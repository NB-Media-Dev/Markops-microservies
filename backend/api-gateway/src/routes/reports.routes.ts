import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const reportsProxy = createServiceProxy({
  target: servicesConfig.services.reports,
  routePrefix: "/reports",
  serviceName: "Reporting Service"
});

router.use("/", optionalGatewayToken, reportsProxy);

export default router;
