import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/lead-service/.env") });

import { app } from "./app.js";
import { initDatabase } from "./config/database.js";

const PORT = Number(process.env.PORT || 4004);

async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log("================================================================");
      console.log(" 📞 MarkOps Lead & Telecalling Microservice Online!");
      console.log(` 🚀 API Server:       http://localhost:${PORT}`);
      console.log(` 🏥 Health Check:     http://localhost:${PORT}/health`);
      console.log(` 📋 Call Logs API:    http://localhost:${PORT}/call-logs`);
      console.log(` 🎯 Targets API:      http://localhost:${PORT}/telecaller-targets`);
      console.log(` ⏰ Follow-ups API:   http://localhost:${PORT}/follow-ups`);
      console.log(` 📊 Analytics API:    http://localhost:${PORT}/telecalling/dashboard-metrics`);
      console.log("================================================================");
    });
  } catch (error) {
    console.error("[Lead Microservice Failure] Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

