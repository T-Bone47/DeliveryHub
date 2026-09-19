import { randomUUID, randomInt } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcrypt";
import { ObjectId, type Filter } from "mongodb";

import {
  DELIVERY_STATUSES,
  PACKAGE_TYPES,
  OTP_PURPOSES,
  type DeliveryStatus,
  type PackageType,
  type OtpPurpose,
} from "../models/enums";
import {
  type LocationSnapshot,
  type Timestamped,
} from "../models/common";
import { type PackageDocument } from "../models/package";
import { type BookingDocument } from "../models/booking";
import { type DeliveryDocument, type OtpRecord, type ProofOfDelivery, type DeliveryException } from "../models/delivery";
import { type DeliveryHistoryDocument } from "../models/delivery-history";
import { type NotificationDocument } from "../models/notification";
import { type UserDocument, toPublicUser } from "../models/user";
import { AgentRepository } from "../repositories/agent.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { DeliveryHistoryRepository } from "../repositories/delivery-history.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { LocationRepository } from "../repositories/location.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { PackageRepository } from "../repositories/package.repository";
import { ServiceRepository } from "../repositories/service.repository";
import { UserRepository } from "../repositories/user.repository";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { AppError } from "../middleware/error-handler";
import { AgentGraphService } from "./agent-graph.service";
import {
  type AssignmentResult,
  AssignmentService,
} from "./assignment.service";
import {
  getEnumValue,
  getInputObject,
  getNumber,
  getObjectId,
  getOptionalString,
  getRequiredString,
} from "../utils/management-validation";

interface PackageRepositories {
  agents: AgentRepository;
  bookings: BookingRepository;
  deliveries: DeliveryRepository;
  histories: DeliveryHistoryRepository;
  locations: LocationRepository;
  notifications: NotificationRepository;
  packages: PackageRepository;
  services: ServiceRepository;
  users: UserRepository;
}

interface PackageQuery {
  status?: DeliveryStatus;
  agentId?: ObjectId;
  customerId?: ObjectId;
  serviceId?: ObjectId;
  fromDate?: Date;
  toDate?: Date;
  page: number;
  limit: number;
}

