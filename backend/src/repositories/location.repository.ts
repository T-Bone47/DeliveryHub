import { type Db } from "mongodb";

import { type LocationDocument } from "../models/location";
import { MongoRepository } from "./mongo.repository";

export class LocationRepository extends MongoRepository<LocationDocument> {
  constructor(db: Db) {
    super(db, "locations");
  }

  async findByCity(city: string): Promise<LocationDocument[]> {
    return this.findMany({ city } as { city: string });
  }

  async findForSnapshot(
    city: string,
    state: string,
    postalCode: string,
  ): Promise<LocationDocument[]> {
    return this.findMany({
      city,
      state,
      postalCode,
    } as {
      city: string;
      state: string;
      postalCode: string;
    });
  }

  /**
   * Fallback lookup when the customer-supplied postal code does not match any
   * stored location. Matches on city + state only so that any valid service
   * zone is resolved regardless of the exact postal code entered in the UI.
   */
  async findByCityAndState(
    city: string,
    state: string,
  ): Promise<LocationDocument[]> {
    return this.findMany({
      city,
      state,
    } as {
      city: string;
      state: string;
    });
  }
}