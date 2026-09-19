import { ObjectId } from "mongodb";

import { type DeliveryStatus } from "./enums";
import { type MongoDocument } from "./common";

export interface DeliveryHistoryDocument extends MongoDocument {
  packageId: ObjectId;
  bookingId: ObjectId | null;
  agentId: ObjectId | null;
  status: DeliveryStatus;
  remarks: string;
  timestamp: Date;
  changedByUserId: ObjectId | null;
}