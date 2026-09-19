import {
  ObjectId,
  type Db,
  type FindOptions,
} from "mongodb";

import { type PackageDocument } from "../models/package";
import { MongoRepository } from "./mongo.repository";

export class PackageRepository extends MongoRepository<PackageDocument> {
  constructor(db: Db) {
    super(db, "packages");
  }

  async findByTrackingNumber(
    trackingNumber: string,
  ): Promise<PackageDocument | null> {
    return this.collection.findOne({
      trackingNumber,
    } as { trackingNumber: string });
  }

  async findByCustomerId(
    customerId: ObjectId,
    options?: FindOptions<PackageDocument>,
  ): Promise<PackageDocument[]> {
    return this.findMany(
      { customerId } as { customerId: ObjectId },
      options,
    );
  }

  async findByAssignedAgentId(
    assignedAgentId: ObjectId,
  ): Promise<PackageDocument[]> {
    return this.findMany({ assignedAgentId } as { assignedAgentId: ObjectId });
  }
}