import { Router } from "express";

import { AdminController } from "../controllers/admin.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/authorize";

const controller = new AdminController();
const router = Router();
const adminOnly = [authenticate, requireRole("ADMIN")];

router.get("/dashboard", ...adminOnly, (request, response, next) =>
  controller.getDashboardSummary(request, response, next),
);

export default router;
