import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config/env.config.js";
import { dbPool } from "./config/db.js";
import { authenticateJwt } from "./middleware/auth.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

// Routes
import healthRoutes from "./routes/health.routes.js";
import productsRoutes from "./routes/products.routes.js";
import packagesRoutes from "./routes/packages.routes.js";
import tasksRoutes from "./routes/tasks.routes.js";
import versionsRoutes from "./routes/versions.routes.js";
import commentsRoutes from "./routes/comments.routes.js";
import designerRoutes from "./routes/designer.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const app = express();

// CORS
const allowedOrigins = [
  config.frontendUrl,
  "http://localhost:4200",
  "http://localhost:4201",
  "http://localhost:4202",
  "http://127.0.0.1:4202"
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
      "x-user-email",
      "x-user-id",
      "x-user-role",
      "x-user-name",
      "x-role-code",
      "x-requested-with"
    ]
  })
);

app.use(express.json({ limit: `${config.maxFileSizeMb || 50}mb` }));
app.use(express.urlencoded({ limit: `${config.maxFileSizeMb || 50}mb`, extended: true }));
app.use(cookieParser());

// Static file uploads
app.use("/uploads", express.static(config.uploadDir));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Document Viewer Card Fallback
app.use("/uploads", (req, res) => {
  const reqPath = req.path || "document";
  const fileName = path.basename(reqPath) || "asset.png";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>MarkOps Designer Asset Viewer - ${fileName}</title>
      <style>
        * { box-sizing: border-box; }
        html, body {
          margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: radial-gradient(circle at center, #1e1b4b 0%, #0a0f1d 100%);
          color: #f8fafc; display: flex; align-items: center; justify-content: center;
        }
        .card {
          background: rgba(30, 27, 75, 0.85); backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px;
          padding: 2.25rem 2.5rem; max-width: 520px; width: 90%; text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
        .badge {
          display: inline-block; background: rgba(99, 102, 241, 0.2); color: #a5b4fc;
          border: 1px solid rgba(99, 102, 241, 0.4); padding: 0.25rem 0.85rem;
          border-radius: 9999px; font-size: 0.75rem; font-weight: 700; margin-bottom: 1rem;
        }
        h1 { font-size: 1.25rem; margin: 0 0 0.5rem; word-break: break-all; }
        p { color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem; }
        .btn {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          color: white; padding: 0.65rem 1.6rem; border-radius: 10px; border: none;
          cursor: pointer; font-weight: 700; font-size: 0.85rem;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">MarkOps Designer Microservice Asset</div>
        <h1>${fileName}</h1>
        <p>Creative asset registered in the Designer Microservice storage engine.</p>
        <button onclick="window.close(); if(!window.closed) history.back();" class="btn">Return to Studio</button>
      </div>
    </body>
    </html>
  `);
});

// 1. Public Root Health Check (Called directly by API Gateway at http://localhost:4003/health)
app.use(healthRoutes);

// 2. Mount Microservice API Endpoints (supports both /api/products and /products)
const apiRouter = express.Router();
apiRouter.use(healthRoutes);
apiRouter.use(authenticateJwt(dbPool));
apiRouter.use(productsRoutes);
apiRouter.use(packagesRoutes);
apiRouter.use(tasksRoutes);
apiRouter.use(versionsRoutes);
apiRouter.use(commentsRoutes);
apiRouter.use(designerRoutes);

app.use("/api", apiRouter);
app.use(apiRouter);

// 404 & Global Error Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
