import { getNeo4jDriver } from "../config/neo4j";
import { AgentGraphRepository } from "../repositories/neo4j/agent-graph.repository";
import { AgentGraphService } from "./agent-graph.service";

export async function bestEffortGraphSync(
  operation: (graph: AgentGraphService) => Promise<void>,
  description: string,
): Promise<void> {
  try {
    await operation(
      new AgentGraphService(
        new AgentGraphRepository(getNeo4jDriver()),
      ),
    );
  } catch (error) {
    console.warn(
      `Neo4j synchronization skipped for ${description}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}