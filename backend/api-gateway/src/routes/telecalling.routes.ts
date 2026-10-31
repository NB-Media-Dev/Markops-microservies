import { Router, type Request } from "express";
import { servicesConfig } from "../config/services.config.js";
import { createServiceProxy } from "../services/proxy.service.js";
import { optionalGatewayToken } from "../middleware/auth.middleware.js";

const router = Router();

const telecallingProxy = createServiceProxy({
  target: servicesConfig.services.telecalling || "http://localhost:4004",
  pathRewrite: (_path: string, req: Request) => {
    let clean = req.originalUrl.replace(/^\/api(?:\/v1)?/, "");
    if (clean.startsWith("/calls")) {
      clean = clean.replace(/^\/calls/, "/call-logs");
    } else if (clean.startsWith("/followups")) {
      clean = clean.replace(/^\/followups/, "/follow-ups");
    }
    return clean;
  },
  serviceName: "Lead & Telecalling Service"
});

router.use("/", optionalGatewayToken, telecallingProxy);

export default router;
