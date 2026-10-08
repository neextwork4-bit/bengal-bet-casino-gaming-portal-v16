-- =============================================================================
-- BengalBet Casino & Gaming Platform - Complete MySQL Database Schema
-- Database: bengalbet_db
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `bengalbet_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bengalbet_db`;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `password_hash` VARCHAR(128) NOT NULL,
  `balance` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `vip_level` INT NOT NULL DEFAULT 0,
  `vip_exp` INT NOT NULL DEFAULT 0,
  `vip_max_exp` INT NOT NULL DEFAULT 1000,
  `free_spins` INT NOT NULL DEFAULT 0,
  `red_packets_available` INT NOT NULL DEFAULT 0,
  `golden_eggs_available` INT NOT NULL DEFAULT 0,
  `unread_notifications` INT NOT NULL DEFAULT 0,
  `referral_code` VARCHAR(32) DEFAULT NULL,
  `total_earnings` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `referred_friends_count` INT NOT NULL DEFAULT 0,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `real_name` VARCHAR(128) DEFAULT NULL,
  `email` VARCHAR(128) DEFAULT NULL,
  `birthday` VARCHAR(32) DEFAULT NULL,
  `transaction_password` VARCHAR(64) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) DEFAULT NULL,
  INDEX `idx_phone` (`phone`),
  INDEX `idx_referral_code` (`referral_code`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `phone` VARCHAR(32) DEFAULT NULL,
  `type` VARCHAR(32) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `fee` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `bonus` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `channel` VARCHAR(32) NOT NULL DEFAULT 'bkash',
  `gateway` VARCHAR(64) DEFAULT NULL,
  `account_number` VARCHAR(64) DEFAULT NULL,
  `trx_id` VARCHAR(128) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) DEFAULT NULL,
  `processed_at` VARCHAR(64) DEFAULT NULL,
  `processed_by` VARCHAR(64) DEFAULT NULL,
  `admin_note` TEXT DEFAULT NULL,
  `rejection_reason` TEXT DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_trx_id` (`trx_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. WALLETS (SAVED CASH-OUT CARDS)
CREATE TABLE IF NOT EXISTS `wallets` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `account_name` VARCHAR(64) NOT NULL,
  `account_number` VARCHAR(64) NOT NULL,
  `full_number` VARCHAR(64) DEFAULT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_user_wallet` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BETS HISTORY
CREATE TABLE IF NOT EXISTS `bets` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `order_no` VARCHAR(64) NOT NULL,
  `category` VARCHAR(32) NOT NULL DEFAULT 'slot',
  `vendor` VARCHAR(64) NOT NULL,
  `game_name` VARCHAR(128) NOT NULL,
  `game_round` VARCHAR(64) DEFAULT NULL,
  `bet_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `valid_bet` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `reward` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `profit` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `time` VARCHAR(32) NOT NULL,
  `date` VARCHAR(32) NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_user_bets` (`user_id`),
  INDEX `idx_date` (`date`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. MESSAGES & INBOX
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL DEFAULT 'all',
  `sender` VARCHAR(64) NOT NULL DEFAULT 'BengalBet System',
  `title` VARCHAR(255) NOT NULL,
  `display_time` VARCHAR(64) NOT NULL,
  `date_full` VARCHAR(64) NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `category` VARCHAR(32) NOT NULL DEFAULT 'notice',
  `claimable_bonus` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `claimed_by` TEXT DEFAULT NULL,
  `content_json` LONGTEXT DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_msg_user` (`user_id`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SUPPORT TICKETS
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `user_phone` VARCHAR(32) DEFAULT NULL,
  `category` VARCHAR(32) NOT NULL DEFAULT 'general',
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `priority` VARCHAR(16) NOT NULL DEFAULT 'medium',
  `status` VARCHAR(32) NOT NULL DEFAULT 'open',
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) DEFAULT NULL,
  `admin_notes` TEXT DEFAULT NULL,
  INDEX `idx_ticket_user` (`user_id`),
  INDEX `idx_ticket_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. LIVE CHAT SESSIONS
CREATE TABLE IF NOT EXISTS `livechat_sessions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `user_phone` VARCHAR(32) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `department` VARCHAR(32) NOT NULL DEFAULT 'general',
  `assigned_agent_json` TEXT DEFAULT NULL,
  `unread_user_count` INT NOT NULL DEFAULT 0,
  `unread_admin_count` INT NOT NULL DEFAULT 0,
  `last_message` TEXT DEFAULT NULL,
  `last_message_at` VARCHAR(64) NOT NULL,
  `rating` INT DEFAULT NULL,
  `rating_comment` TEXT DEFAULT NULL,
  `internal_note` TEXT DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  INDEX `idx_session_user` (`user_id`),
  INDEX `idx_session_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. LIVE CHAT MESSAGES
CREATE TABLE IF NOT EXISTS `livechat_messages` (
  `id` VARCHAR(64) PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL,
  `sender_type` VARCHAR(16) NOT NULL, -- 'user' or 'agent' or 'system'
  `sender_name` VARCHAR(64) NOT NULL,
  `message` TEXT NOT NULL,
  `timestamp` BIGINT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  INDEX `idx_chat_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SITE SETTINGS & ENGINE CONTROLS
