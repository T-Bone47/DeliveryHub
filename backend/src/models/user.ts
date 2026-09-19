import { ObjectId } from "mongodb";

import { type MongoDocument, type Timestamped } from "./common";
import { type UserRole } from "./enums";

export interface UserDocument extends MongoDocument, Timestamped {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
}

export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toHexString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
  };
}

export type UserReference = Pick<UserDocument, "_id"> & {
  _id: ObjectId;
};