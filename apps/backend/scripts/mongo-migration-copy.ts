/**
 * Controlled Mongo-to-Mongo migration runner.
 *
 * Default mode is read-only dry-run. Copying requires all explicit safeguards:
 *   pnpm --filter backend mongo:migration-copy -- --execute \
 *     --confirm-database=<target-db-name> --backup-reference=<verified-backup-id>
 *
 * MONGODB_URI is the target. MIGRATION_SOURCE_MONGODB_URI is the old database.
 * The runner never drops target collections. It preserves _id values and uses
 * idempotent replaceOne upserts, so a failed copy can be resumed with --resume.
 */
import type { IndexDescription, IndexDescriptionInfo } from "mongodb";

import { env } from "../src/config/env.js";
import { closeMongoConnection, inspectDatabase, openMongoConnection } from "./lib/mongo-migration.js";

const COPY_BATCH_SIZE = 500;

type Arguments = {
  execute: boolean;
  resume: boolean;
  confirmDatabase?: string;
  backupReference?: string;
};

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  const sourceUri = env.MIGRATION_SOURCE_MONGODB_URI;
  if (!sourceUri) {
    throw new Error("MIGRATION_SOURCE_MONGODB_URI is required locally; the API never reads it at runtime.");
  }
  if (sameMongoTarget(sourceUri, env.MONGODB_URI)) {
    throw new Error("Source and target MongoDB URIs resolve to the same database. Refusing to self-migrate.");
  }

  let sourceConnection: Awaited<ReturnType<typeof openMongoConnection>> | undefined;
  let targetConnection: Awaited<ReturnType<typeof openMongoConnection>> | undefined;

  try {
    [sourceConnection, targetConnection] = await Promise.all([
      openMongoConnection(sourceUri),
      openMongoConnection(env.MONGODB_URI),
    ]);
    const sourceDb = sourceConnection.db;
    const targetDb = targetConnection.db;
    if (!sourceDb || !targetDb) throw new Error("Source or target Mongo connection has no database handle");

    const [sourceInventory, targetInventory] = await Promise.all([
      inspectDatabase(sourceConnection, { exactCounts: true }),
      inspectDatabase(targetConnection, { exactCounts: true }),
    ]);
    const plan = buildPlan(sourceInventory, targetInventory, args);

    if (!args.execute) {
      console.log(JSON.stringify({ mode: "dry-run", ...plan }, null, 2));
      return;
    }

    assertExecutionGuards(args, targetDb.databaseName, plan);
    for (const collection of plan.collections) {
      await copyCollection(sourceConnection, targetConnection, collection.name);
    }

    const verification = await verifyCounts(sourceConnection, targetConnection, plan.collections.map((collection) => collection.name));
    console.log(JSON.stringify({ mode: "execute", backupReference: args.backupReference, plan, verification }, null, 2));
    if (!verification.passed) process.exitCode = 2;
  } finally {
    await Promise.all([closeMongoConnection(sourceConnection), closeMongoConnection(targetConnection)]);
  }
}

function parseArguments(args: string[]): Arguments {
  const value = (prefix: string) => args.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
  return {
    execute: args.includes("--execute"),
    resume: args.includes("--resume"),
    confirmDatabase: value("--confirm-database="),
    backupReference: value("--backup-reference="),
  };
}

function buildPlan(
  source: Awaited<ReturnType<typeof inspectDatabase>>,
  target: Awaited<ReturnType<typeof inspectDatabase>>,
  args: Arguments,
) {
  const targetByName = new Map(target.collections.map((collection) => [collection.name, collection]));
  return {
    sourceDatabase: source.database,
    targetDatabase: target.database,
    sourceDocuments: source.totalEstimatedDocuments,
    targetDocumentsBeforeCopy: target.totalEstimatedDocuments,
    collections: source.collections.map((sourceCollection) => {
      const targetCollection = targetByName.get(sourceCollection.name);
      return {
        name: sourceCollection.name,
        sourceCount: sourceCollection.exactCount ?? sourceCollection.estimatedCount,
        targetCountBeforeCopy: targetCollection?.exactCount ?? targetCollection?.estimatedCount ?? 0,
        requiresResume: Boolean((targetCollection?.exactCount ?? targetCollection?.estimatedCount ?? 0) > 0),
      };
    }),
    mode: args.execute ? "execute" : "dry-run",
  };
}

