import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { authLimiter } from "../middleware/rate-limit.middleware.js";

const router = Router();

const authProxy = createServiceProxy({
  target: servicesConfig.services.auth,
  routePrefix: "/auth",
  serviceName: "Auth Service"
});

// Protect sensitive endpoints with strict rate limiting
router.use("/login", authLimiter);
router.use("/register", authLimiter);

// Forward all /auth requests to auth-service
router.use("/", authProxy);

export default router;
