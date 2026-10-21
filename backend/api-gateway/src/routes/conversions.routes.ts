import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const conversionsProxy = createServiceProxy({
  target: servicesConfig.services.conversions,
  routePrefix: "/conversions",
  serviceName: "Conversion Service"
});

router.use("/", optionalGatewayToken, conversionsProxy);

export default router;
