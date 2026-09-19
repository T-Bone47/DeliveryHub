import { Router } from "express";

import { PackageController } from "../controllers/package.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new PackageController();
const router = Router();

router.post(
  "/",
  authenticate,
  requireRole("CUSTOMER"),
  (request, response, next) =>
    controller.create(request, response, next),
);
router.get(
  "/my",
  authenticate,
  requireRole("CUSTOMER"),
  (request, response, next) =>
    controller.listMine(request, response, next),
);
router.get(
  "/assigned",
  authenticate,
  requireRole("AGENT"),
  (request, response, next) =>
    controller.listAssigned(request, response, next),
);
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  (request, response, next) =>
    controller.listAll(request, response, next),
);
router.post(
  "/:id/assign",
  authenticate,
  requireRole("ADMIN"),
  (request, response, next) =>
    controller.retryAssignment(request, response, next),
);
router.get(
  "/:id/assignment",
  authenticate,
  (request, response, next) =>
    controller.assignment(request, response, next),
);
router.post(
  "/:id/otp",
  authenticate,
  requireRole("CUSTOMER"),
  (request, response, next) =>
    controller.generateOtp(request, response, next),
);
router.post(
  "/:id/otp/verify",
  authenticate,
  requireRole("AGENT"),
  (request, response, next) =>
    controller.verifyOtp(request, response, next),
);
router.patch(
  "/:id/status",
  authenticate,
  requireRole("AGENT"),
  (request, response, next) =>
    controller.updateStatus(request, response, next),
);
router.post(
  "/:id/proof",
  authenticate,
  requireRole("AGENT"),
  (request, response, next) =>
    controller.uploadProof(request, response, next),
);
router.get(
  "/:id/proof",
  authenticate,
  (request, response, next) =>
    controller.getProof(request, response, next),
);
router.post(
  "/:id/exception",
  authenticate,
  requireRole("AGENT"),
  (request, response, next) =>
    controller.reportException(request, response, next),
);
router.post(
  "/:id/reschedule",
  authenticate,
  requireRole("CUSTOMER", "ADMIN"),
  (request, response, next) =>
    controller.rescheduleDelivery(request, response, next),
);

router.get(
  "/:id",
  authenticate,
  (request, response, next) =>
    controller.getById(request, response, next),
);

export default router;
