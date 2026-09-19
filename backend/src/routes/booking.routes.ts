import { Router } from "express";

import { BookingController } from "../controllers/booking.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new BookingController();
const router = Router();

router.get(
  "/my",
  authenticate,
  requireRole("CUSTOMER"),
  (request, response, next) =>
    controller.listMine(request, response, next),
);
router.get(
  "/agent",
  authenticate,
  requireRole("AGENT"),
  (request, response, next) =>
    controller.listAgent(request, response, next),
);
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  (request, response, next) =>
    controller.listAll(request, response, next),
);
router.put(
  "/:id/cancel",
  authenticate,
  requireRole("CUSTOMER", "ADMIN"),
  (request, response, next) =>
    controller.cancel(request, response, next),
);
router.put(
  "/:id/reschedule",
  authenticate,
  requireRole("CUSTOMER"),
  (request, response, next) =>
    controller.reschedule(request, response, next),
);
router.get(
  "/:id",
  authenticate,
  (request, response, next) =>
    controller.getById(request, response, next),
);

export default router;
