-- ==============================================================================
-- MarkOps Designer Microservice Seed Data
-- ==============================================================================

USE `markops_designer_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Insert Roles
INSERT INTO `roles` (`id`, `name`, `code`, `description`) VALUES
(1, 'Administrator', 'ADMINISTRATOR', 'Full system management access'),
(2, 'Creative Designer', 'DESIGNER', 'Access to design tasks, creative submissions, and revision cycles'),
(3, 'Business Development Manager', 'BDM', 'Creates design briefs, sets deadlines, and conducts design reviews'),
(4, 'Marketing Manager', 'MARKETING_MANAGER', 'Campaign oversight and creative asset strategy')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 2. Insert Teams
INSERT INTO `teams` (`id`, `name`, `description`, `manager_id`) VALUES
(1, 'Creative Studio', 'UI/UX, visual branding, marketing banners, and social creatives', 1),
(2, 'Campaign Marketing', 'Cross-platform ad operations and lead generation', 3)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 3. Insert Users (Designers, BDMs, Admins)
-- Password hash corresponds to 'designer123' and 'admin123'
INSERT INTO `users` (`id`, `email`, `password_hash`, `full_name`, `role_id`, `team_id`, `department`, `avatar_url`, `is_active`) VALUES
(1, 'admin@markops.io', '$2a$10$wT8KzVq2sPfxN9V9xM8pveXhR4F9p4w7WjG9h1rT3B5eQ8dE7u9t.', 'System Administrator', 1, 1, 'Executive Operations', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 1),
(2, 'designer@markops.io', '$2a$10$wT8KzVq2sPfxN9V9xM8pveXhR4F9p4w7WjG9h1rT3B5eQ8dE7u9t.', 'Creative Designer', 2, 1, 'Creative Studio', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 1),
(3, 'bdm@markops.io', '$2a$10$wT8KzVq2sPfxN9V9xM8pveXhR4F9p4w7WjG9h1rT3B5eQ8dE7u9t.', 'Marcus BDM', 3, 2, 'Sales & BD', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 1),
(4, 'sarah.designer@markops.io', '$2a$10$wT8KzVq2sPfxN9V9xM8pveXhR4F9p4w7WjG9h1rT3B5eQ8dE7u9t.', 'Sarah Jenkins', 2, 1, 'Creative Studio', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 1),
(5, 'david.visual@markops.io', '$2a$10$wT8KzVq2sPfxN9V9xM8pveXhR4F9p4w7WjG9h1rT3B5eQ8dE7u9t.', 'David Kim', 2, 1, 'Creative Studio', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 1)
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);

-- 4. Insert Product Packages
INSERT INTO `product_packages` (`id`, `product_id`, `name`, `description`, `price`, `status`) VALUES
('pkg_careermate', 'prod_careermate', 'Careermate', 'Premium Career & Placement Marketing Creative Suite', 2499.00, 'ACTIVE'),
('pkg_classmate', 'prod_classmate', 'Classmate', 'Educational & Student Engagement Banner Series', 1899.00, 'ACTIVE'),
('pkg_jesus_messanger', 'prod_jesus_messanger', 'Jesus the messanger', 'Inspirational Outreach & Community Creative Assets', 1499.00, 'ACTIVE')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 5. Insert Sample Tasks
INSERT INTO `tasks` (`id`, `campaign_id`, `title`, `task_type`, `package_name`, `product_id`, `product_name`, `description`, `content`, `status`, `priority`, `created_by`, `assigned_to`, `due_date`, `progress_percent`) VALUES
(101, 1, 'Design Q4 Hero Banner for Careermate', 'BANNER_DESIGN', 'Careermate', 'pkg_careermate', 'Careermate', 'Create an ultra-modern 1200x628 landscape hero banner highlighting AI-assisted career mentoring and resume evaluation.', 'Hero copy: Fast-track your career trajectory with MarkOps AI.', 'IN_PROGRESS', 'HIGH', 3, 2, DATE_ADD(CURRENT_DATE(), INTERVAL 2 DAY), 50),
(102, 1, 'Classmate Mobile Feed Ad Creative Set', 'BANNER_DESIGN', 'Classmate', 'pkg_classmate', 'Classmate', '1080x1080 square format ad set for Instagram & Facebook feeds with vibrant typography and student testimonial badges.', 'Key hook: Master your exams with targeted mock tests.', 'SUBMITTED', 'URGENT', 3, 2, CURRENT_DATE(), 80),
(103, 2, 'Community Outreach Poster Series', 'BANNER_DESIGN', 'Jesus the messanger', 'pkg_jesus_messanger', 'Jesus the messanger', 'Series of 3 portrait banners for church announcements and weekly broadcast streaming.', 'Quote: Hope, fellowship, and transformation.', 'APPROVED', 'MEDIUM', 1, 4, DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), 100),
(104, 1, 'Careermate LinkedIn Carousel Templates', 'BANNER_DESIGN', 'Careermate', 'pkg_careermate', 'Careermate', '5-slide carousel emphasizing job placement statistics and salary benchmarking tools.', 'Call-to-action: Swipe through to see 2026 hiring trends.', 'REVISION_REQUIRED', 'HIGH', 3, 2, DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), 50),
(105, 2, 'Annual Marketing Conference Backdrop Banner', 'BANNER_DESIGN', 'Careermate', 'pkg_careermate', 'Careermate', 'Large format vector banner for main stage event booth and press backdrop (300dpi CMYK ready).', 'Headline: Shaping the Next Era of Digital Growth.', 'ASSIGNED', 'MEDIUM', 3, 5, DATE_ADD(CURRENT_DATE(), INTERVAL 5 DAY), 10)
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`);

