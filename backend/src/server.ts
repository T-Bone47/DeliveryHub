import { app } from "./app";
import { connectMongoDB } from "./config/mongodb";
import { connectNeo4j } from "./config/neo4j";
import { env } from "./config/env";
import { initializeMongoDBSchema } from "./repositories/mongodb-schema.repository";

const server = app.listen(env.port, () => {
  console.log(
    `Delivery Agent System API listening on http://localhost:${env.port}`,
  );
});

async function initializeDatabaseConnections(): Promise<void> {
  let mongoConnected = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const client = await connectMongoDB();
      await initializeMongoDBSchema(client.db());
      console.log("MongoDB connection established and schema initialized.");
      mongoConnected = true;
      break;
    } catch (error) {
      console.warn(
        `MongoDB connection attempt ${attempt}/5 failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      if (attempt < 5) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  if (!mongoConnected) {
    console.error("MongoDB failed to connect after 5 attempts.");
  }

  try {
    await connectNeo4j();
    console.log("Neo4j connection established.");
  } catch (error) {
    console.warn(
      `Neo4j connection unavailable: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

void initializeDatabaseConnections();

function shutdown(signal: string): void {
  console.log(`${signal} received. Shutting down.`);
  server.close(() => process.exit(0));
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));