import { ObjectId, type Db } from "mongodb";

import {
  type AgentGraphCandidate,
  AgentGraphRepository,
} from "../repositories/neo4j/agent-graph.repository";

export interface AgentGraphLocation {
  locationId: string;
  name: string;
  city: string;
  /** State/UT of the location — required for state-based eligibility matching. */
  state: string;
  latitude?: number;
  longitude?: number;
}

export interface AgentGraphServiceNode {
  serviceId: string;
  serviceCode: string;
}

export interface AgentGraphSyncInput {
  agentId: string;
  agentName: string;
  servedLocationIds?: string[];
  availableLocationIds?: string[];
  offeredServiceIds?: string[];
  servedLocations?: AgentGraphLocation[];
  availableLocations?: AgentGraphLocation[];
  offeredServices?: AgentGraphServiceNode[];
}

export class AgentGraphService {
  constructor(
    private readonly repository: AgentGraphRepository | null,
    private readonly getMongoDB?: () => Db,
  ) {}

  async syncAgent(input: AgentGraphSyncInput): Promise<void> {
    if (!this.repository) return;
    await this.repository.upsertAgent(input.agentId, input.agentName);

    const servedLocations   = input.servedLocations   ?? [];
    const availableLocations = input.availableLocations ?? [];
    const offeredServices   = input.offeredServices   ?? [];
    const servedLocationIds = [
      ...(input.servedLocationIds   ?? []),
      ...servedLocations.map((l) => l.locationId),
    ];
    const availableLocationIds = [
      ...(input.availableLocationIds ?? []),
      ...availableLocations.map((l) => l.locationId),
    ];
    const offeredServiceIds = [
      ...(input.offeredServiceIds ?? []),
      ...offeredServices.map((s) => s.serviceId),
    ];

    // Upsert all location and service nodes (now includes state + coords).
    await Promise.all([
      ...[...servedLocations, ...availableLocations].map((location) =>
        this.repository!.upsertLocation(
          location.locationId,
          location.name,
          location.city,
          location.state,
          location.latitude,
          location.longitude,
        ),
      ),
      ...offeredServices.map((service) =>
        this.repository!.upsertService(service.serviceId, service.serviceCode),
      ),
    ]);

    // Clear previous relationships to ensure Neo4j stays in exact sync with MongoDB
    await this.repository.clearAgentRelationships(input.agentId);

    await Promise.all(
      [...new Set(servedLocationIds)].map((locationId) =>
        this.repository!.linkAgentToLocation(input.agentId, locationId),
      ),
    );

    await Promise.all(
      [...new Set(availableLocationIds)].map((locationId) =>
        this.repository!.linkAgentToLocation(
          input.agentId,
          locationId,
          "AVAILABLE_IN",
        ),
      ),
    );

    await Promise.all(
      [...new Set(offeredServiceIds)].map((serviceId) =>
        this.repository!.linkAgentToService(input.agentId, serviceId),
      ),
    );
  }

  async syncLocation(location: AgentGraphLocation): Promise<void> {
    if (!this.repository) return;
    await this.repository.upsertLocation(
      location.locationId,
      location.name,
      location.city,
      location.state,
      location.latitude,
      location.longitude,
    );
  }

  async syncService(service: AgentGraphServiceNode): Promise<void> {
    if (!this.repository) return;
    await this.repository.upsertService(
      service.serviceId,
      service.serviceCode,
    );
  }

