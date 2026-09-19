import type { ErrorRequestHandler, RequestHandler } from "express";

import { errorResponse } from "../utils/api-response";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const notFoundHandler: RequestHandler = (_request, response) => {
  response
    .status(404)
    .json(errorResponse("Route not found.", "NOT_FOUND"));
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof SyntaxError && "body" in error) {
    response
      .status(400)
      .json(errorResponse("Request body contains invalid JSON.", "VALIDATION_ERROR"));
    return;
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const code = error instanceof AppError ? error.code : "INTERNAL_SERVER_ERROR";
  const message =
    error instanceof AppError
      ? error.message
      : "An unexpected error occurred.";

  if (statusCode >= 500) {
    console.error(error);
  }

  response.status(statusCode).json(errorResponse(message, code));
};