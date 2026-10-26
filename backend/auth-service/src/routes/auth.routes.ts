import { Router } from "express";
import {
  loginController,
  refreshController,
  logoutController,
  meController
} from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validation.middleware.js";
import {
  loginSchema,
  refreshTokenSchema
} from "../validators/auth.validator.js";

const router = Router();

// GET /auth - Root status endpoint
router.get("/", (_req, res) => {
  res.status(200).json({
    service: "auth-service",
    message: "Auth Service API is active",
    endpoints: ["POST /login", "POST /register", "POST /refresh-token", "POST /logout", "GET /me"]
  });
});

// POST /auth/login
router.post("/login", validateBody(loginSchema), loginController);

// POST /auth/refresh-token
router.post("/refresh-token", validateBody(refreshTokenSchema), refreshController);

// POST /auth/logout
router.post("/logout", logoutController);

// GET /auth/me
router.get("/me", meController);

export default router;
