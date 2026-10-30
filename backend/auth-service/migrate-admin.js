import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

async function run() {
<<<<<<< HEAD
  const conn = await mysql.createConnection(process.env.DATABASE_URL || 'mysql://root:Ratheesh@17@localhost:3303/auth_db');
=======
  const conn = await mysql.createConnection(process.env.DATABASE_URL || 'mysql://root:Ratheesh@17@localhost:3303/auth_db');
>>>>>>> f1f6db5be22570188d950de5fa2d49d227647a47
  console.log('Connected to auth_db');

  const [cols] = await conn.query('SHOW COLUMNS FROM User LIKE ?', ['department']);
  if (!cols || cols.length === 0) {
    await conn.query("ALTER TABLE User ADD COLUMN department VARCHAR(191) DEFAULT 'General Operations' AFTER roleId;");
    console.log('✅ Added department column to User');
  } else {
    console.log('ℹ️  department column already exists');
  }

  // Insert marketing-manager role
  await conn.query(
    'INSERT INTO Role (id, name, description, permissions) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)',
    [
      'marketing-manager',
      'MARKETING MANAGER',
      'Campaign oversight and operational target setting',
      JSON.stringify(['campaigns:read', 'campaigns:write', 'ads:read', 'leads:read', 'reports:read'])
    ]
  );
  console.log('✅ Upserted marketing-manager role');

  const [users] = await conn.query('SELECT COUNT(*) as c FROM User');
  console.log(`Current users in DB: ${users[0].c}`);

  await conn.end();
}

run().catch(console.error);

