import path from "node:path";
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || process.env.REALTIME_SERVICE_PORT || "4006", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:4202"
};

export default config;

