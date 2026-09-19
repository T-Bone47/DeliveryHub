import {
  ObjectId,
  type Collection,
  type Db,
  type Document,
  type Filter,
  type FindOptions,
  type OptionalUnlessRequiredId,
  type UpdateFilter,
} from "mongodb";

import { toObjectId } from "../utils/object-id";
import { type MongoDocument } from "../models/common";

export abstract class MongoRepository<
  T extends MongoDocument & Document,
> {
  protected readonly collection: Collection<T>;

  protected constructor(db: Db, collectionName: string) {
    this.collection = db.collection<T>(collectionName);
  }

  async create(document: Omit<T, "_id">): Promise<T> {
    const value = {
      _id: new ObjectId(),
      ...document,
    } as T;

    await this.collection.insertOne(
      value as OptionalUnlessRequiredId<T>,
    );
    return value;
  }

  async findById(id: string | ObjectId): Promise<T | null> {
    return (await this.collection.findOne({
      _id: toObjectId(id),
    } as Filter<T>)) as T | null;
  }

  async findMany(
    filter: Filter<T> = {},
    options?: FindOptions<T>,
  ): Promise<T[]> {
    return (await this.collection.find(filter, options).toArray()) as T[];
  }

  async count(filter: Filter<T> = {}): Promise<number> {
    return this.collection.countDocuments(filter);
  }

  async updateById(
    id: string | ObjectId,
    update: UpdateFilter<T>,
  ): Promise<T | null> {
    await this.collection.updateOne(
      { _id: toObjectId(id) } as Filter<T>,
      update,
    );
    return this.findById(id);
  }

  async deleteById(id: string | ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: toObjectId(id),
    } as Filter<T>);
    return result.deletedCount === 1;
  }
}