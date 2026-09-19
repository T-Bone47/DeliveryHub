import type { NextFunction, Request, Response } from "express";
import { ObjectId, type Filter } from "mongodb";

import { getMongoDB } from "../config/mongodb";
import { NotificationRepository } from "../repositories/notification.repository";
import { type NotificationDocument } from "../models/notification";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { AppError } from "../middleware/error-handler";
import { successResponse } from "../utils/api-response";
import { getObjectId } from "../utils/management-validation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NotificationView {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: Date;
}

function toNotificationView(doc: NotificationDocument): NotificationView {
  return {
    id: doc._id.toHexString(),
    userId: doc.userId.toHexString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    isRead: doc.isRead,
    relatedId: doc.relatedId?.toHexString() ?? null,
    createdAt: doc.createdAt,
  };
}

function getAuth(request: Request): AuthenticatedUser {
  return request.auth as AuthenticatedUser;
}

/* ------------------------------------------------------------------ */
/*  Controller                                                         */
/* ------------------------------------------------------------------ */

export class NotificationController {
  /* list my notifications */
  async listMine(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const auth = getAuth(request);
      const query = request.query as Record<string, string>;
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

      const filter: Record<string, unknown> = {
        userId: new ObjectId(auth.userId),
      };
      if (query.isRead === "true") filter.isRead = true;
      if (query.isRead === "false") filter.isRead = false;

      const db = getMongoDB();
      const notifications = new NotificationRepository(db);
      const [docs, total] = await Promise.all([
        notifications.findMany(filter as Filter<NotificationDocument>, {
          sort: { createdAt: -1 },
          skip: (page - 1) * limit,
          limit,
        }),
        notifications.count(filter as Filter<NotificationDocument>),
      ]);

      const unreadCount = await notifications.count({
        userId: new ObjectId(auth.userId),
        isRead: false,
      } as Filter<NotificationDocument>);

      response.status(200).json(
        successResponse("Notifications retrieved successfully.", {
          notifications: docs.map(toNotificationView),
          unreadCount,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  /* mark notification as read */
  async markRead(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const auth = getAuth(request);
      const notificationId = getObjectId(request.params.id, "Notification ID");

      const db = getMongoDB();
      const notifications = new NotificationRepository(db);
      const doc = await notifications.findById(notificationId);

      if (!doc) {
        throw new AppError(
          "Notification not found.",
          404,
          "NOTIFICATION_NOT_FOUND",
        );
      }

      // Users can only mark their own notifications as read
      if (!doc.userId.equals(new ObjectId(auth.userId))) {
        throw new AppError(
          "You do not have permission to modify this notification.",
          403,
          "FORBIDDEN",
        );
      }

      await notifications.updateById(notificationId, {
        $set: { isRead: true },
      });

      response.status(200).json(
        successResponse("Notification marked as read.", {
          notificationId: notificationId.toHexString(),
          isRead: true,
        }),
      );
    } catch (error) {
      next(error);
    }
  }
}
