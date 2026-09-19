import type { NextFunction, Request, Response } from "express";
import { ObjectId, type Filter } from "mongodb";

import { getMongoDB } from "../config/mongodb";
import { AgentRepository } from "../repositories/agent.repository";
import { RewardPenaltyRepository } from "../repositories/reward-penalty.repository";
import { type RewardPenaltyDocument } from "../models/reward-penalty";
import { type AuthenticatedUser } from "../middleware/authenticate";
import { AppError } from "../middleware/error-handler";
import { successResponse } from "../utils/api-response";
import {
  getInputObject,
  getNumber,
  getObjectId,
  getRequiredString,
  getOptionalObjectId,
} from "../utils/management-validation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RewardView {
  id: string;
  agentId: string;
  packageId: string | null;
  type: string;
  reason: string;
  points: number;
  createdAt: Date;
  createdBy: string;
}

function toRewardView(doc: RewardPenaltyDocument): RewardView {
  return {
    id: doc._id.toHexString(),
    agentId: doc.agentId.toHexString(),
    packageId: doc.packageId?.toHexString() ?? null,
    type: doc.type,
    reason: doc.reason,
    points: doc.points,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy.toHexString(),
  };
}

function getAuth(request: Request): AuthenticatedUser {
  return request.auth as AuthenticatedUser;
}

/* ------------------------------------------------------------------ */
/*  Controller                                                         */
/* ------------------------------------------------------------------ */

export class RewardController {
  /* list agent rewards/penalties */
  async getAgentRewards(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const agentId = getObjectId(request.params.agentId, "Agent ID");
      const auth = getAuth(request);

      // Agent can only view own rewards
      if (auth.role === "AGENT") {
        const db = getMongoDB();
        const agents = new AgentRepository(db);
        const agentDocs = await agents.findMany(
          { userId: new ObjectId(auth.userId) } as Filter<any>,
        );
        if (agentDocs.length === 0 || !agentDocs[0]._id.equals(agentId)) {
          throw new AppError(
            "You do not have permission to view this agent's rewards.",
            403,
            "FORBIDDEN",
          );
        }
      }

      const db = getMongoDB();
      const rewards = new RewardPenaltyRepository(db);
      const docs = await rewards.findByAgentId(agentId);

      response.status(200).json(
        successResponse("Agent rewards retrieved successfully.", {
          rewards: docs.map(toRewardView),
        }),
      );
    } catch (error) {
      next(error);
    }
  }

  /* add reward */
  async addReward(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const agentId = getObjectId(request.params.agentId, "Agent ID");
      const body = getInputObject(request.body);
      const reason = getRequiredString(body.reason, "reason");
      const points = getNumber(body.points, "points", 1);
      const packageId =
        typeof body.packageId === "string" && body.packageId.trim() !== ""
          ? new ObjectId(body.packageId as string)
          : undefined;

      const db = getMongoDB();
      const agents = new AgentRepository(db);
      const agent = await agents.findById(agentId);
      if (!agent) {
        throw new AppError("Agent not found.", 404, "AGENT_NOT_FOUND");
      }

      const auth = getAuth(request);
      const rewards = new RewardPenaltyRepository(db);
      const doc = await rewards.create({
        agentId,
        packageId,
        type: "REWARD",
        reason,
        points,
        createdAt: new Date(),
        createdBy: new ObjectId(auth.userId),
      });

      // Update agent's rewardPoints
      await agents.updateById(agentId, {
        $inc: { rewardPoints: points },
        $set: { updatedAt: new Date() },
      });

      response.status(201).json(
        successResponse("Reward added successfully.", toRewardView(doc)),
      );
    } catch (error) {
      next(error);
    }
  }

  /* add penalty */
  async addPenalty(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const agentId = getObjectId(request.params.agentId, "Agent ID");
      const body = getInputObject(request.body);
      const reason = getRequiredString(body.reason, "reason");
      const points = getNumber(body.points, "points", 1);
      const packageId =
        typeof body.packageId === "string" && body.packageId.trim() !== ""
          ? new ObjectId(body.packageId as string)
          : undefined;

      const db = getMongoDB();
      const agents = new AgentRepository(db);
      const agent = await agents.findById(agentId);
      if (!agent) {
        throw new AppError("Agent not found.", 404, "AGENT_NOT_FOUND");
      }

      const auth = getAuth(request);
      const rewards = new RewardPenaltyRepository(db);
      const doc = await rewards.create({
        agentId,
        packageId,
        type: "PENALTY",
        reason,
        points,
        createdAt: new Date(),
        createdBy: new ObjectId(auth.userId),
      });

      // Update agent's penaltyPoints
      await agents.updateById(agentId, {
        $inc: { penaltyPoints: points },
        $set: { updatedAt: new Date() },
      });

      response.status(201).json(
        successResponse("Penalty added successfully.", toRewardView(doc)),
      );
    } catch (error) {
      next(error);
    }
  }
}
