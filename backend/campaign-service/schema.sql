-- ==============================================================================
-- MarkOps Digital / Campaign Service Database Schema
-- Database: digital_db
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `digital_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `digital_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `leads`;
DROP TABLE IF EXISTS `ads`;
DROP TABLE IF EXISTS `meta_webhook_events`;
DROP TABLE IF EXISTS `meta_sync_logs`;
DROP TABLE IF EXISTS `meta_connections`;
DROP TABLE IF EXISTS `campaigns`;

-- 1. Campaigns Table
CREATE TABLE `campaigns` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `objective` VARCHAR(100) NOT NULL,
  `product_id` VARCHAR(100) DEFAULT NULL,
  `package_id` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'PLANNING',
  `start_date` DATE NOT NULL,
  `budget` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `spend` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `leads_count` INT NOT NULL DEFAULT 0,
  `paid_leads` INT NOT NULL DEFAULT 0,
  `conversions` INT NOT NULL DEFAULT 0,
  `auto_cpl` DECIMAL(12,2) GENERATED ALWAYS AS (
    IF(`leads_count` > 0, `spend` / `leads_count`, 0.00)
  ) STORED,
  `auto_conversion_pct` DECIMAL(5,2) GENERATED ALWAYS AS (
    IF(`leads_count` > 0, (`conversions` / `leads_count`) * 100, 0.00)
  ) STORED,
  `owner_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_campaigns_status` (`status`),
  KEY `idx_campaigns_owner` (`owner_id`),
  KEY `idx_campaigns_product_pkg` (`product_id`, `package_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Meta Ad Accounts Connections
CREATE TABLE `meta_connections` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `account_name` VARCHAR(100) NOT NULL,
  `ad_account_id` VARCHAR(100) NOT NULL UNIQUE,
  `business_id` VARCHAR(100) DEFAULT NULL,
  `access_token_encrypted` TEXT NOT NULL,
  `token_expires_at` DATETIME DEFAULT NULL,
  `status` ENUM('CONNECTED', 'EXPIRED', 'ERROR', 'DISCONNECTED') NOT NULL DEFAULT 'CONNECTED',
  `last_synced_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Meta Sync Logs
CREATE TABLE `meta_sync_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `meta_connection_id` INT NOT NULL,
  `sync_type` ENUM('MANUAL', 'SCHEDULED', 'WEBHOOK') NOT NULL DEFAULT 'SCHEDULED',
  `status` ENUM('SUCCESS', 'FAILED', 'PARTIAL') NOT NULL,
  `records_processed` INT NOT NULL DEFAULT 0,
  `started_at` DATETIME NOT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `error_details` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sync_conn` (`meta_connection_id`),
  CONSTRAINT `fk_sync_conn` FOREIGN KEY (`meta_connection_id`) REFERENCES `meta_connections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Meta Webhook Events
CREATE TABLE `meta_webhook_events` (
  `meta_lead_id` VARCHAR(100) NOT NULL,
  `form_id` VARCHAR(100) DEFAULT NULL,
  `page_id` VARCHAR(100) DEFAULT NULL,
  `ad_id` VARCHAR(100) DEFAULT NULL,
  `campaign_id` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  `attempts` INT NOT NULL DEFAULT 0,
  `last_error` TEXT DEFAULT NULL,
  `next_attempt_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`meta_lead_id`),
  KEY `idx_meta_webhook_status_next_attempt` (`status`, `next_attempt_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Ads Table
CREATE TABLE `ads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `campaign_id` INT NOT NULL,
  `product_id` VARCHAR(100) DEFAULT NULL,
  `package_id` VARCHAR(100) DEFAULT NULL,
  `meta_connection_id` INT DEFAULT NULL,
  `created_by` INT DEFAULT NULL,
  `task_type` ENUM('BANNER_DESIGN', 'POST_DESIGN', 'VIDEO') NOT NULL DEFAULT 'BANNER_DESIGN',
  `design_id` INT DEFAULT NULL,
  `platform_ad_id` VARCHAR(100) DEFAULT NULL,
  `platform_adset_id` VARCHAR(100) DEFAULT NULL,
  `platform_campaign_id` VARCHAR(100) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `platform` VARCHAR(50) DEFAULT 'Meta',
  `spend` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `impressions` INT NOT NULL DEFAULT 0,
  `clicks` INT NOT NULL DEFAULT 0,
  `leads_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'DRAFT') NOT NULL DEFAULT 'ACTIVE',
  `auto_cpl` DECIMAL(12,2) GENERATED ALWAYS AS (
    IF(`leads_count` > 0, `spend` / `leads_count`, 0.00)
  ) STORED,
  `auto_ctr` DECIMAL(5,2) GENERATED ALWAYS AS (
    IF(`impressions` > 0, (`clicks` / `impressions`) * 100, 0.00)
  ) STORED,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
  PRIMARY KEY (`id`),
  KEY `idx_ads_campaign` (`campaign_id`),
  KEY `idx_ads_product_pkg` (`product_id`, `package_id`),
  KEY `idx_ads_created_by` (`created_by`),
  KEY `idx_ads_meta` (`meta_connection_id`),
  UNIQUE KEY `uq_ads_platform_ad_id` (`platform_ad_id`),
  KEY `idx_ads_platform_campaign_id` (`platform_campaign_id`),
  CONSTRAINT `fk_ads_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ads_meta` FOREIGN KEY (`meta_connection_id`) REFERENCES `meta_connections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Leads Table
CREATE TABLE `leads` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `source` ENUM(
  'META', 
  'GOOGLE', 
  'FACEBOOK', 
  'LINKINED', 
  'YOUTUBE',
  'INSTAGRAM'
) NOT NULL DEFAULT 'META';
  `campaign` VARCHAR(150) DEFAULT NULL,
  `ad` VARCHAR(150) DEFAULT NULL,
  `product_id` VARCHAR(100) DEFAULT NULL,
  `package_id` VARCHAR(100) DEFAULT NULL,
  `call_disposition` VARCHAR(50) DEFAULT NULL,
  `status` ENUM('ASSIGNED', 'CALL_BUSY', 'NO_ANSWER', 'FOLLOW_UP', 'INTERESTED', 'NOT_INTERESTED', 'PAID') NOT NULL DEFAULT 'ASSIGNED',
  `assignment_status` ENUM('UNASSIGNED', 'ASSIGNED', 'REASSIGNED') NOT NULL DEFAULT 'UNASSIGNED',
  `assigned_telecaller_id` INT DEFAULT NULL,
  `meta_lead_id` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_leads_phone` (`phone`),
  KEY `idx_leads_email` (`email`),
  KEY `idx_leads_status_assignment` (`status`, `assignment_status`),
  KEY `idx_leads_assigned_telecaller` (`assigned_telecaller_id`),
  KEY `idx_leads_campaign` (`campaign`),
  KEY `idx_leads_ad` (`ad`),
  KEY `idx_leads_product_pkg` (`product_id`, `package_id`),
  UNIQUE KEY `uq_leads_meta_lead_id` (`meta_lead_id`),
  KEY `idx_leads_call_disposition` (`call_disposition`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

