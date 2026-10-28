import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRoutes from "./routes/health.routes.js";
import callLogsRoutes from "./routes/call-logs.routes.js";
import targetsRoutes from "./routes/targets.routes.js";
import followUpsRoutes from "./routes/follow-ups.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { authenticateGatewayUser } from "./middleware/auth.middleware.js";

export const app = express();

const allowedOrigins = [
  "http://localhost:4000",
  "http://localhost:4200",
  "http://localhost:4201",
  "http://localhost:4202",
  "http://localhost:4204",
  "http://127.0.0.1:4200",
  "http://127.0.0.1:4204"
];

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
      "x-requested-with"
    ]
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use(cookieParser());

// 1. Root Health Check (Public, for API Gateway checkMicroserviceHealth at http://localhost:4004/health)
app.use(healthRoutes);

// 2. Main API Router (Supports both direct path and /api/ prefix)
const apiRouter = express.Router();
apiRouter.use(healthRoutes);
apiRouter.use(authenticateGatewayUser);
apiRouter.use(callLogsRoutes);
apiRouter.use(targetsRoutes);
apiRouter.use(followUpsRoutes);
apiRouter.use(analyticsRoutes);

app.use("/api", apiRouter);
app.use(apiRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found on Lead Service"
  });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Lead Service Error]:", err?.message || err);
  res.status(500).json({
    success: false,
    error: err?.message || "Internal server error on Lead Service"
  });
});

export default app;

