import { type ServiceDocument } from "../models/service";
import { ServiceRepository } from "../repositories/service.repository";
import { AppError } from "../middleware/error-handler";
import { bestEffortGraphSync } from "./graph-sync.service";
import {
  conflictError,
  getBoolean,
  getInputObject,
  getNumber,
  getObjectId,
  getOptionalString,
  getRequiredString,
  isDuplicateKeyError,
} from "../utils/management-validation";

export interface ServiceView {
  id: string;
  serviceCode: string;
  name: string;
  description: string;
  basePrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toServiceView(service: ServiceDocument): ServiceView {
  return {
    id: service._id.toHexString(),
    serviceCode: service.serviceCode,
    name: service.name,
    description: service.description,
    basePrice: service.basePrice,
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

export class ServiceManagementService {
  constructor(
    private readonly getServices: () => ServiceRepository,
  ) {}

  async list(): Promise<ServiceView[]> {
    const services = await this.getServices().findMany({}, {
      sort: { createdAt: -1 },
    });
    return services.map(toServiceView);
  }

  async getById(id: unknown): Promise<ServiceView> {
    const service = await this.findService(id);
    return toServiceView(service);
  }

  async create(input: unknown): Promise<ServiceView> {
    const body = getInputObject(input);
    const serviceCode = getRequiredString(body.serviceCode, "serviceCode");
    const name = getRequiredString(body.name, "name");
    const description = getRequiredString(body.description, "description");
    const basePrice = getNumber(body.basePrice, "basePrice", 0);
    const isActive =
      body.isActive === undefined
        ? true
        : getBoolean(body.isActive, "isActive");
    const services = this.getServices();

    if (await services.findByServiceCode(serviceCode)) {
      throw conflictError(
        "A service with this serviceCode already exists.",
        "DUPLICATE_SERVICE_CODE",
      );
    }

    const now = new Date();
    try {
      const service = await services.create({
        serviceCode,
        name,
        description,
        basePrice,
        isActive,
        createdAt: now,
        updatedAt: now,
      });

      await bestEffortGraphSync(
        (graph) =>
          graph.syncService({
            serviceId: service._id.toHexString(),
            serviceCode: service.serviceCode,
          }),
        `service ${service._id.toHexString()}`,
      );

      return toServiceView(service);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw conflictError(
          "A service with this serviceCode already exists.",
          "DUPLICATE_SERVICE_CODE",
        );
      }
      throw error;
    }
  }

  async update(id: unknown, input: unknown): Promise<ServiceView> {
    const serviceId = getObjectId(id, "Service ID");
    const body = getInputObject(input);
    const updates: Partial<ServiceDocument> = {};

    const serviceCode = getOptionalString(body, "serviceCode");
    if (serviceCode !== undefined) {
      updates.serviceCode = serviceCode;
    }

    const name = getOptionalString(body, "name");
    if (name !== undefined) {
      updates.name = name;
    }

    const description = getOptionalString(body, "description");
    if (description !== undefined) {
      updates.description = description;
    }

    if ("basePrice" in body && body.basePrice !== undefined) {
      updates.basePrice = getNumber(body.basePrice, "basePrice", 0);
    }

    if ("isActive" in body && body.isActive !== undefined) {
      updates.isActive = getBoolean(body.isActive, "isActive");
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError(
        "At least one service field must be provided.",
        400,
        "VALIDATION_ERROR",
      );
    }

    const services = this.getServices();
    const existing = await services.findById(serviceId);
    if (!existing) {
      throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
    }

    if (updates.serviceCode !== undefined) {
      const duplicate = await services.findByServiceCode(updates.serviceCode);
      if (duplicate && !duplicate._id.equals(serviceId)) {
        throw conflictError(
          "A service with this serviceCode already exists.",
          "DUPLICATE_SERVICE_CODE",
        );
      }
    }

    try {
      const updated = await services.updateById(serviceId, {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      if (!updated) {
        throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
      }

      await bestEffortGraphSync(
        (graph) =>
          graph.syncService({
            serviceId: updated._id.toHexString(),
            serviceCode: updated.serviceCode,
          }),
        `service ${updated._id.toHexString()}`,
      );

      return toServiceView(updated);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw conflictError(
          "A service with this serviceCode already exists.",
          "DUPLICATE_SERVICE_CODE",
        );
      }
      throw error;
    }
  }

  async updateStatus(id: unknown, input: unknown): Promise<ServiceView> {
    const body = getInputObject(input);
    if (body.isActive === undefined) {
      throw new AppError(
        "isActive is required.",
        400,
        "VALIDATION_ERROR",
      );
    }

    return this.update(id, {
      isActive: getBoolean(body.isActive, "isActive"),
    });
  }

  private async findService(id: unknown): Promise<ServiceDocument> {
    const serviceId = getObjectId(id, "Service ID");
    const service = await this.getServices().findById(serviceId);
    if (!service) {
      throw new AppError("Service not found.", 404, "SERVICE_NOT_FOUND");
    }
    return service;
  }
}