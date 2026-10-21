import http from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { app } from "./app.js";
import { config } from "./config/env.config.js";
import { initDatabase } from "./config/db.js";
import { setSocketIO } from "./events/socket.events.js";

async function startServer(): Promise<void> {
  // 1. Initialize Database connection
  await initDatabase();

  // 2. Create HTTP server
  const server = http.createServer(app);

  // 3. Attach Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: [
        config.frontendUrl,
        "http://localhost:4200",
        "http://localhost:4201",
        "http://localhost:4202",
        "http://127.0.0.1:4202"
      ],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });

  setSocketIO(io);

  io.on("connection", (socket) => {
    const userRole = socket.handshake.auth?.role || "DESIGNER";
    const userName = socket.handshake.auth?.fullName || "Creative User";
    console.log(`[Designer Realtime] Client connected: ${socket.id} (${userName} / ${userRole})`);

    socket.on("disconnect", (reason) => {
      console.log(`[Designer Realtime] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  // 4. Listen on designated microservice port
  server.listen(config.port, "0.0.0.0", () => {
    console.log("================================================================");
    console.log(` 🎨 MarkOps Designer Microservice Online!`);
    console.log(` 🚀 API Server:    http://localhost:${config.port}`);
    console.log(` 🏥 Health Check:  http://localhost:${config.port}/api/health`);
    console.log(` 📊 Metrics API:   http://localhost:${config.port}/api/designer/dashboard-metrics`);
    console.log(` 📋 Tasks API:     http://localhost:${config.port}/api/tasks`);
    console.log(` 👥 Designers API: http://localhost:${config.port}/api/designers`);
    console.log(` ⚡ Socket.IO:     ws://localhost:${config.port}`);
    console.log(` 🌐 Frontend UI:   http://localhost:4202`);
    console.log("================================================================");
  });

  // Handle graceful shutdown
  const shutdown = () => {
    console.log("[Designer Microservice] Shutting down gracefully...");
    server.close(() => {
      console.log("[Designer Microservice] Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("[Designer Microservice Fatal Error]:", err);
  process.exit(1);
});
