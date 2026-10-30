import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from creative-task-service directory or project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const config = {
  port: parseInt(
    process.env.CREATIVE_TASK_SERVICE_PORT || process.env.PORT || "4003",
    10
  ),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:4202",
<<<<<<< HEAD
  databaseUrl: process.env.DATABASE_URL || "mysql://root:Ratheesh@17@localhost:3303/markops_designer_db",
=======
  databaseUrl: process.env.DATABASE_URL || "mysql://root:Ratheesh@17@localhost:3303/markops_designer_db",
>>>>>>> f1f6db5be22570188d950de5fa2d49d227647a47
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: parseInt(process.env.DB_PORT || "3303", 10),
  dbUser: process.env.DB_USER || "root",
<<<<<<< HEAD
  dbPassword: process.env.DB_PASSWORD || "Ratheesh@17",
=======
  dbPassword: process.env.DB_PASSWORD || "Ratheesh@17",
>>>>>>> f1f6db5be22570188d950de5fa2d49d227647a47
  dbName: process.env.DB_NAME || "markops_designer_db",
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads")),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "50", 10),
  realtimeServiceUrl: process.env.REALTIME_SERVICE_URL || "http://localhost:4006"
};

export default config;
