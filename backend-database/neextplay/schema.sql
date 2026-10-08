-- =============================================================================
-- NeextPlay B2B Gaming Platform - Dedicated MySQL Database Schema
-- Database: neextplay_db
-- Character Set: utf8mb4 / utf8mb4_unicode_ci
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `neextplay_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `neextplay_db`;

-- 1. USERS & AUTHENTICATION (COMPANY ADMIN & DEVELOPERS)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) PRIMARY KEY,
  `role` VARCHAR(32) NOT NULL DEFAULT 'DEVELOPER', -- 'COMPANY_ADMIN', 'DEVELOPER'
  `name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(128) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `company_name` VARCHAR(128) DEFAULT NULL,
  `operator_id` VARCHAR(64) DEFAULT NULL,
  `country` VARCHAR(64) DEFAULT 'Bangladesh',
  `currency` VARCHAR(16) DEFAULT 'BDT',
  `status` VARCHAR(32) DEFAULT 'ACTIVE',
  `api_key` VARCHAR(128) DEFAULT NULL,
  `api_secret` VARCHAR(128) DEFAULT NULL,
  `permissions_json` TEXT DEFAULT NULL,
  `last_login` VARCHAR(64) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) DEFAULT NULL,
  INDEX `idx_user_role` (`role`),
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_op` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. OPERATORS (B2B CLIENT CASINOS)
CREATE TABLE IF NOT EXISTS `operators` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `code` VARCHAR(64) NOT NULL UNIQUE,
  `email` VARCHAR(128) NOT NULL,
  `country` VARCHAR(64) NOT NULL DEFAULT 'Bangladesh',
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `currency` VARCHAR(16) NOT NULL DEFAULT 'BDT',
  `allowed_currencies_json` TEXT DEFAULT NULL,
  `api_key` VARCHAR(128) NOT NULL,
  `api_secret` VARCHAR(128) NOT NULL,
  `webhook_url` VARCHAR(255) DEFAULT NULL,
  `webhook_secret` VARCHAR(128) DEFAULT NULL,
  `company_balance` DECIMAL(16,2) NOT NULL DEFAULT 500000.00,
  `total_turnover` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `total_ggr` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `total_bets_count` INT NOT NULL DEFAULT 0,
  `total_wins_count` INT NOT NULL DEFAULT 0,
  `total_payout` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) DEFAULT NULL,
  INDEX `idx_operator_code` (`code`),
  INDEX `idx_operator_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. API KEYS & CREDENTIALS
