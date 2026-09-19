import { ObjectId } from "mongodb";

import { type MongoDocument, type Timestamped } from "./common";
import { type DeliveryStatus } from "./enums";

export interface OtpRecord {
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  verified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
}

export interface ProofOfDelivery {
  photoUrl: string;
  capturedAt: Date;
  capturedByAgentId: ObjectId;
  otpVerified: boolean;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryException {
  reason: string;
  note?: string;
  reportedAt: Date;
  reportedByAgentId: ObjectId;
  previousStatus: DeliveryStatus;
  attemptNumber: number;
}

export interface DeliveryDocument extends MongoDocument, Timestamped {
  packageId: ObjectId;
  bookingId: ObjectId;
  agentId: ObjectId;
  currentStatus: DeliveryStatus;
  pickupTime: Date | null;
  estimatedDeliveryTime: Date | null;
  actualDeliveryTime: Date | null;
  otpHash: string | null;
  otpExpiresAt: Date | null;
  pickupOtp?: OtpRecord | null;
  deliveryOtp?: OtpRecord | null;
  proofOfDelivery?: ProofOfDelivery | null;
  exceptions?: DeliveryException[];
}