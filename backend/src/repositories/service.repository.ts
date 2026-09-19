import { type Db } from "mongodb";

import { type ServiceDocument } from "../models/service";
import { MongoRepository } from "./mongo.repository";

export class ServiceRepository extends MongoRepository<ServiceDocument> {
  constructor(db: Db) {
    super(db, "services");
  }

  async findByServiceCode(
    serviceCode: string,
  ): Promise<ServiceDocument | null> {
    return this.collection.findOne({ serviceCode } as { serviceCode: string });
  }
}