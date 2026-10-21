import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const usersProxy = createServiceProxy({
  target: servicesConfig.services.auth,
  routePrefix: "/users",
  serviceName: "Users (Auth Service)"
});

// Pass through optional token information if provided
router.use("/", optionalGatewayToken, usersProxy);

export default router;
