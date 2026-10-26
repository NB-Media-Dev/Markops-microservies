import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

async function initializeDatabase() {
  console.log("Connecting to the MySQL instance from environment...");
  const connectionString = process.env.DATABASE_URL || "mysql://root:nb123@localhost:3306/designer_db";
  
  let connection;
  try {
    // 1. URL-ஐப் பகுப்பாய்வு செய்து database பெயர் இல்லாமல் connect செய்கிறோம்
    const dbUrl = new URL(connectionString);
    
    const connectionOptions = {
      host: dbUrl.hostname,
      port: dbUrl.port ? parseInt(dbUrl.port) : 3306,
      user: dbUrl.username,
      password: decodeURIComponent(dbUrl.password),
      multipleStatements: true 
    };

    console.log(`Connecting to MySQL server at ${connectionOptions.host}...`);
    connection = await mysql.createConnection(connectionOptions);
    console.log('Connected to MySQL server successfully.');

    // 2. Schema definition script (இங்கு DATABASE உருவாகி, USE செய்யப்படும்)
    const sqlScript = `

      
      USE \`designer_db\`;
      
      SET FOREIGN_KEY_CHECKS = 0;

      -- 1. Core Products Reference Table
      DROP TABLE IF EXISTS \`ourproducts\`;
      CREATE TABLE \`ourproducts\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`name\` VARCHAR(150) NOT NULL UNIQUE,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 2. Product Packages Reference Table
      DROP TABLE IF EXISTS \`product_packages\`;
      CREATE TABLE \`product_packages\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`product_id\` VARCHAR(100) NOT NULL,
        \`name\` VARCHAR(150) NOT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_packages_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`ourproducts\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 3. Tasks Table
      DROP TABLE IF EXISTS \`tasks\`;
      CREATE TABLE \`tasks\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`title\` VARCHAR(150) NOT NULL,
        \`task_type\` ENUM('BANNER', 'POSTER', 'VIDEO') NOT NULL DEFAULT 'BANNER',
        \`package_id\` VARCHAR(100) NULL,
        \`product_id\` VARCHAR(100) NULL,
        \`product_name\` VARCHAR(100) NULL,
        \`description\` TEXT NULL,
        \`attachment_url\` VARCHAR(500) NULL,
        \`attachment_name\` VARCHAR(255) NULL,
        \`reviewer_feedback\` TEXT NULL,
        \`status\` ENUM(
          'DRAFT', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 
          'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 
          'REDESIGN_REQUIRED', 'RESUBMITTED', 'APPROVED', 
          'PUBLISHED', 'COMPLETED'
        ) NOT NULL DEFAULT 'ASSIGNED',
        \`priority\` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
        \`created_by\` INT NOT NULL,
        \`assigned_to\` INT NULL,
        \`due_date\` DATE NULL,
        \`progress_percent\` INT NOT NULL DEFAULT 0,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_tasks_product\` FOREIGN KEY (\`product_id\`) REFERENCES \`ourproducts\` (\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_tasks_package\` FOREIGN KEY (\`package_id\`) REFERENCES \`product_packages\` (\`id\`) ON DELETE SET NULL,
        INDEX \`idx_tasks_status\` (\`status\`),
        INDEX \`idx_tasks_assignee\` (\`assigned_to\`),
        INDEX \`idx_tasks_creator\` (\`created_by\`),
        INDEX \`idx_tasks_due_date\` (\`due_date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 4. Unified Task Activities Table
      DROP TABLE IF EXISTS \`task_activities\`;
      CREATE TABLE \`task_activities\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`task_id\` INT NOT NULL,
        \`previous_status\` ENUM(
          'DRAFT', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 
          'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 
          'REDESIGN_REQUIRED', 'RESUBMITTED', 'APPROVED', 
          'PUBLISHED', 'COMPLETED'
        ) NULL,
        \`new_status\` ENUM(
          'DRAFT', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 
          'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 
          'REDESIGN_REQUIRED', 'RESUBMITTED', 'APPROVED', 
          'PUBLISHED', 'COMPLETED'
        ) NOT NULL,
        \`changed_by\` INT NOT NULL,
        \`comment\` TEXT NULL,
        \`duration_seconds\` INT NULL DEFAULT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_activity_tasks\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE,
        INDEX \`idx_activity_task_id\` (\`task_id\`),
        INDEX \`idx_activity_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 5. Task Deliverables Table
      DROP TABLE IF EXISTS \`task_deliverables\`;
      CREATE TABLE \`task_deliverables\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`task_id\` INT NOT NULL,
        \`user_id\` INT NOT NULL,
        \`asset_type\` ENUM('BRIEF_ATTACHMENT', 'DESIGN_SUBMISSION') NOT NULL DEFAULT 'BRIEF_ATTACHMENT',
        \`version_number\` INT NOT NULL DEFAULT 1,
        \`file_name\` VARCHAR(255) NOT NULL,
        \`file_path\` VARCHAR(500) NOT NULL,
        \`storage_key\` VARCHAR(255) NULL,
        \`file_size\` BIGINT NOT NULL DEFAULT 0,
        \`mime_type\` VARCHAR(100) DEFAULT 'image/png',
        \`changelog\` TEXT NULL,
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_deliverables_task\` FOREIGN KEY (\`task_id\`) REFERENCES \`tasks\` (\`id\`) ON DELETE CASCADE,
        INDEX \`idx_deliverables_lookup\` (\`task_id\`, \`asset_type\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      SET FOREIGN_KEY_CHECKS = 1;
    `;

    console.log('Executing database schema script...');
    await connection.query(sqlScript);
    console.log('✅ Database and structures built successfully.');

    // 3. 🛠️ INSERT THE THREE CORE PRODUCT ROWS
    console.log('Inserting product reference rows...');
    
    const insertProductsQuery = `
      INSERT IGNORE INTO \`designer_db\`.\`ourproducts\` (\`id\`, \`name\`) 
      VALUES (?, ?), (?, ?), (?, ?)
    `;

    const productValues = [
      'prod_carrement', 'carrement',
      'prod_classmate', 'classmate',
      'prod_jesus_messenger', 'the jesus messager'
    ];

    await connection.query(insertProductsQuery, productValues);
    console.log('✅ Rows successfully added: "carrement", "classmate", and "the jesus messager"!');

  } catch (error) {
    console.error('❌ Error executing initialization/seeding:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

initializeDatabase();
