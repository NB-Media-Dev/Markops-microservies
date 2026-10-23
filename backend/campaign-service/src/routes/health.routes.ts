import { Router } from "express";
import { dbPool } from "../config/database.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "UP",
    service: "campaign-service",
    version: "1.0.0",
    port: 4002,
    uptime: process.uptime(),
    database: dbPool.isConnected() ? "CONNECTED" : "DISCONNECTED",
    timestamp: new Date().toISOString()
  });
});

export default router;

