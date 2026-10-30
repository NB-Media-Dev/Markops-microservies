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
  console.log(" 📢 MarkOps Campaign & Digital Service Database Setup");
  console.log("================================================================");

  const connectionString = process.env.DATABASE_URL || "mysql://root:Ratheesh@17@localhost:3303/digital_db";
  let connection;

  try {
    let connectionOptions;
    let targetDatabase = "digital_db";

    try {
      const dbUrl = new URL(connectionString);
      targetDatabase = dbUrl.pathname.replace(/^\//, '') || "digital_db";
      connectionOptions = {
        host: dbUrl.hostname,
        port: dbUrl.port ? parseInt(dbUrl.port, 10) : 3303,
        user: dbUrl.username || "root",
        password: decodeURIComponent(dbUrl.password || ""),
        multipleStatements: true
      };
    } catch {
      connectionOptions = {
        host: "localhost",
        port: 3303,
        user: "root",
        password: "password",
        multipleStatements: true
      };
    }

    console.log(`🔌 Connecting to MySQL server at ${connectionOptions.host}:${connectionOptions.port}...`);
    connection = await mysql.createConnection(connectionOptions);
    console.log('✅ Connected to MySQL server successfully.');

    // 1. Ensure target database exists
    console.log(`📁 Ensuring database '${targetDatabase}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${targetDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${targetDatabase}\`;`);
    console.log(`✅ Using database: '${targetDatabase}'.`);

    // 2. Schema definition script
    const sqlScript = `
      SET FOREIGN_KEY_CHECKS = 0;

      -- 1. Campaigns Table
      CREATE TABLE IF NOT EXISTS \`campaigns\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`name\` VARCHAR(150) NOT NULL,
        \`objective\` VARCHAR(100) NOT NULL,
        \`product_id\` VARCHAR(100) DEFAULT NULL,
        \`package_id\` VARCHAR(100) DEFAULT NULL,
        \`status\` ENUM('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'PLANNING',
        \`start_date\` DATE NOT NULL,
        \`budget\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`spend\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`leads_count\` INT NOT NULL DEFAULT 0,
        \`paid_leads\` INT NOT NULL DEFAULT 0,
        \`conversions\` INT NOT NULL DEFAULT 0,
        \`auto_cpl\` DECIMAL(12,2) GENERATED ALWAYS AS (
          IF(\`leads_count\` > 0, \`spend\` / \`leads_count\`, 0.00)
        ) STORED,
        \`auto_conversion_pct\` DECIMAL(5,2) GENERATED ALWAYS AS (
          IF(\`leads_count\` > 0, (\`conversions\` / \`leads_count\`) * 100, 0.00)
        ) STORED,
        \`owner_id\` INT NOT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`idx_campaigns_status\` (\`status\`),
        KEY \`idx_campaigns_owner\` (\`owner_id\`),
        KEY \`idx_campaigns_product_pkg\` (\`product_id\`, \`package_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 2. Meta Ad Accounts Connections
      CREATE TABLE IF NOT EXISTS \`meta_connections\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`account_name\` VARCHAR(100) NOT NULL,
        \`ad_account_id\` VARCHAR(100) NOT NULL UNIQUE,
        \`business_id\` VARCHAR(100) DEFAULT NULL,
        \`access_token_encrypted\` TEXT NOT NULL,
        \`token_expires_at\` DATETIME DEFAULT NULL,
        \`status\` ENUM('CONNECTED', 'EXPIRED', 'ERROR', 'DISCONNECTED') NOT NULL DEFAULT 'CONNECTED',
        \`last_synced_at\` DATETIME DEFAULT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 3. Meta Sync Logs
      CREATE TABLE IF NOT EXISTS \`meta_sync_logs\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`meta_connection_id\` INT NOT NULL,
        \`sync_type\` ENUM('MANUAL', 'SCHEDULED', 'WEBHOOK') NOT NULL DEFAULT 'SCHEDULED',
        \`status\` ENUM('SUCCESS', 'FAILED', 'PARTIAL') NOT NULL,
        \`records_processed\` INT NOT NULL DEFAULT 0,
        \`started_at\` DATETIME NOT NULL,
        \`completed_at\` DATETIME DEFAULT NULL,
        \`error_details\` TEXT DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_sync_conn\` (\`meta_connection_id\`),
        CONSTRAINT \`fk_sync_conn\` FOREIGN KEY (\`meta_connection_id\`) REFERENCES \`meta_connections\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 4. Meta Webhook Events
      CREATE TABLE IF NOT EXISTS \`meta_webhook_events\` (
        \`meta_lead_id\` VARCHAR(100) NOT NULL,
        \`form_id\` VARCHAR(100) DEFAULT NULL,
        \`page_id\` VARCHAR(100) DEFAULT NULL,
        \`ad_id\` VARCHAR(100) DEFAULT NULL,
        \`campaign_id\` VARCHAR(100) DEFAULT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        \`attempts\` INT NOT NULL DEFAULT 0,
        \`last_error\` TEXT DEFAULT NULL,
        \`next_attempt_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`meta_lead_id\`),
        KEY \`idx_meta_webhook_status_next_attempt\` (\`status\`, \`next_attempt_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 5. Ads Table
      CREATE TABLE IF NOT EXISTS \`ads\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`campaign_id\` INT NOT NULL,
        \`product_id\` VARCHAR(100) DEFAULT NULL,
        \`package_id\` VARCHAR(100) DEFAULT NULL,
        \`meta_connection_id\` INT DEFAULT NULL,
        \`created_by\` INT DEFAULT NULL,
        \`task_type\` ENUM('BANNER_DESIGN', 'POST_DESIGN', 'VIDEO') NOT NULL DEFAULT 'BANNER_DESIGN',
        \`design_id\` INT DEFAULT NULL,
        \`platform_ad_id\` VARCHAR(100) DEFAULT NULL,
        \`platform_adset_id\` VARCHAR(100) DEFAULT NULL,
        \`platform_campaign_id\` VARCHAR(100) DEFAULT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`platform\` VARCHAR(50) DEFAULT 'Meta',
        \`spend\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`impressions\` INT NOT NULL DEFAULT 0,
        \`clicks\` INT NOT NULL DEFAULT 0,
        \`leads_count\` INT NOT NULL DEFAULT 0,
        \`status\` ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
        \`auto_cpl\` DECIMAL(12,2) GENERATED ALWAYS AS (
          IF(\`leads_count\` > 0, \`spend\` / \`leads_count\`, 0.00)
        ) STORED,
        \`auto_ctr\` DECIMAL(5,2) GENERATED ALWAYS AS (
          IF(\`impressions\` > 0, (\`clicks\` / \`impressions\`) * 100, 0.00)
        ) STORED,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
        PRIMARY KEY (\`id\`),
        KEY \`idx_ads_campaign\` (\`campaign_id\`),
        KEY \`idx_ads_product_pkg\` (\`product_id\`, \`package_id\`),
        KEY \`idx_ads_created_by\` (\`created_by\`),
        KEY \`idx_ads_meta\` (\`meta_connection_id\`),
        UNIQUE KEY \`uq_ads_platform_ad_id\` (\`platform_ad_id\`),
        KEY \`idx_ads_platform_campaign_id\` (\`platform_campaign_id\`),
        CONSTRAINT \`fk_ads_campaign\` FOREIGN KEY (\`campaign_id\`) REFERENCES \`campaigns\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_ads_meta\` FOREIGN KEY (\`meta_connection_id\`) REFERENCES \`meta_connections\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 6. Leads Table
      CREATE TABLE IF NOT EXISTS \`leads\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`first_name\` VARCHAR(50) NOT NULL,
        \`last_name\` VARCHAR(50) DEFAULT NULL,
        \`email\` VARCHAR(100) DEFAULT NULL,
        \`phone\` VARCHAR(20) NOT NULL,
        \`source\` ENUM(
          'META', 
          'GOOGLE', 
          'FACEBOOK', 
          'LINKINED', 
          'YOUTUBE',    
          'INSTAGRAM'
        ) NOT NULL DEFAULT 'META',
        \`campaign\` VARCHAR(150) DEFAULT NULL,
        \`ad\` VARCHAR(150) DEFAULT NULL,
        \`product_id\` VARCHAR(100) DEFAULT NULL,
        \`package_id\` VARCHAR(100) DEFAULT NULL,
        \`call_disposition\` VARCHAR(50) DEFAULT NULL,
        \`status\` ENUM('ASSIGNED', 'CALL_BUSY', 'NO_ANSWER', 'FOLLOW_UP', 'INTERESTED', 'NOT_INTERESTED', 'PAID') NOT NULL DEFAULT 'ASSIGNED',
        \`assignment_status\` ENUM('UNASSIGNED', 'ASSIGNED', 'REASSIGNED') NOT NULL DEFAULT 'UNASSIGNED',
        \`assigned_telecaller_id\` INT DEFAULT NULL,
        \`meta_lead_id\` VARCHAR(50) DEFAULT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_leads_phone\` (\`phone\`),
        KEY \`idx_leads_email\` (\`email\`),
        KEY \`idx_leads_status_assignment\` (\`status\`, \`assignment_status\`),
        KEY \`idx_leads_assigned_telecaller\` (\`assigned_telecaller_id\`),
        KEY \`idx_leads_campaign\` (\`campaign\`),
        KEY \`idx_leads_ad\` (\`ad\`),
        KEY \`idx_leads_product_pkg\` (\`product_id\`, \`package_id\`),
        UNIQUE KEY \`uq_leads_meta_lead_id\` (\`meta_lead_id\`),
        KEY \`idx_leads_call_disposition\` (\`call_disposition\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      SET FOREIGN_KEY_CHECKS = 1;
    `;

    console.log("🔨 Creating tables ('campaigns', 'meta_connections', 'meta_sync_logs', 'meta_webhook_events', 'ads', 'leads')...");
    await connection.query(sqlScript);
    console.log("✅ Tables verified and created successfully!");

    // 3. Insert Sample Campaign
    console.log("📥 Checking and inserting sample campaigns...");
    const [existingCampaigns] = await connection.query("SELECT COUNT(*) as count FROM campaigns;");
    if (existingCampaigns[0]?.count === 0) {
      const sampleCampaignsQuery = `
        INSERT INTO campaigns (id, name, objective, product_id, package_id, status, start_date, budget, spend, leads_count, paid_leads, conversions, owner_id)
        VALUES 
          (1, 'Digital Brand Awareness 2026', 'LEAD_GENERATION', 'prod-1', 'pkg-1', 'ACTIVE', '2026-01-15', 50000.00, 18500.00, 145, 18, 12, 1),
          (2, 'Summer Product Launch Ad Blitz', 'CONVERSIONS', 'prod-2', 'pkg-3', 'ACTIVE', '2026-03-01', 75000.00, 32000.00, 210, 35, 28, 1),
          (3, 'Meta Retargeting Campaign', 'RE_ENGAGEMENT', 'prod-1', 'pkg-2', 'PAUSED', '2026-02-10', 25000.00, 8900.00, 65, 9, 7, 2);
      `;
      await connection.query(sampleCampaignsQuery);
      console.log("✅ Sample campaigns inserted successfully!");
    } else {
      console.log(`ℹ️  campaigns table already contains ${existingCampaigns[0].count} records.`);
    }

    // 4. Insert Sample Ads
    const [existingAds] = await connection.query("SELECT COUNT(*) as count FROM ads;");
    if (existingAds[0]?.count === 0) {
      console.log("📥 Inserting sample ads...");
      const sampleAdsQuery = `
        INSERT INTO ads (id, campaign_id, product_id, package_id, name, platform, spend, impressions, clicks, leads_count, status, task_type)
        VALUES 
          (1, 1, 'prod-1', 'pkg-1', 'Banner Ad - Starter Package Promo', 'Meta', 6500.00, 45000, 1200, 48, 'ACTIVE', 'BANNER_DESIGN'),
          (2, 1, 'prod-1', 'pkg-1', 'Video Ad - Customer Success Story', 'Meta', 12000.00, 92000, 3100, 97, 'ACTIVE', 'VIDEO'),
          (3, 2, 'prod-2', 'pkg-3', 'Poster Ad - Flash Sale 25% Off', 'Meta', 15000.00, 80000, 2400, 110, 'ACTIVE', 'POST_DESIGN');
      `;
      await connection.query(sampleAdsQuery);
      console.log("✅ Sample ads inserted successfully!");
    } else {
      console.log(`ℹ️  ads table already contains ${existingAds[0].count} records.`);
    }

    // 5. Insert Sample Leads
    const [existingLeads] = await connection.query("SELECT COUNT(*) as count FROM leads;");
    if (existingLeads[0]?.count === 0) {
      console.log("📥 Inserting sample leads...");
      const sampleLeadsQuery = `
        INSERT INTO leads (first_name, last_name, email, phone, source, campaign, ad, product_id, package_id, call_disposition, status, assignment_status, assigned_telecaller_id)
        VALUES 
          ('Arun', 'Kumar', 'arun.k@gmail.com', '+919876543210', 'META', 'Digital Brand Awareness 2026', 'Banner Ad - Starter Package Promo', 'prod-1', 'pkg-1', 'INTERESTED', 'INTERESTED', 'ASSIGNED', 1),
          ('Priya Ananth', 'Sharma', 'priya.s@yahoo.com', '+919988776655', 'INSTAGRAM', 'Summer Product Launch Ad Blitz', 'Poster Ad - Flash Sale 25% Off', 'prod-2', 'pkg-3', 'CALLBACK_REQUESTED', 'FOLLOW_UP', 'ASSIGNED', 2),
          ('Rahul', 'Verma', 'rahul.v@outlook.com', '+919911223344', 'FACEBOOK', 'Digital Brand Awareness 2026', 'Video Ad - Customer Success Story', 'prod-1', 'pkg-1', 'NONE', 'ASSIGNED', 'ASSIGNED', 1);
      `;
      await connection.query(sampleLeadsQuery);
      console.log("✅ Sample leads inserted successfully!");
    } else {
      console.log(`ℹ️  leads table already contains ${existingLeads[0].count} records.`);
    }

    console.log("================================================================");
    console.log(" 🎉 Campaign & Digital database initialization completed!");
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
