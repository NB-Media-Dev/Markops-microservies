import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRoutes from "./routes/health.routes.js";
import campaignsRoutes from "./routes/campaigns.routes.js";
import adsRoutes from "./routes/ads.routes.js";
import leadsRoutes from "./routes/leads.routes.js";
import metaConnectionsRoutes from "./routes/meta-connections.routes.js";
import { authenticateGatewayUser } from "./middleware/auth.middleware.js";

export const app = express();

const allowedOrigins = [
  "http://localhost:4000",
  "http://localhost:4200",
  "http://localhost:4201",
  "http://localhost:4202",
  "http://127.0.0.1:4200"
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.includes("localhost") || origin.includes("127.0.0.1")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// 1. Root Health Check (Public, for API Gateway checkMicroserviceHealth at http://localhost:4002/health)
app.use(healthRoutes);

// 2. Main API Router (Supports both /api/campaigns and /campaigns)
const apiRouter = express.Router();
apiRouter.use(healthRoutes);
apiRouter.use(authenticateGatewayUser);
apiRouter.use(campaignsRoutes);
apiRouter.use(adsRoutes);
apiRouter.use(leadsRoutes);
apiRouter.use(metaConnectionsRoutes);

app.use("/api", apiRouter);
app.use(apiRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found on Campaign Service"
  });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[Campaign Service Error]:", err?.message || err);
  res.status(500).json({
    success: false,
    error: err?.message || "Internal server error on Campaign Service"
  });
});

export default app;

