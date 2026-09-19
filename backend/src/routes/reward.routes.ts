import { Router } from "express";

import { RewardController } from "../controllers/reward.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new RewardController();
const router = Router();

router.get(
  "/agent/:agentId",
  authenticate,
  (request, response, next) =>
    controller.getAgentRewards(request, response, next),
);
router.post(
  "/agent/:agentId/reward",
  authenticate,
  requireRole("ADMIN"),
  (request, response, next) =>
    controller.addReward(request, response, next),
);
router.post(
  "/agent/:agentId/penalty",
  authenticate,
  requireRole("ADMIN"),
  (request, response, next) =>
    controller.addPenalty(request, response, next),
);

export default router;
