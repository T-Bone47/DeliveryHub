import type { NextFunction, Request, Response } from "express";

import { getMongoDB } from "../config/mongodb";
import { LocationRepository } from "../repositories/location.repository";
import { LocationManagementService } from "../services/location-management.service";
import { successResponse } from "../utils/api-response";

function createService(): LocationManagementService {
  return new LocationManagementService(
    () => new LocationRepository(getMongoDB()),
  );
}

export class LocationController {
  async list(
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse("Locations retrieved successfully.", {
            locations: await createService().list(),
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
          successResponse("Location created successfully.", {
            location: await createService().create(request.body),
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
          successResponse("Location updated successfully.", {
            location: await createService().update(
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