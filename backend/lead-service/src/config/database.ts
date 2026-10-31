import mysql from "mysql2/promise";
import type { Pool, PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/lead-service/.env") });

const databaseUrl = process.env.DATABASE_URL || "";
const dbUrl = new URL(databaseUrl);

export const CAMPAIGN_DB = process.env.CAMPAIGN_DB || "digital_db";
export const LEADS_TABLE = `\`${CAMPAIGN_DB}\`.\`leads\``;

export const pool: Pool = mysql.createPool({
  host: dbUrl.hostname,
  port: Number(dbUrl.port || 3303),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.slice(1),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export interface DbPoolWrapper {
  isConnected: () => boolean;
  query: Pool["query"];
  getConnection: () => Promise<PoolConnection>;
}

export const dbPool: DbPoolWrapper = {
  isConnected: () => true,
  query: pool.query.bind(pool),
  getConnection: () => pool.getConnection()
};

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT DATABASE() AS db");
    console.log("[Lead Service DB] Connected database:", rows);
    connection.release();
  } catch (error) {
    console.error("[Lead Microservice DB] Database connection failed:", error);
  }
}

export const initDatabase = testConnection;
