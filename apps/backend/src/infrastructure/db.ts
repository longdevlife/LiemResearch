import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

mongoose.set("strictQuery", true);

export async function connectMongo(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 20,
    });
    logger.info({ uri: redact(env.MONGODB_URI) }, "mongo connected");
  } catch (err) {
    logger.fatal({ err }, "mongo connection failed");
    throw err;
  }
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  logger.info("mongo disconnected");
}

function redact(uri: string): string {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}
