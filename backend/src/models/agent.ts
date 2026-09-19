import { ObjectId } from "mongodb";

import { type MongoDocument, type Timestamped } from "./common";
import { type AgentStatus, type VehicleType } from "./enums";

export interface AgentDocument extends MongoDocument, Timestamped {
  userId: ObjectId;
  agentCode: string;
  vehicleType: VehicleType;
  status: AgentStatus;
  rating: number;
  activeDeliveries: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
  rewardPoints: number;
  penaltyPoints: number;
  /** Location IDs this agent serves (used for Neo4j SERVES relationships). */
  servedLocationIds?: ObjectId[];
  /** Location IDs where this agent is currently available. */
  availableLocationIds?: ObjectId[];
  /** Service IDs this agent offers (used for Neo4j OFFERS relationships). */
  offeredServiceIds?: ObjectId[];
}