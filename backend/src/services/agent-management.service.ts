import { type AgentDocument } from "../models/agent";
import {
  AGENT_STATUSES,
  VEHICLE_TYPES,
  type AgentStatus,
  type VehicleType,
} from "../models/enums";
import { type LocationDocument } from "../models/location";
import { type PublicUser, toPublicUser } from "../models/user";
import { AgentRepository } from "../repositories/agent.repository";
import { LocationRepository } from "../repositories/location.repository";
import { ServiceRepository } from "../repositories/service.repository";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../middleware/error-handler";
import { bestEffortGraphSync } from "./graph-sync.service";
import {
  conflictError,
  getEnumValue,
  getInputObject,
  getNumber,
  getObjectId,
  getObjectIdArray,
  getOptionalEnumValue,
  getOptionalObjectId,
  getOptionalString,
  getRequiredString,
  isDuplicateKeyError,
  type InputObject,
} from "../utils/management-validation";

interface AgentRepositories {
  agents: AgentRepository;
  locations: LocationRepository;
  services: ServiceRepository;
  users: UserRepository;
}

interface AgentRelations {
  servedLocationIds?: ReturnType<typeof getObjectIdArray>;
  availableLocationIds?: ReturnType<typeof getObjectIdArray>;
  offeredServiceIds?: ReturnType<typeof getObjectIdArray>;
}

export interface AgentView {
  id: string;
  user: PublicUser;
  agentCode: string;
  vehicleType: VehicleType;
  status: AgentStatus;
  rating: number;
  activeDeliveries: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
  rewardPoints: number;
  penaltyPoints: number;
  servedLocationIds: string[];
  availableLocationIds: string[];
  offeredServiceIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentPerformanceView {
  id: string;
  agentCode: string;
  user: PublicUser;
  rating: number;
  activeDeliveries: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
  delayedDeliveries: number;
  onTimeRate: number;
  rewardPoints: number;
  penaltyPoints: number;
}

interface RelationDocuments {
  servedLocations: LocationDocument[];
  availableLocations: LocationDocument[];
  offeredServices: {
    _id: import("mongodb").ObjectId;
    serviceCode: string;
  }[];
}

function toAgentView(
  agent: AgentDocument,
  user: PublicUser,
): AgentView {
  return {
    id: agent._id.toHexString(),
    user,
    agentCode: agent.agentCode,
    vehicleType: agent.vehicleType,
    status: agent.status,
    rating: agent.rating,
    activeDeliveries: agent.activeDeliveries,
    completedDeliveries: agent.completedDeliveries,
    onTimeDeliveries: agent.onTimeDeliveries,
    rewardPoints: agent.rewardPoints,
    penaltyPoints: agent.penaltyPoints,
    servedLocationIds: (agent.servedLocationIds ?? []).map((id) => id.toHexString()),
    availableLocationIds: (agent.availableLocationIds ?? []).map((id) => id.toHexString()),
    offeredServiceIds: (agent.offeredServiceIds ?? []).map((id) => id.toHexString()),
    createdAt: agent.createdAt,
    updatedAt: agent.updatedAt,
  };
}

function parseRelations(input: InputObject): AgentRelations {
  return {
    servedLocationIds: getObjectIdArray(input, "servedLocationIds"),
    availableLocationIds: getObjectIdArray(
      input,
      "availableLocationIds",
    ),
    offeredServiceIds: getObjectIdArray(input, "offeredServiceIds"),
  };
}

function hasRelations(input: InputObject): boolean {
  return (
    "servedLocationIds" in input ||
    "availableLocationIds" in input ||
    "offeredServiceIds" in input
  );
}

function getMetric(
  input: InputObject,
  fieldName: string,
  maximum = Number.POSITIVE_INFINITY,
): number | undefined {
  if (!(fieldName in input) || input[fieldName] === undefined) {
    return undefined;
  }
  return getNumber(input[fieldName], fieldName, 0, maximum);
}

export class AgentManagementService {
  constructor(
    private readonly getRepositories: () => AgentRepositories,
  ) {}

