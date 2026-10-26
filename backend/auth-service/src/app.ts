import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import roleRoutes from "./routes/roles.routes.js";
import permissionRoutes from "./routes/permissions.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"]
  })
);

// Parse JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (e.g. /uploads/avatars/avatar-xxx.png)
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    service: "auth-service",
    status: "ok",
    port: 4001,
    message: "auth-services are running"
  });
});

// API routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/roles", roleRoutes);
app.use("/permissions", permissionRoutes);

// Handle unknown routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Central error handler
app.use((
  error: unknown,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  console.error("Auth Service error:", error);

  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : "Internal server error"
  });
});

export default app;
