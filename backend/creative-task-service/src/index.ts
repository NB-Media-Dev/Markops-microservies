import { app } from "./app.js";
import { config } from "./config/env.config.js";
import { initDatabase } from "./config/db.js";

async function startServer(): Promise<void> {
  // 1. Initialize Database connection
  await initDatabase();

  // 2. Listen on designated microservice port
  const server = app.listen(config.port, "0.0.0.0", () => {
    console.log("================================================================");
    console.log(` 🎨 MarkOps Designer Microservice Online!`);
    console.log(` 🚀 API Server:    http://localhost:${config.port}`);
    console.log(` 🏥 Health Check:  http://localhost:${config.port}/api/health`);
    console.log(` 📊 Metrics API:   http://localhost:${config.port}/api/designer/dashboard-metrics`);
    console.log(` 📋 Tasks API:     http://localhost:${config.port}/api/tasks`);
    console.log(` 👥 Designers API: http://localhost:${config.port}/api/designers`);
    console.log(` 📡 Realtime Hub:  ${config.realtimeServiceUrl}`);
    console.log(` 🌐 Frontend UI:   ${config.frontendUrl}`);
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
