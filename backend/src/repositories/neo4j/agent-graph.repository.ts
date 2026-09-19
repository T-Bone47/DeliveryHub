import type { Driver, ManagedTransaction } from "neo4j-driver";

export interface AgentGraphCandidate {
  agentId: string;
  agentName: string | null;
  /** Coordinates of agent's first served location (for distance scoring). */
  latitude: number | null;
  longitude: number | null;
}

export type LocationRelationship = "SERVES" | "AVAILABLE_IN";

export class AgentGraphRepository {
  constructor(private readonly driver: Driver) {}

  private async executeWrite<T>(
    work: (transaction: ManagedTransaction) => Promise<T>,
  ): Promise<T> {
    const session = this.driver.session();
    try {
      return await session.executeWrite(work);
    } finally {
      await session.close();
    }
  }

  private async executeRead<T>(
    work: (transaction: ManagedTransaction) => Promise<T>,
  ): Promise<T> {
    const session = this.driver.session();
    try {
      return await session.executeRead(work);
    } finally {
      await session.close();
    }
  }

  async upsertAgent(agentId: string, name: string): Promise<void> {
    await this.executeWrite(async (transaction) => {
      await transaction.run(
        `
        MERGE (agent:Agent {agentId: $agentId})
        SET agent.name = $name
        `,
        { agentId, name },
      );
    });
  }

  async clearAgentRelationships(agentId: string): Promise<void> {
    await this.executeWrite(async (transaction) => {
      await transaction.run(
        `
        MATCH (agent:Agent {agentId: $agentId})-[r:SERVES|AVAILABLE_IN|OFFERS]->()
        DELETE r
        `,
        { agentId },
      );
    });
  }

  /**
   * Upsert a Location node.  Now includes `state`, `latitude`, and `longitude`
   * so that state-based eligibility matching and coordinate-based distance
   * scoring both work without extra round-trips.
   */
  async upsertLocation(
    locationId: string,
    name: string,
    city: string,
    state: string,
    latitude?: number,
    longitude?: number,
  ): Promise<void> {
    await this.executeWrite(async (transaction) => {
      await transaction.run(
        `
        MERGE (location:Location {locationId: $locationId})
        SET location.name      = $name,
            location.city      = $city,
            location.state     = $state,
            location.latitude  = $latitude,
            location.longitude = $longitude
        `,
        {
          locationId,
          name,
          city,
          state,
          latitude:  latitude  ?? null,
          longitude: longitude ?? null,
        },
      );
    });
  }

  async upsertService(
    serviceId: string,
    serviceCode: string,
  ): Promise<void> {
    await this.executeWrite(async (transaction) => {
      await transaction.run(
        `
        MERGE (service:Service {serviceId: $serviceId})
        SET service.code = $serviceCode
        `,
        { serviceId, serviceCode },
      );
    });
  }

  async linkAgentToLocation(
    agentId: string,
    locationId: string,
    relationship: LocationRelationship = "SERVES",
  ): Promise<void> {
    const relationshipQuery =
      relationship === "SERVES" ? "SERVES" : "AVAILABLE_IN";

    await this.executeWrite(async (transaction) => {
      await transaction.run(
        `
        MATCH (agent:Agent {agentId: $agentId})
        MATCH (location:Location {locationId: $locationId})
        MERGE (agent)-[:${relationshipQuery}]->(location)
        `,
        { agentId, locationId },
      );
    });
  }

  async linkAgentToService(
    agentId: string,
    serviceId: string,
  ): Promise<void> {
    await this.executeWrite(async (transaction) => {
      await transaction.run(
        `
        MATCH (agent:Agent {agentId: $agentId})
        MATCH (service:Service {serviceId: $serviceId})
        MERGE (agent)-[:OFFERS]->(service)
        `,
        { agentId, serviceId },
      );
    });
  }

  /**
   * Legacy exact-locationId query — kept for backward compatibility but no
   * longer used by the assignment flow.
   */
  async findEligibleAgents(
    sourceLocationId: string,
    destinationLocationId: string,
    serviceId: string,
  ): Promise<AgentGraphCandidate[]> {
    return this.executeRead(async (transaction) => {
      const result = await transaction.run(
        `
        MATCH (agent:Agent)-[:SERVES]->(srcLoc:Location {locationId: $sourceLocationId})
        MATCH (agent)-[:SERVES]->(dstLoc:Location {locationId: $destinationLocationId})
        MATCH (agent)-[:OFFERS]->(:Service {serviceId: $serviceId})
        WITH DISTINCT agent
        OPTIONAL MATCH (agent)-[:SERVES]->(refLoc:Location)
          WHERE refLoc.latitude IS NOT NULL AND refLoc.longitude IS NOT NULL
        WITH agent, refLoc ORDER BY agent.agentId, refLoc.locationId
        WITH agent, collect(refLoc)[0] AS firstLoc
        RETURN agent.agentId  AS agentId,
               agent.name     AS agentName,
               firstLoc.latitude  AS latitude,
               firstLoc.longitude AS longitude
        `,
        { sourceLocationId, destinationLocationId, serviceId },
      );

      return result.records.map((record) => ({
        agentId:   record.get("agentId") as string,
        agentName: (record.get("agentName") as string | null) ?? null,
        latitude:  (record.get("latitude")  as number | null) ?? null,
        longitude: (record.get("longitude") as number | null) ?? null,
      }));
    });
  }

  /**
   * State-based eligibility query.
   *
   * Returns agents who:
   *  – SERVE at least one location in `sourceState`
   *  – SERVE at least one location in `destinationState`
   *  – OFFER the requested service
   *
   * The agent's first served-location coordinates are also returned so the
   * caller can compute a haversine distance score without another DB round-trip.
   *
   * State matching is case-insensitive (toLower) so "Telangana" and "telangana"
   * both work.
   */
  async findEligibleAgentsByState(
    sourceState: string,
    destinationState: string,
    serviceId: string,
  ): Promise<AgentGraphCandidate[]> {
    return this.executeRead(async (transaction) => {
      const result = await transaction.run(
        `
        MATCH (agent:Agent)-[:SERVES]->(srcLoc:Location)
          WHERE toLower(srcLoc.state) = toLower($sourceState)
        MATCH (agent)-[:SERVES]->(dstLoc:Location)
          WHERE toLower(dstLoc.state) = toLower($destinationState)
        MATCH (agent)-[:OFFERS]->(:Service {serviceId: $serviceId})
        WITH DISTINCT agent
        OPTIONAL MATCH (agent)-[:SERVES]->(refLoc:Location)
          WHERE refLoc.latitude IS NOT NULL AND refLoc.longitude IS NOT NULL
        WITH agent, refLoc ORDER BY agent.agentId, refLoc.locationId
        WITH agent, collect(refLoc)[0] AS firstLoc
        RETURN agent.agentId       AS agentId,
               agent.name          AS agentName,
               firstLoc.latitude   AS latitude,
               firstLoc.longitude  AS longitude
        `,
        { sourceState, destinationState, serviceId },
      );

      return result.records.map((record) => ({
        agentId:   record.get("agentId") as string,
        agentName: (record.get("agentName") as string | null) ?? null,
        latitude:  (record.get("latitude")  as number | null) ?? null,
        longitude: (record.get("longitude") as number | null) ?? null,
      }));
    });
  }
}