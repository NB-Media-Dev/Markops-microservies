-- ==============================================================================
-- MarkOps Designer Microservice Database Schema
-- Database: markops_designer_db (Fully Optimized Edition)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `markops_designer_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `markops_designer_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Core Products Reference Table
DROP TABLE IF EXISTS `ourproducts`;
CREATE TABLE `ourproducts` (
  `id` VARCHAR(100) PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Product Packages Reference Table (One-to-Many Relationship with Products)
DROP TABLE IF EXISTS `product_packages`;
CREATE TABLE `product_packages` (
  `id` VARCHAR(100) PRIMARY KEY,
  `product_id` VARCHAR(100) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_packages_product` FOREIGN KEY (`product_id`) REFERENCES `ourproducts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tasks Table (Core Work Entities)
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `task_type` ENUM('BANNER', 'POSTER', 'VIDEO') NOT NULL DEFAULT 'BANNER',
  `package_id` VARCHAR(100) NULL,
  `product_id` VARCHAR(100) NULL,
  `product_name` VARCHAR(100) NULL,
  `description` TEXT NULL,
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
  `created_by` INT NOT NULL, 
  `assigned_to` INT NULL,   
  `due_date` DATE NULL,
  `progress_percent` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_tasks_product` FOREIGN KEY (`product_id`) REFERENCES `ourproducts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tasks_package` FOREIGN KEY (`package_id`) REFERENCES `product_packages` (`id`) ON DELETE SET NULL,
  
  INDEX `idx_tasks_status` (`status`),
  INDEX `idx_tasks_assignee` (`assigned_to`),
  INDEX `idx_tasks_creator` (`created_by`),
  INDEX `idx_tasks_due_date` (`due_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Unified Task Activities Table (COMBINED: Comments, Progress, Status History)
DROP TABLE IF EXISTS `task_activities`;
CREATE TABLE `task_activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `previous_status` ENUM(
    'DRAFT', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 
    'UNDER_REVIEW', 'REVISION_REQUIRED', 'REDESIGN_REQUIRED', 
    'RESUBMITTED', 'APPROVED', 'PUBLISHED', 'COMPLETED'
  ) NULL,
  `new_status` ENUM(
    'DRAFT', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED', 
    'UNDER_REVIEW', 'REVISION_REQUIRED', 'REDESIGN_REQUIRED', 
    'RESUBMITTED', 'APPROVED', 'PUBLISHED', 'COMPLETED'
  ) NOT NULL,
  `changed_by` INT NOT NULL,
  `comment` TEXT NULL,
  `duration_seconds` INT NULL DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT `fk_activity_tasks` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  INDEX `idx_activity_task_id` (`task_id`),
  INDEX `idx_activity_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Task Deliverables & Attachments (COMBINED: Initial Brief Attachments and Versions/Submissions)
DROP TABLE IF EXISTS `task_deliverables`;
CREATE TABLE `task_deliverables` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `asset_type` ENUM('BRIEF_ATTACHMENT', 'DESIGN_SUBMISSION') NOT NULL DEFAULT 'BRIEF_ATTACHMENT',
  `version_number` INT NOT NULL DEFAULT 1,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `storage_key` VARCHAR(255) NULL,
  `file_size` BIGINT NOT NULL DEFAULT 0,
  `mime_type` VARCHAR(100) DEFAULT 'image/png',
  `changelog` TEXT NULL, 
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_deliverables_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  INDEX `idx_deliverables_lookup` (`task_id`, `asset_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
