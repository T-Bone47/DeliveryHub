import { ObjectId, type Filter } from "mongodb";

import { type DeliveryDocument } from "../models/delivery";
import { type DeliveryHistoryDocument } from "../models/delivery-history";
import { type PackageDocument } from "../models/package";
import { type NotificationDocument } from "../models/notification";
import {
  DELIVERY_STATUSES,
  type DeliveryStatus,
} from "../models/enums";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { DeliveryHistoryRepository } from "../repositories/delivery-history.repository";
import { PackageRepository } from "../repositories/package.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { AgentRepository } from "../repositories/agent.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { UserRepository } from "../repositories/user.repository";
import { RewardPenaltyRepository } from "../repositories/reward-penalty.repository";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { AppError } from "../middleware/error-handler";
import { getObjectId, getInputObject, getRequiredString, getEnumValue, getOptionalString } from "../utils/management-validation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DeliveryRepositories {
  deliveries: DeliveryRepository;
  histories: DeliveryHistoryRepository;
  packages: PackageRepository;
  bookings: BookingRepository;
  agents: AgentRepository;
  notifications: NotificationRepository;
  users: UserRepository;
  rewards: RewardPenaltyRepository;
}

interface DeliveryListQuery {
  status?: DeliveryStatus;
  agentId?: string;
  customerId?: string;
  fromDate?: Date;
  toDate?: Date;
  page: number;
  limit: number;
}

