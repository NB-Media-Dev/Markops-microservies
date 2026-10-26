import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const telecallingProxy = createServiceProxy({
  target: servicesConfig.services.telecalling || "http://localhost:4004",
  routePrefix: "/leads",
  serviceName: "Lead & Telecalling Service"
});

router.use("/", optionalGatewayToken, telecallingProxy);

export default router;
