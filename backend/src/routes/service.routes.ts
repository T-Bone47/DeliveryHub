import { Router } from "express";

import { ServiceController } from "../controllers/service.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new ServiceController();
const router = Router();
const adminOnly = [authenticate, requireRole("ADMIN")];

router.get("/", authenticate, requireRole("ADMIN", "CUSTOMER"), (request, response, next) =>
  controller.list(request, response, next),
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
