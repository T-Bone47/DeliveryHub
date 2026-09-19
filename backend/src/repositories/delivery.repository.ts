import { ObjectId, type Db } from "mongodb";

import { type DeliveryDocument } from "../models/delivery";
import { MongoRepository } from "./mongo.repository";

export class DeliveryRepository extends MongoRepository<DeliveryDocument> {
  constructor(db: Db) {
    super(db, "deliveries");
  }

  async findByPackageId(packageId: ObjectId): Promise<DeliveryDocument | null> {
    return this.collection.findOne({ packageId } as { packageId: ObjectId });
  }

  async findByBookingId(bookingId: ObjectId): Promise<DeliveryDocument | null> {
    return this.collection.findOne({ bookingId } as { bookingId: ObjectId });
  }

  async findByAgentId(agentId: ObjectId): Promise<DeliveryDocument[]> {
    return this.findMany({ agentId } as { agentId: ObjectId });
  }
}