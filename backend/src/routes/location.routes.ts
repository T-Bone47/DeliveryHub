import { Router } from "express";

import { LocationController } from "../controllers/location.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new LocationController();
const router = Router();
const adminOnly = [authenticate, requireRole("ADMIN")];

router.get("/", ...adminOnly, (request, response, next) =>
  controller.list(request, response, next),
);
router.post("/", ...adminOnly, (request, response, next) =>
  controller.create(request, response, next),
);
router.put("/:id", ...adminOnly, (request, response, next) =>
  controller.update(request, response, next),
);

export default router;