function assertExecutionGuards(
  args: Arguments,
  targetDatabase: string,
  plan: ReturnType<typeof buildPlan>,
): void {
  if (args.confirmDatabase !== targetDatabase) {
    throw new Error(`Refusing copy: pass --confirm-database=${targetDatabase} to confirm the target database.`);
  }
  if (!args.backupReference || args.backupReference.trim().length < 3) {
    throw new Error("Refusing copy: pass --backup-reference=<verified-backup-id-or-location> after a restore-tested backup.");
  }
  if (!args.resume && plan.collections.some((collection) => collection.requiresResume)) {
    throw new Error("Target contains documents. Refusing to mix data; verify it, empty it through an approved runbook, or rerun with --resume.");
  }
}

async function copyCollection(
  sourceConnection: Awaited<ReturnType<typeof openMongoConnection>>,
  targetConnection: Awaited<ReturnType<typeof openMongoConnection>>,
  collectionName: string,
): Promise<void> {
  const sourceDb = sourceConnection.db;
  const targetDb = targetConnection.db;
  if (!sourceDb || !targetDb) throw new Error("Source or target Mongo connection has no database handle");

  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);
  await copyIndexes(sourceCollection, targetCollection);

  let batch: Record<string, unknown>[] = [];
  const cursor = sourceCollection.find({}).sort({ _id: 1 }).batchSize(COPY_BATCH_SIZE);
  for await (const document of cursor) {
    batch.push(document);
    if (batch.length >= COPY_BATCH_SIZE) {
      await writeBatch(targetCollection, batch);
      batch = [];
    }
  }
  if (batch.length > 0) await writeBatch(targetCollection, batch);
}

async function copyIndexes(
  sourceCollection: ReturnType<NonNullable<Awaited<ReturnType<typeof openMongoConnection>>["db"]>["collection"]>,
  targetCollection: ReturnType<NonNullable<Awaited<ReturnType<typeof openMongoConnection>>["db"]>["collection"]>,
): Promise<void> {
  const sourceIndexes = await sourceCollection.indexInformation({ full: true });
  const definitions = sourceIndexes
    .filter((index) => index.name !== "_id_")
    .map(toIndexDefinition)
    .filter((definition): definition is IndexDescription => definition !== undefined);
  if (definitions.length > 0) await targetCollection.createIndexes(definitions);
}

function toIndexDefinition(index: IndexDescriptionInfo): IndexDescription | undefined {
  if (!index.key || !index.name) return undefined;
  return {
    key: index.key,
    name: index.name,
    background: index.background,
    unique: index.unique,
    sparse: index.sparse,
    expireAfterSeconds: index.expireAfterSeconds,
    partialFilterExpression: index.partialFilterExpression,
    collation: index.collation,
    hidden: index.hidden,
  };
}

async function writeBatch(
  targetCollection: ReturnType<NonNullable<Awaited<ReturnType<typeof openMongoConnection>>["db"]>["collection"]>,
  documents: Record<string, unknown>[],
): Promise<void> {
  await targetCollection.bulkWrite(
    documents.map((document) => ({
      replaceOne: {
        filter: { _id: document._id },
        replacement: document,
        upsert: true,
      },
    })),
    { ordered: false },
  );
}

async function verifyCounts(
  sourceConnection: Awaited<ReturnType<typeof openMongoConnection>>,
  targetConnection: Awaited<ReturnType<typeof openMongoConnection>>,
  collectionNames: string[],
): Promise<{ passed: boolean; collections: Array<{ name: string; sourceCount: number; targetCount: number; matches: boolean }> }> {
  const sourceDb = sourceConnection.db;
  const targetDb = targetConnection.db;
  if (!sourceDb || !targetDb) throw new Error("Source or target Mongo connection has no database handle");

  const collections = await Promise.all(
    collectionNames.map(async (name) => {
      const [sourceCount, targetCount] = await Promise.all([
        sourceDb.collection(name).countDocuments({}),
        targetDb.collection(name).countDocuments({}),
      ]);
      return { name, sourceCount, targetCount, matches: sourceCount === targetCount };
    }),
  );
  return { passed: collections.every((collection) => collection.matches), collections };
}

function sameMongoTarget(sourceUri: string, targetUri: string): boolean {
  return normalizeMongoUri(sourceUri) === normalizeMongoUri(targetUri);
}

function normalizeMongoUri(uri: string): string {
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@").replace(/\/?$/, "");
}

void main().catch((error: unknown) => {
  console.error("Mongo migration copy failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
