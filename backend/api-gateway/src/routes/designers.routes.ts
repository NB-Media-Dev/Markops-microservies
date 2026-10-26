import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const designersProxy = createServiceProxy({
  target: servicesConfig.services.tasks,
  routePrefix: "/designers",
  serviceName: "Designers Directory (Creative Task Service)"
});

router.use("/", optionalGatewayToken, designersProxy);

export default router;

