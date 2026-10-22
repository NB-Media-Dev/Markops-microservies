-- ==============================================================================
-- MarkOps Designer Microservice Seed Data
-- Database: markops_designer_db
-- ==============================================================================

USE `markops_designer_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Seed ourproducts
INSERT INTO `ourproducts` (`id`, `name`) VALUES
('prod_carrement', 'carrement'),
('prod_classmate', 'classmate'),
('prod_jesus_messenger', 'the jesus messager')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Seed product_packages
INSERT INTO `product_packages` (`id`, `product_id`, `name`) VALUES
('pkg_carrement_q4', 'prod_carrement', 'Careermate Q4 Suite'),
('pkg_classmate_exam', 'prod_classmate', 'Classmate Exam Pack'),
('pkg_jesus_outreach', 'prod_jesus_messenger', 'Community Outreach Pack')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. Seed tasks
INSERT INTO `tasks` (
  `id`, `title`, `task_type`, `package_id`, `product_id`, `product_name`,
  `description`, `attachment_url`, `attachment_name`, `status`, `priority`,
  `created_by`, `assigned_to`, `due_date`, `progress_percent`
) VALUES
(
  1, 'Design Q4 Hero Banner for Careermate', 'BANNER', 'pkg_carrement_q4', 'prod_carrement', 'carrement',
  'Create an ultra-modern 1200x628 landscape hero banner.',
  '/uploads/briefs/careermate_brief.pdf', 'careermate_brief.pdf',
  'IN_PROGRESS', 'HIGH', 1, 2, DATE_ADD(CURRENT_DATE(), INTERVAL 2 DAY), 50
)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 4. Seed task_activities
INSERT INTO `task_activities` (`id`, `task_id`, `previous_status`, `new_status`, `changed_by`, `comment`) VALUES
(1, 1, 'DRAFT', 'ASSIGNED', 1, 'Task created and assigned to Designer.'),
(2, 1, 'ASSIGNED', 'IN_PROGRESS', 2, 'Designer started work on the creative assets.')
ON DUPLICATE KEY UPDATE `comment`=VALUES(`comment`);

-- 5. Seed task_deliverables
INSERT INTO `task_deliverables` (
  `id`, `task_id`, `user_id`, `asset_type`, `version_number`, `file_name`, `file_path`, `file_size`, `mime_type`, `changelog`
) VALUES
(
  1, 1, 1, 'BRIEF_ATTACHMENT', 1, 'careermate_brief.pdf', '/uploads/briefs/careermate_brief.pdf', 540200, 'application/pdf', 'Initial creative brief attachment.'
)
ON DUPLICATE KEY UPDATE `file_name`=VALUES(`file_name`);

SET FOREIGN_KEY_CHECKS = 1;

