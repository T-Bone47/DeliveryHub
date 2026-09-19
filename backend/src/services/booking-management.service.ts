import { ObjectId, type Filter } from "mongodb";

import { type BookingDocument } from "../models/booking";
import { type DeliveryDocument } from "../models/delivery";
import { type DeliveryHistoryDocument } from "../models/delivery-history";
import { type NotificationDocument } from "../models/notification";
import { type PackageDocument } from "../models/package";
import {
  type BookingStatus,
  type DeliveryStatus,
} from "../models/enums";
import { BookingRepository } from "../repositories/booking.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { DeliveryHistoryRepository } from "../repositories/delivery-history.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { PackageRepository } from "../repositories/package.repository";
import { AgentRepository } from "../repositories/agent.repository";
import { UserRepository } from "../repositories/user.repository";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { AppError } from "../middleware/error-handler";
import {
  getInputObject,
  getObjectId,
  getRequiredString,
} from "../utils/management-validation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BookingRepositories {
  bookings: BookingRepository;
  deliveries: DeliveryRepository;
  histories: DeliveryHistoryRepository;
  notifications: NotificationRepository;
  packages: PackageRepository;
  agents: AgentRepository;
  users: UserRepository;
}

interface BookingListQuery {
  status?: BookingStatus;
  page: number;
  limit: number;
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
  status: BookingStatus;
  confirmationCode: string;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingListView {
  bookings: BookingView[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CancelBookingResult {
  bookingId: string;
  bookingNumber: string;
  status: BookingStatus;
  cancellationReason: string;
}

export interface RescheduleBookingResult {
  bookingId: string;
  scheduledDate: Date;
  status: BookingStatus;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

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

function parseQuery(raw: unknown): BookingListQuery {
  const query = (raw ?? {}) as Record<string, unknown>;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const status =
    typeof query.status === "string" && query.status.trim() !== ""
      ? (query.status.trim() as BookingStatus)
      : undefined;
  return { status, page, limit };
}

/** Statuses from which cancellation is allowed. */
const CANCELLABLE_STATUSES: ReadonlySet<BookingStatus> = new Set([
  "PENDING",
  "CONFIRMED",
]);

/** Statuses from which rescheduling is allowed. */
const RESCHEDULABLE_STATUSES: ReadonlySet<BookingStatus> = new Set([
  "PENDING",
  "CONFIRMED",
]);

/** Delivery statuses from which cancellation is allowed. */
const CANCELLABLE_DELIVERY_STATUSES: ReadonlySet<DeliveryStatus> = new Set([
  "PENDING",
  "AGENT_ASSIGNED",
]);

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

export class BookingManagementService {
  constructor(
    private readonly getRepos: () => BookingRepositories,
  ) {}

  /* ---------- list customer bookings ---------- */

  async listMine(
    userId: string,
    rawQuery: unknown,
  ): Promise<BookingListView> {
    const { status, page, limit } = parseQuery(rawQuery);

    // Find the customer's user id
    const customerId = new ObjectId(userId);

    const filter: Filter<BookingDocument> = { customerId } as Filter<BookingDocument>;
    if (status) {
      (filter as Record<string, unknown>).status = status;
    }

    const repos = this.getRepos();
    const [bookings, total] = await Promise.all([
      repos.bookings.findMany(filter, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
      }),
      repos.bookings.count(filter),
    ]);

    return {
      bookings: bookings.map(toBookingView),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ---------- list agent bookings ---------- */

  async listAgent(
    userId: string,
    rawQuery: unknown,
  ): Promise<BookingListView> {
    const { status, page, limit } = parseQuery(rawQuery);

    // Look up the agent document by userId
    const repos = this.getRepos();
    const agent = await repos.agents.findMany(
      { userId: new ObjectId(userId) } as Filter<any>,
    );
    if (agent.length === 0) {
      throw new AppError("Agent profile not found.", 404, "AGENT_NOT_FOUND");
    }

    const agentId = agent[0]._id;
    const filter: Filter<BookingDocument> = { agentId } as Filter<BookingDocument>;
    if (status) {
      (filter as Record<string, unknown>).status = status;
    }

    const [bookings, total] = await Promise.all([
      repos.bookings.findMany(filter, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
      }),
      repos.bookings.count(filter),
    ]);

    return {
      bookings: bookings.map(toBookingView),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ---------- list all bookings (admin) ---------- */

  async listAll(rawQuery: unknown): Promise<BookingListView> {
    const { status, page, limit } = parseQuery(rawQuery);

    const filter: Filter<BookingDocument> = {};
    if (status) {
      (filter as Record<string, unknown>).status = status;
    }

    const repos = this.getRepos();
    const [bookings, total] = await Promise.all([
      repos.bookings.findMany(filter, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit,
      }),
      repos.bookings.count(filter),
    ]);

    return {
      bookings: bookings.map(toBookingView),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /* ---------- get single booking ---------- */

  async getById(
    id: unknown,
    auth: AuthenticatedUser,
  ): Promise<BookingView> {
    const bookingId = getObjectId(id, "Booking ID");
    const repos = this.getRepos();
    const booking = await repos.bookings.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found.", 404, "BOOKING_NOT_FOUND");
    }

    // Authorization: customer can only see own bookings
    if (auth.role === "CUSTOMER") {
      if (!booking.customerId.equals(new ObjectId(auth.userId))) {
        throw new AppError(
          "You do not have permission to view this booking.",
          403,
          "FORBIDDEN",
        );
      }
    }

    // Authorization: agent can only see assigned bookings
    if (auth.role === "AGENT") {
      const agent = await repos.agents.findMany(
        { userId: new ObjectId(auth.userId) } as Filter<any>,
      );
      if (
        agent.length === 0 ||
        !booking.agentId.equals(agent[0]._id)
      ) {
        throw new AppError(
          "You do not have permission to view this booking.",
          403,
          "FORBIDDEN",
        );
      }
    }

    return toBookingView(booking);
  }

  /* ---------- cancel booking ---------- */

  async cancel(
    id: unknown,
    auth: AuthenticatedUser,
    input: unknown,
  ): Promise<CancelBookingResult> {
    const bookingId = getObjectId(id, "Booking ID");
    const body = getInputObject(input);
    const reason = getRequiredString(body.reason, "reason");

    const repos = this.getRepos();
    const booking = await repos.bookings.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found.", 404, "BOOKING_NOT_FOUND");
    }

    // Authorization: customer can only cancel own bookings
    if (auth.role === "CUSTOMER") {
      if (!booking.customerId.equals(new ObjectId(auth.userId))) {
        throw new AppError(
          "You do not have permission to cancel this booking.",
          403,
          "FORBIDDEN",
        );
      }
    }

    // Validate booking status
    if (!CANCELLABLE_STATUSES.has(booking.status)) {
      throw new AppError(
        `Booking cannot be cancelled in status "${booking.status}".`,
        422,
        "INVALID_STATUS_TRANSITION",
      );
    }

    const now = new Date();

    // 1. Update booking status
    await repos.bookings.updateById(bookingId, {
      $set: {
        status: "CANCELLED" as BookingStatus,
        cancellationReason: reason,
        updatedAt: now,
      },
    });

    // 2. Update package status
    const pkg = await repos.packages.findById(booking.packageId);
    if (pkg) {
      await repos.packages.updateById(booking.packageId, {
        $set: {
          status: "CANCELLED" as DeliveryStatus,
          updatedAt: now,
        },
      });
    }

    // 3. Update delivery status if exists
    const delivery = await repos.deliveries.findByPackageId(booking.packageId);
    if (delivery && CANCELLABLE_DELIVERY_STATUSES.has(delivery.currentStatus)) {
      await repos.deliveries.updateById(delivery._id, {
        $set: {
          currentStatus: "CANCELLED" as DeliveryStatus,
          updatedAt: now,
        },
      });

      // Free up the agent's active delivery count
      if (delivery.agentId) {
        await repos.agents.updateById(delivery.agentId, {
          $inc: { activeDeliveries: -1 },
          $set: { updatedAt: now },
        });
      }
    }

    // 4. Create history record
    await repos.histories.create({
      packageId: booking.packageId,
      bookingId: booking._id,
      agentId: booking.agentId,
      status: "CANCELLED" as DeliveryStatus,
      remarks: `Booking cancelled: ${reason}`,
      timestamp: now,
      changedByUserId: new ObjectId(auth.userId),
    });

    // 5. Create notifications for customer and agent
    const baseNotification = {
      type: "BOOKING_CANCELLED" as const,
      title: "Booking Cancelled",
      isRead: false,
      relatedId: booking._id,
      createdAt: now,
    };

    await repos.notifications.create({
      ...baseNotification,
      userId: booking.customerId,
      message: `Your booking ${booking.bookingNumber} has been cancelled.`,
    });

    // Notify the agent via their userId
    const agent = await repos.agents.findById(booking.agentId);
    if (agent) {
      await repos.notifications.create({
        ...baseNotification,
        userId: agent.userId,
        message: `Booking ${booking.bookingNumber} has been cancelled.`,
      });
    }

    return {
      bookingId: booking._id.toHexString(),
      bookingNumber: booking.bookingNumber,
      status: "CANCELLED",
      cancellationReason: reason,
    };
  }

  /* ---------- reschedule booking ---------- */

  async reschedule(
    id: unknown,
    auth: AuthenticatedUser,
    input: unknown,
  ): Promise<RescheduleBookingResult> {
    const bookingId = getObjectId(id, "Booking ID");
    const body = getInputObject(input);
    const scheduledDateStr = getRequiredString(
      body.scheduledDate,
      "scheduledDate",
    );

    const newScheduledDate = new Date(scheduledDateStr);
    if (isNaN(newScheduledDate.getTime())) {
      throw new AppError(
        "scheduledDate must be a valid date.",
        400,
        "VALIDATION_ERROR",
      );
    }

    if (newScheduledDate <= new Date()) {
      throw new AppError(
        "scheduledDate must be in the future.",
        400,
        "VALIDATION_ERROR",
      );
    }

    const repos = this.getRepos();
    const booking = await repos.bookings.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found.", 404, "BOOKING_NOT_FOUND");
    }

    // Authorization: only the customer who owns the booking can reschedule
    if (auth.role === "CUSTOMER") {
      if (!booking.customerId.equals(new ObjectId(auth.userId))) {
        throw new AppError(
          "You do not have permission to reschedule this booking.",
          403,
          "FORBIDDEN",
        );
      }
    }

    // Validate booking status
    if (!RESCHEDULABLE_STATUSES.has(booking.status)) {
      throw new AppError(
        `Booking cannot be rescheduled in status "${booking.status}".`,
        422,
        "INVALID_STATUS_TRANSITION",
      );
    }

    const now = new Date();
    const previousDate = booking.scheduledDate;

    // 1. Update booking
    await repos.bookings.updateById(bookingId, {
      $set: {
        scheduledDate: newScheduledDate,
        status: "RESCHEDULED" as BookingStatus,
        updatedAt: now,
      },
    });

    // 2. Update package scheduledDate
    await repos.packages.updateById(booking.packageId, {
      $set: {
        scheduledDate: newScheduledDate,
        status: "RESCHEDULED" as DeliveryStatus,
        updatedAt: now,
      },
    });

    // 3. Create history record
    await repos.histories.create({
      packageId: booking.packageId,
      bookingId: booking._id,
      agentId: booking.agentId,
      status: "RESCHEDULED" as DeliveryStatus,
      remarks: `Rescheduled from ${previousDate.toISOString()} to ${newScheduledDate.toISOString()}`,
      timestamp: now,
      changedByUserId: new ObjectId(auth.userId),
    });

    // 4. Create notifications
    const baseNotification = {
      type: "DELIVERY_RESCHEDULED" as const,
      title: "Delivery Rescheduled",
      isRead: false,
      relatedId: booking._id,
      createdAt: now,
    };

    await repos.notifications.create({
      ...baseNotification,
      userId: booking.customerId,
      message: `Your booking ${booking.bookingNumber} has been rescheduled to ${newScheduledDate.toLocaleDateString()}.`,
    });

    const agent = await repos.agents.findById(booking.agentId);
    if (agent) {
      await repos.notifications.create({
        ...baseNotification,
        userId: agent.userId,
        message: `Booking ${booking.bookingNumber} has been rescheduled to ${newScheduledDate.toLocaleDateString()}.`,
      });
    }

    return {
      bookingId: booking._id.toHexString(),
      scheduledDate: newScheduledDate,
      status: "RESCHEDULED",
    };
  }
}