export interface DeliveryListItemView {
  id: string;
  packageId: string;
  bookingId: string;
  agentId: string;
  currentStatus: DeliveryStatus;
  pickupTime: Date | null;
  estimatedDeliveryTime: Date | null;
  actualDeliveryTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeliveryListView {
  deliveries: DeliveryListItemView[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TrackingView {
  packageId: string;
  trackingNumber: string;
  currentStatus: DeliveryStatus;
  agent: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
  scheduledDate: Date;
  estimatedDeliveryTime: Date | null;
  history: Array<{
    status: DeliveryStatus;
    remarks: string;
    timestamp: Date;
  }>;
}

export interface StatusUpdateResult {
  deliveryId: string;
  status: DeliveryStatus;
  updatedAt: Date;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toDeliveryListItemView(doc: DeliveryDocument): DeliveryListItemView {
  return {
    id: doc._id.toHexString(),
    packageId: doc.packageId.toHexString(),
    bookingId: doc.bookingId.toHexString(),
    agentId: doc.agentId.toHexString(),
    currentStatus: doc.currentStatus,
    pickupTime: doc.pickupTime,
    estimatedDeliveryTime: doc.estimatedDeliveryTime,
    actualDeliveryTime: doc.actualDeliveryTime,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function parseDeliveryQuery(raw: unknown): DeliveryListQuery {
  const query = (raw ?? {}) as Record<string, unknown>;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const status =
    typeof query.status === "string" && query.status.trim() !== ""
      ? (query.status.trim() as DeliveryStatus)
      : undefined;
  const agentId =
    typeof query.agentId === "string" && query.agentId.trim() !== ""
      ? query.agentId.trim()
      : undefined;
  const customerId =
    typeof query.customerId === "string" && query.customerId.trim() !== ""
      ? query.customerId.trim()
      : undefined;
  const fromDate =
    typeof query.fromDate === "string" && query.fromDate.trim() !== ""
      ? new Date(query.fromDate.trim())
      : undefined;
  const toDate =
    typeof query.toDate === "string" && query.toDate.trim() !== ""
      ? new Date(query.toDate.trim())
      : undefined;

  return { status, agentId, customerId, fromDate, toDate, page, limit };
}

/** Valid transitions for agent status updates. */
const VALID_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING: ["AGENT_ASSIGNED"],
  AGENT_ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  CANCELLED: [],
  RESCHEDULED: ["AGENT_ASSIGNED", "PICKED_UP"],
  FAILED: ["AGENT_ASSIGNED"],
};

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

export class DeliveryManagementService {
  constructor(
    private readonly getRepos: () => DeliveryRepositories,
  ) {}

  /* ---------- list all deliveries (admin) ---------- */

  async listAll(rawQuery: unknown): Promise<DeliveryListView> {
    const { status, agentId, customerId, fromDate, toDate, page, limit } =
      parseDeliveryQuery(rawQuery);

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    // Since deliveries don't have customerId directly, we'd need to join via package.
    // For simplicity, filter by agentId on the delivery document.
    if (agentId) filter.agentId = new ObjectId(agentId);
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) dateFilter.$gte = fromDate;
      if (toDate) dateFilter.$lte = toDate;
      filter.createdAt = dateFilter;
    }

    // Map status field name: delivery documents use `currentStatus`
    if (status) {
      delete filter.status;
      filter.currentStatus = status;
    }

    const repos = this.getRepos();
    const [deliveries, total] = await Promise.all([
      repos.deliveries.findMany(filter as Filter<DeliveryDocument>, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
      }),
      repos.deliveries.count(filter as Filter<DeliveryDocument>),
    ]);

    return {
      deliveries: deliveries.map(toDeliveryListItemView),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ---------- get single delivery ---------- */

  async getById(
    id: unknown,
    auth: AuthenticatedUser,
  ): Promise<DeliveryListItemView> {
    const deliveryId = getObjectId(id, "Delivery ID");
    const repos = this.getRepos();
    const delivery = await repos.deliveries.findById(deliveryId);
    if (!delivery) {
      throw new AppError("Delivery not found.", 404, "DELIVERY_NOT_FOUND");
    }

    // Agent can only see assigned deliveries
    if (auth.role === "AGENT") {
      const agentDocs = await repos.agents.findMany(
        { userId: new ObjectId(auth.userId) } as Filter<any>,
      );
      if (agentDocs.length === 0 || !delivery.agentId.equals(agentDocs[0]._id)) {
        throw new AppError(
          "You do not have permission to view this delivery.",
          403,
          "FORBIDDEN",
        );
      }
    }

    // Customer can see deliveries for their packages
    if (auth.role === "CUSTOMER") {
      const pkg = await repos.packages.findById(delivery.packageId);
      if (!pkg || !pkg.customerId.equals(new ObjectId(auth.userId))) {
        throw new AppError(
          "You do not have permission to view this delivery.",
          403,
          "FORBIDDEN",
        );
      }
    }

    return toDeliveryListItemView(delivery);
  }

  /* ---------- get tracking information ---------- */

  async getTracking(
    id: unknown,
    auth: AuthenticatedUser,
  ): Promise<TrackingView> {
    const deliveryId = getObjectId(id, "Delivery ID");
    const repos = this.getRepos();
    const delivery = await repos.deliveries.findById(deliveryId);
    if (!delivery) {
      throw new AppError("Delivery not found.", 404, "DELIVERY_NOT_FOUND");
    }

    const pkg = await repos.packages.findById(delivery.packageId);
    if (!pkg) {
      throw new AppError("Package not found.", 404, "PACKAGE_NOT_FOUND");
    }

    // Authorization
    if (auth.role === "CUSTOMER") {
      if (!pkg.customerId.equals(new ObjectId(auth.userId))) {
        throw new AppError(
          "You do not have permission to view this tracking information.",
          403,
          "FORBIDDEN",
        );
      }
    }

    // Get agent info
    let agentInfo: TrackingView["agent"] = null;
    if (delivery.agentId) {
      const agentDoc = await repos.agents.findById(delivery.agentId);
      if (agentDoc) {
        const userDoc = await repos.users.findById(agentDoc.userId);
        if (userDoc) {
          agentInfo = {
            id: agentDoc._id.toHexString(),
            fullName: userDoc.fullName,
            phone: userDoc.phone,
          };
        }
      }
    }

    // Get history
    const historyDocs = await repos.histories.findByPackageId(pkg._id);

    return {
      packageId: pkg._id.toHexString(),
      trackingNumber: pkg.trackingNumber,
      currentStatus: delivery.currentStatus,
      agent: agentInfo,
      scheduledDate: pkg.scheduledDate,
      estimatedDeliveryTime: delivery.estimatedDeliveryTime,
      history: historyDocs.map((h) => ({
        status: h.status,
        remarks: h.remarks,
        timestamp: h.timestamp,
      })),
    };
  }

  /* ---------- update delivery status ---------- */

  async updateStatus(
    id: unknown,
    auth: AuthenticatedUser,
    input: unknown,
  ): Promise<StatusUpdateResult> {
    const deliveryId = getObjectId(id, "Delivery ID");
    const body = getInputObject(input);
    const newStatus = getEnumValue(body.status, "status", DELIVERY_STATUSES);
    const remarks = typeof body.remarks === "string" ? body.remarks.trim() : `Status updated to ${newStatus}`;

    const repos = this.getRepos();
    const delivery = await repos.deliveries.findById(deliveryId);
    if (!delivery) {
      throw new AppError("Delivery not found.", 404, "DELIVERY_NOT_FOUND");
    }

    // Authorization: agent must be assigned
    if (auth.role === "AGENT") {
      const agentDocs = await repos.agents.findMany(
        { userId: new ObjectId(auth.userId) } as Filter<any>,
      );
      if (agentDocs.length === 0 || !delivery.agentId.equals(agentDocs[0]._id)) {
        throw new AppError(
          "You are not assigned to this delivery.",
          403,
          "FORBIDDEN",
        );
      }
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[delivery.currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from "${delivery.currentStatus}" to "${newStatus}".`,
        422,
        "INVALID_STATUS_TRANSITION",
      );
    }

    const now = new Date();
    const updates: Record<string, unknown> = {
      currentStatus: newStatus,
      updatedAt: now,
    };

    if (newStatus === "PICKED_UP") {
      updates.pickupTime = now;
    }
    if (newStatus === "DELIVERED") {
      updates.actualDeliveryTime = now;
    }

    await repos.deliveries.updateById(deliveryId, { $set: updates });

    // Update package status
    await repos.packages.updateById(delivery.packageId, {
      $set: { status: newStatus, updatedAt: now },
    });

    // If delivered, decrement agent's active deliveries and update completed count
    if (newStatus === "DELIVERED") {
      await repos.agents.updateById(delivery.agentId, {
        $inc: { activeDeliveries: -1, completedDeliveries: 1 },
        $set: { updatedAt: now },
      });

      // Auto-calculate reward for on-time delivery
      const pkg = await repos.packages.findById(delivery.packageId);
      if (pkg) {
        const isOnTime =
          !pkg.scheduledDate || now <= new Date(pkg.scheduledDate.getTime() + 24 * 60 * 60 * 1000);
        const points = isOnTime ? 10 : -5;
        const type = isOnTime ? "REWARD" : "PENALTY";

        await repos.rewards.create({
          agentId: delivery.agentId,
          packageId: delivery.packageId,
          type,
          reason: isOnTime ? "On-time delivery" : "Late delivery",
          points: Math.abs(points),
          createdAt: now,
          createdBy: new ObjectId(auth.userId),
        });

        // Update agent reward/penalty points
        if (isOnTime) {
          await repos.agents.updateById(delivery.agentId, {
            $inc: { rewardPoints: points, onTimeDeliveries: 1 },
          });
        } else {
          await repos.agents.updateById(delivery.agentId, {
            $inc: { penaltyPoints: Math.abs(points), delayedDeliveries: 1 },
          });
        }
      }
    }

    if (newStatus === "FAILED") {
      await repos.agents.updateById(delivery.agentId, {
        $inc: { activeDeliveries: -1 },
        $set: { updatedAt: now },
      });
    }

    // Create history record
    await repos.histories.create({
      packageId: delivery.packageId,
      bookingId: delivery.bookingId,
      agentId: delivery.agentId,
      status: newStatus,
      remarks,
      timestamp: now,
      changedByUserId: new ObjectId(auth.userId),
    });

    // Create notification
    const pkg = await repos.packages.findById(delivery.packageId);
    if (pkg) {
      await repos.notifications.create({
        userId: pkg.customerId,
        type: newStatus === "DELIVERED" ? "DELIVERY_COMPLETED" : "STATUS_UPDATED",
        title:
          newStatus === "DELIVERED"
            ? "Delivery Completed"
            : "Delivery Status Updated",
        message: `Your delivery ${pkg.trackingNumber} is now ${newStatus.replace(/_/g, " ")}.`,
        isRead: false,
        relatedId: delivery._id,
        createdAt: now,
      });
    }

    return {
      deliveryId: delivery._id.toHexString(),
      status: newStatus,
      updatedAt: now,
    };
  }
}
