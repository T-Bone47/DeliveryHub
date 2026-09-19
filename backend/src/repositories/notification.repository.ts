import { ObjectId, type Db } from "mongodb";

import { type NotificationDocument } from "../models/notification";
import { MongoRepository } from "./mongo.repository";

export class NotificationRepository extends MongoRepository<NotificationDocument> {
  constructor(db: Db) {
    super(db, "notifications");
  }

  async findByUserId(userId: ObjectId): Promise<NotificationDocument[]> {
    return this.findMany(
      { userId } as { userId: ObjectId },
      { sort: { createdAt: -1 } },
    );
  }

  async findUnreadByUserId(
    userId: ObjectId,
  ): Promise<NotificationDocument[]> {
    return this.findMany(
      { userId, isRead: false } as {
        userId: ObjectId;
        isRead: boolean;
      },
      { sort: { createdAt: -1 } },
    );
  }
}