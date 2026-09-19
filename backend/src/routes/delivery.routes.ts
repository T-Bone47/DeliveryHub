import { Router } from "express";

import { DeliveryController } from "../controllers/delivery.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new DeliveryController();
const router = Router();

router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  (request, response, next) =>
    controller.listAll(request, response, next),
);
router.get(
  "/:id/tracking",
  authenticate,
  (request, response, next) =>
    controller.getTracking(request, response, next),
);
router.put(
  "/:id/status",
  authenticate,
  requireRole("AGENT", "ADMIN"),
  (request, response, next) =>
    controller.updateStatus(request, response, next),
);
router.get(
  "/:id",
  authenticate,
  (request, response, next) =>
    controller.getById(request, response, next),
);

export default router;
