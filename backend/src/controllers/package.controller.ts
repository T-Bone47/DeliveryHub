import type { NextFunction, Request, Response } from "express";

import { getMongoDB } from "../config/mongodb";
import { getNeo4jDriver } from "../config/neo4j";
import { authenticate, type AuthenticatedUser } from "../middleware/authenticate";
import { AgentRepository } from "../repositories/agent.repository";
import { AgentGraphRepository } from "../repositories/neo4j/agent-graph.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { DeliveryHistoryRepository } from "../repositories/delivery-history.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { LocationRepository } from "../repositories/location.repository";
import { NotificationRepository } from "../repositories/notification.repository";
import { PackageRepository } from "../repositories/package.repository";
import { ServiceRepository } from "../repositories/service.repository";
import { UserRepository } from "../repositories/user.repository";
import { AgentGraphService } from "../services/agent-graph.service";
import { PackageManagementService } from "../services/package-management.service";
import { successResponse } from "../utils/api-response";

function createService(): PackageManagementService {
  return new PackageManagementService(
    () => {
      const db = getMongoDB();
      return {
        agents: new AgentRepository(db),
        bookings: new BookingRepository(db),
        deliveries: new DeliveryRepository(db),
        histories: new DeliveryHistoryRepository(db),
        locations: new LocationRepository(db),
        notifications: new NotificationRepository(db),
        packages: new PackageRepository(db),
        services: new ServiceRepository(db),
        users: new UserRepository(db),
      };
    },
    () => {
      let graphRepo: AgentGraphRepository | null = null;
      try {
        graphRepo = new AgentGraphRepository(getNeo4jDriver());
      } catch {
        graphRepo = null;
      }
      return new AgentGraphService(graphRepo, getMongoDB);
    },
  );
}

function getAuth(request: Request): AuthenticatedUser {
  return request.auth as AuthenticatedUser;
}

export class PackageController {
  async create(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await createService().create(
        getAuth(request).userId,
        request.body,
      );
      const message = result.assignment
        ? "Delivery request created and agent assigned successfully."
        : "Delivery request created, but no suitable agent is currently available.";
      response.status(201).json(successResponse(message, result));
    } catch (error) {
      next(error);
    }
  }

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
            "Customer packages retrieved successfully.",
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
            "Packages retrieved successfully.",
            await createService().listAll(request.query),
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async listAssigned(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Assigned packages retrieved successfully.",
            await createService().listAssigned(
              getAuth(request).userId,
              request.query,
            ),
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
            "Package retrieved successfully.",
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

  async retryAssignment(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Agent assigned successfully.",
            await createService().retryAssignment(request.params.id),
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async assignment(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse(
            "Assignment details retrieved successfully.",
            await createService().getAssignment(
              request.params.id,
              getAuth(request),
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  }

  async generateOtp(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await createService().generateOtp(
        request.params.id,
        getAuth(request).userId,
        request.body.purpose,
      );
      response.status(200).json(
        successResponse("Verification OTP generated successfully.", result),
      );
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await createService().verifyOtp(
        request.params.id,
        getAuth(request).userId,
        request.body.purpose,
        request.body.otp,
      );
      response.status(200).json(
        successResponse(result.message, result),
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
      const result = await createService().updateTrackingStatus(
        request.params.id,
        getAuth(request).userId,
        request.body.status,
      );
      response.status(200).json(
        successResponse("Delivery tracking status updated successfully.", result),
      );
    } catch (error) {
      next(error);
    }
  }

  async uploadProof(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await createService().uploadProof(
        request.params.id,
        getAuth(request).userId,
        request.body.photoData,
      );
      response.status(200).json(
        successResponse("Proof of delivery uploaded successfully.", result),
      );
    } catch (error) {
      next(error);
    }
  }

  async reportException(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await createService().reportException(
        request.params.id,
        getAuth(request).userId,
        request.body.reason,
        request.body.note,
      );
      response.status(200).json(
        successResponse("Delivery exception reported successfully.", result),
      );
    } catch (error) {
      next(error);
    }
  }

  async rescheduleDelivery(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await createService().rescheduleDelivery(
        request.params.id,
        getAuth(request),
        request.body.rescheduledDate,
      );
      response.status(200).json(
        successResponse("Delivery rescheduled successfully.", result),
      );
    } catch (error) {
      next(error);
    }
  }

  async getProof(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await createService().getProof(
        request.params.id,
        getAuth(request),
      );
      response.status(200).json(
        successResponse("Proof of delivery retrieved successfully.", result),
      );
    } catch (error) {
      next(error);
    }
  }
}
