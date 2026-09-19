import type { NextFunction, Request, Response } from "express";

import { getMongoDB } from "../config/mongodb";
import { AgentRepository } from "../repositories/agent.repository";
import { LocationRepository } from "../repositories/location.repository";
import { ServiceRepository } from "../repositories/service.repository";
import { UserRepository } from "../repositories/user.repository";
import {
  AgentManagementService,
} from "../services/agent-management.service";
import { successResponse } from "../utils/api-response";

import { type AuthenticatedUser } from "../middleware/authenticate";

function createService(): AgentManagementService {
  return new AgentManagementService(() => {
    const db = getMongoDB();
    return {
      agents: new AgentRepository(db),
      locations: new LocationRepository(db),
      services: new ServiceRepository(db),
      users: new UserRepository(db),
    };
  });
}

export class AgentController {
  async me(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const auth = request.auth as AuthenticatedUser;
      response
        .status(200)
        .json(
          successResponse("Agent profile retrieved successfully.", {
            agent: await createService().getByUserId(auth.userId),
          }),
        );
    } catch (error) {
      next(error);
    }
  }
  async list(
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse("Agents retrieved successfully.", {
            agents: await createService().list(),
          }),
        );
    } catch (error) {
      next(error);
    }
  }

  async getById(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse("Agent retrieved successfully.", {
            agent: await createService().getById(request.params.id),
          }),
        );
    } catch (error) {
      next(error);
    }
  }

  async create(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(201)
        .json(
          successResponse("Agent created successfully.", {
            agent: await createService().create(request.body),
          }),
        );
    } catch (error) {
      next(error);
    }
  }

  async update(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse("Agent updated successfully.", {
            agent: await createService().update(
              request.params.id,
              request.body,
            ),
          }),
        );
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse("Agent status updated successfully.", {
            agent: await createService().updateStatus(
              request.params.id,
              request.body,
            ),
          }),
        );
    } catch (error) {
      next(error);
    }
  }

  async performance(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      response
        .status(200)
        .json(
          successResponse("Agent performance retrieved successfully.", {
            performance: await createService().getPerformance(
              request.params.id,
            ),
          }),
        );
    } catch (error) {
      next(error);
    }
  }
}