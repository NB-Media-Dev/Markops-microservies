import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const adsProxy = createServiceProxy({
  target: servicesConfig.services.campaigns || "http://localhost:4002",
  routePrefix: "/ads",
  serviceName: "Ads (Campaign Service)"
});

router.use("/", optionalGatewayToken, adsProxy);

export default router;

