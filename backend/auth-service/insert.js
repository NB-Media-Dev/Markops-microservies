import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

async function runDatabaseInsertions() {
  console.log("Connecting to the MySQL Workbench instance...");

  const connectionString = process.env.DATABASE_URL || "mysql://root:tiger@localhost:3306/auth_db";
  
  let connection;
  try {
    connection = await mysql.createConnection(connectionString);
    console.log("Successfully connected to MySQL database!");

    console.log("Creating tables if they do not exist...");

    // Permission Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Permission (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          name VARCHAR(191) NOT NULL UNIQUE,
          description VARCHAR(191) NOT NULL,
          resource VARCHAR(191) NOT NULL,
          action VARCHAR(191) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Role Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS Role (
          id VARCHAR(191) NOT NULL PRIMARY KEY,
          name VARCHAR(191) NOT NULL UNIQUE,
          description VARCHAR(191) NOT NULL,
          permissions JSON NOT NULL, 
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // User Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS User (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(191) NOT NULL,
          email VARCHAR(191) NOT NULL UNIQUE,
          password VARCHAR(191) NOT NULL,
          roleId VARCHAR(191) NOT NULL,   
          avatar_image VARCHAR(255) NULL, 
          isActive BOOLEAN NOT NULL DEFAULT TRUE,
          createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          FOREIGN KEY (roleId) REFERENCES Role(id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log("✔ Tables checked/created successfully!");

    console.log("Inserting Permissions records...");
    const permissionQuery = `
      INSERT INTO Permission (id, name, description, resource, action) 
      VALUES 
      ('perm-1', 'users:read', 'View system users', 'users', 'read'),
      ('perm-2', 'users:write', 'Manage system users', 'users', 'write'),
      ('perm-3', 'roles:read', 'View roles and permissions', 'roles', 'read'),
      ('perm-4', 'roles:write', 'Modify roles and permissions', 'roles', 'write'),
      ('perm-5', 'campaigns:read', 'View marketing campaigns', 'campaigns', 'read'),
      ('perm-6', 'campaigns:write', 'Create and edit campaigns', 'campaigns', 'write'),
      ('perm-7', 'ads:read', 'View marketing ads', 'ads', 'read'),
      ('perm-8', 'ads:write', 'Modify marketing ads templates', 'ads', 'write'),
      ('perm-9', 'tasks:read', 'View creative tasks', 'tasks', 'read'),
      ('perm-10', 'tasks:write', 'Create and update tasks', 'tasks', 'write'),
      ('perm-11', 'leads:read', 'View lead records', 'leads', 'read'),
      ('perm-12', 'leads:write', 'Update lead status and follow-ups', 'leads', 'write'),
      ('perm-13', 'reports:read', 'Access analytics dashboards', 'reports', 'read'),
      ('perm-14', 'audit:read', 'View system operational tracks logs', 'audit', 'read'),
      ('perm-15', 'integrations:write', 'Manage external sync tools profiles', 'integrations', 'write')
      ON DUPLICATE KEY UPDATE name=VALUES(name);
    `;
    await connection.execute(permissionQuery);
    console.log("✔ Permissions table rows fully inserted successfully!");

    console.log("Inserting System Roles data...");
    const roleQuery = `
      INSERT INTO Role (id, name, description, permissions) 
      VALUES 
      (
        'admin', 
        'ADMINISTRATOR', 
        'Full system access, users, roles, settings, audit and integrations', 
        '["users:read", "users:write", "roles:read", "roles:write", "campaigns:read", "campaigns:write", "ads:read", "ads:write", "tasks:read", "tasks:write", "leads:read", "leads:write", "reports:read","audit:read", "integrations:write"]'
      ),
      (
        'digital-marketing', 
        'DIGITAL MARKETING', 
        'Campaigns, ads, Meta sync, ad metrics and lead source', 
        '["campaigns:read", "campaigns:write", "ads:read", "ads:write", "leads:read","leads:write", "integrations:write"]'
      ),
      (
        'designer', 
        'DESIGNER', 
        'Own tasks, submissions, revisions, comments, files and achievements', 
        '["tasks:read", "tasks:write"]'
      ),
      (
        'telecaller', 
        'TELECALLER', 
        'Assigned leads, calls, follow-ups, paid and outcomes', 
        '["leads:read", "leads:write"]' 
      ),
      (
        'bdm', 
        'BDM', 
        'Business Development Manager managing creating designer tasks only', 
        '["reports:read", "tasks:write"]'
      )
      ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), permissions=VALUES(permissions);
    `;
    await connection.execute(roleQuery);
    console.log("✔ Roles table rows updated successfully!");

    console.log("Inserting valid default users with hashed passwords...");
    const adminPassHash = await bcrypt.hash('admin123', 10);
    const pass123Hash = await bcrypt.hash('Password@123', 10);

    const users = [
      { name: 'Admin', email: 'admin@markops.io', pass: adminPassHash, role: 'admin' },
      { name: 'vishwa', email: 'vishwa@markops.io', pass: pass123Hash, role: 'designer' },
      { name: 'sakthi', email: 'sakthi@markops.io', pass: adminPassHash, role: 'digital-marketing' },
      { name: 'Rajesh', email: 'rajesh@markops.io', pass: adminPassHash, role: 'telecaller' },
      { name: 'Karthik', email: 'karthick@markops.io', pass: adminPassHash, role: 'bdm' },
    ];

    for (const u of users) {
      await connection.execute(`
        INSERT INTO User (name, email, password, roleId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, TRUE, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), roleId=VALUES(roleId), isActive=TRUE, updatedAt=NOW(3);
      `, [u.name, u.email.toLowerCase(), u.pass, u.role]);
    }

    console.log("✔ Default users generated with bcrypt hashed credentials!");

  } catch (error) {
    console.error("❌ Database script running execution failure error:", error);
  } finally {
    if (connection) {
      await connection.end(); 
      console.log("Database connection closed.");
    }
  }
}

runDatabaseInsertions();
