import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check multiple potential locations for .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/auth-service/.env") });

const databaseUrl = process.env.DATABASE_URL || "mysql://root:Ratheesh@17@localhost:3306/auth_db";

const dbUrl = new URL(databaseUrl);

export const pool = mysql.createPool({
  host: dbUrl.hostname,
  port: Number(dbUrl.port || 3306),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.slice(1),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT DATABASE() AS db");
    console.log("Connected database:", rows);
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error);
  }
}