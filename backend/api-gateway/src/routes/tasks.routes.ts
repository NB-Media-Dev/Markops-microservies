import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const tasksProxy = createServiceProxy({
  target: servicesConfig.services.tasks,
  routePrefix: "/tasks",
  serviceName: "Creative Task Service"
});

router.use("/", optionalGatewayToken, tasksProxy);

export default router;