export interface PackageView {
  id: string;
  trackingNumber: string;
  customerId: string;
  packageType: PackageType;
  description: string;
  weight: number;
  sourceLocation: LocationSnapshot;
  destinationLocation: LocationSnapshot;
  serviceId: string;
  scheduledDate: Date;
  status: DeliveryStatus;
  assignedAgentId: string | null;
  assignmentScore?: number;
  assignmentDistanceKm?: number;
  assignmentEstimatedMinutes?: number;
  assignmentReason?: string;
  assignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingView {
  id: string;
  bookingNumber: string;
  packageId: string;
  customerId: string;
  agentId: string;
  serviceId: string;
  bookingDate: Date;
  scheduledDate: Date;
  status: BookingDocument["status"];
  confirmationCode: string;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OtpView {
  verified: boolean;
  expiresAt: Date;
  verifiedAt: Date | null;
  attemptsRemaining: number;
}

export interface DeliveryView {
  id: string;
  packageId: string;
  bookingId: string | null;
  agentId: string | null;
  currentStatus: DeliveryDocument["currentStatus"];
  pickupTime: Date | null;
  estimatedDeliveryTime: Date | null;
  actualDeliveryTime: Date | null;
  pickupOtp?: OtpView | null;
  deliveryOtp?: OtpView | null;
  proofOfDelivery?: ProofOfDeliveryView | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryView {
  id: string;
  packageId: string;
  bookingId: string | null;
  agentId: string | null;
  status: DeliveryStatus;
  remarks: string;
  timestamp: Date;
  changedByUserId: string | null;
}

export interface AssignedAgentView {
  id: string;
  userId: string;
  name: string;
  agentCode: string;
  status: string;
  rating: number;
}

export interface AssignmentView {
  packageId: string;
  agentId: string | null;
  agentName: string | null;
  score: number | null;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  reason: string | null;
  assignedAt: Date | null;
}

export const DELIVERY_EXCEPTION_REASONS = [
  "Customer unavailable",
  "Wrong address",
  "Package damaged",
  "Customer rejected",
  "Vehicle issue",
  "Other",
] as const;
export type DeliveryExceptionReason = (typeof DELIVERY_EXCEPTION_REASONS)[number];

export interface ProofOfDeliveryView {
  photoUrl: string;
  capturedAt: Date;
  capturedByAgentId: string;
  otpVerified: boolean;
  latitude?: number;
  longitude?: number;
}

export interface DeliveryExceptionView {
  reason: string;
  note?: string;
  reportedAt: Date;
  reportedByAgentId: string;
  previousStatus: DeliveryStatus;
  attemptNumber: number;
}

export interface PackageDetailsView {
  package: PackageView;
  assignment: AssignmentView;
  assignedAgent: AssignedAgentView | null;
  booking: BookingView | null;
  delivery: DeliveryView | null;
  history: HistoryView[];
  proofOfDelivery?: ProofOfDeliveryView | null;
  exceptions?: DeliveryExceptionView[];
  latestException?: DeliveryExceptionView | null;
}

export interface PackageListView {
  packages: PackageView[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePackageResult {
  package: PackageView;
  assignment: AssignmentView | null;
  booking: BookingView | null;
}

export interface AssignmentRetryResult {
  packageId: string;
  agentId: string | null;
  agentName: string | null;
  score: number | null;
  reason: string;
}

function toPackageView(packageDocument: PackageDocument): PackageView {
  return {
    id: packageDocument._id.toHexString(),
    trackingNumber: packageDocument.trackingNumber,
    customerId: packageDocument.customerId.toHexString(),
    packageType: packageDocument.packageType,
    description: packageDocument.description,
    weight: packageDocument.weight,
    sourceLocation: packageDocument.sourceLocation,
    destinationLocation: packageDocument.destinationLocation,
    serviceId: packageDocument.serviceId.toHexString(),
    scheduledDate: packageDocument.scheduledDate,
    status: packageDocument.status,
    assignedAgentId:
      packageDocument.assignedAgentId?.toHexString() ?? null,
    ...(packageDocument.assignmentScore === undefined
      ? {}
      : { assignmentScore: packageDocument.assignmentScore }),
    ...(packageDocument.assignmentDistanceKm === undefined
      ? {}
      : { assignmentDistanceKm: packageDocument.assignmentDistanceKm }),
    ...(packageDocument.assignmentEstimatedMinutes === undefined
      ? {}
      : {
          assignmentEstimatedMinutes:
            packageDocument.assignmentEstimatedMinutes,
        }),
    ...(packageDocument.assignmentReason === undefined
      ? {}
      : { assignmentReason: packageDocument.assignmentReason }),
    ...(packageDocument.assignedAt === undefined
      ? {}
      : { assignedAt: packageDocument.assignedAt }),
    createdAt: packageDocument.createdAt,
    updatedAt: packageDocument.updatedAt,
  };
}

function toBookingView(booking: BookingDocument): BookingView {
  return {
    id: booking._id.toHexString(),
    bookingNumber: booking.bookingNumber,
    packageId: booking.packageId.toHexString(),
    customerId: booking.customerId.toHexString(),
    agentId: booking.agentId.toHexString(),
    serviceId: booking.serviceId.toHexString(),
    bookingDate: booking.bookingDate,
    scheduledDate: booking.scheduledDate,
    status: booking.status,
    confirmationCode: booking.confirmationCode,
    cancellationReason: booking.cancellationReason,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };
}

function toDeliveryView(delivery: DeliveryDocument): DeliveryView {
  return {
    id: delivery._id.toHexString(),
    packageId: delivery.packageId.toHexString(),
    bookingId: delivery.bookingId.toHexString(),
    agentId: delivery.agentId.toHexString(),
    currentStatus: delivery.currentStatus,
    pickupTime: delivery.pickupTime,
    estimatedDeliveryTime: delivery.estimatedDeliveryTime,
    actualDeliveryTime: delivery.actualDeliveryTime,
    pickupOtp: delivery.pickupOtp
      ? {
          verified: delivery.pickupOtp.verified,
          expiresAt: delivery.pickupOtp.expiresAt,
          verifiedAt: delivery.pickupOtp.verifiedAt,
          attemptsRemaining: Math.max(
            0,
            delivery.pickupOtp.maxAttempts - delivery.pickupOtp.attempts,
          ),
        }
      : null,
    deliveryOtp: delivery.deliveryOtp
      ? {
          verified: delivery.deliveryOtp.verified,
          expiresAt: delivery.deliveryOtp.expiresAt,
          verifiedAt: delivery.deliveryOtp.verifiedAt,
          attemptsRemaining: Math.max(
            0,
            delivery.deliveryOtp.maxAttempts - delivery.deliveryOtp.attempts,
          ),
        }
      : null,
    proofOfDelivery: delivery.proofOfDelivery
      ? {
          photoUrl: delivery.proofOfDelivery.photoUrl,
          capturedAt: delivery.proofOfDelivery.capturedAt,
          capturedByAgentId: delivery.proofOfDelivery.capturedByAgentId.toHexString(),
          otpVerified: delivery.proofOfDelivery.otpVerified,
          latitude: delivery.proofOfDelivery.latitude,
          longitude: delivery.proofOfDelivery.longitude,
        }
      : null,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
  };
}

function toHistoryView(history: DeliveryHistoryDocument): HistoryView {
  return {
    id: history._id.toHexString(),
    packageId: history.packageId.toHexString(),
    bookingId: history.bookingId?.toHexString() ?? null,
    agentId: history.agentId?.toHexString() ?? null,
    status: history.status,
    remarks: history.remarks,
    timestamp: history.timestamp,
    changedByUserId: history.changedByUserId?.toHexString() ?? null,
  };
}

function getQueryValue(value: unknown, fieldName: string): unknown {
  if (Array.isArray(value)) {
    throw new AppError(
      `${fieldName} must be provided once.`,
      400,
      "VALIDATION_ERROR",
    );
  }
  return value;
}

function getPositiveInteger(
  value: unknown,
  fieldName: string,
  fallback: number,
  maximum: number,
): number {
  const normalized = getQueryValue(value, fieldName);
  if (normalized === undefined) {
    return fallback;
  }
  if (
    typeof normalized !== "string" ||
    !/^\d+$/.test(normalized) ||
    Number(normalized) < 1 ||
    Number(normalized) > maximum
  ) {
    throw new AppError(
      `${fieldName} must be an integer between 1 and ${maximum}.`,
      400,
      "VALIDATION_ERROR",
    );
  }
  return Number(normalized);
}

function parseLocation(
  value: unknown,
  fieldName: string,
): LocationSnapshot {
  const location = getInputObject(value);
  return {
    address: getRequiredString(location.address, `${fieldName}.address`),
    city: getRequiredString(location.city, `${fieldName}.city`),
    state: getRequiredString(location.state, `${fieldName}.state`),
    postalCode: getRequiredString(
      location.postalCode,
      `${fieldName}.postalCode`,
    ),
    latitude: getNumber(
      location.latitude,
      `${fieldName}.latitude`,
      -90,
      90,
    ),
    longitude: getNumber(
      location.longitude,
      `${fieldName}.longitude`,
      -180,
      180,
    ),
  };
}

function parseScheduledDate(value: unknown): Date {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(
      "scheduledDate is required.",
      400,
      "VALIDATION_ERROR",
    );
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(
      "scheduledDate must be a valid date.",
      400,
      "VALIDATION_ERROR",
    );
  }
  return parsed;
}

function locationsAreIdentical(
  source: LocationSnapshot,
  destination: LocationSnapshot,
): boolean {
  return (
    source.address.toLowerCase() === destination.address.toLowerCase() &&
    source.city.toLowerCase() === destination.city.toLowerCase() &&
    source.state.toLowerCase() === destination.state.toLowerCase() &&
    source.postalCode === destination.postalCode &&
    source.latitude === destination.latitude &&
    source.longitude === destination.longitude
  );
}

function savePodPhoto(base64Data: string): string {
  if (typeof base64Data !== "string" || base64Data.trim() === "") {
    throw new AppError("Photo image data is required.", 400, "VALIDATION_ERROR");
  }

  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let mimeType = "image/jpeg";
  let buffer: Buffer;

  if (matches && matches.length === 3) {
    mimeType = matches[1].toLowerCase();
    buffer = Buffer.from(matches[2], "base64");
  } else {
    buffer = Buffer.from(base64Data, "base64");
  }

  const allowedMimeTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const ext = allowedMimeTypes[mimeType] || "jpg";

  // Check file size (max 5MB)
  if (buffer.length > 5 * 1024 * 1024) {
    throw new AppError("Image file size exceeds maximum limit of 5MB.", 400, "FILE_TOO_LARGE");
  }

  if (buffer.length === 0) {
    throw new AppError("Image data is empty or invalid.", 400, "INVALID_FILE");
  }

  const uploadsDir = path.resolve(process.cwd(), "uploads", "pod");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const safeFilename = `pod-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
  const filePath = path.resolve(uploadsDir, safeFilename);

  fs.writeFileSync(filePath, buffer);

  return `/uploads/pod/${safeFilename}`;
}

export class PackageManagementService {
  constructor(
    private readonly getRepositories: () => PackageRepositories,
    private readonly getGraph: () => AgentGraphService,
  ) {}

  async create(
    customerIdValue: unknown,
    input: unknown,
  ): Promise<CreatePackageResult> {
    const customerId = getObjectId(customerIdValue, "Customer ID");
    const body = getInputObject(input);
    const packageType = getEnumValue(
      body.packageType,
      "packageType",
      PACKAGE_TYPES,
    );
    const description = getRequiredString(body.description, "description");
    const weight = getNumber(body.weight, "weight", Number.MIN_VALUE);
    const sourceLocation = parseLocation(
      body.sourceLocation,
      "sourceLocation",
    );
    const destinationLocation = parseLocation(
      body.destinationLocation,
      "destinationLocation",
    );
    if (locationsAreIdentical(sourceLocation, destinationLocation)) {
      throw new AppError(
        "sourceLocation and destinationLocation must be different.",
        400,
        "VALIDATION_ERROR",
      );
    }
    const serviceId = getObjectId(body.serviceId, "serviceId");
    const scheduledDate = parseScheduledDate(body.scheduledDate);
    const repositories = this.getRepositories();
    const customer = await repositories.users.findById(customerId);
    if (!customer || !customer.isActive || customer.role !== "CUSTOMER") {
      throw new AppError(
        "The authenticated customer account is not available.",
        403,
        "FORBIDDEN",
      );
    }

    const service = await repositories.services.findById(serviceId);
    if (!service) {
      throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
    }
    if (!service.isActive) {
      throw new AppError(
        "The selected service is inactive.",
        400,
        "SERVICE_INACTIVE",
      );
    }

    const assignmentService = this.createAssignmentService(repositories);
    const packageDocument = await repositories.packages.create({
      trackingNumber: await this.generateTrackingNumber(repositories),
      customerId,
      packageType,
      description,
      weight,
      sourceLocation,
      destinationLocation,
      serviceId,
      scheduledDate,
      status: "PENDING",
      assignedAgentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let assignment: AssignmentResult | null;
    try {
      assignment = await assignmentService.findBestAgent(packageDocument);
    } catch (error) {
      await repositories.packages.deleteById(packageDocument._id);
      throw new AppError(
        "Automatic assignment is temporarily unavailable.",
        503,
        "ASSIGNMENT_UNAVAILABLE",
      );
    }

    if (!assignment) {
      const history = await repositories.histories.create({
        packageId: packageDocument._id,
        bookingId: null,
        agentId: null,
        status: "PENDING",
        remarks:
          "No delivery agents are currently available at this location.",
        timestamp: new Date(),
        changedByUserId: customerId,
      });
      return {
        package: toPackageView(packageDocument),
        assignment: {
          packageId: packageDocument._id.toHexString(),
          agentId: null,
          agentName: null,
          score: null,
          distanceKm: null,
          estimatedMinutes: null,
          reason: history.remarks,
          assignedAt: null,
        },
        booking: null,
      };
    }

    return this.completeAssignment(
      packageDocument,
      assignment,
      customer,
      repositories,
    );
  }

  async listMine(
    customerIdValue: unknown,
    queryInput: unknown,
  ): Promise<PackageListView> {
    const customerId = getObjectId(customerIdValue, "Customer ID");
    const query = this.parseQuery(queryInput, true);
    query.customerId = customerId;
    return this.listWithQuery(query);
  }

  async listAll(queryInput: unknown): Promise<PackageListView> {
    return this.listWithQuery(this.parseQuery(queryInput, false));
  }

  async listAssigned(
    agentUserIdValue: unknown,
    queryInput: unknown,
  ): Promise<PackageListView> {
    const agentUserId = getObjectId(agentUserIdValue, "Agent user ID");
    const repositories = this.getRepositories();
    const agent = await repositories.agents.findByUserId(agentUserId);
    if (!agent) {
      throw new AppError(
        "The authenticated agent profile is not available.",
        403,
        "FORBIDDEN",
      );
    }
    const query = this.parseQuery(queryInput, false);
    query.agentId = agent._id;
    return this.listWithQuery(query);
  }

  async getById(
    id: unknown,
    auth: AuthenticatedUser,
  ): Promise<PackageDetailsView> {
    const repositories = this.getRepositories();
    let packageDocument: PackageDocument | null = null;
    try {
      const packageId = getObjectId(id, "Package ID");
      packageDocument = await repositories.packages.findById(packageId);
    } catch {
      if (typeof id === "string" && id.trim().length > 0) {
        packageDocument = await repositories.packages.findByTrackingNumber(id.trim());
      }
    }
    if (!packageDocument && typeof id === "string" && id.trim().length > 0) {
      packageDocument = await repositories.packages.findByTrackingNumber(id.trim());
    }
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }
    await this.assertPackageAccess(packageDocument, auth, repositories);
    return this.getDetails(packageDocument, repositories);
  }

  async retryAssignment(
    id: unknown,
  ): Promise<AssignmentRetryResult> {
    const packageId = getObjectId(id, "Package ID");
    const repositories = this.getRepositories();
    const packageDocument = await repositories.packages.findById(packageId);
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }
    if (packageDocument.assignedAgentId) {
      throw new AppError(
        "This package already has an assigned agent.",
        409,
        "PACKAGE_ALREADY_ASSIGNED",
      );
    }
    if (packageDocument.status !== "PENDING") {
      throw new AppError(
        "Only PENDING packages can be assigned.",
        400,
        "INVALID_PACKAGE_STATUS",
      );
    }

    const assignmentService = this.createAssignmentService(repositories);
    let assignment: AssignmentResult | null;
    try {
      assignment = await assignmentService.findBestAgent(packageDocument);
    } catch (_error) {
      throw new AppError(
        "Automatic assignment is temporarily unavailable.",
        503,
        "ASSIGNMENT_UNAVAILABLE",
      );
    }

    if (!assignment) {
      await repositories.histories.create({
        packageId: packageDocument._id,
        bookingId: null,
        agentId: null,
        status: "PENDING",
        remarks:
          "No delivery agents are currently available at this location.",
        timestamp: new Date(),
        changedByUserId: null,
      });
      return {
        packageId: packageDocument._id.toHexString(),
        agentId: null,
        agentName: null,
        score: null,
        reason: "No delivery agents are currently available at this location.",
      };
    }

    const customer = await repositories.users.findById(
      packageDocument.customerId,
    );
    if (!customer) {
      throw new AppError(
        "Package customer not found.",
        500,
        "DATA_INTEGRITY_ERROR",
      );
    }
    await this.completeAssignment(
      packageDocument,
      assignment,
      customer,
      repositories,
    );

    return {
      packageId: packageDocument._id.toHexString(),
      agentId: assignment.agent._id.toHexString(),
      agentName: assignment.user.fullName,
      score: assignment.score,
      reason: assignment.reason,
    };
  }

  async getAssignment(
    id: unknown,
    auth: AuthenticatedUser,
  ): Promise<AssignmentView> {
    const details = await this.getById(id, auth);
    return details.assignment;
  }

  async generateOtp(
    id: unknown,
    customerUserIdValue: unknown,
    purposeInput: unknown,
  ): Promise<{ purpose: OtpPurpose; otp: string; expiresAt: Date; expiresInSeconds: number }> {
    const packageId = getObjectId(id, "Package ID");
    const customerUserId = getObjectId(customerUserIdValue, "Customer User ID");
    const purpose = getEnumValue(purposeInput, "OTP Purpose", OTP_PURPOSES);

    const repositories = this.getRepositories();
    const packageDocument = await repositories.packages.findById(packageId);
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }

    if (!packageDocument.customerId.equals(customerUserId)) {
      throw new AppError(
        "Only the package customer can generate verification OTPs.",
        403,
        "FORBIDDEN",
      );
    }

    if (
      packageDocument.status === "DELIVERED" ||
      packageDocument.status === "CANCELLED" ||
      packageDocument.status === "FAILED"
    ) {
      throw new AppError(
        "Cannot generate verification code for a completed or terminated delivery.",
        400,
        "TERMINAL_STATE",
      );
    }

    if (purpose === "PICKUP") {
      if (packageDocument.status !== "AGENT_ASSIGNED") {
        throw new AppError(
          "Pickup OTP can only be generated when an agent is assigned and package pickup is pending.",
          400,
          "INVALID_PACKAGE_STATUS",
        );
      }
    } else if (purpose === "DELIVERY") {
      if (packageDocument.status !== "OUT_FOR_DELIVERY" && packageDocument.status !== "IN_TRANSIT") {
        throw new AppError(
          "Delivery OTP can only be generated when the package is in transit or out for delivery.",
          400,
          "INVALID_PACKAGE_STATUS",
        );
      }
    }

    const delivery = await repositories.deliveries.findByPackageId(packageDocument._id);
    if (!delivery) {
      throw new AppError("Associated delivery record not found.", 404, "DELIVERY_NOT_FOUND");
    }

    const existingOtp = purpose === "PICKUP" ? delivery.pickupOtp : delivery.deliveryOtp;
    if (existingOtp?.verified) {
      throw new AppError(
        `The ${purpose.toLowerCase()} verification has already been successfully completed.`,
        409,
        "ALREADY_VERIFIED",
      );
    }

    const rawOtp = randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otpRecord: OtpRecord = {
      otpHash,
      expiresAt,
      attempts: 0,
      maxAttempts: 5,
      verified: false,
      verifiedAt: null,
      createdAt: new Date(),
    };

    const field = purpose === "PICKUP" ? "pickupOtp" : "deliveryOtp";
    await repositories.deliveries.updateById(delivery._id, {
      $set: {
        [field]: otpRecord,
        otpHash: otpRecord.otpHash,
        otpExpiresAt: otpRecord.expiresAt,
        updatedAt: new Date(),
      },
    });

    return {
      purpose,
      otp: rawOtp,
      expiresAt,
      expiresInSeconds: 600,
    };
  }

  async verifyOtp(
    id: unknown,
    agentUserIdValue: unknown,
    purposeInput: unknown,
    otpInput: unknown,
  ): Promise<{
    verified: boolean;
    purpose: OtpPurpose;
    message: string;
    package: PackageView;
    delivery: DeliveryView;
  }> {
    const packageId = getObjectId(id, "Package ID");
    const agentUserId = getObjectId(agentUserIdValue, "Agent User ID");
    const purpose = getEnumValue(purposeInput, "OTP Purpose", OTP_PURPOSES);
    const otp = getRequiredString(otpInput, "OTP Code").trim();

    const repositories = this.getRepositories();
    const packageDocument = await repositories.packages.findById(packageId);
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }

    const agent = await repositories.agents.findByUserId(agentUserId);
    if (!agent) {
      throw new AppError("Authenticated agent profile not found.", 403, "FORBIDDEN");
    }

    if (!packageDocument.assignedAgentId || !packageDocument.assignedAgentId.equals(agent._id)) {
      throw new AppError(
        "Only the assigned courier agent can verify OTPs for this package.",
        403,
        "FORBIDDEN",
      );
    }

    const delivery = await repositories.deliveries.findByPackageId(packageDocument._id);
    if (!delivery) {
      throw new AppError("Associated delivery record not found.", 404, "DELIVERY_NOT_FOUND");
    }

    const otpRecord = purpose === "PICKUP" ? delivery.pickupOtp : delivery.deliveryOtp;
    if (!otpRecord) {
      throw new AppError(
        `Customer has not generated a ${purpose.toLowerCase()} verification OTP yet.`,
        400,
        "OTP_NOT_GENERATED",
      );
    }

    if (otpRecord.verified) {
      throw new AppError(
        `This ${purpose.toLowerCase()} verification has already been completed.`,
        409,
        "ALREADY_VERIFIED",
      );
    }

    const now = new Date();
    if (now > new Date(otpRecord.expiresAt)) {
      throw new AppError(
        "This OTP has expired. Ask the customer to generate a new OTP.",
        400,
        "OTP_EXPIRED",
      );
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new AppError(
        "Maximum OTP verification attempts exceeded. Ask the customer to generate a new OTP.",
        400,
        "OTP_ATTEMPTS_EXHAUSTED",
      );
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);
    const field = purpose === "PICKUP" ? "pickupOtp" : "deliveryOtp";

    if (!isMatch) {
      const newAttempts = otpRecord.attempts + 1;
      const remaining = Math.max(0, otpRecord.maxAttempts - newAttempts);
      await repositories.deliveries.updateById(delivery._id, {
        $inc: { [`${field}.attempts`]: 1 },
        $set: { updatedAt: now },
      });
      throw new AppError(
        `Incorrect OTP. Attempts remaining: ${remaining}.`,
        400,
        "INVALID_OTP",
      );
    }

    if (purpose === "PICKUP") {
      await repositories.deliveries.updateById(delivery._id, {
        $set: {
          [`${field}.verified`]: true,
          [`${field}.verifiedAt`]: now,
          currentStatus: "PICKED_UP",
          pickupTime: now,
          updatedAt: now,
        },
      });
      await repositories.packages.updateById(packageDocument._id, {
        $set: {
          status: "PICKED_UP",
          updatedAt: now,
        },
      });

      await repositories.histories.create({
        packageId: packageDocument._id,
        bookingId: delivery.bookingId,
        agentId: agent._id,
        status: "PICKED_UP",
        remarks: "Package picked up. Customer pickup OTP verified.",
        timestamp: now,
        changedByUserId: agentUserId,
      });

      await repositories.notifications.create({
        userId: packageDocument.customerId,
        type: "STATUS_UPDATED",
        title: "Package Picked Up",
        message: `Your package ${packageDocument.trackingNumber} has been verified and picked up by courier.`,
        isRead: false,
        relatedId: packageDocument._id,
        createdAt: now,
      }).catch(() => undefined);
    } else {
      // Step 1: Verify OTP and record verification timestamp.
      // Do NOT transition to DELIVERED yet — POD must be captured/uploaded first!
      await repositories.deliveries.updateById(delivery._id, {
        $set: {
          [`${field}.verified`]: true,
          [`${field}.verifiedAt`]: now,
          updatedAt: now,
        },
      });

      await repositories.histories.create({
        packageId: packageDocument._id,
        bookingId: delivery.bookingId,
        agentId: agent._id,
        status: packageDocument.status,
        remarks: "Customer delivery OTP verified. Ready for digital proof of delivery.",
        timestamp: now,
        changedByUserId: agentUserId,
      });

      await repositories.notifications.create({
        userId: packageDocument.customerId,
        type: "STATUS_UPDATED",
        title: "Delivery OTP Verified",
        message: `Delivery OTP for package ${packageDocument.trackingNumber} has been verified by the courier.`,
        isRead: false,
        relatedId: packageDocument._id,
        createdAt: now,
      }).catch(() => undefined);
    }

    const refetchedPackage = (await repositories.packages.findById(packageDocument._id))!;
    const refetchedDelivery = (await repositories.deliveries.findById(delivery._id))!;

    return {
      verified: true,
      purpose,
      message: `${purpose === "PICKUP" ? "Pickup" : "Delivery"} verified successfully.${purpose === "DELIVERY" ? " Please capture and upload proof of delivery photo." : ""}`,
      package: toPackageView(refetchedPackage),
      delivery: toDeliveryView(refetchedDelivery),
    };
  }

  async uploadProof(
    id: unknown,
    agentUserIdValue: unknown,
    photoInput: unknown,
    latitudeInput?: unknown,
    longitudeInput?: unknown,
  ): Promise<PackageDetailsView> {
    const packageId = getObjectId(id, "Package ID");
    const agentUserId = getObjectId(agentUserIdValue, "Agent User ID");
    const photo = getRequiredString(photoInput, "Proof Photo");

    const repositories = this.getRepositories();
    const packageDocument = await repositories.packages.findById(packageId);
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }

    const agent = await repositories.agents.findByUserId(agentUserId);
    if (!agent) {
      throw new AppError("Authenticated agent profile not found.", 403, "FORBIDDEN");
    }

    if (!packageDocument.assignedAgentId || !packageDocument.assignedAgentId.equals(agent._id)) {
      throw new AppError("Only the assigned courier agent can upload proof of delivery.", 403, "FORBIDDEN");
    }

    if (packageDocument.status === "DELIVERED") {
      throw new AppError("This delivery is already delivered. Proof cannot be modified.", 400, "TERMINAL_STATE");
    }

    if (packageDocument.status !== "OUT_FOR_DELIVERY") {
      throw new AppError(
        `Proof of delivery can only be uploaded when package is OUT_FOR_DELIVERY. Current status: ${packageDocument.status}.`,
        400,
        "INVALID_PACKAGE_STATUS",
      );
    }

    const delivery = await repositories.deliveries.findByPackageId(packageDocument._id);
    if (!delivery) {
      throw new AppError("Associated delivery record not found.", 404, "DELIVERY_NOT_FOUND");
    }

    if (!delivery.deliveryOtp?.verified) {
      throw new AppError(
        "Delivery OTP must be successfully verified before capturing proof of delivery.",
        400,
        "DELIVERY_OTP_REQUIRED",
      );
    }

    // Save image safely to uploads/pod
    const photoUrl = savePodPhoto(photo);
    const now = new Date();

    const latitude = typeof latitudeInput === "number" && Number.isFinite(latitudeInput) ? latitudeInput : undefined;
    const longitude = typeof longitudeInput === "number" && Number.isFinite(longitudeInput) ? longitudeInput : undefined;

    const podRecord: ProofOfDelivery = {
      photoUrl,
      capturedAt: now,
      capturedByAgentId: agent._id,
      otpVerified: true,
      latitude,
      longitude,
    };

    await repositories.deliveries.updateById(delivery._id, {
      $set: {
        proofOfDelivery: podRecord,
        updatedAt: now,
      },
    });

    await repositories.packages.updateById(packageDocument._id, {
      $set: {
        proofOfDelivery: {
          photoUrl: podRecord.photoUrl,
          capturedAt: podRecord.capturedAt,
          capturedByAgentId: podRecord.capturedByAgentId,
          otpVerified: podRecord.otpVerified,
        },
        updatedAt: now,
      },
    });

    await repositories.histories.create({
      packageId: packageDocument._id,
      bookingId: delivery.bookingId,
      agentId: agent._id,
      status: packageDocument.status,
      remarks: "Digital proof of delivery photo captured and uploaded.",
      timestamp: now,
      changedByUserId: agentUserId,
    });

    return this.getById(packageDocument._id, { userId: agentUserId.toHexString(), role: "AGENT" });
  }

  async reportException(
    id: unknown,
    agentUserIdValue: unknown,
    reasonInput: unknown,
    noteInput?: unknown,
  ): Promise<PackageDetailsView> {
    const packageId = getObjectId(id, "Package ID");
    const agentUserId = getObjectId(agentUserIdValue, "Agent User ID");
    const reason = getRequiredString(reasonInput, "Exception Reason");
    const note = typeof noteInput === "string" && noteInput.trim() !== "" ? noteInput.trim() : undefined;

    if (!DELIVERY_EXCEPTION_REASONS.includes(reason as DeliveryExceptionReason)) {
      throw new AppError(
        `Invalid exception reason. Must be one of: ${DELIVERY_EXCEPTION_REASONS.join(", ")}.`,
        400,
        "VALIDATION_ERROR",
      );
    }

    const repositories = this.getRepositories();
    const packageDocument = await repositories.packages.findById(packageId);
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }

    const agent = await repositories.agents.findByUserId(agentUserId);
    if (!agent) {
      throw new AppError("Authenticated agent profile not found.", 403, "FORBIDDEN");
    }

    if (!packageDocument.assignedAgentId || !packageDocument.assignedAgentId.equals(agent._id)) {
      throw new AppError("Only the assigned courier agent can report a delivery issue.", 403, "FORBIDDEN");
    }

    if (packageDocument.status === "DELIVERED") {
      throw new AppError("Cannot report an issue for an already delivered package.", 400, "TERMINAL_STATE");
    }
    if (packageDocument.status === "CANCELLED") {
      throw new AppError("Cannot report an issue for a cancelled delivery.", 400, "TERMINAL_STATE");
    }
    if (packageDocument.status === "FAILED") {
      throw new AppError("A delivery failure is already recorded for this package.", 409, "ALREADY_FAILED");
    }

    const delivery = await repositories.deliveries.findByPackageId(packageDocument._id);
    if (!delivery) {
      throw new AppError("Associated delivery record not found.", 404, "DELIVERY_NOT_FOUND");
    }

    const now = new Date();
    const attemptNumber = (delivery.exceptions?.length ?? 0) + 1;

    const exceptionRecord: DeliveryException = {
      reason,
      note,
      reportedAt: now,
      reportedByAgentId: agent._id,
      previousStatus: packageDocument.status,
      attemptNumber,
    };

    await repositories.deliveries.updateById(delivery._id, {
      $set: {
        currentStatus: "FAILED",
        updatedAt: now,
      },
      $push: {
        exceptions: exceptionRecord,
      } as any,
    });

    await repositories.packages.updateById(packageDocument._id, {
      $set: {
        status: "FAILED",
        latestException: {
          reason: exceptionRecord.reason,
          note: exceptionRecord.note,
          reportedAt: exceptionRecord.reportedAt,
          attemptNumber: exceptionRecord.attemptNumber,
        },
        updatedAt: now,
      },
    });

    // Free up agent active delivery count
    await repositories.agents.updateById(agent._id, {
      $inc: { activeDeliveries: -1 },
      $set: { updatedAt: now },
    }).catch(() => undefined);

    await repositories.histories.create({
      packageId: packageDocument._id,
      bookingId: delivery.bookingId,
      agentId: agent._id,
      status: "FAILED",
      remarks: `Delivery attempt failed: ${reason}${note ? " (" + note + ")" : ""}.`,
      timestamp: now,
      changedByUserId: agentUserId,
    });

    await repositories.notifications.create({
      userId: packageDocument.customerId,
      type: "STATUS_UPDATED",
      title: "Delivery Attempt Unsuccessful",
      message: `Delivery attempt for ${packageDocument.trackingNumber} was unsuccessful: ${reason}. Please reschedule your delivery.`,
      isRead: false,
      relatedId: packageDocument._id,
      createdAt: now,
    }).catch(() => undefined);

    return this.getById(packageDocument._id, { userId: agentUserId.toHexString(), role: "AGENT" });
  }

  async rescheduleDelivery(
    id: unknown,
    auth: AuthenticatedUser,
    scheduledDateInput: unknown,
  ): Promise<PackageDetailsView> {
    const packageId = getObjectId(id, "Package ID");
    const scheduledDate = parseScheduledDate(scheduledDateInput);

    if (scheduledDate.getTime() <= Date.now()) {
      throw new AppError("Scheduled date must be in the future.", 400, "VALIDATION_ERROR");
    }

    const repositories = this.getRepositories();
    const packageDocument = await repositories.packages.findById(packageId);
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }

    if (auth.role === "CUSTOMER") {
      if (!packageDocument.customerId.equals(new ObjectId(auth.userId))) {
        throw new AppError("You do not have permission to reschedule this delivery.", 403, "FORBIDDEN");
      }
    } else if (auth.role !== "ADMIN") {
      throw new AppError("Only customers or administrators can reschedule deliveries.", 403, "FORBIDDEN");
    }

    if (packageDocument.status === "DELIVERED") {
      throw new AppError("Cannot reschedule an already delivered package.", 400, "TERMINAL_STATE");
    }
    if (packageDocument.status === "CANCELLED") {
      throw new AppError("Cannot reschedule a cancelled delivery.", 400, "TERMINAL_STATE");
    }

    const delivery = await repositories.deliveries.findByPackageId(packageDocument._id);
    const now = new Date();

    await repositories.packages.updateById(packageDocument._id, {
      $set: {
        scheduledDate,
        status: "PENDING",
        assignedAgentId: null,
        assignmentScore: undefined,
        assignmentDistanceKm: undefined,
        assignmentEstimatedMinutes: undefined,
        assignmentReason: `Rescheduled to ${scheduledDate.toLocaleDateString()}. Pending courier assignment.`,
        assignedAt: undefined,
        updatedAt: now,
      },
    });

    if (delivery) {
      await repositories.deliveries.updateById(delivery._id, {
        $set: {
          currentStatus: "PENDING",
          pickupOtp: null,
          deliveryOtp: null,
          updatedAt: now,
        },
      });
    }

    if (delivery?.bookingId) {
      await repositories.bookings.updateById(delivery.bookingId, {
        $set: {
          scheduledDate,
          status: "RESCHEDULED",
          updatedAt: now,
        },
      }).catch(() => undefined);
    }

    await repositories.histories.create({
      packageId: packageDocument._id,
      bookingId: delivery?.bookingId ?? null,
      agentId: null,
      status: "RESCHEDULED",
      remarks: `Delivery rescheduled for ${scheduledDate.toLocaleDateString()}. Re-entered dispatch queue.`,
      timestamp: now,
      changedByUserId: new ObjectId(auth.userId),
    });

    await repositories.notifications.create({
      userId: packageDocument.customerId,
      type: "DELIVERY_RESCHEDULED",
      title: "Delivery Rescheduled",
      message: `Your package ${packageDocument.trackingNumber} has been rescheduled to ${scheduledDate.toLocaleDateString()}. A courier will be assigned shortly.`,
      isRead: false,
      relatedId: packageDocument._id,
      createdAt: now,
    }).catch(() => undefined);

    // Reuse existing assignment engine!
    try {
      const assignmentService = this.createAssignmentService(repositories);
      const updatedPkg = (await repositories.packages.findById(packageDocument._id))!;
      const assignment = await assignmentService.findBestAgent(updatedPkg);
      if (assignment) {
        const customer = (await repositories.users.findById(packageDocument.customerId))!;
        await this.completeAssignment(updatedPkg, assignment, customer, repositories);
      }
    } catch (assignErr) {
      console.warn("Auto-assignment on reschedule warning:", assignErr);
    }

    return this.getById(packageDocument._id, auth);
  }

  async getProof(
    id: unknown,
    auth: AuthenticatedUser,
  ): Promise<ProofOfDeliveryView | null> {
    const details = await this.getById(id, auth);
    return details.proofOfDelivery ?? null;
  }

  async updateTrackingStatus(
    id: unknown,
    agentUserIdValue: unknown,
    statusInput: unknown,
  ): Promise<{ package: PackageView; delivery: DeliveryView }> {
    const packageId = getObjectId(id, "Package ID");
    const agentUserId = getObjectId(agentUserIdValue, "Agent User ID");
    const nextStatus = getEnumValue(statusInput, "Delivery Status", DELIVERY_STATUSES);

    const repositories = this.getRepositories();
    const packageDocument = await repositories.packages.findById(packageId);
    if (!packageDocument) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }

    const agent = await repositories.agents.findByUserId(agentUserId);
    if (!agent) {
      throw new AppError("Authenticated agent profile not found.", 403, "FORBIDDEN");
    }

    if (!packageDocument.assignedAgentId || !packageDocument.assignedAgentId.equals(agent._id)) {
      throw new AppError(
        "Only the assigned courier agent can update tracking status.",
        403,
        "FORBIDDEN",
      );
    }

    if (packageDocument.status === "DELIVERED") {
      throw new AppError(
        "This delivery is already completed and cannot be modified.",
        400,
        "TERMINAL_STATE",
      );
    }

    const delivery = await repositories.deliveries.findByPackageId(packageDocument._id);
    if (!delivery) {
      throw new AppError("Associated delivery record not found.", 404, "DELIVERY_NOT_FOUND");
    }

    const current = packageDocument.status;
    if (nextStatus === "PICKED_UP") {
      if (!delivery.pickupOtp?.verified) {
        throw new AppError(
          "Customer pickup OTP must be verified before marking package as picked up.",
          400,
          "PICKUP_OTP_REQUIRED",
        );
      }
    } else if (nextStatus === "IN_TRANSIT") {
      if (current !== "PICKED_UP") {
        throw new AppError(
          `Cannot transition to IN_TRANSIT from current status "${current}". Package must be PICKED_UP first.`,
          400,
          "INVALID_STATE_TRANSITION",
        );
      }
    } else if (nextStatus === "OUT_FOR_DELIVERY") {
      if (current !== "IN_TRANSIT") {
        throw new AppError(
          `Cannot transition to OUT_FOR_DELIVERY from current status "${current}". Package must be IN_TRANSIT first.`,
          400,
          "INVALID_STATE_TRANSITION",
        );
      }
    } else if (nextStatus === "DELIVERED") {
      if (!delivery.deliveryOtp?.verified) {
        throw new AppError(
          "Customer delivery OTP must be verified before marking package as delivered.",
          400,
          "DELIVERY_OTP_REQUIRED",
        );
      }
      if (!delivery.proofOfDelivery?.photoUrl) {
        throw new AppError(
          "Proof of delivery photo must be uploaded before completing delivery.",
          400,
          "PROOF_OF_DELIVERY_REQUIRED",
        );
      }
    } else {
      throw new AppError(
        `Transition from "${current}" to "${nextStatus}" is not permitted through courier tracking controls.`,
        400,
        "INVALID_STATE_TRANSITION",
      );
    }

    const now = new Date();
    const deliveryUpdates: Record<string, unknown> = {
      currentStatus: nextStatus,
      updatedAt: now,
    };
    if (nextStatus === "DELIVERED") {
      deliveryUpdates.actualDeliveryTime = now;
    }

    await repositories.packages.updateById(packageDocument._id, {
      $set: { status: nextStatus, updatedAt: now },
    });
    await repositories.deliveries.updateById(delivery._id, {
      $set: deliveryUpdates,
    });

    if (nextStatus === "DELIVERED") {
      if (delivery.bookingId) {
        await repositories.bookings.updateById(delivery.bookingId, {
          $set: { status: "COMPLETED", updatedAt: now },
        }).catch(() => undefined);
      }
      await repositories.agents.updateById(agent._id, {
        $inc: { activeDeliveries: -1, completedDeliveries: 1 },
        $set: { updatedAt: now },
      }).catch(() => undefined);

      const isOnTime =
        !packageDocument.scheduledDate ||
        now <= new Date(packageDocument.scheduledDate.getTime() + 24 * 60 * 60 * 1000);
      const points = isOnTime ? 10 : 5;
      if (isOnTime) {
        await repositories.agents.updateById(agent._id, {
          $inc: { rewardPoints: points, onTimeDeliveries: 1 },
        }).catch(() => undefined);
      } else {
        await repositories.agents.updateById(agent._id, {
          $inc: { penaltyPoints: points, delayedDeliveries: 1 },
        }).catch(() => undefined);
      }
    }

    const remarks =
      nextStatus === "DELIVERED"
        ? "Package successfully delivered with verified OTP and proof of delivery."
        : `Courier updated tracking status to ${nextStatus.replace(/_/g, " ")}.`;

    await repositories.histories.create({
      packageId: packageDocument._id,
      bookingId: delivery.bookingId,
      agentId: agent._id,
      status: nextStatus,
      remarks,
      timestamp: now,
      changedByUserId: agentUserId,
    });

    const notifType = nextStatus === "DELIVERED" ? "DELIVERY_COMPLETED" : "STATUS_UPDATED";
    const notifTitle = nextStatus === "DELIVERED" ? "Package Delivered" : `Delivery Status: ${nextStatus.replace(/_/g, " ")}`;
    const notifMsg = nextStatus === "DELIVERED"
      ? `Your package ${packageDocument.trackingNumber} has been successfully delivered.`
      : `Your package ${packageDocument.trackingNumber} is now ${nextStatus.replace(/_/g, " ").toLowerCase()}.`;

    await repositories.notifications.create({
      userId: packageDocument.customerId,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      isRead: false,
      relatedId: packageDocument._id,
      createdAt: now,
    }).catch(() => undefined);

    if (nextStatus === "DELIVERED") {
      await repositories.notifications.create({
        userId: agentUserId,
        type: "DELIVERY_COMPLETED",
        title: "Delivery Completed",
        message: `Delivery ${packageDocument.trackingNumber} has been completed and verified.`,
        isRead: false,
        relatedId: packageDocument._id,
        createdAt: now,
      }).catch(() => undefined);
    }

    const refetchedPackage = (await repositories.packages.findById(packageDocument._id))!;
    const refetchedDelivery = (await repositories.deliveries.findById(delivery._id))!;

    return {
      package: toPackageView(refetchedPackage),
      delivery: toDeliveryView(refetchedDelivery),
    };
  }

  private async listWithQuery(
    query: PackageQuery,
  ): Promise<PackageListView> {
    const repositories = this.getRepositories();
    const filter: Filter<PackageDocument> = {};
    if (query.status) filter.status = query.status;
    if (query.agentId) filter.assignedAgentId = query.agentId;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.serviceId) filter.serviceId = query.serviceId;
    if (query.fromDate || query.toDate) {
      filter.scheduledDate = {
        ...(query.fromDate ? { $gte: query.fromDate } : {}),
        ...(query.toDate ? { $lte: query.toDate } : {}),
      };
    }

    const [packages, total] = await Promise.all([
      repositories.packages.findMany(filter, {
        sort: { createdAt: -1 },
        skip: (query.page - 1) * query.limit,
        limit: query.limit,
      }),
      repositories.packages.count(filter),
    ]);

    return {
      packages: packages.map(toPackageView),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    };
  }

  private parseQuery(
    input: unknown,
    customerQuery: boolean,
  ): PackageQuery {
    const query = getInputObject(input);
    const parsed: PackageQuery = {
      page: getPositiveInteger(query.page, "page", 1, 100000),
      limit: getPositiveInteger(query.limit, "limit", 20, 100),
    };

    if (query.status !== undefined) {
      parsed.status = getEnumValue(
        getQueryValue(query.status, "status"),
        "status",
        DELIVERY_STATUSES,
      );
    }

    if (!customerQuery && query.agentId !== undefined) {
      parsed.agentId = getObjectId(
        getQueryValue(query.agentId, "agentId"),
        "agentId",
      );
    }
    if (!customerQuery && query.customerId !== undefined) {
      parsed.customerId = getObjectId(
        getQueryValue(query.customerId, "customerId"),
        "customerId",
      );
    }
    if (!customerQuery && query.serviceId !== undefined) {
      parsed.serviceId = getObjectId(
        getQueryValue(query.serviceId, "serviceId"),
        "serviceId",
      );
    }

    if (!customerQuery) {
      const fromDate = this.parseOptionalQueryDate(
        query.fromDate,
        "fromDate",
      );
      const toDate = this.parseOptionalQueryDate(query.toDate, "toDate");
      parsed.fromDate = fromDate;
      parsed.toDate = toDate;
      if (fromDate && toDate && fromDate > toDate) {
        throw new AppError(
          "fromDate must be before toDate.",
          400,
          "VALIDATION_ERROR",
        );
      }
    }

    return parsed;
  }

  private parseOptionalQueryDate(
    value: unknown,
    fieldName: string,
  ): Date | undefined {
    const normalized = getQueryValue(value, fieldName);
    if (normalized === undefined) return undefined;
    if (typeof normalized !== "string") {
      throw new AppError(
        `${fieldName} must be a valid date.`,
        400,
        "VALIDATION_ERROR",
      );
    }
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
      throw new AppError(
        `${fieldName} must be a valid date.`,
        400,
        "VALIDATION_ERROR",
      );
    }
    return date;
  }

  private async completeAssignment(
    packageDocument: PackageDocument,
    assignment: AssignmentResult,
    customer: UserDocument,
    repositories: PackageRepositories,
  ): Promise<CreatePackageResult> {
    const now = assignment.assignedAt;
    let booking: BookingDocument | null = null;
    let delivery: DeliveryDocument | null = null;
    let history: DeliveryHistoryDocument | null = null;
    let workloadUpdated = false;

    try {
      const bookingDate = now;
      booking = await repositories.bookings.create({
        bookingNumber: await this.generateBookingNumber(repositories),
        packageId: packageDocument._id,
        customerId: packageDocument.customerId,
        agentId: assignment.agent._id,
        serviceId: packageDocument.serviceId,
        bookingDate,
        scheduledDate: packageDocument.scheduledDate,
        status: "CONFIRMED",
        confirmationCode:
          await this.generateConfirmationCode(repositories),
        cancellationReason: null,
        createdAt: now,
        updatedAt: now,
      });

      delivery = await repositories.deliveries.create({
        packageId: packageDocument._id,
        bookingId: booking._id,
        agentId: assignment.agent._id,
        currentStatus: "AGENT_ASSIGNED",
        pickupTime: null,
        estimatedDeliveryTime: new Date(
          packageDocument.scheduledDate.getTime() +
            assignment.estimatedMinutes * 60 * 1000,
        ),
        actualDeliveryTime: null,
        otpHash: null,
        otpExpiresAt: null,
        createdAt: now,
        updatedAt: now,
      });

      history = await repositories.histories.create({
        packageId: packageDocument._id,
        bookingId: booking._id,
        agentId: assignment.agent._id,
        status: "AGENT_ASSIGNED",
        remarks: "An agent was automatically assigned.",
        timestamp: now,
        changedByUserId: customer._id,
      });

      const updatedAgent = await repositories.agents.updateById(
        assignment.agent._id,
        {
          $inc: { activeDeliveries: 1 },
          $set: { updatedAt: now },
        },
      );
      if (!updatedAgent) {
        throw new Error("Assigned agent could not be updated.");
      }
      workloadUpdated = true;

      const updatedPackage = await repositories.packages.updateById(
        packageDocument._id,
        {
          $set: {
            status: "AGENT_ASSIGNED",
            assignedAgentId: assignment.agent._id,
            assignmentScore: assignment.score,
            assignmentDistanceKm: assignment.distanceKm,
            assignmentEstimatedMinutes: assignment.estimatedMinutes,
            assignmentReason: assignment.reason,
            assignedAt: now,
            updatedAt: now,
          },
        },
      );
      if (!updatedPackage) {
        throw new Error("Assigned package could not be updated.");
      }

      await this.createNotifications(
        packageDocument,
        assignment,
        repositories.notifications,
      );

      return {
        package: toPackageView(updatedPackage),
        assignment: this.toAssignmentView(updatedPackage, assignment),
        booking: toBookingView(booking),
      };
    } catch (error) {
      if (workloadUpdated) {
        await repositories.agents
          .updateById(assignment.agent._id, {
            $inc: { activeDeliveries: -1 },
            $set: { updatedAt: new Date() },
          })
          .catch(() => undefined);
      }
      if (history) {
        await repositories.histories
          .deleteById(history._id)
          .catch(() => undefined);
      }
      if (delivery) {
        await repositories.deliveries
          .deleteById(delivery._id)
          .catch(() => undefined);
      }
      if (booking) {
        await repositories.bookings
          .deleteById(booking._id)
          .catch(() => undefined);
      }
      throw new AppError(
        "The delivery request could not be assigned consistently.",
        500,
        "ASSIGNMENT_WORKFLOW_FAILED",
      );
    }
  }

  private async createNotifications(
    packageDocument: PackageDocument,
    assignment: AssignmentResult,
    notifications: NotificationRepository,
  ): Promise<void> {
    const records: Omit<NotificationDocument, "_id">[] = [
      {
        userId: packageDocument.customerId,
        type: "BOOKING_CONFIRMED",
        title: "Delivery request created and agent assigned.",
        message: `Agent ${assignment.user.fullName} has been assigned to your delivery request.`,
        isRead: false,
        relatedId: packageDocument._id,
        createdAt: new Date(),
      },
      {
        userId: assignment.agent.userId,
        type: "AGENT_ASSIGNED",
        title: "New delivery assigned.",
        message: `You have been assigned delivery ${packageDocument.trackingNumber}.`,
        isRead: false,
        relatedId: packageDocument._id,
        createdAt: new Date(),
      },
    ];

    for (const record of records) {
      try {
        await notifications.create(record);
      } catch (error) {
        console.warn(
          `Notification creation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private async getDetails(
    packageDocument: PackageDocument,
    repositories: PackageRepositories,
  ): Promise<PackageDetailsView> {
    const booking = await repositories.bookings.findByPackageId(packageDocument._id);
    const delivery = await repositories.deliveries.findByPackageId(packageDocument._id);
    const history = await repositories.histories.findByPackageId(packageDocument._id);
    const assignedAgent = await this.getAssignedAgent(
      packageDocument.assignedAgentId,
      repositories,
    );

    const podView: ProofOfDeliveryView | null = delivery?.proofOfDelivery
      ? {
          photoUrl: delivery.proofOfDelivery.photoUrl,
          capturedAt: delivery.proofOfDelivery.capturedAt,
          capturedByAgentId: delivery.proofOfDelivery.capturedByAgentId.toHexString(),
          otpVerified: delivery.proofOfDelivery.otpVerified,
          latitude: delivery.proofOfDelivery.latitude,
          longitude: delivery.proofOfDelivery.longitude,
        }
      : null;

    const exceptionsView: DeliveryExceptionView[] = (delivery?.exceptions ?? []).map((ex) => ({
      reason: ex.reason,
      note: ex.note,
      reportedAt: ex.reportedAt,
      reportedByAgentId: ex.reportedByAgentId.toHexString(),
      previousStatus: ex.previousStatus,
      attemptNumber: ex.attemptNumber,
    }));

    const latestEx: DeliveryExceptionView | null =
      exceptionsView.length > 0
        ? exceptionsView[exceptionsView.length - 1]
        : packageDocument.latestException
          ? {
              reason: packageDocument.latestException.reason,
              note: packageDocument.latestException.note,
              reportedAt: packageDocument.latestException.reportedAt,
              reportedByAgentId: "",
              previousStatus: "FAILED",
              attemptNumber: packageDocument.latestException.attemptNumber,
            }
          : null;

    return {
      package: toPackageView(packageDocument),
      assignment: this.toAssignmentView(
        packageDocument,
        undefined,
        assignedAgent?.name ?? null,
      ),
      assignedAgent,
      booking: booking ? toBookingView(booking) : null,
      delivery: delivery ? toDeliveryView(delivery) : null,
      history: history.map(toHistoryView),
      proofOfDelivery: podView,
      exceptions: exceptionsView,
      latestException: latestEx,
    };
  }

  private toAssignmentView(
    packageDocument: PackageDocument,
    assignment?: AssignmentResult,
    assignedAgentName?: string | null,
  ): AssignmentView {
    return {
      packageId: packageDocument._id.toHexString(),
      agentId:
        packageDocument.assignedAgentId?.toHexString() ??
        assignment?.agent._id.toHexString() ??
        null,
      agentName:
        assignment?.user.fullName ??
        assignedAgentName ??
        null,
      score:
        packageDocument.assignmentScore ??
        assignment?.score ??
        null,
      distanceKm:
        packageDocument.assignmentDistanceKm ??
        assignment?.distanceKm ??
        null,
      estimatedMinutes:
        packageDocument.assignmentEstimatedMinutes ??
        assignment?.estimatedMinutes ??
        null,
      reason:
        packageDocument.assignmentReason ??
        assignment?.reason ??
        (packageDocument.status === "PENDING"
          ? "No agent is currently assigned."
          : null),
      assignedAt:
        packageDocument.assignedAt ??
        assignment?.assignedAt ??
        null,
    };
  }

  private async getAssignedAgent(
    agentId: ObjectId | null,
    repositories: PackageRepositories,
  ): Promise<AssignedAgentView | null> {
    if (!agentId) return null;
    const agent = await repositories.agents.findById(agentId);
    if (!agent) return null;
    const user = await repositories.users.findById(agent.userId);
    if (!user) return null;
    return {
      id: agent._id.toHexString(),
      userId: user._id.toHexString(),
      name: user.fullName,
      agentCode: agent.agentCode,
      status: agent.status,
      rating: agent.rating,
    };
  }

  private async assertPackageAccess(
    packageDocument: PackageDocument,
    auth: AuthenticatedUser,
    repositories: PackageRepositories,
  ): Promise<void> {
    if (auth.role === "ADMIN") return;
    const userId = getObjectId(auth.userId, "User ID");
    if (
      auth.role === "CUSTOMER" &&
      packageDocument.customerId.equals(userId)
    ) {
      return;
    }
    if (auth.role === "AGENT") {
      const agent = await repositories.agents.findByUserId(userId);
      if (
        agent &&
        packageDocument.assignedAgentId?.equals(agent._id)
      ) {
        return;
      }
    }
    throw new AppError(
      "You do not have permission to access this package.",
      403,
      "FORBIDDEN",
    );
  }

  private createAssignmentService(
    repositories: PackageRepositories,
  ): AssignmentService {
    try {
      return new AssignmentService(
        repositories.agents,
        repositories.locations,
        repositories.users,
        this.getGraph(),
      );
    } catch (_error) {
      throw new AppError(
        "Automatic assignment is temporarily unavailable.",
        503,
        "ASSIGNMENT_UNAVAILABLE",
      );
    }
  }

  private async generateTrackingNumber(
    repositories: PackageRepositories,
  ): Promise<string> {
    return this.generateUniqueIdentifier(
      "DLV",
      (value) => repositories.packages.findByTrackingNumber(value),
    );
  }

  private async generateBookingNumber(
    repositories: PackageRepositories,
  ): Promise<string> {
    return this.generateUniqueIdentifier(
      "BK",
      (value) => repositories.bookings.findByBookingNumber(value),
    );
  }

  private async generateConfirmationCode(
    repositories: PackageRepositories,
  ): Promise<string> {
    return this.generateUniqueIdentifier(
      "CNF",
      (value) => repositories.bookings.findByConfirmationCode(value),
    );
  }

  private async generateUniqueIdentifier(
    prefix: string,
    exists: (value: string) => Promise<unknown>,
  ): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const year = new Date().getFullYear();
      const token = randomUUID().replace(/-/g, "");
      const numericSuffix = String(
        Number.parseInt(token.slice(0, 8), 16) % 100000,
      ).padStart(5, "0");
      const value =
        prefix === "CNF"
          ? `CNF${numericSuffix}`
          : `${prefix}-${year}-${numericSuffix}`;
      if (!(await exists(value))) {
        return value;
      }
    }
    throw new AppError(
      "A unique delivery identifier could not be generated.",
      500,
      "IDENTIFIER_GENERATION_FAILED",
    );
  }
}
