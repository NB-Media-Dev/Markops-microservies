import mysql from 'mysql2/promise';
import 'dotenv/config';

async function truncateDatabaseTables() {
  console.log("Connecting to the MySQL Workbench instance to clear data...");

  const connectionString = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/auth_db";
  
  let connection;
  try {
    connection = await mysql.createConnection(connectionString);
    console.log("Successfully connected to MySQL database!");

    // 1. Foreign Key checks-ஐ தற்காலிகமாக OFF செய்கிறோம் (இல்லையென்றால் டிலீட் ஆகாது)
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0;');
    console.log("Temporarily disabled foreign key checks...");

    // 2. Tables-ல் உள்ள தரவுகளை மட்டும் காலி செய்கிறோம்
    console.log("Truncating tables...");
    
    await connection.execute('TRUNCATE TABLE User;');
    console.log("✔ User table data cleared!");

    await connection.execute('TRUNCATE TABLE Role;');
    console.log("✔ Role table data cleared!");

    await connection.execute('TRUNCATE TABLE Permission;');
    console.log("✔ Permission table data cleared!");

    // 3. Foreign Key checks-ஐ மீண்டும் ON செய்கிறோம்
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1;');
    console.log("Re-enabled foreign key checks safely.");

    console.log("🎉 All tables truncated successfully! Structure is empty and ready.");

  } catch (error) {
    console.error("❌ Truncate execution failure error:", error);
  } finally {
    if (connection) {
      await connection.end(); 
      console.log("Database connection closed.");
    }
  }
}

truncateDatabaseTables();
