import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

import { env } from "../config/env";
import { USER_ROLES, type UserRole } from "../models/enums";
import { AppError } from "./error-handler";

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthenticatedUser;
    }
  }
}

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    USER_ROLES.includes(value as UserRole)
  );
}

function getJwtSecret(): string {
  if (!env.jwtSecret) {
    throw new AppError(
      "Authentication is not configured.",
      500,
      "INTERNAL_SERVER_ERROR",
    );
  }

  return env.jwtSecret;
}

function getBearerToken(request: Request): string {
  const authorization = request.header("authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw new AppError(
      "Authentication is required.",
      401,
      "UNAUTHORIZED",
    );
  }

  return token;
}

function getAuthenticatedUser(payload: string | JwtPayload): AuthenticatedUser {
  if (
    typeof payload === "string" ||
    typeof payload.sub !== "string" ||
    !isUserRole(payload.role)
  ) {
    throw new AppError(
      "The authentication token is invalid.",
      401,
      "UNAUTHORIZED",
    );
  }

  return {
    userId: payload.sub,
    role: payload.role,
  };
}

export const authenticate: RequestHandler = (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  try {
    const token = getBearerToken(request);
    const payload = jwt.verify(token, getJwtSecret());
    request.auth = getAuthenticatedUser(payload);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      next(
        new AppError(
          "The authentication token has expired.",
          401,
          "UNAUTHORIZED",
        ),
      );
      return;
    }

    next(
      new AppError(
        "The authentication token is invalid.",
        401,
        "UNAUTHORIZED",
      ),
    );
  }
};