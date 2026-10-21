import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));


dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/api-gateway/.env") });

export const servicesConfig = {
  port: Number(process.env.API_GATEWAY_PORT || process.env.PORT || 4000),
  jwtSecret: process.env.JWT_ACCESS_SECRET || "markops_access_secret_super_secure_key_12345",
  services: {
    auth: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
    campaigns: process.env.CAMPAIGN_SERVICE_URL || "http://localhost:4002",
    tasks: process.env.CREATIVE_TASK_SERVICE_URL || "http://localhost:4003",
    leads: process.env.LEAD_SERVICE_URL || "http://localhost:4004",
    conversions: process.env.CONVERSION_SERVICE_URL || "http://localhost:4005",
    realtime: process.env.REALTIME_SERVICE_URL || "http://localhost:4006",
    reports: process.env.REPORTING_SERVICE_URL || "http://localhost:4007"
  }
};

