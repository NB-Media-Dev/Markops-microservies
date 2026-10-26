import { Router } from "express";
import { dbPool } from "../config/db.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "UP",
    service: "designer-microservice",
    version: "1.0.0",
    uptime: process.uptime(),
    database: dbPool.isConnected() ? "CONNECTED" : "IN_MEMORY_FALLBACK",
    timestamp: new Date().toISOString()
  });
});

export default router;

