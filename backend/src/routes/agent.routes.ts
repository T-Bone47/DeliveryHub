import { Router } from "express";

import { AgentController } from "../controllers/agent.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new AgentController();
const router = Router();
const adminOnly = [authenticate, requireRole("ADMIN")];

router.get(
  "/me",
  authenticate,
  requireRole("AGENT"),
  (request, response, next) => controller.me(request, response, next),
);
router.get("/", ...adminOnly, (request, response, next) =>
  controller.list(request, response, next),
);
router.get("/:id/performance", ...adminOnly, (request, response, next) =>
  controller.performance(request, response, next),
);
router.get("/:id", ...adminOnly, (request, response, next) =>
  controller.getById(request, response, next),
);
router.post("/", ...adminOnly, (request, response, next) =>
  controller.create(request, response, next),
);
router.put("/:id/status", ...adminOnly, (request, response, next) =>
  controller.updateStatus(request, response, next),
);
router.put("/:id", ...adminOnly, (request, response, next) =>
  controller.update(request, response, next),
);

export default router;