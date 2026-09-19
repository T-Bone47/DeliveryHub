import type { NextFunction, Request, Response } from "express";

import { getMongoDB } from "../config/mongodb";
import { ServiceRepository } from "../repositories/service.repository";
import { ServiceManagementService } from "../services/service-management.service";
import { successResponse } from "../utils/api-response";

function createService(): ServiceManagementService {
  return new ServiceManagementService(
    () => new ServiceRepository(getMongoDB()),
  );
}

export class ServiceController {
  async list(
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse("Services retrieved successfully.", {
            services: await createService().list(),
          }),
        );
    } catch (error) {
      next(error);
    }
  }

  async create(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(201)
        .json(
          successResponse("Service created successfully.", {
            service: await createService().create(request.body),
          }),
        );
    } catch (error) {
      next(error);
    }
  }

  async update(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse("Service updated successfully.", {
            service: await createService().update(
              request.params.id,
              request.body,
            ),
          }),
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
          successResponse("Service status updated successfully.", {
            service: await createService().updateStatus(
              request.params.id,
              request.body,
            ),
          }),
        );
    } catch (error) {
      next(error);
    }
  }
}