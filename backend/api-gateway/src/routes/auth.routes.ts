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


router.use("/login", authLimiter);
router.use("/register", authLimiter);


router.use("/", authProxy);

export default router;
