import { type ObjectId } from "mongodb";

import { type AgentDocument } from "../models/agent";
import { type LocationDocument } from "../models/location";
import { type PackageDocument } from "../models/package";
import { type UserDocument } from "../models/user";
import { AgentRepository } from "../repositories/agent.repository";
import { LocationRepository } from "../repositories/location.repository";
import { UserRepository } from "../repositories/user.repository";
import {
  type AgentGraphCandidate,
  AgentGraphRepository,
} from "../repositories/neo4j/agent-graph.repository";
import { AgentGraphService } from "./agent-graph.service";
import { AppError } from "../middleware/error-handler";
import { getObjectId } from "../utils/management-validation";

export const MAX_ACTIVE_DELIVERIES = 5;

export interface AssignmentResult {
  agent: AgentDocument;
  user: UserDocument;
  score: number;
  distanceKm: number;
  estimatedMinutes: number;
  reason: string;
  assignedAt: Date;
}

interface ScoredCandidate {
  agent: AgentDocument;
  user: UserDocument;
  agentName: string;
  score: number;
  distanceKm: number;
  estimatedMinutes: number;
  reason: string;
}

export function calculateHaversineDistanceKm(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
): number {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(secondLatitude - firstLatitude);
  const longitudeDelta = toRadians(secondLongitude - firstLongitude);
  const firstLatitudeRadians = toRadians(firstLatitude);
  const secondLatitudeRadians = toRadians(secondLatitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitudeRadians) *
      Math.cos(secondLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;

  return Number(
    (earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)))
      .toFixed(2),
  );
}

export function calculateAssignmentScore(
  distanceKm: number,
  activeDeliveries: number,
  rating: number,
  completedDeliveries: number,
  onTimeDeliveries: number,
): number {
  const distanceScore =
    100 * (1 - Math.min(Math.max(distanceKm, 0), 100) / 100);
  const workloadScore =
    100 *
    (1 -
      Math.min(
        Math.max(activeDeliveries, 0),
        MAX_ACTIVE_DELIVERIES,
      ) /
        MAX_ACTIVE_DELIVERIES);
  const ratingScore = (Math.min(Math.max(rating, 0), 5) / 5) * 100;
  const onTimeScore =
    completedDeliveries <= 0
      ? 100
      : (Math.min(
          Math.max(onTimeDeliveries, 0),
          completedDeliveries,
        ) /
          completedDeliveries) *
        100;

  return Number(
    (
      distanceScore * 0.4 +
      workloadScore * 0.25 +
      ratingScore * 0.2 +
      onTimeScore * 0.15
    ).toFixed(2),
  );
}

export class AssignmentService {
  constructor(
    private readonly agents: AgentRepository,
    private readonly locations: LocationRepository,
    private readonly users: UserRepository,
    private readonly graph: AgentGraphService,
  ) {}

  async findBestAgent(
    packageDocument: PackageDocument,
  ): Promise<AssignmentResult | null> {
    const graphCandidates = await this.graph.findEligibleAgentsByState(
      packageDocument.sourceLocation.state,
      packageDocument.destinationLocation.state,
      packageDocument.serviceId.toHexString(),
    );
    const scoredCandidates: ScoredCandidate[] = [];

    for (const graphCandidate of graphCandidates) {
      const scored = await this.scoreCandidate(
        graphCandidate,
        packageDocument,
      );
      if (scored) {
        scoredCandidates.push(scored);
      }
    }

    scoredCandidates.sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }
      if (
        first.agent.activeDeliveries !== second.agent.activeDeliveries
      ) {
        return (
          first.agent.activeDeliveries -
          second.agent.activeDeliveries
        );
      }
      if (second.agent.rating !== first.agent.rating) {
        return second.agent.rating - first.agent.rating;
      }
      return first.agent.agentCode.localeCompare(second.agent.agentCode);
    });

    const selected = scoredCandidates[0];
    if (!selected) {
      return null;
    }

    return {
      agent: selected.agent,
      user: selected.user,
      score: selected.score,
      distanceKm: selected.distanceKm,
      estimatedMinutes: selected.estimatedMinutes,
      reason: selected.reason,
      assignedAt: new Date(),
    };
  }

  private async scoreCandidate(
    graphCandidate: AgentGraphCandidate,
    packageDocument: PackageDocument,
  ): Promise<ScoredCandidate | null> {
    let agentId: ObjectId;
    try {
      agentId = getObjectId(graphCandidate.agentId, "agentId");
    } catch (error) {
      if (error instanceof AppError) {
        return null;
      }
      throw error;
    }

    const agent = await this.agents.findById(agentId);
    if (!agent || agent.status !== "AVAILABLE") {
      return null;
    }
    if (agent.activeDeliveries >= MAX_ACTIVE_DELIVERIES) {
      return null;
    }

    const user = await this.users.findById(agent.userId);
    if (!user || !user.isActive) {
      return null;
    }

    const agentLat = graphCandidate.latitude ?? packageDocument.sourceLocation.latitude;
    const agentLng = graphCandidate.longitude ?? packageDocument.sourceLocation.longitude;

    const distanceKm = calculateHaversineDistanceKm(
      agentLat,
      agentLng,
      packageDocument.sourceLocation.latitude,
      packageDocument.sourceLocation.longitude,
    );
    const estimatedMinutes = Math.max(
      5,
      Math.ceil((distanceKm / 30) * 60),
    );
    const score = calculateAssignmentScore(
      distanceKm,
      agent.activeDeliveries,
      agent.rating,
      agent.completedDeliveries,
      agent.onTimeDeliveries,
    );

    return {
      agent,
      user,
      agentName: user.fullName,
      score,
      distanceKm,
      estimatedMinutes,
      reason:
        "Selected using distance (40%), workload (25%), rating (20%), and on-time performance (15%).",
    };
  }
}