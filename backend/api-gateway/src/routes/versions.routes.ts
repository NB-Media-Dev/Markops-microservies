import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const versionsProxy = createServiceProxy({
  target: servicesConfig.services.tasks,
  routePrefix: "/versions",
  serviceName: "Task Versions (Creative Task Service)"
});

router.use("/", optionalGatewayToken, versionsProxy);

export default router;

