import type { RequestHandler } from "express";

import { type UserRole } from "../models/enums";
import { AppError } from "./error-handler";

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth) {
      next(
        new AppError(
          "Authentication is required.",
          401,
          "UNAUTHORIZED",
        ),
      );
      return;
    }

    if (!allowedRoles.includes(request.auth.role)) {
      next(
        new AppError(
          "You do not have permission to access this resource.",
          403,
          "FORBIDDEN",
        ),
      );
      return;
    }

    next();
  };
}