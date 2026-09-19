import type { NextFunction, Request, Response } from "express";

import { getMongoDB } from "../config/mongodb";
import { DeliveryHistoryRepository } from "../repositories/delivery-history.repository";
import { AgentRepository } from "../repositories/agent.repository";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { AppError } from "../middleware/error-handler";
import { successResponse } from "../utils/api-response";
import { getObjectId } from "../utils/management-validation";
import { ObjectId, type Filter } from "mongodb";
import { type DeliveryHistoryDocument } from "../models/delivery-history";

function getAuth(request: Request): AuthenticatedUser {
  return request.auth as AuthenticatedUser;
}

interface HistoryItemView {
  id: string;
  packageId: string;
  bookingId: string | null;
  agentId: string | null;
  status: string;
  remarks: string;
  timestamp: Date;
  changedByUserId: string | null;
}

function toHistoryView(doc: DeliveryHistoryDocument): HistoryItemView {
  return {
    id: doc._id.toHexString(),
    packageId: doc.packageId.toHexString(),
    bookingId: doc.bookingId?.toHexString() ?? null,
    agentId: doc.agentId?.toHexString() ?? null,
    status: doc.status,
    remarks: doc.remarks,
    timestamp: doc.timestamp,
    changedByUserId: doc.changedByUserId?.toHexString() ?? null,
  };
}

export class HistoryController {
  /* list all history records (admin) */
  async listAll(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = request.query as Record<string, string>;
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
      const filter: Record<string, unknown> = {};

      if (query.agentId) filter.agentId = new ObjectId(query.agentId);
      if (query.status) filter.status = query.status;
      if (query.fromDate || query.toDate) {
        const dateFilter: Record<string, Date> = {};
        if (query.fromDate) dateFilter.$gte = new Date(query.fromDate);
        if (query.toDate) dateFilter.$lte = new Date(query.toDate);
        filter.timestamp = dateFilter;
      }

      const db = getMongoDB();
      const histories = new DeliveryHistoryRepository(db);
      const [docs, total] = await Promise.all([
        histories.findMany(filter as Filter<DeliveryHistoryDocument>, {
          sort: { timestamp: -1 },
          skip: (page - 1) * limit,
          limit,
        }),
        histories.count(filter as Filter<DeliveryHistoryDocument>),
      ]);

      response.status(200).json(
        successResponse("History records retrieved successfully.", {
          history: docs.map(toHistoryView),
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

  /* package history */
  async getPackageHistory(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const packageId = getObjectId(request.params.packageId, "Package ID");
      const db = getMongoDB();
      const histories = new DeliveryHistoryRepository(db);
      const docs = await histories.findByPackageId(packageId);

      response.status(200).json(
        successResponse("Delivery history retrieved successfully.", {
          history: docs.map(toHistoryView),
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  /* agent history */
  async getAgentHistory(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const auth = getAuth(request);
      const agentIdParam = request.params.agentId;
      const agentId = getObjectId(agentIdParam, "Agent ID");

      // Agents can only see their own history
      if (auth.role === "AGENT") {
        const db = getMongoDB();
        const agents = new AgentRepository(db);
        const agentDocs = await agents.findMany(
          { userId: new ObjectId(auth.userId) } as Filter<any>,
        );
        if (agentDocs.length === 0 || !agentDocs[0]._id.equals(agentId)) {
          throw new AppError(
            "You do not have permission to view this agent's history.",
            403,
            "FORBIDDEN",
          );
        }
      }

      const query = request.query as Record<string, string>;
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

      const filter: Record<string, unknown> = { agentId };
      if (query.status) filter.status = query.status;
      if (query.fromDate || query.toDate) {
        const dateFilter: Record<string, Date> = {};
        if (query.fromDate) dateFilter.$gte = new Date(query.fromDate);
        if (query.toDate) dateFilter.$lte = new Date(query.toDate);
        filter.timestamp = dateFilter;
      }

      const db = getMongoDB();
      const histories = new DeliveryHistoryRepository(db);
      const [docs, total] = await Promise.all([
        histories.findMany(filter as Filter<DeliveryHistoryDocument>, {
          sort: { timestamp: -1 },
          skip: (page - 1) * limit,
          limit,
        }),
        histories.count(filter as Filter<DeliveryHistoryDocument>),
      ]);

      response.status(200).json(
        successResponse("Agent history retrieved successfully.", {
          history: docs.map(toHistoryView),
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
}