  async list(): Promise<AgentView[]> {
    const repositories = this.getRepositories();
    const agents = await repositories.agents.findMany({}, {
      sort: { createdAt: -1 },
    });
    const users = await repositories.users.findByIds(
      agents.map((agent) => agent.userId),
    );
    const usersById = new Map(
      users.map((user) => [user._id.toHexString(), user]),
    );

    return agents.map((agent) => {
      const user = usersById.get(agent.userId.toHexString());
      if (!user) {
        throw new AppError(
          "An agent is missing its related user.",
          500,
          "DATA_INTEGRITY_ERROR",
        );
      }
      return toAgentView(agent, toPublicUser(user));
    });
  }

  async getById(id: unknown): Promise<AgentView> {
    const agentId = getObjectId(id, "Agent ID");
    const repositories = this.getRepositories();
    const agent = await repositories.agents.findById(agentId);
    if (!agent) {
      throw new AppError("Agent not found.", 404, "AGENT_NOT_FOUND");
    }

    return toAgentView(
      agent,
      await this.getRelatedUser(agent.userId, repositories.users),
    );
  }

  async getByUserId(userIdValue: unknown): Promise<AgentView> {
    const userId = getObjectId(userIdValue, "User ID");
    const repositories = this.getRepositories();
    const agent = await repositories.agents.findByUserId(userId);
    if (!agent) {
      throw new AppError("Agent profile not found.", 404, "AGENT_NOT_FOUND");
    }

    return toAgentView(
      agent,
      await this.getRelatedUser(agent.userId, repositories.users),
    );
  }

  async create(input: unknown): Promise<AgentView> {
    const body = getInputObject(input);
    const userId = getObjectId(body.userId, "userId");
    const agentCode = getRequiredString(body.agentCode, "agentCode");
    const vehicleType = getEnumValue(
      body.vehicleType,
      "vehicleType",
      VEHICLE_TYPES,
    );
    const status =
      getOptionalEnumValue(body, "status", AGENT_STATUSES) ?? "OFFLINE";
    const metrics = this.parseMetrics(body);
    const relations = parseRelations(body);
    const repositories = this.getRepositories();
    const user = await this.requireAgentUser(
      userId,
      repositories.users,
    );

    if (await repositories.agents.findByAgentCode(agentCode)) {
      throw conflictError(
        "An agent with this agentCode already exists.",
        "DUPLICATE_AGENT_CODE",
      );
    }

    if (await repositories.agents.findByUserId(userId)) {
      throw conflictError(
        "This user already has an agent profile.",
        "DUPLICATE_AGENT_USER",
      );
    }

    const relationDocuments = await this.resolveRelations(
      relations,
      repositories,
    );
    const now = new Date();

    try {
      const agent = await repositories.agents.create({
        userId,
        agentCode,
        vehicleType,
        status,
        rating: metrics.rating ?? 0,
        activeDeliveries: metrics.activeDeliveries ?? 0,
        completedDeliveries: metrics.completedDeliveries ?? 0,
        onTimeDeliveries: metrics.onTimeDeliveries ?? 0,
        rewardPoints: metrics.rewardPoints ?? 0,
        penaltyPoints: metrics.penaltyPoints ?? 0,
        servedLocationIds: relations.servedLocationIds ?? [],
        availableLocationIds: relations.availableLocationIds ?? [],
        offeredServiceIds: relations.offeredServiceIds ?? [],
        createdAt: now,
        updatedAt: now,
      });

      await this.syncGraph(agent, user, relationDocuments);
      return toAgentView(agent, toPublicUser(user));
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw conflictError(
          "An agent with this agentCode already exists.",
          "DUPLICATE_AGENT_CODE",
        );
      }
      throw error;
    }
  }

