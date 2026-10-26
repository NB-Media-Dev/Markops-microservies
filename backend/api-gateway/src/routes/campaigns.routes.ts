import { Router } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const campaignsProxy = createServiceProxy({
  target: servicesConfig.services.campaigns,
  routePrefix: "/campaigns",
  serviceName: "Campaign Service"
});

router.use("/", optionalGatewayToken, campaignsProxy);

export default router;
