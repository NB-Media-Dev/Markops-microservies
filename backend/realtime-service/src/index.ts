import http from "node:http";
import { app } from "./app.js";
import { config } from "./config/env.config.js";
import { initSocket } from "./socket.js";

async function startServer(): Promise<void> {
  const server = http.createServer(app);

  // Initialize Socket.IO engine
  initSocket(server);

  server.listen(config.port, "0.0.0.0", () => {
    console.log("================================================================");
    console.log(` ⚡ MarkOps Realtime WebSocket Service Online!`);
    console.log(` 🚀 API Server:    http://localhost:${config.port}`);
    console.log(` 🏥 Health Check:  http://localhost:${config.port}/health`);
    console.log(` 📡 Broadcast API: http://localhost:${config.port}/api/broadcast`);
    console.log(` 🔌 Socket.IO WS:  ws://localhost:${config.port}`);
    console.log("================================================================");
  });

  const shutdown = () => {
    console.log("[Realtime Gateway] Shutting down gracefully...");
    server.close(() => {
      console.log("[Realtime Gateway] Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("[Realtime Gateway Fatal Error]:", err);
  process.exit(1);
});

