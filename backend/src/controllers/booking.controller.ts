import type { NextFunction, Request, Response } from "express";

import { getMongoDB } from "../config/mongodb";
import { AgentRepository } from "../repositories/agent.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { DeliveryHistoryRepository } from "../repositories/delivery-history.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { PackageRepository } from "../repositories/package.repository";
import { UserRepository } from "../repositories/user.repository";
import { BookingManagementService } from "../services/booking-management.service";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { successResponse } from "../utils/api-response";

function createService(): BookingManagementService {
  return new BookingManagementService(() => {
    const db = getMongoDB();
    return {
      bookings: new BookingRepository(db),
      deliveries: new DeliveryRepository(db),
      histories: new DeliveryHistoryRepository(db),
      notifications: new NotificationRepository(db),
      packages: new PackageRepository(db),
      agents: new AgentRepository(db),
      users: new UserRepository(db),
    };
  });
}

function getAuth(request: Request): AuthenticatedUser {
  return request.auth as AuthenticatedUser;
}

export class BookingController {
  async listMine(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Customer bookings retrieved successfully.",
            await createService().listMine(
              getAuth(request).userId,
              request.query,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async listAgent(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Agent bookings retrieved successfully.",
            await createService().listAgent(
              getAuth(request).userId,
              request.query,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async listAll(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Bookings retrieved successfully.",
            await createService().listAll(request.query),
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async getById(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Booking retrieved successfully.",
            await createService().getById(
              request.params.id,
              getAuth(request),
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async cancel(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Booking cancelled successfully.",
            await createService().cancel(
              request.params.id,
              getAuth(request),
              request.body,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async reschedule(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Booking rescheduled successfully.",
            await createService().reschedule(
              request.params.id,
              getAuth(request),
              request.body,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  }
}
