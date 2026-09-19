export const USER_ROLES = ["ADMIN", "CUSTOMER", "AGENT"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const VEHICLE_TYPES = ["BIKE", "CAR", "VAN", "TRUCK"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const AGENT_STATUSES = [
  "AVAILABLE",
  "BUSY",
  "OFFLINE",
  "SUSPENDED",
] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];

export const PACKAGE_TYPES = [
  "DOCUMENT",
  "PARCEL",
  "ELECTRONICS",
  "CLOTHING",
  "FOOD",
  "OTHER",
] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const DELIVERY_STATUSES = [
  "PENDING",
  "AGENT_ASSIGNED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RESCHEDULED",
  "FAILED",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "RESCHEDULED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const REWARD_PENALTY_TYPES = ["REWARD", "PENALTY"] as const;
export type RewardPenaltyType = (typeof REWARD_PENALTY_TYPES)[number];

export const NOTIFICATION_TYPES = [
  "BOOKING_CONFIRMED",
  "AGENT_ASSIGNED",
  "STATUS_UPDATED",
  "BOOKING_CANCELLED",
  "DELIVERY_RESCHEDULED",
  "DELIVERY_COMPLETED",
  "REWARD_ADDED",
  "PENALTY_ADDED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const OTP_PURPOSES = ["PICKUP", "DELIVERY"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];