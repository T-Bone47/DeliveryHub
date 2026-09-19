import type { NextFunction, Request, Response } from "express";

import { getMongoDB } from "../config/mongodb";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { UserRepository } from "../repositories/user.repository";
import { AuthService } from "../services/auth.service";
import { successResponse } from "../utils/api-response";

function createAuthService(): AuthService {
  return new AuthService(() => new UserRepository(getMongoDB()));
}

export class AuthController {
  async register(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = await createAuthService().register(request.body);
      response
        .status(201)
        .json(successResponse("Registration successful.", { user }));
    } catch (error) {
      next(error);
    }
  }

  async login(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await createAuthService().login(request.body);
      response.status(200).json(successResponse("Login successful.", result));
    } catch (error) {
      next(error);
    }
  }

  async me(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const auth = request.auth as AuthenticatedUser;
      const user = await createAuthService().getCurrentUser(auth.userId);
      response
        .status(200)
        .json(successResponse("User retrieved successfully.", { user }));
    } catch (error) {
      next(error);
    }
  }
}