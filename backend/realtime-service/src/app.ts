import express from "express";
import cors from "cors";
import { config } from "./config/env.config.js";
import { broadcastEvent } from "./socket.js";

export const app = express();

app.use(
  cors({
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"]
  })
);

app.use(express.json());

// Health Check
app.get("/health", (_req, res) => {
  res.json({
    status: "UP",
    service: "realtime-service",
    port: config.port,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "UP",
    service: "realtime-service",
    port: config.port,
    timestamp: new Date().toISOString()
  });
});

// Broadcast Endpoints for Microservices
function handleBroadcast(req: express.Request, res: express.Response) {
  const { event, data, room } = req.body;

  if (!event || typeof event !== "string") {
    return res.status(400).json({
      success: false,
      error: "Event name is required (string)"
    });
  }

  const success = broadcastEvent(event, data, room);

  return res.json({
    success,
    event,
    target: room ? `room:${room}` : "global",
    timestamp: new Date().toISOString()
  });
}

app.post("/api/broadcast", handleBroadcast);
app.post("/api/realtime/broadcast", handleBroadcast);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`,
    service: "realtime-service"
  });
});

export default app;

