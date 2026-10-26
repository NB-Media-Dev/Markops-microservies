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
import packagesRoutes from "./routes/packages.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import productsRoutes from "./routes/products.routes.js";
import designersRoutes from "./routes/designers.routes.js";
import commentsRoutes from "./routes/comments.routes.js";
import versionsRoutes from "./routes/versions.routes.js";
import adsRoutes from "./routes/ads.routes.js";
import telecallingRoutes from "./routes/telecalling.routes.js";

const app = express();

// Enable Cross-Origin Resource Sharing for all origins
app.use(
  cors({
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "x-user-id",
      "x-user-email",
      "x-user-role",
      "x-user-name",
      "x-role-code",
      "x-requested-with",
      "Cache-Control",
      "Pragma"
    ]
  })
);


app.use(requestIdMiddleware);


app.use(generalLimiter);


app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "api-gateway",
    status: "ok",
    port: servicesConfig.port,
    timestamp: new Date().toISOString()
  });
});


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
  { path: "/ads", handler: adsRoutes },
  { path: "/tasks", handler: tasksRoutes },
  { path: "/packages", handler: packagesRoutes },
  { path: "/products", handler: productsRoutes },
  { path: "/designers", handler: designersRoutes },
  { path: "/designer", handler: designersRoutes },
  { path: "/comments", handler: commentsRoutes },
  { path: "/versions", handler: versionsRoutes },
  { path: "/reports", handler: reportsRoutes },
  { path: "/call-logs", handler: telecallingRoutes },
  { path: "/telecaller-targets", handler: telecallingRoutes },
  { path: "/targets", handler: telecallingRoutes },
  { path: "/follow-ups", handler: telecallingRoutes },
  { path: "/telecalling", handler: telecallingRoutes }
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
