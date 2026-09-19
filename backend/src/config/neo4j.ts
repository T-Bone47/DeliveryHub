import neo4j, { type Driver } from "neo4j-driver";

import { env } from "./env";
import type { DatabaseConnectionState } from "./mongodb";

let driver: Driver | null = null;
let connectionState: DatabaseConnectionState = "not_connected";

export async function connectNeo4j(): Promise<Driver> {
  if (driver && connectionState === "connected") {
    return driver;
  }

  if (!env.neo4jPassword) {
    connectionState = "error";
    throw new Error(
      "Neo4j is not configured. Set NEO4J_PASSWORD before connecting.",
    );
  }

  connectionState = "connecting";
  const nextDriver = neo4j.driver(
    env.neo4jUri,
    neo4j.auth.basic(env.neo4jUsername, env.neo4jPassword),
  );

  try {
    await nextDriver.verifyConnectivity();
    driver = nextDriver;
    connectionState = "connected";
    return nextDriver;
  } catch (error) {
    connectionState = "error";
    await nextDriver.close().catch(() => undefined);
    throw error;
  }
}

export function getNeo4jDriver(): Driver {
  if (!driver || connectionState !== "connected") {
    throw new Error("Neo4j is not connected.");
  }

  return driver;
}

export async function disconnectNeo4j(): Promise<void> {
  await driver?.close();
  driver = null;
  connectionState = "not_connected";
}

export function getNeo4jConnectionState(): DatabaseConnectionState {
  return connectionState;
}