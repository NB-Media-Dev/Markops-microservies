CREATE TABLE `call_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `lead_id` INT NOT NULL COMMENT 'References the lead being called',
  `telecaller_id` INT NOT NULL COMMENT 'The agent who made or logged the call',
  `call_outcome` VARCHAR(50) NOT NULL COMMENT 'Corresponds to CALL OUTCOME selection (e.g., Connected, Busy, No Answer)',
  `duration_seconds` INT NOT NULL DEFAULT 0 COMMENT 'Corresponds to DURATION (SECONDS) field',
  `call_remarks` TEXT DEFAULT NULL COMMENT 'Corresponds to CALL REMARKS text input area',
  `follow_up_required` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Boolean toggle for Set Follow-up Reminder',
  `follow_up_time` DATETIME DEFAULT NULL COMMENT 'Scheduled timestamp if follow_up_required is true',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),

  KEY `idx_call_logs_lead` (`lead_id`),
  KEY `idx_call_logs_telecaller` (`telecaller_id`),
  KEY `idx_call_logs_outcome` (`call_outcome`),
  KEY `idx_call_logs_created` (`created_at`),
  

  CONSTRAINT `fk_call_logs_leads` 
    FOREIGN KEY (`lead_id`) 
    REFERENCES `leads` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `telecaller_targets` (
  `telecaller_id` VARCHAR(64) NOT NULL COMMENT 'Primary key identifying the agent',
  `telecaller_name` VARCHAR(100) NOT NULL,
  `telecaller_email` VARCHAR(191) NOT NULL,
  `daily_calls_target` INT NOT NULL DEFAULT 30 COMMENT 'Common system target: 30 calls',
  `daily_interested_target` INT NOT NULL DEFAULT 5 COMMENT 'Common system target: 5 interested',
  `daily_duration_target_seconds` INT NOT NULL DEFAULT 3600 COMMENT 'Target speaker time (1 hour)',
  `updated_by` VARCHAR(255) NOT NULL COMMENT 'User who made the update',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`telecaller_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
