import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const packagesProxy = createServiceProxy({
  target: servicesConfig.services.conversions,
  routePrefix: "/packages",
  serviceName: "Conversion (Packages) Service"
});

router.use("/", optionalGatewayToken, packagesProxy);

export default router;
