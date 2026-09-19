import { ObjectId, type Db } from "mongodb";

import { type DeliveryHistoryDocument } from "../models/delivery-history";
import { MongoRepository } from "./mongo.repository";

export class DeliveryHistoryRepository extends MongoRepository<DeliveryHistoryDocument> {
  constructor(db: Db) {
    super(db, "deliveryHistory");
  }

  async findByPackageId(
    packageId: ObjectId,
  ): Promise<DeliveryHistoryDocument[]> {
    return this.findMany(
      { packageId } as { packageId: ObjectId },
      { sort: { timestamp: 1 } },
    );
  }

  async findByAgentId(agentId: ObjectId): Promise<DeliveryHistoryDocument[]> {
    return this.findMany(
      { agentId } as { agentId: ObjectId },
      { sort: { timestamp: -1 } },
    );
  }
}