import { ObjectId } from "mongodb";

import { type MongoDocument } from "./common";
import { type RewardPenaltyType } from "./enums";

export interface RewardPenaltyDocument extends MongoDocument {
  agentId: ObjectId;
  packageId?: ObjectId;
  type: RewardPenaltyType;
  reason: string;
  points: number;
  amount?: number;
  createdAt: Date;
  createdBy: ObjectId;
}