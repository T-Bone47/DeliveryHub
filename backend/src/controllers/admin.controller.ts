import type { NextFunction, Request, Response } from "express";
import { type Filter } from "mongodb";

import { getMongoDB } from "../config/mongodb";
import { PackageRepository } from "../repositories/package.repository";
import { AgentRepository } from "../repositories/agent.repository";
import { DeliveryRepository } from "../repositories/delivery.repository";
import { UserRepository } from "../repositories/user.repository";
import { BookingRepository } from "../repositories/booking.repository";
import { type PackageDocument } from "../models/package";
import { type DeliveryDocument } from "../models/delivery";
import { successResponse } from "../utils/api-response";

export class AdminController {
  async getDashboardSummary(
    _request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const db = getMongoDB();
      const packages = new PackageRepository(db);
      const agents = new AgentRepository(db);
      const deliveries = new DeliveryRepository(db);
      const users = new UserRepository(db);
      const bookings = new BookingRepository(db);

      const [
        totalDeliveries,
        activeDeliveries,
        deliveredDeliveries,
        pendingDeliveries,
        cancelledDeliveries,
        failedDeliveries,
        totalAgents,
        availableAgents,
        busyAgents,
        offlineAgents,
        totalCustomers,
        totalBookings,
        activeBookings,
      ] = await Promise.all([
        packages.count(),
        packages.count({
          status: { $in: ["AGENT_ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
        } as Filter<PackageDocument>),
        packages.count({ status: "DELIVERED" } as Filter<PackageDocument>),
        packages.count({ status: "PENDING" } as Filter<PackageDocument>),
        packages.count({ status: "CANCELLED" } as Filter<PackageDocument>),
        packages.count({ status: "FAILED" } as Filter<PackageDocument>),
        agents.count(),
        agents.count({ status: "AVAILABLE" } as Filter<any>),
        agents.count({ status: "BUSY" } as Filter<any>),
        agents.count({ status: "OFFLINE" } as Filter<any>),
        users.count({ role: "CUSTOMER" } as Filter<any>),
        bookings.count(),
        bookings.count({
          status: { $in: ["PENDING", "CONFIRMED"] },
        } as Filter<any>),
      ]);

      response.status(200).json(
        successResponse("Dashboard data retrieved successfully.", {
          totalDeliveries,
          activeDeliveries,
          deliveredDeliveries,
          pendingDeliveries,
          cancelledDeliveries,
          failedDeliveries,
          totalAgents,
          availableAgents,
          busyAgents,
          offlineAgents,
          totalCustomers,
          totalBookings,
          activeBookings,
        }),
      );
    } catch (error) {
      next(error);
    }
  }
}
