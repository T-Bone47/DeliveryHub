import { ObjectId, type Db } from "mongodb";

import { type RewardPenaltyDocument } from "../models/reward-penalty";
import { MongoRepository } from "./mongo.repository";

export class RewardPenaltyRepository extends MongoRepository<RewardPenaltyDocument> {
  constructor(db: Db) {
    super(db, "rewardPenalties");
  }

  async findByAgentId(
    agentId: ObjectId,
  ): Promise<RewardPenaltyDocument[]> {
    return this.findMany(
      { agentId } as { agentId: ObjectId },
      { sort: { createdAt: -1 } },
    );
  }
}