CREATE TABLE IF NOT EXISTS `site_settings` (
  `setting_key` VARCHAR(64) PRIMARY KEY,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. VIP TIERS CONFIGURATION
CREATE TABLE IF NOT EXISTS `vip_tiers` (
  `level` INT PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `badge_type` VARCHAR(32) NOT NULL DEFAULT 'bronze',
  `target_bet` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `target_bet_display` VARCHAR(64) DEFAULT NULL,
  `deposit_target` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `upgrade_bonus` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `weekly_bonus` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `monthly_bonus` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `birthday_bonus` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `slot_rebate` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `live_rebate` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  `description` VARCHAR(255) DEFAULT NULL,
  `perks_json` TEXT DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `updated_at` VARCHAR(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. VIP REWARDS CLAIMS
CREATE TABLE IF NOT EXISTS `vip_claims` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `level` INT NOT NULL,
  `type` VARCHAR(32) NOT NULL,
  `event_name` VARCHAR(128) NOT NULL,
  `bonus` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `points` INT NOT NULL DEFAULT 0,
  `ticket_name` VARCHAR(128) NOT NULL,
  `date` VARCHAR(32) NOT NULL,
  `timestamp` BIGINT NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'claimed',
  INDEX `idx_vip_claim_user` (`user_id`),
  INDEX `idx_vip_claim_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. DAILY SIGN-IN CLAIMS
CREATE TABLE IF NOT EXISTS `daily_signins` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `day` INT NOT NULL,
  `bonus` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `date` VARCHAR(32) NOT NULL,
  `claimed_at` VARCHAR(64) NOT NULL,
  `streak` INT NOT NULL DEFAULT 1,
  `vip_multiplier` DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  `status` VARCHAR(32) NOT NULL DEFAULT 'claimed',
  `note` VARCHAR(255) DEFAULT NULL,
  INDEX `idx_signin_user_date` (`user_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. REFERRALS (AFFILIATE NETWORK)
CREATE TABLE IF NOT EXISTS `referrals` (
  `id` VARCHAR(64) PRIMARY KEY,
  `referrer_id` VARCHAR(64) NOT NULL,
  `referrer_username` VARCHAR(64) NOT NULL,
  `referrer_code` VARCHAR(32) NOT NULL,
  `referred_user_id` VARCHAR(64) NOT NULL,
  `referred_username` VARCHAR(64) NOT NULL,
  `referred_phone` VARCHAR(32) NOT NULL,
  `level` INT NOT NULL DEFAULT 1,
  `instant_bonus_paid` TINYINT(1) NOT NULL DEFAULT 0,
  `instant_bonus_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_deposit` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_bet` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `deposit_commission` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `bet_commission` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `total_commission_earned` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `joined_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) DEFAULT NULL,
  INDEX `idx_ref_referrer` (`referrer_id`),
  INDEX `idx_ref_referred` (`referred_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. REFERRAL REWARD CLAIMS
CREATE TABLE IF NOT EXISTS `referral_claims` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `tier_id` INT NOT NULL,
  `level` INT DEFAULT NULL,
  `type` VARCHAR(32) NOT NULL DEFAULT 'tier',
  `required_count` INT NOT NULL,
  `bonus_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `trx_id` VARCHAR(128) NOT NULL,
  `claimed_at` VARCHAR(64) NOT NULL,
  INDEX `idx_claim_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. PROMOTIONS
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(128) NOT NULL,
  `category` VARCHAR(64) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `banner` VARCHAR(255) DEFAULT NULL,
  `bonus_value` VARCHAR(64) DEFAULT NULL,
  `rules` TEXT DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `created_at` VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. GAMES SUITE
CREATE TABLE IF NOT EXISTS `games` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `name_bn` VARCHAR(128) DEFAULT NULL,
  `provider` VARCHAR(64) NOT NULL,
  `category` VARCHAR(32) NOT NULL,
  `image` VARCHAR(255) NOT NULL,
  `is_hot` TINYINT(1) NOT NULL DEFAULT 0,
  `is_new` TINYINT(1) NOT NULL DEFAULT 0,
  `jackpot` DECIMAL(16,2) DEFAULT 0.00,
  `rtp` DECIMAL(5,2) NOT NULL DEFAULT 97.00,
  `players_count` INT NOT NULL DEFAULT 1000,
  `volatility` VARCHAR(32) DEFAULT 'Medium',
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  INDEX `idx_game_category` (`category`),
  INDEX `idx_game_provider` (`provider`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. BANNERS
CREATE TABLE IF NOT EXISTS `banners` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(128) NOT NULL,
  `subtitle` VARCHAR(255) DEFAULT NULL,
  `image` VARCHAR(255) NOT NULL,
  `category` VARCHAR(32) NOT NULL DEFAULT 'home',
  `link_url` VARCHAR(255) DEFAULT NULL,
  `action_type` VARCHAR(64) DEFAULT 'navigate',
  `display_order` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_banner_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. PROMO CODES
CREATE TABLE IF NOT EXISTS `promo_codes` (
  `id` VARCHAR(64) PRIMARY KEY,
  `code` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(128) NOT NULL,
  `bonus_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `min_deposit` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `wagering_multiplier` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  `max_redemptions` INT NOT NULL DEFAULT 1000,
  `used_count` INT NOT NULL DEFAULT 0,
  `expires_at` VARCHAR(64) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_promo_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. PROMO REDEMPTIONS
CREATE TABLE IF NOT EXISTS `promo_redemptions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `promo_code_id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `bonus_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `redeemed_at` VARCHAR(64) NOT NULL,
  INDEX `idx_promo_user` (`user_id`, `code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. RESCUE FUND TIERS
CREATE TABLE IF NOT EXISTS `rescue_tiers` (
  `id` INT PRIMARY KEY,
  `min_loss` DECIMAL(14,2) NOT NULL,
  `max_loss` DECIMAL(14,2) DEFAULT NULL,
  `bonus_percent` DECIMAL(5,2) NOT NULL,
  `max_bonus` DECIMAL(14,2) NOT NULL,
  `wagering` DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  `description` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. RESCUE FUND CLAIMS
CREATE TABLE IF NOT EXISTS `rescue_claims` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(64) DEFAULT NULL,
  `loss_date` VARCHAR(32) NOT NULL,
  `net_loss` DECIMAL(14,2) NOT NULL,
  `bonus_amount` DECIMAL(14,2) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'approved',
  `admin_note` TEXT DEFAULT NULL,
  `claimed_at` VARCHAR(64) NOT NULL,
  INDEX `idx_rescue_user_date` (`user_id`, `loss_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
