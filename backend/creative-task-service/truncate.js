import mysql from 'mysql2/promise';
import 'dotenv/config';

async function truncateDatabase() {
  const connectionString = process.env.DATABASE_URL || "mysql://root:Ratheesh@17@localhost:3306/designer_db";
  let connection;

  try {
    const dbUrl = new URL(connectionString);
    const connectionOptions = {
      host: dbUrl.hostname,
      port: dbUrl.port ? parseInt(dbUrl.port, 10) : 3306,
      user: dbUrl.username,
      password: decodeURIComponent(dbUrl.password),
      multipleStatements: true
    };

    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection(connectionOptions);
    console.log('Connected successfully.');

    const truncateScript = `
      USE \`designer_db\`;
      SET FOREIGN_KEY_CHECKS = 0;
      TRUNCATE TABLE \`task_deliverables\`;
      TRUNCATE TABLE \`task_activities\`;
      TRUNCATE TABLE \`tasks\`;
      TRUNCATE TABLE \`product_packages\`;
      TRUNCATE TABLE \`ourproducts\`;
      SET FOREIGN_KEY_CHECKS = 1;
    `;

    console.log('Executing truncate queries...');
    await connection.query(truncateScript);
    console.log('✅ Success! All table data wiped clean and Auto-Increments reset to 1.');

  } catch (error) {
    console.error('❌ Error executing database truncate:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

truncateDatabase();
