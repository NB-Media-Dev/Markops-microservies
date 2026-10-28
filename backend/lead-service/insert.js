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

async function initializeDatabase() {
  console.log("================================================================");
  console.log(" 📞 MarkOps Lead & Telecalling Service Database Setup");
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

    // 1. Ensure target database exists
    const campaignDb = process.env.CAMPAIGN_DB || "digital_db";
    console.log(`📁 Ensuring database '${targetDatabase}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${targetDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${targetDatabase}\`;`);
    console.log(`✅ Using database: '${targetDatabase}' (fetching leads from '${campaignDb}').`);

    // 2. Schema definition script (call_logs referencing campaign's leads table, telecaller_targets)
    const sqlScript = `
      SET FOREIGN_KEY_CHECKS = 0;

      -- 1. Call Logs Table (History of telecalling attempts & follow-up scheduling)
      CREATE TABLE IF NOT EXISTS \`call_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`lead_id\` INT NOT NULL COMMENT 'References the lead being called from campaign database',
        \`telecaller_id\` INT NOT NULL COMMENT 'The agent who made or logged the call',
        \`call_outcome\` VARCHAR(50) NOT NULL COMMENT 'Corresponds to Connected, Busy, No Answer, Interested, etc.',
        \`duration_seconds\` INT NOT NULL DEFAULT 0 COMMENT 'Duration in seconds',
        \`call_remarks\` TEXT DEFAULT NULL COMMENT 'Remarks or summary of the conversation',
        \`follow_up_required\` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 if follow-up reminder is set',
        \`follow_up_time\` DATETIME DEFAULT NULL COMMENT 'Scheduled follow-up date and time',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX \`idx_call_logs_lead\` (\`lead_id\`),
        INDEX \`idx_call_logs_telecaller\` (\`telecaller_id\`),
        INDEX \`idx_call_logs_outcome\` (\`call_outcome\`),
        INDEX \`idx_call_logs_created\` (\`created_at\`),
        INDEX \`idx_call_logs_followup\` (\`follow_up_time\`, \`follow_up_required\`),

        CONSTRAINT \`fk_call_logs_leads\` 
          FOREIGN KEY (\`lead_id\`) 
          REFERENCES \`${campaignDb}\`.\`leads\` (\`id\`) 
          ON DELETE CASCADE 
          ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 3. Telecaller Targets Table (Daily caller goals and KPIs)
      CREATE TABLE IF NOT EXISTS \`telecaller_targets\` (
        \`telecaller_id\` VARCHAR(64) NOT NULL PRIMARY KEY COMMENT 'Primary key identifying the agent',
        \`telecaller_name\` VARCHAR(100) NOT NULL,
        \`telecaller_email\` VARCHAR(191) NOT NULL,
        \`daily_calls_target\` INT NOT NULL DEFAULT 30 COMMENT 'Target calls per day',
        \`daily_interested_target\` INT NOT NULL DEFAULT 5 COMMENT 'Target interested leads per day',
        \`daily_duration_target_seconds\` INT NOT NULL DEFAULT 3600 COMMENT 'Target speaker talk-time in seconds',
        \`updated_by\` VARCHAR(255) NOT NULL COMMENT 'User or Admin who made the update',
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX \`idx_targets_telecaller\` (\`telecaller_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      SET FOREIGN_KEY_CHECKS = 1;
    `;

    console.log("🔨 Creating tables ('call_logs', 'telecaller_targets')...");
    await connection.query(sqlScript);
    console.log("✅ Tables verified and created successfully!");

    // 3. Insert Default Telecaller Targets
    console.log("📥 Inserting default telecaller targets...");
    const targetsInsertQuery = `
      INSERT INTO telecaller_targets 
        (telecaller_id, telecaller_name, telecaller_email, daily_calls_target, daily_interested_target, daily_duration_target_seconds, updated_by)
      VALUES 
        ('1', 'Suresh Kumar', 'suresh.k@markops.in', 40, 8, 3600, 'System Seed'),
        ('2', 'Priya Mohan', 'priya.m@markops.in', 50, 10, 4500, 'System Seed'),
        ('3', 'Anitha Raj', 'anitha.r@markops.in', 30, 5, 3600, 'System Seed'),
        ('telecaller_01', 'Arun Telecaller', 'arun.t@markops.in', 35, 6, 3600, 'System Seed')
      ON DUPLICATE KEY UPDATE 
        telecaller_name = VALUES(telecaller_name),
        telecaller_email = VALUES(telecaller_email),
        daily_calls_target = VALUES(daily_calls_target),
        daily_interested_target = VALUES(daily_interested_target),
        daily_duration_target_seconds = VALUES(daily_duration_target_seconds);
    `;
    await connection.query(targetsInsertQuery);
    console.log("✅ Default telecaller targets inserted successfully!");

    // 4. Insert Sample Call Logs if table is empty
    const [existingLogs] = await connection.query("SELECT COUNT(*) as count FROM call_logs;");
    const count = existingLogs[0]?.count || 0;

    if (count === 0) {
      // Find valid lead ID to reference from campaign database
      const [leads] = await connection.query(`SELECT id FROM \`${campaignDb}\`.\`leads\` ORDER BY id ASC LIMIT 2;`);
      if (leads.length > 0) {
        console.log("📥 Inserting sample call logs...");
        const firstLeadId = leads[0].id;
        const secondLeadId = leads[1]?.id || firstLeadId;

        const callLogsInsertQuery = `
          INSERT INTO call_logs 
            (lead_id, telecaller_id, call_outcome, duration_seconds, call_remarks, follow_up_required, follow_up_time, created_at)
          VALUES 
            (?, 1, 'INTERESTED', 185, 'Client requested product demonstration tomorrow at 11:00 AM.', 1, DATE_ADD(NOW(), INTERVAL 1 DAY), NOW()),
            (?, 2, 'BUSY', 0, 'Customer was busy in a meeting, requested callback after 5:00 PM.', 1, DATE_ADD(NOW(), INTERVAL 5 HOUR), NOW());
        `;
        await connection.query(callLogsInsertQuery, [firstLeadId, secondLeadId]);
        console.log("✅ Sample call logs inserted successfully!");
      }
    } else {
      console.log(`ℹ️  call_logs table already contains ${count} records. Skipping sample call logs insertion.`);
    }

    console.log("================================================================");
    console.log(" 🎉 Lead & Telecalling database initialization completed!");
    console.log("================================================================");

  } catch (error) {
    console.error("❌ Database initialization error:", error.message || error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔒 MySQL connection closed.");
    }
  }
}

initializeDatabase();