-- 6. Insert Versions for Task 102 & 104
INSERT INTO `task_versions` (`id`, `task_id`, `version_number`, `submitted_by`, `file_name`, `file_path`, `file_size`, `mime_type`, `changelog`) VALUES
(1, 102, 1, 2, 'classmate_feed_v1.png', '/uploads/designs/classmate_feed_v1.png', 1420500, 'image/png', 'Initial layout with high-contrast typography and gradient backdrop.'),
(2, 104, 1, 2, 'careermate_carousel_draft.png', '/uploads/designs/careermate_carousel_draft.png', 2180400, 'image/png', 'Initial 5 slides layout draft.'),
(3, 104, 2, 2, 'careermate_carousel_revised.png', '/uploads/designs/careermate_carousel_revised.png', 2240100, 'image/png', 'Adjusted font sizing and updated CTAs on slides 3 and 5.')
ON DUPLICATE KEY UPDATE `file_name`=VALUES(`file_name`);

-- 7. Insert Status History
INSERT INTO `task_status_history` (`id`, `task_id`, `actor_id`, `previous_status`, `new_status`, `remark`) VALUES
(1, 101, 3, 'DRAFT', 'ASSIGNED', 'Assigned to Creative Designer with priority HIGH'),
(2, 101, 2, 'ASSIGNED', 'IN_PROGRESS', 'Designer accepted task and began wireframing'),
(3, 102, 2, 'IN_PROGRESS', 'SUBMITTED', 'Version 1 submitted for review'),
(4, 104, 3, 'SUBMITTED', 'REVISION_REQUIRED', 'Please brighten the background gradient and enlarge the company logo on slide 1.')
ON DUPLICATE KEY UPDATE `new_status`=VALUES(`new_status`);

-- 8. Insert Comments & Feedback
INSERT INTO `task_comments` (`id`, `task_id`, `user_id`, `comment`) VALUES
(1, 101, 3, 'Please ensure the brand accent color matches #6366F1 exactly as per the 2026 design system guidelines.'),
(2, 101, 2, 'Acknowledged! Working on the typography hierarchy now. Will share initial draft by 3 PM.'),
(3, 104, 3, 'The slides look promising, but the contrast between the subtitle text and the navy gradient needs enhancement for mobile readability.')
ON DUPLICATE KEY UPDATE `comment`=VALUES(`comment`);

SET FOREIGN_KEY_CHECKS = 1;
