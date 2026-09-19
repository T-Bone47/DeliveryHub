import { Router } from "express";

import { NotificationController } from "../controllers/notification.controller";
import { authenticate } from "../middleware/authenticate";

const controller = new NotificationController();
const router = Router();

router.get(
  "/",
  authenticate,
  (request, response, next) =>
    controller.listMine(request, response, next),
);
router.put(
  "/:id/read",
  authenticate,
  (request, response, next) =>
    controller.markRead(request, response, next),
);

export default router;