CREATE TABLE IF NOT EXISTS `api_keys` (
  `id` VARCHAR(64) PRIMARY KEY,
  `operator_id` VARCHAR(64) NOT NULL,
  `key_name` VARCHAR(64) NOT NULL,
  `key_value` VARCHAR(128) NOT NULL UNIQUE,
  `secret_value` VARCHAR(128) NOT NULL,
  `permissions_json` TEXT DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_key_op` (`operator_id`),
  INDEX `idx_key_val` (`key_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. PLAYERS ACROSS OPERATORS
CREATE TABLE IF NOT EXISTS `players` (
  `id` VARCHAR(64) PRIMARY KEY,
  `operator_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `currency` VARCHAR(16) NOT NULL DEFAULT 'BDT',
  `balance` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_wagered` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_won` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `last_active` VARCHAR(64) NOT NULL,
  `registered_at` VARCHAR(64) DEFAULT NULL,
  `play_count` INT NOT NULL DEFAULT 0,
  `phone` VARCHAR(32) DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `vip_level` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  INDEX `idx_player_op` (`operator_id`),
  INDEX `idx_player_id_op` (`id`, `operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. GAME LAUNCH SESSIONS (IFRAME & EMBED TOKENS)
CREATE TABLE IF NOT EXISTS `sessions` (
  `token` VARCHAR(128) PRIMARY KEY,
  `operator_id` VARCHAR(64) NOT NULL,
  `player_id` VARCHAR(64) NOT NULL,
  `game_id` VARCHAR(64) NOT NULL,
  `currency` VARCHAR(16) NOT NULL DEFAULT 'BDT',
  `launch_url` TEXT DEFAULT NULL,
  `domain` VARCHAR(255) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `expires_at` VARCHAR(64) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  INDEX `idx_sess_token` (`token`),
  INDEX `idx_sess_op` (`operator_id`),
  INDEX `idx_sess_player` (`player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. GAMES CATALOG
CREATE TABLE IF NOT EXISTS `games` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title` VARCHAR(128) NOT NULL,
  `type` VARCHAR(32) NOT NULL DEFAULT 'CRASH',
  `category` VARCHAR(32) NOT NULL DEFAULT 'crash',
  `rtp` DECIMAL(5,2) NOT NULL DEFAULT 97.00,
  `provider` VARCHAR(64) NOT NULL DEFAULT 'NeextPlay Studios',
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `created_at` VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. GAME ROUNDS (AVIATOR MULTIPLIERS & PROVABLY FAIR)
CREATE TABLE IF NOT EXISTS `game_rounds` (
  `round_id` VARCHAR(64) PRIMARY KEY,
  `game_id` VARCHAR(64) NOT NULL,
  `crash_multiplier` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `server_seed` VARCHAR(128) NOT NULL,
  `client_seed` VARCHAR(128) NOT NULL,
  `round_hash` VARCHAR(128) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_round_game` (`game_id`),
  INDEX `idx_round_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. ROUND BETS (PLAYER WAGERS IN MULTIPLAYER / CRASH)
CREATE TABLE IF NOT EXISTS `round_bets` (
  `id` VARCHAR(64) PRIMARY KEY,
  `round_id` VARCHAR(64) NOT NULL,
  `operator_id` VARCHAR(64) NOT NULL,
  `player_id` VARCHAR(64) NOT NULL,
  `game_id` VARCHAR(64) NOT NULL,
  `bet_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `win_amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `multiplier` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  `currency` VARCHAR(16) NOT NULL DEFAULT 'BDT',
  `timestamp` BIGINT NOT NULL,
  `created_at` VARCHAR(64) DEFAULT NULL,
  INDEX `idx_round_bets_round` (`round_id`),
  INDEX `idx_round_bets_player` (`player_id`),
  INDEX `idx_round_bets_op` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. OPERATOR & PLAYER TRANSACTIONS
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `operator_id` VARCHAR(64) NOT NULL,
  `player_id` VARCHAR(64) NOT NULL,
  `type` VARCHAR(32) NOT NULL, -- 'DEBIT', 'CREDIT', 'ROLLBACK'
  `amount` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
  `currency` VARCHAR(16) NOT NULL DEFAULT 'BDT',
  `reference_id` VARCHAR(128) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_trx_op` (`operator_id`),
  INDEX `idx_trx_player` (`player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. PROVABLY FAIR LEDGER ENTRIES
CREATE TABLE IF NOT EXISTS `ledger_entries` (
  `id` VARCHAR(64) PRIMARY KEY,
  `operator_id` VARCHAR(64) NOT NULL,
  `player_id` VARCHAR(64) DEFAULT NULL,
  `type` VARCHAR(32) NOT NULL,
  `amount` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `balance_before` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `balance_after` DECIMAL(16,2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(16) NOT NULL DEFAULT 'BDT',
  `reference` VARCHAR(255) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_ledg_op` (`operator_id`),
  INDEX `idx_ledg_player` (`player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. LIVE CASINO TABLES
CREATE TABLE IF NOT EXISTS `live_tables` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `game_type` VARCHAR(32) NOT NULL,
  `dealer_name` VARCHAR(64) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  `min_bet` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `max_bet` DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
  `current_players` INT NOT NULL DEFAULT 0,
  `last_results_json` TEXT DEFAULT NULL,
  `stream_url` VARCHAR(255) DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. GLI-19 AUDIT LOGS
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `operator_id` VARCHAR(64) DEFAULT NULL,
  `actor` VARCHAR(128) NOT NULL,
  `action` VARCHAR(128) NOT NULL,
  `category` VARCHAR(64) NOT NULL DEFAULT 'SECURITY',
  `details` TEXT DEFAULT NULL,
  `ip` VARCHAR(64) DEFAULT '127.0.0.1',
  `timestamp` VARCHAR(64) NOT NULL,
  INDEX `idx_audit_op` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. WIN CONTROLS & OPERATOR RTP ENGINE
CREATE TABLE IF NOT EXISTS `win_controls` (
  `id` VARCHAR(64) PRIMARY KEY,
  `config_key` VARCHAR(64) NOT NULL UNIQUE,
  `config_json` LONGTEXT NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. WEBHOOK LOGS
CREATE TABLE IF NOT EXISTS `webhook_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `operator_id` VARCHAR(64) NOT NULL,
  `event` VARCHAR(64) NOT NULL,
  `payload_json` LONGTEXT DEFAULT NULL,
  `response_status` INT DEFAULT NULL,
  `response_body` TEXT DEFAULT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  INDEX `idx_wh_op` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
