import { ObjectId, type Db } from "mongodb";

import { type BookingDocument } from "../models/booking";
import { MongoRepository } from "./mongo.repository";

export class BookingRepository extends MongoRepository<BookingDocument> {
  constructor(db: Db) {
    super(db, "bookings");
  }

  async findByBookingNumber(
    bookingNumber: string,
  ): Promise<BookingDocument | null> {
    return this.collection.findOne({ bookingNumber } as { bookingNumber: string });
  }

  async findByConfirmationCode(
    confirmationCode: string,
  ): Promise<BookingDocument | null> {
    return this.collection.findOne({
      confirmationCode,
    } as { confirmationCode: string });
  }

  async findByPackageId(packageId: ObjectId): Promise<BookingDocument | null> {
    return this.collection.findOne({ packageId } as { packageId: ObjectId });
  }

  async findByCustomerId(customerId: ObjectId): Promise<BookingDocument[]> {
    return this.findMany({ customerId } as { customerId: ObjectId });
  }

  async findByAgentId(agentId: ObjectId): Promise<BookingDocument[]> {
    return this.findMany({ agentId } as { agentId: ObjectId });
  }
}