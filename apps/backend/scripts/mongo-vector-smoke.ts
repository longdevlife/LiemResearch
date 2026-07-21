/**
 * Read-only Vector Search readiness check for the configured Mongo database.
 * It never creates or alters an index. A configured index is required before
 * the query probe can run.
 *
 * Run: pnpm --filter backend mongo:vector-smoke
 */
import { closeMongoConnection, openMongoConnection } from "./lib/mongo-migration.js";
import { env } from "../src/config/env.js";

type SearchIndex = {
  name?: string;
  type?: string;
  status?: string;
  latestDefinition?: {
    fields?: Array<{
      type?: string;
      path?: string;
      numDimensions?: number;
      similarity?: string;
    }>;
  };
};

async function main(): Promise<void> {
  let connection: Awaited<ReturnType<typeof openMongoConnection>> | undefined;

  try {
    connection = await openMongoConnection(env.MONGODB_URI);
    const db = connection.db;
    if (!db) throw new Error("Mongo connection has no database handle");

    const indexes = (await db.collection("research_papers").listSearchIndexes().toArray()) as SearchIndex[];
    const vectorIndexes = indexes.filter((index) => index.type === "vectorSearch" || index.latestDefinition?.fields?.some((field) => field.type === "vector"));
    const summary = vectorIndexes.map((index) => ({
      name: index.name ?? null,
      type: index.type ?? null,
      status: index.status ?? null,
      vectorFields: (index.latestDefinition?.fields ?? [])
        .filter((field) => field.type === "vector")
        .map((field) => ({ path: field.path ?? null, dimensions: field.numDimensions ?? null, similarity: field.similarity ?? null })),
    }));

    if (summary.length !== 1 || summary[0]?.status !== "READY") {
      console.log(JSON.stringify({ ready: false, indexes: summary, message: "No READY vector index is configured for research_papers." }, null, 2));
      process.exitCode = 2;
      return;
    }

    const vector = summary[0].vectorFields.find((field) => field.path === "embedding");
    if (vector?.dimensions !== 768 || vector.similarity !== "cosine") {
      console.log(JSON.stringify({ ready: false, indexes: summary, message: "READY index does not match embedding: 768 dimensions, cosine." }, null, 2));
      process.exitCode = 2;
      return;
    }

    const probe = await db.collection("research_papers").aggregate([
      {
        $vectorSearch: {
          index: summary[0].name,
          path: "embedding",
          queryVector: Array.from({ length: 768 }, () => 0.001),
          numCandidates: 20,
          limit: 1,
        },
      },
      { $project: { _id: 1 } },
    ]).toArray();

    console.log(JSON.stringify({ ready: true, indexes: summary, queryProbeReturned: probe.length }, null, 2));
  } finally {
    await closeMongoConnection(connection);
  }
}

void main().catch((error: unknown) => {
  console.error("Mongo vector smoke check failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
