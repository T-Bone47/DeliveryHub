import type { NextFunction, Request, Response } from "express";

import { getMongoDB } from "../config/mongodb";
import { UserRepository } from "../repositories/user.repository";
import { UserManagementService } from "../services/user-management.service";
import { successResponse } from "../utils/api-response";

function createService(): UserManagementService {
  return new UserManagementService(
    () => new UserRepository(getMongoDB()),
  );
}

export class UserController {
  async list(
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse("Users retrieved successfully.", {
            users: await createService().list(),
          }),
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
          successResponse("User retrieved successfully.", {
            user: await createService().getById(request.params.id),
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
          successResponse("User updated successfully.", {
            user: await createService().update(
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