  async update(id: unknown, input: unknown): Promise<AgentView> {
    const agentId = getObjectId(id, "Agent ID");
    const body = getInputObject(input);
    const relations = parseRelations(body);
    const updates: Partial<AgentDocument> = {};

    const userId = getOptionalObjectId(body, "userId");
    if (userId !== undefined) updates.userId = userId;
    const agentCode = getOptionalString(body, "agentCode");
    if (agentCode !== undefined) updates.agentCode = agentCode;
    const vehicleType = getOptionalEnumValue(
      body,
      "vehicleType",
      VEHICLE_TYPES,
    );
    if (vehicleType !== undefined) updates.vehicleType = vehicleType;
    const status = getOptionalEnumValue(body, "status", AGENT_STATUSES);
    if (status !== undefined) updates.status = status;

    if (relations.servedLocationIds !== undefined) {
      updates.servedLocationIds = relations.servedLocationIds;
    }
    if (relations.availableLocationIds !== undefined) {
      updates.availableLocationIds = relations.availableLocationIds;
    }
    if (relations.offeredServiceIds !== undefined) {
      updates.offeredServiceIds = relations.offeredServiceIds;
    }

    const metrics = this.parseMetrics(body);
    Object.assign(updates, metrics);

    if (
      Object.keys(updates).length === 0 &&
      !hasRelations(body)
    ) {
      throw new AppError(
        "At least one agent field must be provided.",
        400,
        "VALIDATION_ERROR",
      );
    }

    const repositories = this.getRepositories();
    const existing = await repositories.agents.findById(agentId);
    if (!existing) {
      throw new AppError("Agent not found.", 404, "AGENT_NOT_FOUND");
    }

    const nextUserId = updates.userId ?? existing.userId;
    const user = await this.requireAgentUser(
      nextUserId,
      repositories.users,
    );

    if (updates.agentCode !== undefined) {
      const duplicate = await repositories.agents.findByAgentCode(
        updates.agentCode,
      );
      if (duplicate && !duplicate._id.equals(agentId)) {
        throw conflictError(
          "An agent with this agentCode already exists.",
          "DUPLICATE_AGENT_CODE",
        );
      }
    }

    if (updates.userId !== undefined) {
      const duplicate = await repositories.agents.findByUserId(
        updates.userId,
      );
      if (duplicate && !duplicate._id.equals(agentId)) {
        throw conflictError(
          "This user already has an agent profile.",
          "DUPLICATE_AGENT_USER",
        );
      }
    }

    const effectiveRelations: AgentRelations = {
      servedLocationIds:
        relations.servedLocationIds !== undefined
          ? relations.servedLocationIds
          : existing.servedLocationIds,
      availableLocationIds:
        relations.availableLocationIds !== undefined
          ? relations.availableLocationIds
          : existing.availableLocationIds,
      offeredServiceIds:
        relations.offeredServiceIds !== undefined
          ? relations.offeredServiceIds
          : existing.offeredServiceIds,
    };

    const relationDocuments = await this.resolveRelations(
      effectiveRelations,
      repositories,
    );

    try {
      const updated = await repositories.agents.updateById(agentId, {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      });
      if (!updated) {
        throw new AppError("Agent not found.", 404, "AGENT_NOT_FOUND");
      }

      await this.syncGraph(updated, user, relationDocuments);
      return toAgentView(updated, toPublicUser(user));
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw conflictError(
          "An agent with this agentCode already exists.",
          "DUPLICATE_AGENT_CODE",
        );
      }
      throw error;
    }
  }

  async updateStatus(id: unknown, input: unknown): Promise<AgentView> {
    const body = getInputObject(input);
    const status = getEnumValue(body.status, "status", AGENT_STATUSES);
    return this.update(id, { status });
  }

  async getPerformance(id: unknown): Promise<AgentPerformanceView> {
    const agentId = getObjectId(id, "Agent ID");
    const repositories = this.getRepositories();
    const agent = await repositories.agents.findById(agentId);
    if (!agent) {
      throw new AppError("Agent not found.", 404, "AGENT_NOT_FOUND");
    }

    const completed = agent.completedDeliveries;
    const delayedDeliveries = Math.max(
      completed - agent.onTimeDeliveries,
      0,
    );
    const onTimeRate =
      completed === 0
        ? 0
        : Number(
            ((agent.onTimeDeliveries / completed) * 100).toFixed(2),
          );

    return {
      id: agent._id.toHexString(),
      agentCode: agent.agentCode,
      user: await this.getRelatedUser(agent.userId, repositories.users),
      rating: agent.rating,
      activeDeliveries: agent.activeDeliveries,
      completedDeliveries: completed,
      onTimeDeliveries: agent.onTimeDeliveries,
      delayedDeliveries,
      onTimeRate,
      rewardPoints: agent.rewardPoints,
      penaltyPoints: agent.penaltyPoints,
    };
  }

  private parseMetrics(input: InputObject): Partial<AgentDocument> {
    const metrics: Partial<AgentDocument> = {};
    const rating = getMetric(input, "rating", 5);
    const activeDeliveries = getMetric(input, "activeDeliveries");
    const completedDeliveries = getMetric(input, "completedDeliveries");
    const onTimeDeliveries = getMetric(input, "onTimeDeliveries");
    const rewardPoints = getMetric(input, "rewardPoints");
    const penaltyPoints = getMetric(input, "penaltyPoints");

    if (rating !== undefined) metrics.rating = rating;
    if (activeDeliveries !== undefined) {
      metrics.activeDeliveries = activeDeliveries;
    }
    if (completedDeliveries !== undefined) {
      metrics.completedDeliveries = completedDeliveries;
    }
    if (onTimeDeliveries !== undefined) {
      metrics.onTimeDeliveries = onTimeDeliveries;
    }
    if (rewardPoints !== undefined) metrics.rewardPoints = rewardPoints;
    if (penaltyPoints !== undefined) metrics.penaltyPoints = penaltyPoints;

    return metrics;
  }

  private async requireAgentUser(
    userId: import("mongodb").ObjectId,
    users: UserRepository,
  ) {
    const user = await users.findById(userId);
    if (!user) {
      throw new AppError("Related user not found.", 404, "USER_NOT_FOUND");
    }
    if (user.role !== "AGENT") {
      throw new AppError(
        "The related user must have the AGENT role.",
        400,
        "VALIDATION_ERROR",
      );
    }
    return user;
  }

  private async getRelatedUser(
    userId: import("mongodb").ObjectId,
    users: UserRepository,
  ): Promise<PublicUser> {
    const user = await users.findById(userId);
    if (!user) {
      throw new AppError(
        "An agent is missing its related user.",
        500,
        "DATA_INTEGRITY_ERROR",
      );
    }
    return toPublicUser(user);
  }

  private async resolveRelations(
    relations: AgentRelations,
    repositories: AgentRepositories,
  ): Promise<RelationDocuments> {
    const servedLocations = await this.getLocations(
      relations.servedLocationIds,
      repositories.locations,
    );
    const availableLocations = await this.getLocations(
      relations.availableLocationIds,
      repositories.locations,
    );
    const offeredServices = [];

    for (const serviceId of relations.offeredServiceIds ?? []) {
      const service = await repositories.services.findById(serviceId);
      if (!service) {
        throw new AppError(
          "Related service not found.",
          404,
          "SERVICE_NOT_FOUND",
        );
      }
      offeredServices.push({
        _id: service._id,
        serviceCode: service.serviceCode,
      });
    }

    return {
      servedLocations,
      availableLocations,
      offeredServices,
    };
  }

  private async getLocations(
    ids: ReturnType<typeof getObjectIdArray>,
    locations: LocationRepository,
  ): Promise<LocationDocument[]> {
    const result: LocationDocument[] = [];
    for (const id of ids ?? []) {
      const location = await locations.findById(id);
      if (!location) {
        throw new AppError(
          "Related location not found.",
          404,
          "LOCATION_NOT_FOUND",
        );
      }
      result.push(location);
    }
    return result;
  }

  private async syncGraph(
    agent: AgentDocument,
    user: { fullName: string },
    relations: RelationDocuments,
  ): Promise<void> {
    await bestEffortGraphSync(
      (graph) =>
        graph.syncAgent({
          agentId: agent._id.toHexString(),
          agentName: user.fullName,
          servedLocations: relations.servedLocations.map((location) => ({
            locationId: location._id.toHexString(),
            name: location.name,
            city: location.city,
            state: location.state,
            latitude: location.latitude,
            longitude: location.longitude,
          })),
          availableLocations: relations.availableLocations.map(
            (location) => ({
              locationId: location._id.toHexString(),
              name: location.name,
              city: location.city,
              state: location.state,
              latitude: location.latitude,
              longitude: location.longitude,
            }),
          ),
          offeredServices: relations.offeredServices.map((service) => ({
            serviceId: service._id.toHexString(),
            serviceCode: service.serviceCode,
          })),
        }),
      `agent ${agent._id.toHexString()}`,
    );
  }
}