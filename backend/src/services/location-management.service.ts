import { type LocationDocument } from "../models/location";
import { LocationRepository } from "../repositories/location.repository";
import { AppError } from "../middleware/error-handler";
import { bestEffortGraphSync } from "./graph-sync.service";
import {
  getBoolean,
  getInputObject,
  getNumber,
  getObjectId,
  getOptionalString,
  getRequiredString,
} from "../utils/management-validation";

export interface LocationView {
  id: string;
  name: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toLocationView(location: LocationDocument): LocationView {
  return {
    id: location._id.toHexString(),
    name: location.name,
    city: location.city,
    state: location.state,
    postalCode: location.postalCode,
    latitude: location.latitude,
    longitude: location.longitude,
    isActive: location.isActive,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
  };
}

export class LocationManagementService {
  constructor(
    private readonly getLocations: () => LocationRepository,
  ) {}

  async list(): Promise<LocationView[]> {
    const locations = await this.getLocations().findMany({}, {
      sort: { createdAt: -1 },
    });
    return locations.map(toLocationView);
  }

  async getById(id: unknown): Promise<LocationView> {
    const location = await this.findLocation(id);
    return toLocationView(location);
  }

  async create(input: unknown): Promise<LocationView> {
    const body = getInputObject(input);
    const name = getRequiredString(body.name, "name");
    const city = getRequiredString(body.city, "city");
    const state = getRequiredString(body.state, "state");
    const postalCode = getRequiredString(body.postalCode, "postalCode");
    const latitude = getNumber(body.latitude, "latitude", -90, 90);
    const longitude = getNumber(body.longitude, "longitude", -180, 180);
    const isActive =
      body.isActive === undefined
        ? true
        : getBoolean(body.isActive, "isActive");
    const now = new Date();
    const location = await this.getLocations().create({
      name,
      city,
      state,
      postalCode,
      latitude,
      longitude,
      isActive,
      createdAt: now,
      updatedAt: now,
    });

    await bestEffortGraphSync(
      (graph) =>
        graph.syncLocation({
          locationId: location._id.toHexString(),
          name: location.name,
          city: location.city,
          state: location.state,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      `location ${location._id.toHexString()}`,
    );

    return toLocationView(location);
  }

  async update(id: unknown, input: unknown): Promise<LocationView> {
    const locationId = getObjectId(id, "Location ID");
    const body = getInputObject(input);
    const updates: Partial<LocationDocument> = {};

    const name = getOptionalString(body, "name");
    if (name !== undefined) updates.name = name;
    const city = getOptionalString(body, "city");
    if (city !== undefined) updates.city = city;
    const state = getOptionalString(body, "state");
    if (state !== undefined) updates.state = state;
    const postalCode = getOptionalString(body, "postalCode");
    if (postalCode !== undefined) updates.postalCode = postalCode;
    if ("latitude" in body && body.latitude !== undefined) {
      updates.latitude = getNumber(body.latitude, "latitude", -90, 90);
    }
    if ("longitude" in body && body.longitude !== undefined) {
      updates.longitude = getNumber(
        body.longitude,
        "longitude",
        -180,
        180,
      );
    }
    if ("isActive" in body && body.isActive !== undefined) {
      updates.isActive = getBoolean(body.isActive, "isActive");
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError(
        "At least one location field must be provided.",
        400,
        "VALIDATION_ERROR",
      );
    }

    const locations = this.getLocations();
    const existing = await locations.findById(locationId);
    if (!existing) {
      throw new AppError("Location not found.", 404, "LOCATION_NOT_FOUND");
    }

    const updated = await locations.updateById(locationId, {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    });
    if (!updated) {
      throw new AppError("Location not found.", 404, "LOCATION_NOT_FOUND");
    }

    await bestEffortGraphSync(
      (graph) =>
        graph.syncLocation({
          locationId: updated._id.toHexString(),
          name: updated.name,
          city: updated.city,
          state: updated.state,
          latitude: updated.latitude,
          longitude: updated.longitude,
        }),
      `location ${updated._id.toHexString()}`,
    );

    return toLocationView(updated);
  }

  private async findLocation(id: unknown): Promise<LocationDocument> {
    const locationId = getObjectId(id, "Location ID");
    const location = await this.getLocations().findById(locationId);
    if (!location) {
      throw new AppError("Location not found.", 404, "LOCATION_NOT_FOUND");
    }
    return location;
  }
}