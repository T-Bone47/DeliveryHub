import { ObjectId, type Db } from "mongodb";

import { type UserDocument } from "../models/user";
import { MongoRepository } from "./mongo.repository";

export class UserRepository extends MongoRepository<UserDocument> {
  constructor(db: Db) {
    super(db, "users");
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.collection.findOne({ email } as { email: string });
  }

  async findByRole(role: UserDocument["role"]): Promise<UserDocument[]> {
    return this.findMany({ role } as { role: UserDocument["role"] });
  }

  async findByIds(ids: ObjectId[]): Promise<UserDocument[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.findMany({
      _id: { $in: ids },
    });
  }

  async existsById(id: ObjectId): Promise<boolean> {
    return (await this.collection.countDocuments({ _id: id })) > 0;
  }
}