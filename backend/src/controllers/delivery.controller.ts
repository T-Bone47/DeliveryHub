import type { NextFunction, Request, Response } from "express";

import { getMongoDB } from "../config/mongodb";
import { AgentRepository } from "../repositories/agent.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { DeliveryHistoryRepository } from "../repositories/delivery-history.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { PackageRepository } from "../repositories/package.repository";
import { UserRepository } from "../repositories/user.repository";
import { RewardPenaltyRepository } from "../repositories/reward-penalty.repository";
import { DeliveryManagementService } from "../services/delivery-management.service";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { successResponse } from "../utils/api-response";

function createService(): DeliveryManagementService {
  return new DeliveryManagementService(() => {
    const db = getMongoDB();
    return {
      deliveries: new DeliveryRepository(db),
      histories: new DeliveryHistoryRepository(db),
      packages: new PackageRepository(db),
      bookings: new BookingRepository(db),
      agents: new AgentRepository(db),
      notifications: new NotificationRepository(db),
      users: new UserRepository(db),
      rewards: new RewardPenaltyRepository(db),
    };
  });
}

function getAuth(request: Request): AuthenticatedUser {
  return request.auth as AuthenticatedUser;
}

export class DeliveryController {
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
            "Deliveries retrieved successfully.",
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
            "Delivery retrieved successfully.",
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

  async getTracking(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Tracking information retrieved successfully.",
            await createService().getTracking(
              request.params.id,
              getAuth(request),
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Delivery status updated successfully.",
            await createService().updateStatus(
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
