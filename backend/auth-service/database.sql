
CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;


CREATE TABLE IF NOT EXISTS Permission (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    description VARCHAR(191) NOT NULL,
    resource VARCHAR(191) NOT NULL,
    action VARCHAR(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hierarchical System Role Structural Table (Handles Arrays as JSON)
CREATE TABLE IF NOT EXISTS Role (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
    name VARCHAR(191) NOT NULL UNIQUE,
    description VARCHAR(191) NOT NULL,
    permissions JSON NOT NULL, 
    createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Account Credentials and Profiling Table
CREATE TABLE IF NOT EXISTS User (
    id VARCHAR(191) NOT NULL PRIMARY KEY,
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



INSERT INTO Permission (id, name, description, resource, action) 
VALUES 
('perm-1', 'users:read', 'View system users', 'users', 'read'),
('perm-2', 'users:write', 'Manage system users', 'users', 'write'),
('perm-3', 'roles:read', 'View roles and permissions', 'roles', 'read'),
('perm-4', 'roles:write', 'Modify roles and permissions', 'roles', 'write'),
('perm-5', 'campaigns:read', 'View marketing campaigns', 'campaigns', 'read'),
('perm-6', 'campaigns:write', 'Create and edit campaigns', 'campaigns', 'write'),
('perm-5', 'ads:read', 'View ads', 'campaigns', 'read'),
('perm-6', 'ads:write', 'Create and edit ads', 'campaigns', 'write'),
('perm-7', 'tasks:read', 'View creative tasks', 'tasks', 'read'),
('perm-8', 'tasks:write', 'Create and update tasks', 'tasks', 'write'),
('perm-9', 'leads:read', 'View lead records', 'leads', 'read'),
('perm-10', 'leads:write', 'Update lead status and follow-ups', 'leads', 'write'),
('perm-13', 'reports:read', 'Access analytics dashboards', 'reports', 'read'),
('perm-15', 'audit:read', 'View system operational tracks logs', 'audit', 'read'),
('perm-16', 'integrations:write', 'Manage external sync tools profiles', 'integrations', 'write')
ON DUPLICATE KEY UPDATE name=name;


INSERT INTO Role (id, name, description, permissions) 
VALUES 
(
  'admin', 
  'ADMINISTRATOR', 
  'Full system access, users, roles, settings, audit and integrations', 
  '["users:read", "users:write", "roles:read", "roles:write", "campaigns:read", "campaigns:write","ads:read", "ads:write" ,"tasks:read", "tasks:write", "leads:read", "leads:write", "reports:read", "audit:read", "integrations:write"]'
),
(
  'digital-marketing', 
  'DIGITAL MARKETING', 
  'Campaigns, ads, Meta sync, ad metrics and lead source', 
  '["campaigns:read", "campaigns:write","ads:read", "ads:write" , "leads:read", "integrations:write"]'
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
  'Assigned leads, calls, follow-ups, qualification and outcomes', 
  '["leads:read", "leads:write",]'
),
(
  'bdm', 
  'BDM', 
  'Business Development Manager managing leads, conversions, reports and creating designer tasks only', 
  '["reports:read", "tasks:write"]'
)
ON DUPLICATE KEY UPDATE name=name;


INSERT INTO User (id, name, email, password, roleId, isActive)
VALUES
('usr-1', 'Anand Kumar', 'anand@company.com', '$2b$10$xyzHashedPasswordSample1', 'role-admin', TRUE),
('usr-2', 'Priya Sharma', 'priya@company.com', '$2b$10$xyzHashedPasswordSample2', 'role-marketing', TRUE),
('usr-3', 'John Doe', 'john.d@company.com', '$2b$10$xyzHashedPasswordSample3', 'role-designer', TRUE)
ON DUPLICATE KEY UPDATE email=email;
