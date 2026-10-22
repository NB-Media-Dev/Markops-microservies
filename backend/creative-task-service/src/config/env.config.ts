import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve .env from multiple levels
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/creative-task-service/.env") });

export const config = {
  port: parseInt(
    process.env.CREATIVE_TASK_SERVICE_PORT || process.env.PORT || process.env.DESIGNER_SERVICE_PORT || "4003",
    10
  ),
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "markops_designer_jwt_secret_token_2026",
  jwtExpiration: process.env.JWT_EXPIRATION || "7d",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:4202",
  databaseUrl: process.env.DATABASE_URL || "mysql://root:nb123@localhost:3306/markops_designer_db",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: parseInt(process.env.DB_PORT || "3306", 10),
  dbUser: process.env.DB_USER || "root",
  dbPassword: process.env.DB_PASSWORD || "nb123",
  dbName: process.env.DB_NAME || "markops_designer_db",
  uploadDir: path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads")),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || "50", 10)
};

export default config;

