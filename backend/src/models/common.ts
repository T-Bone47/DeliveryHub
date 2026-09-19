import { ObjectId } from "mongodb";

export interface MongoDocument {
  _id: ObjectId;
}

export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationSnapshot {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export type WithoutId<T extends MongoDocument> = Omit<T, "_id">;