import { app } from "./app.js";
import { initDatabase } from "./config/database.js";

const PORT = parseInt(process.env.PORT || process.env.CAMPAIGN_SERVICE_PORT || "4002", 10);

async function startServer(): Promise<void> {
  // 1. Connect to digital_db
  await initDatabase();

  // 2. Start Express server
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("================================================================");
    console.log(` 📢 MarkOps Campaign Microservice Online!`);
    console.log(` 🚀 API Server:    http://localhost:${PORT}`);
    console.log(` 🏥 Health Check:  http://localhost:${PORT}/health`);
    console.log(` 📊 Metrics API:   http://localhost:${PORT}/campaigns/metrics`);
    console.log(` 📋 Campaigns API: http://localhost:${PORT}/campaigns`);
    console.log(` 🎯 Ads API:       http://localhost:${PORT}/ads`);
    console.log("================================================================");
  });

  const shutdown = () => {
    console.log("[Campaign Microservice] Shutting down gracefully...");
    server.close(() => {
      console.log("[Campaign Microservice] Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch((err) => {
  console.error("[Campaign Microservice Fatal Error]:", err);
  process.exit(1);
});

