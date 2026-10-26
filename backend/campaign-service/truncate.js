import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment configurations from multiple levels
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function truncateDatabaseTables() {
  console.log("================================================================");
  console.log(" 🗑️  MarkOps Campaign & Digital Service Database Truncate");
  console.log("================================================================");

  const connectionString = process.env.DATABASE_URL || "mysql://root:nb123@localhost:3306/digital_db";
  let connection;

  try {
    let connectionOptions;
    let targetDatabase = "digital_db";

    try {
      const dbUrl = new URL(connectionString);
      targetDatabase = dbUrl.pathname.replace(/^\//, '') || "digital_db";
      connectionOptions = {
        host: dbUrl.hostname,
        port: dbUrl.port ? parseInt(dbUrl.port, 10) : 3306,
        user: dbUrl.username || "root",
        password: decodeURIComponent(dbUrl.password || ""),
        multipleStatements: true
      };
    } catch {
      connectionOptions = {
        host: "localhost",
        port: 3306,
        user: "root",
        password: "password",
        multipleStatements: true
      };
    }

    console.log(`🔌 Connecting to MySQL server at ${connectionOptions.host}:${connectionOptions.port}...`);
    connection = await mysql.createConnection(connectionOptions);
    console.log('✅ Connected to MySQL server successfully.');

    await connection.query(`USE \`${targetDatabase}\`;`);
    console.log(`📁 Selected database: '${targetDatabase}'.`);

    // 1. Temporarily disable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log("🔒 Temporarily disabled foreign key checks...");

    // 2. Safe truncate helper
    async function safeTruncate(tableName) {
      try {
        await connection.query(`TRUNCATE TABLE \`${tableName}\`;`);
        console.log(`✔ '${tableName}' table data cleared & AUTO_INCREMENT reset to 1!`);
      } catch (err) {
        if (err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`ℹ️  Table '${tableName}' does not exist, skipping.`);
        } else {
          throw err;
        }
      }
    }

    console.log("🧹 Truncating tables...");
    await safeTruncate('meta_sync_logs');
    await safeTruncate('meta_webhook_events');
    await safeTruncate('ads');
    await safeTruncate('leads');
    await safeTruncate('meta_connections');
    await safeTruncate('campaigns');

    // 3. Re-enable foreign key checks
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log("🔓 Re-enabled foreign key checks safely.");

    console.log("================================================================");
    console.log(" 🎉 Campaign & Digital tables truncated successfully!");
    console.log("================================================================");

  } catch (error) {
    console.error("❌ Truncate execution failure:", error.message || error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔒 MySQL database connection closed.");
    }
  }
}

truncateDatabaseTables();

