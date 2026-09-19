import { ObjectId } from "mongodb";

export function toObjectId(value: string | ObjectId): ObjectId {
  if (value instanceof ObjectId) {
    return value;
  }

  if (!/^[a-f\d]{24}$/i.test(value)) {
    throw new Error(`Invalid MongoDB ObjectId: "${value}".`);
  }

  return new ObjectId(value);
}