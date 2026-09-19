import { ObjectId } from "mongodb";

import { type MongoDocument, type Timestamped } from "./common";
import { type BookingStatus } from "./enums";

export interface BookingDocument extends MongoDocument, Timestamped {
  bookingNumber: string;
  packageId: ObjectId;
  customerId: ObjectId;
  agentId: ObjectId;
  serviceId: ObjectId;
  bookingDate: Date;
  scheduledDate: Date;
  status: BookingStatus;
  confirmationCode: string;
  cancellationReason: string | null;
}