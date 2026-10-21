import express from "express";
import cors from "cors";
import { servicesConfig } from "./config/services.config.js";
import { requestIdMiddleware } from "./middleware/request-id.middleware.js";
import { generalLimiter } from "./middleware/rate-limit.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { checkAllServicesHealth } from "./utils/health.js";

import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import campaignsRoutes from "./routes/campaigns.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import leadsRoutes from "./routes/leads.routes.js";
import conversionsRoutes from "./routes/conversions.routes.js";
import packagesRoutes from "./routes/packages.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

const app = express();

// Enable Cross-Origin Resource Sharing for all origins
app.use(
  cors({
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"]
  })
);

// Assign unique tracking ID to every request
app.use(requestIdMiddleware);

// Apply general rate limiting
app.use(generalLimiter);

// 1. Gateway Health Check
app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "api-gateway",
    status: "ok",
    port: servicesConfig.port,
    timestamp: new Date().toISOString()
  });
});

// 2. Downstream Microservices Health Check
app.get("/health/services", async (_req, res) => {
  const statuses = await checkAllServicesHealth();
  const allUp = Object.values(statuses).every((s) => s.status === "UP");

  res.status(allUp ? 200 : 207).json({
    gateway: "ok",
    services: statuses
  });
});

// Mount Routes (supporting direct path and /api/v1/ prefix)
const routeList = [
  { path: "/auth", handler: authRoutes },
  { path: "/users", handler: usersRoutes },
  { path: "/campaigns", handler: campaignsRoutes },
  { path: "/tasks", handler: tasksRoutes },
  { path: "/leads", handler: leadsRoutes },
  { path: "/conversions", handler: conversionsRoutes },
  { path: "/packages", handler: packagesRoutes },
  { path: "/reports", handler: reportsRoutes }
];

for (const route of routeList) {
  app.use(route.path, route.handler);
  app.use(`/api/v1${route.path}`, route.handler);
}

// 404 Catch-all for undefined routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found on API Gateway"
  });
});

// Central error handler
app.use(errorMiddleware);

export default app;
