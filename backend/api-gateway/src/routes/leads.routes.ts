import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const leadsProxy = createServiceProxy({
  target: servicesConfig.services.leads,
  routePrefix: "/leads",
  serviceName: "Lead Service"
});

router.use("/", optionalGatewayToken, leadsProxy);

export default router;
