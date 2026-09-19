import dotenv from "dotenv";

dotenv.config();

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer but received "${value}".`);
  }

  return parsed;
}

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePositiveInteger(process.env.PORT, 5000),
  mongodbUri:
    process.env.MONGODB_URI ??
    "mongodb://127.0.0.1:27017/delivery_agent_system",
  mongodbServerSelectionTimeoutMs: parsePositiveInteger(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    2000,
  ),
  neo4jUri: process.env.NEO4J_URI ?? "bolt://127.0.0.1:7687",
  neo4jUsername: process.env.NEO4J_USERNAME ?? "neo4j",
  neo4jPassword: process.env.NEO4J_PASSWORD,
  jwtSecret: process.env.JWT_SECRET,
});