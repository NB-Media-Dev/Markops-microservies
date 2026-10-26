import "dotenv/config";
import { pool } from "./config/database.js";
import app from "./app.js";

const PORT = Number(process.env.AUTH_SERVICE_PORT || 4001);

async function startServer() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("MySQL connected successfully");
  } catch (error) {
    console.warn("⚠️ MySQL connection could not be established. Falling back to sample in-memory data store.");
  }

  app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

startServer();