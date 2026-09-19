import { MongoClient, type Db } from "mongodb";

import { env } from "./env";

export type DatabaseConnectionState =
  | "not_connected"
  | "connecting"
  | "connected"
  | "error";

let client: MongoClient | null = null;
let connectionState: DatabaseConnectionState = "not_connected";

export async function connectMongoDB(): Promise<MongoClient> {
  if (client && connectionState === "connected") {
    return client;
  }

  connectionState = "connecting";
  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const isDirect = env.mongodbUri.includes("directConnection=true");
    const nextClient = new MongoClient(env.mongodbUri, {
      ...(isDirect ? { directConnection: true, tlsInsecure: true } : {}),
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: env.mongodbServerSelectionTimeoutMs,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    });

    try {
      await nextClient.connect();
      await nextClient.db().command({ ping: 1 });
      client = nextClient;
      connectionState = "connected";
      return nextClient;
    } catch (error) {
      lastError = error;
      await nextClient.close().catch(() => undefined);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  connectionState = "error";
  throw lastError;
}

export function getMongoDB(): Db {
  if (!client || connectionState !== "connected") {
    throw new Error("MongoDB is not connected.");
  }

  return client.db();
}

export async function disconnectMongoDB(): Promise<void> {
  await client?.close();
  client = null;
  connectionState = "not_connected";
}

export function getMongoDBConnectionState(): DatabaseConnectionState {
  return connectionState;
}