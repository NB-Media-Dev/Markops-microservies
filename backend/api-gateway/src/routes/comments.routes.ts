import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const commentsProxy = createServiceProxy({
  target: servicesConfig.services.tasks,
  routePrefix: "/comments",
  serviceName: "Task Comments (Creative Task Service)"
});

router.use("/", optionalGatewayToken, commentsProxy);

export default router;

