import { ObjectId } from "mongodb";

import { type MongoDocument } from "./common";
import { type NotificationType } from "./enums";

export interface NotificationDocument extends MongoDocument {
  userId: ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: ObjectId | null;
  createdAt: Date;
}