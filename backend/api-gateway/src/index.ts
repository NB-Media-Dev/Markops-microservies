import app from "./app.js";
import { servicesConfig } from "./config/services.config.js";

const PORT = servicesConfig.port;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`=========================================`);
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📍 Health Check:    http://localhost:${PORT}/health`);
  console.log(`📍 Services Status: http://localhost:${PORT}/health/services`);
  console.log(`🔌 WebSockets:      ws://localhost:${PORT}/socket.io`);
  console.log(`=========================================`);
  console.log(`Configured Microservice Downstream Targets:`);
  for (const [name, url] of Object.entries(servicesConfig.services)) {
    console.log(`  • /${name.padEnd(12)} -> ${url}`);
  }
  console.log(`=========================================`);
});

server.setMaxListeners(25)

// Graceful shutdown handling
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down API Gateway gracefully...");
  server.close(() => {
    console.log("API Gateway closed.");
    process.exit(0);
  });
});
