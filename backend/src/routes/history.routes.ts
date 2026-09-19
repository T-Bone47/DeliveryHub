import { Router } from "express";

import { HistoryController } from "../controllers/history.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new HistoryController();
const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  (request, response, next) =>
    controller.listAll(request, response, next),
);
router.get(
  "/package/:packageId",
  authenticate,
  (request, response, next) =>
    controller.getPackageHistory(request, response, next),
);
router.get(
  "/agent/:agentId",
  authenticate,
  requireRole("AGENT", "ADMIN"),
  (request, response, next) =>
    controller.getAgentHistory(request, response, next),
);

export default router;
