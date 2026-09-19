import { Router } from "express";

import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new UserController();
const router = Router();
const adminOnly = [authenticate, requireRole("ADMIN")];

router.get("/", ...adminOnly, (request, response, next) =>
  controller.list(request, response, next),
);
router.get("/:id", ...adminOnly, (request, response, next) =>
  controller.getById(request, response, next),
);
router.put("/:id", ...adminOnly, (request, response, next) =>
  controller.update(request, response, next),
);

export default router;