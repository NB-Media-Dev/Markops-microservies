-- -- ==============================================================================
-- -- MarkOps Designer Microservice Database Schema
-- -- Database: markops_designer_db
-- -- ==============================================================================

-- CREATE DATABASE IF NOT EXISTS `markops_designer_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `markops_designer_db`;

-- SET FOREIGN_KEY_CHECKS = 0;

-- -- 1. Roles Table
-- DROP TABLE IF EXISTS `roles`;

-- -- 2. Teams Table


-- -- 4. Product Packages Reference Table
-- DROP TABLE IF EXISTS `product_packages`;
-- CREATE TABLE `product_packages` (
--   `id` VARCHAR(100) PRIMARY KEY,
--   `product_id` VARCHAR(100) NOT NULL,
--   `name` VARCHAR(150) NOT NULL,
--   `description` TEXT NULL,
--   `image_url` VARCHAR(500) NULL,
--   `price` DECIMAL(12, 2) DEFAULT 0.00,
--   `status` VARCHAR(50) DEFAULT 'ACTIVE',
--   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- 5. Tasks Table (Core Design Work Items)
-- DROP TABLE IF EXISTS `tasks`;
-- CREATE TABLE `tasks` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `campaign_id` INT NULL,
--   `title` VARCHAR(150) NOT NULL,
--   `task_type` VARCHAR(50) NOT NULL DEFAULT 'BANNER_DESIGN',
--   `package_name` VARCHAR(100) NULL,
--   `product_id` VARCHAR(100) NULL,
--   `product_name` VARCHAR(100) NULL,
--   `description` TEXT NULL,
--   `content` TEXT NULL,
--   `attachment_url` VARCHAR(500) NULL,
--   `attachment_name` VARCHAR(255) NULL,
--   `reviewer_feedback` TEXT NULL,
--   `status` ENUM(
--     'DRAFT',
--     'ASSIGNED',
--     'ACCEPTED',
--     'IN_PROGRESS',
--     'SUBMITTED',
--     'UNDER_REVIEW',
--     'REVISION_REQUIRED',
--     'REDESIGN_REQUIRED',
--     'RESUBMITTED',
--     'APPROVED',
--     'PUBLISHED',
--     'COMPLETED'
--   ) NOT NULL DEFAULT 'ASSIGNED',
--   `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
--   `created_by` INT NOT NULL,
--   `assigned_to` INT NULL,
--   `due_date` DATE NULL,
--   `progress_percent` INT NOT NULL DEFAULT 0,
--   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   CONSTRAINT `fk_tasks_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
--   CONSTRAINT `fk_tasks_assignee` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
--   INDEX `idx_tasks_status` (`status`),
--   INDEX `idx_tasks_assignee` (`assigned_to`),
--   INDEX `idx_tasks_creator` (`created_by`),
--   INDEX `idx_tasks_due_date` (`due_date`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- 6. Task Versions (Iterative Design Submissions)
-- DROP TABLE IF EXISTS `task_versions`;
-- CREATE TABLE `task_versions` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `task_id` INT NOT NULL,
--   `version_number` INT NOT NULL DEFAULT 1,
--   `submitted_by` INT NOT NULL,
--   `file_name` VARCHAR(255) NOT NULL,
--   `file_path` VARCHAR(500) NOT NULL,
--   `storage_key` VARCHAR(255) NULL,
--   `file_size` BIGINT NOT NULL DEFAULT 0,
--   `mime_type` VARCHAR(100) DEFAULT 'image/png',
--   `changelog` TEXT NULL,
--   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT `fk_versions_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
--   CONSTRAINT `fk_versions_user` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`),
--   INDEX `idx_versions_task` (`task_id`, `version_number`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- 7. Task Status History (State Machine Auditing)
-- DROP TABLE IF EXISTS `task_status_history`;
-- CREATE TABLE `task_status_history` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `task_id` INT NOT NULL,
--   `actor_id` INT NOT NULL,
--   `previous_status` VARCHAR(50) NULL,
--   `new_status` VARCHAR(50) NOT NULL,
--   `remark` TEXT NULL,
--   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT `fk_history_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
--   INDEX `idx_history_task` (`task_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- 8. Task Progress History
-- DROP TABLE IF EXISTS `task_progress_history`;
-- CREATE TABLE `task_progress_history` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `task_id` INT NOT NULL,
--   `actor_id` INT NOT NULL,
--   `progress_percent` INT NOT NULL DEFAULT 0,
--   `notes` TEXT NULL,
--   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT `fk_progress_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
--   INDEX `idx_progress_task` (`task_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- 9. Task Comments & Feedback
-- DROP TABLE IF EXISTS `task_comments`;
-- CREATE TABLE `task_comments` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `task_id` INT NOT NULL,
--   `user_id` INT NOT NULL,
--   `comment` TEXT NOT NULL,
--   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT `fk_comments_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
--   CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
--   INDEX `idx_comments_task` (`task_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- 10. Task Attachments (Briefs, Assets, References)
-- DROP TABLE IF EXISTS `task_attachments`;
-- CREATE TABLE `task_attachments` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `task_id` INT NOT NULL,
--   `file_name` VARCHAR(255) NOT NULL,
--   `file_path` VARCHAR(500) NOT NULL,
--   `file_size` BIGINT NOT NULL DEFAULT 0,
--   `uploaded_by` INT NOT NULL,
--   `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   CONSTRAINT `fk_attachments_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
--   INDEX `idx_attachments_task` (`task_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- MarkOps Designer Microservice Database Schema
-- Database: markops_designer_db (Isolated Microservice Context)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `markops_designer_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `markops_designer_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================================================
-- 1. PRODUCT PACKAGES REFERENCE TABLE
-- ==============================================================================
DROP TABLE IF EXISTS `product_packages`;
CREATE TABLE `product_packages` (
  `id` VARCHAR(100) PRIMARY KEY,
  `product_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `image_url` VARCHAR(500) NULL,
  `price` DECIMAL(12, 2) DEFAULT 0.00,
  `status` VARCHAR(50) DEFAULT 'ACTIVE',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 2. TASKS TABLE (Core Design Work Items - Free from External DB Dependencies)
-- ==============================================================================
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` INT NULL,
  `title` VARCHAR(150) NOT NULL,
  `task_type` VARCHAR(50) NOT NULL DEFAULT 'BANNER_DESIGN',
  `package_name` VARCHAR(100) NULL,
  `product_id` VARCHAR(100) NULL,
  `product_name` VARCHAR(100) NULL,
  `description` TEXT NULL,
  `content` TEXT NULL,
  `attachment_url` VARCHAR(500) NULL,
  `attachment_name` VARCHAR(255) NULL,
  `reviewer_feedback` TEXT NULL,
  `status` ENUM(
    'DRAFT',
    'ASSIGNED',
    'ACCEPTED',
    'IN_PROGRESS',
    'SUBMITTED',
    'UNDER_REVIEW',
    'REVISION_REQUIRED',
    'REDESIGN_REQUIRED',
    'RESUBMITTED',
    'APPROVED',
    'PUBLISHED',
    'COMPLETED'
  ) NOT NULL DEFAULT 'ASSIGNED',
  `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
  
  -- Microservices Integration Keys: Stores logical User IDs from the Auth service
  `created_by` VARCHAR(191) NOT NULL,   
  `assigned_to` VARCHAR(191) NULL,       
  
  `due_date` DATE NULL,
  `progress_percent` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes added for lightning-fast application lookup queries
  INDEX `idx_tasks_status` (`status`),
  INDEX `idx_tasks_assignee` (`assigned_to`),
  INDEX `idx_tasks_creator` (`created_by`),
  INDEX `idx_tasks_due_date` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 3. TASK VERSIONS (Iterative Design Submissions)
-- ==============================================================================
DROP TABLE IF EXISTS `task_versions`;
CREATE TABLE `task_versions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `version_number` INT NOT NULL DEFAULT 1,
  `submitted_by` VARCHAR(191) NOT NULL, -- User ID tracking link
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `storage_key` VARCHAR(255) NULL,
  `file_size` BIGINT NOT NULL DEFAULT 0,
  `mime_type` VARCHAR(100) DEFAULT 'image/png',
  `changelog` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_versions_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  INDEX `idx_versions_task` (`task_id`, `version_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 4. TASK STATUS HISTORY (State Machine Auditing)
-- ==============================================================================
DROP TABLE IF EXISTS `task_status_history`;
CREATE TABLE `task_status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `actor_id` VARCHAR(191) NOT NULL, -- User ID tracking link
  `previous_status` VARCHAR(50) NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `remark` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_history_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  INDEX `idx_history_task` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 5. TASK PROGRESS HISTORY
-- ==============================================================================
DROP TABLE IF EXISTS `task_progress_history`;
CREATE TABLE `task_progress_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `actor_id` VARCHAR(191) NOT NULL, -- User ID tracking link
  `progress_percent` INT NOT NULL DEFAULT 0,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_progress_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  INDEX `idx_progress_task` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 6. TASK COMMENTS & FEEDBACK
-- ==============================================================================
DROP TABLE IF EXISTS `task_comments`;
CREATE TABLE `task_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `user_id` VARCHAR(191) NOT NULL, -- User ID tracking link
  `comment` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_comments_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  INDEX `idx_comments_task` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- 7. TASK ATTACHMENTS (Briefs, Assets, References)
-- ==============================================================================
DROP TABLE IF EXISTS `task_attachments`;
CREATE TABLE `task_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` BIGINT NOT NULL DEFAULT 0,
  `uploaded_by` VARCHAR(191) NOT NULL, -- User ID tracking link
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_attachments_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  INDEX `idx_attachments_task` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- 8. OUR PRODUCT REFERENCE TABLE
-- ==============================================================================
DROP TABLE IF EXISTS `ourproduct`;
CREATE TABLE `ourproduct` (
  `id` VARCHAR(191) NOT NULL DEFAULT (UUID()) PRIMARY KEY, -- Automatically generates unique IDs inside MySQL
  `name` VARCHAR(150) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
