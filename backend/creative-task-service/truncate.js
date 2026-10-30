import mysql from 'mysql2/promise';
import 'dotenv/config';

async function truncateDatabase() {
<<<<<<< HEAD
  const connectionString = process.env.DATABASE_URL || "mysql://Ratheesh@17@localhost:3303/designer_db";
=======
  const connectionString = process.env.DATABASE_URL || "mysql://Ratheesh@17@localhost:3303/designer_db";
>>>>>>> f1f6db5be22570188d950de5fa2d49d227647a47
  let connection;

  try {
    const dbUrl = new URL(connectionString);
    const connectionOptions = {
      host: dbUrl.hostname,
      port: dbUrl.port ? parseInt(dbUrl.port, 10) : 3303,
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
