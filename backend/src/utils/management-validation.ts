import { ObjectId } from "mongodb";

import { AppError } from "../middleware/error-handler";

export type InputObject = Record<string, unknown>;

export function getInputObject(value: unknown): InputObject {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new AppError(
      "Request body must be a JSON object.",
      400,
      "VALIDATION_ERROR",
    );
  }

  return value as InputObject;
}

export function getRequiredString(
  value: unknown,
  fieldName: string,
): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new AppError(
      `${fieldName} is required.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return value.trim();
}

export function getOptionalString(
  input: InputObject,
  fieldName: string,
): string | undefined {
  if (!(fieldName in input) || input[fieldName] === undefined) {
    return undefined;
  }

  return getRequiredString(input[fieldName], fieldName);
}

export function getBoolean(
  value: unknown,
  fieldName: string,
): boolean {
  if (typeof value !== "boolean") {
    throw new AppError(
      `${fieldName} must be a boolean.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return value;
}

export function getNumber(
  value: unknown,
  fieldName: string,
  minimum = Number.NEGATIVE_INFINITY,
  maximum = Number.POSITIVE_INFINITY,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    const range =
      minimum !== Number.NEGATIVE_INFINITY &&
      maximum !== Number.POSITIVE_INFINITY
        ? ` between ${minimum} and ${maximum}`
        : minimum !== Number.NEGATIVE_INFINITY
          ? ` greater than or equal to ${minimum}`
          : maximum !== Number.POSITIVE_INFINITY
            ? ` less than or equal to ${maximum}`
            : "";

    throw new AppError(
      `${fieldName} must be a number${range}.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return value;
}

export function getEnumValue<T extends string>(
  value: unknown,
  fieldName: string,
  values: readonly T[],
): T {
  if (typeof value !== "string" || !values.includes(value as T)) {
    throw new AppError(
      `${fieldName} must be one of: ${values.join(", ")}.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return value as T;
}

export function getOptionalEnumValue<T extends string>(
  input: InputObject,
  fieldName: string,
  values: readonly T[],
): T | undefined {
  if (!(fieldName in input) || input[fieldName] === undefined) {
    return undefined;
  }

  return getEnumValue(input[fieldName], fieldName, values);
}

export function getObjectId(
  value: unknown,
  fieldName: string,
): ObjectId {
  if (value instanceof ObjectId) {
    return value;
  }

  if (
    typeof value !== "string" ||
    !/^[a-f\d]{24}$/i.test(value)
  ) {
    throw new AppError(
      `${fieldName} must be a valid MongoDB ID.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return new ObjectId(value);
}

export function getOptionalObjectId(
  input: InputObject,
  fieldName: string,
): ObjectId | undefined {
  if (!(fieldName in input) || input[fieldName] === undefined) {
    return undefined;
  }

  return getObjectId(input[fieldName], fieldName);
}

export function getObjectIdArray(
  input: InputObject,
  fieldName: string,
): ObjectId[] | undefined {
  if (!(fieldName in input) || input[fieldName] === undefined) {
    return undefined;
  }

  const value = input[fieldName];
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== "string")
  ) {
    throw new AppError(
      `${fieldName} must be an array of valid MongoDB IDs.`,
      400,
      "VALIDATION_ERROR",
    );
  }

  return value.map((item) => getObjectId(item, `${fieldName} item`));
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export function conflictError(
  message: string,
  code: string,
): AppError {
  return new AppError(message, 409, code);
}