  /** Legacy exact-locationId query — still available for admin/retry flows. */
  async findEligibleAgents(
    sourceLocationId: string,
    destinationLocationId: string,
    serviceId: string,
  ): Promise<AgentGraphCandidate[]> {
    if (this.repository) {
      try {
        return await this.repository.findEligibleAgents(
          sourceLocationId,
          destinationLocationId,
          serviceId,
        );
      } catch (error) {
        console.warn(
          `Neo4j findEligibleAgents failed, falling back to MongoDB: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    return this.findEligibleAgentsFromMongo(sourceLocationId, destinationLocationId, serviceId);
  }

  /**
   * Primary assignment query. Matches agents by state so any valid Indian
   * location can be served without pre-seeding the exact city in the DB.
   */
  async findEligibleAgentsByState(
    sourceState: string,
    destinationState: string,
    serviceId: string,
  ): Promise<AgentGraphCandidate[]> {
    if (this.repository) {
      try {
        return await this.repository.findEligibleAgentsByState(
          sourceState,
          destinationState,
          serviceId,
        );
      } catch (error) {
        console.warn(
          `Neo4j findEligibleAgentsByState failed, falling back to MongoDB: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    return this.findEligibleAgentsByStateFromMongo(
      sourceState,
      destinationState,
      serviceId,
    );
  }

  private async findEligibleAgentsFromMongo(
    sourceLocationId: string,
    destinationLocationId: string,
    serviceIdString: string,
  ): Promise<AgentGraphCandidate[]> {
    if (!this.getMongoDB) return [];
    try {
      const db = this.getMongoDB();
      const srcId = new ObjectId(sourceLocationId);
      const dstId = new ObjectId(destinationLocationId);
      const srvId = new ObjectId(serviceIdString);

      const eligibleAgents = await db
        .collection("agents")
        .find({
          status: "AVAILABLE",
          servedLocationIds: { $all: [srcId, dstId] },
          offeredServiceIds: srvId,
        })
        .toArray();

      const loc = await db.collection("locations").findOne({ _id: srcId });
      const candidates: AgentGraphCandidate[] = [];
      for (const agent of eligibleAgents) {
        const user = await db.collection("users").findOne({ _id: agent.userId });
        candidates.push({
          agentId: agent._id.toHexString(),
          agentName: user ? user.fullName : null,
          latitude: loc ? (loc.latitude as number) : null,
          longitude: loc ? (loc.longitude as number) : null,
        });
      }
      return candidates;
    } catch (e) {
      console.error("MongoDB agent fallback error:", e);
      return [];
    }
  }

  private async findEligibleAgentsByStateFromMongo(
    sourceState: string,
    destinationState: string,
    serviceIdString: string,
  ): Promise<AgentGraphCandidate[]> {
    if (!this.getMongoDB) return [];
    try {
      const db = this.getMongoDB();
      const locationsColl = db.collection("locations");
      const agentsColl = db.collection("agents");
      const usersColl = db.collection("users");

      const sourceLocs = await locationsColl
        .find({ state: { $regex: new RegExp(`^${sourceState.trim()}$`, "i") } })
        .toArray();
      const destLocs = await locationsColl
        .find({ state: { $regex: new RegExp(`^${destinationState.trim()}$`, "i") } })
        .toArray();

      if (sourceLocs.length === 0 || destLocs.length === 0) {
        return [];
      }

      const sourceLocIds = sourceLocs.map((l) => l._id);
      const destLocIds = destLocs.map((l) => l._id);
      const serviceObjectId = new ObjectId(serviceIdString);

      const eligibleAgents = await agentsColl
        .find({
          status: "AVAILABLE",
          servedLocationIds: { $in: sourceLocIds },
          $and: [
            { servedLocationIds: { $in: destLocIds } },
            { offeredServiceIds: serviceObjectId },
          ],
        })
        .toArray();

      const candidates: AgentGraphCandidate[] = [];
      for (const agent of eligibleAgents) {
        const user = await usersColl.findOne({ _id: agent.userId });
        const agentServedIds: ObjectId[] = agent.servedLocationIds ?? [];
        const firstLoc = sourceLocs.find((sl) =>
          agentServedIds.some((asId) => asId.equals(sl._id)),
        );

        candidates.push({
          agentId: agent._id.toHexString(),
          agentName: user ? user.fullName : null,
          latitude: firstLoc ? (firstLoc.latitude as number) : null,
          longitude: firstLoc ? (firstLoc.longitude as number) : null,
        });
      }

      return candidates;
    } catch (e) {
      console.error("MongoDB agent state-fallback error:", e);
      return [];
    }
  }
}