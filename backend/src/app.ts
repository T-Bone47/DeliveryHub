import express from "express";

import {
  getMongoDBConnectionState,
} from "./config/mongodb";
import { getNeo4jConnectionState } from "./config/neo4j";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error-handler";
import adminRouter from "./routes/admin.routes";
import agentRouter from "./routes/agent.routes";
import authRouter from "./routes/auth.routes";
import bookingRouter from "./routes/booking.routes";
import deliveryRouter from "./routes/delivery.routes";
import historyRouter from "./routes/history.routes";
import locationRouter from "./routes/location.routes";
import notificationRouter from "./routes/notification.routes";
import packageRouter from "./routes/package.routes";
import rewardRouter from "./routes/reward.routes";
import serviceRouter from "./routes/service.routes";
import userRouter from "./routes/user.routes";
import fs from "node:fs";
import path from "node:path";

import { successResponse } from "./utils/api-response";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "10mb" }));

// Ensure uploads/pod directory exists
const uploadsDir = path.resolve(process.cwd(), "uploads");
const podUploadsDir = path.resolve(uploadsDir, "pod");
if (!fs.existsSync(podUploadsDir)) {
  fs.mkdirSync(podUploadsDir, { recursive: true });
}

// Serve uploaded images statically
app.use("/uploads", express.static(uploadsDir));

app.get("/", (_request, response) => {
  response.status(200).json(
    successResponse("DeliveryHub API Server is running.", {
      service: "DeliveryHub API",
      frontendUrl: "http://localhost:4200",
      message: "Please access the DeliveryHub web application at http://localhost:4200",
      health: "http://localhost:5000/health",
    }),
  );
});

app.get("/health", (_request, response) => {
  response.status(200).json(
    successResponse("Service is healthy.", {
      status: "ok",
      service: "delivery-agent-system",
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb: getMongoDBConnectionState(),
        neo4j: getNeo4jConnectionState(),
      },
    }),
  );
});

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/agents", agentRouter);
app.use("/api/services", serviceRouter);
app.use("/api/locations", locationRouter);
app.use("/api/packages", packageRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/deliveries", deliveryRouter);
app.use("/api/history", historyRouter);
app.use("/api/rewards", rewardRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/admin", adminRouter);
app.use(notFoundHandler);
app.use(errorHandler);