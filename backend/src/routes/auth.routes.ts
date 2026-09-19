import { Router } from "express";

import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";

const controller = new AuthController();
const router = Router();

router.post("/register", (request, response, next) =>
  controller.register(request, response, next),
);
router.post("/login", (request, response, next) =>
  controller.login(request, response, next),
);
router.get("/me", authenticate, (request, response, next) =>
  controller.me(request, response, next),
);

export default router;