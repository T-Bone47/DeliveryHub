import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { USER_ROLES } from "../models/enums";
import {
  toPublicUser,
  type PublicUser,
  type UserDocument,
} from "../models/user";
import { UserRepository } from "../repositories/user.repository";
import { AppError } from "../middleware/error-handler";
import {
  conflictError,
  getBoolean,
  getEnumValue,
  getInputObject,
  getOptionalString,
  getRequiredString,
  isDuplicateKeyError,
} from "../utils/management-validation";

export class UserManagementService {
  constructor(
    private readonly getUsers: () => UserRepository,
  ) {}

  async list(): Promise<PublicUser[]> {
    const users = await this.getUsers().findMany({}, {
      sort: { createdAt: -1 },
    });
    return users.map(toPublicUser);
  }

  async getById(id: unknown): Promise<PublicUser> {
    const user = await this.findUser(id);
    return toPublicUser(user);
  }

  async update(id: unknown, input: unknown): Promise<PublicUser> {
    const userId = this.findUserId(id);
    const body = getInputObject(input);
    const updates: Partial<UserDocument> = {};

    const fullName = getOptionalString(body, "fullName");
    if (fullName !== undefined) {
      updates.fullName = fullName;
    }

    const email = getOptionalString(body, "email")?.toLowerCase();
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new AppError(
          "Email must be valid.",
          400,
          "VALIDATION_ERROR",
        );
      }
      updates.email = email;
    }

    const phone = getOptionalString(body, "phone");
    if (phone !== undefined) {
      updates.phone = phone;
    }

    if ("role" in body && body.role !== undefined) {
      updates.role = getEnumValue(body.role, "Role", USER_ROLES);
    }

    if ("isActive" in body && body.isActive !== undefined) {
      updates.isActive = getBoolean(body.isActive, "isActive");
    }

    if ("passwordHash" in body) {
      throw new AppError(
        "passwordHash cannot be updated directly.",
        400,
        "VALIDATION_ERROR",
      );
    }

    if ("password" in body && body.password !== undefined) {
      if (
        typeof body.password !== "string" ||
        body.password.length < 8
      ) {
        throw new AppError(
          "Password must contain at least 8 characters.",
          400,
          "VALIDATION_ERROR",
        );
      }
      updates.passwordHash = await bcrypt.hash(body.password, 12);
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError(
        "At least one user field must be provided.",
        400,
        "VALIDATION_ERROR",
      );
    }

    if (updates.email !== undefined) {
      const existing = await this.getUsers().findByEmail(updates.email);
      if (existing && !existing._id.equals(userId)) {
        throw conflictError(
          "An account with this email already exists.",
          "DUPLICATE_EMAIL",
        );
      }
    }

    try {
      const updated = await this.getUsers().updateById(userId, {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      if (!updated) {
        throw new AppError("User not found.", 404, "USER_NOT_FOUND");
      }

      return toPublicUser(updated);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw conflictError(
          "An account with this email already exists.",
          "DUPLICATE_EMAIL",
        );
      }
      throw error;
    }
  }

  private async findUser(id: unknown): Promise<UserDocument> {
    const userId = this.findUserId(id);
    const user = await this.getUsers().findById(userId);
    if (!user) {
      throw new AppError("User not found.", 404, "USER_NOT_FOUND");
    }
    return user;
  }

  private findUserId(id: unknown) {
    if (
      typeof id !== "string" ||
      !/^[a-f\d]{24}$/i.test(id)
    ) {
      throw new AppError(
        "User ID must be a valid MongoDB ID.",
        400,
        "VALIDATION_ERROR",
      );
    }

    return new ObjectId(id);
  }
}