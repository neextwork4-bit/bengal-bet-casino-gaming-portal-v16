<?php
/**
 * NeextPlay Dedicated Database Migration & Auto-Process Script
 * Auto-creates database, creates/updates all tables, columns, indexes, and seeds default records.
 * Can be run stand-alone or included by /backend-database/process.php
 */

require_once __DIR__ . '/config.php';

function run_neextplay_process($returnArray = false, $existingPdo = null, $customDbName = null) {
    $startTime = microtime(true);
    $log = [];
    $targetDb = $customDbName ?: NP_DB_NAME;
    $stats = [
        'database' => $targetDb,
        'tables_created_or_verified' => [],
        'tables_count' => 0,
        'rows_seeded' => [],
        'status' => 'success',
        'errors' => []
    ];

    try {
        if ($existingPdo) {
            $pdo = $existingPdo;
            $log[] = "Using established database connection for: " . $targetDb;
        } else {
            // 1. Ensure Database exists
            ensure_database_exists(NP_DB_HOST, NP_DB_PORT, NP_DB_USER, NP_DB_PASS, $targetDb);
            $log[] = "Verified database: " . $targetDb;

            // 2. Connect to database
            $pdo = get_neextplay_db(true);
        }

        // 3. Run schema statements
        $schemaSql = file_get_contents(__DIR__ . '/schema.sql');
        if ($schemaSql) {
            $statements = array_filter(array_map('trim', explode(';', $schemaSql)));
            foreach ($statements as $stmt) {
                if (empty($stmt)) continue;
                if (stripos($stmt, 'CREATE DATABASE') === 0 || stripos($stmt, 'USE ') === 0) continue;
                try {
                    $pdo->exec($stmt);
                } catch (Exception $e) {
                    if (strpos($e->getMessage(), 'already exists') === false) {
                        $stats['errors'][] = "Schema statement error: " . $e->getMessage();
                    }
                }
            }
        }

        // 4. List all tables
        $tablesStmt = $pdo->query("SHOW TABLES");
        $allTables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
        $stats['tables_created_or_verified'] = $allTables;
        $stats['tables_count'] = count($allTables);

        // 5. Seed Users
        $userCount = (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
        if ($userCount === 0) {
            $defaultUsers = [
                ['usr_admin_001', 'COMPANY_ADMIN', 'NeextPlay Super Admin', 'admin@neextplay.com', 'admin123', 'NeextPlay Studios Global', 'op_neexthub', 'Global Licensing Authority', 'USD', 'ACTIVE', 'np_live_key_neexthub_992147', 'np_sec_live_neexthub_8f7b6a5c4d3e210a', date('Y-m-d H:i:s')],
                ['usr_dev_001', 'DEVELOPER', 'BengalBet Integrator', 'developer@neextplay.com', 'developer123', 'BengalBet Casino Portal', 'op_bengalbet', 'Bangladesh (BDT Certified)', 'BDT', 'ACTIVE', 'np_live_key_bengalbet_883921', 'np_sec_live_bengalbet_55a9c3d1e2f4', date('Y-m-d H:i:s')],
                ['usr_dev_002', 'DEVELOPER', 'Sandbox Partner', 'demo@neextplay.com', 'demo123', 'NeextPlay Global Sandbox', 'op_global_demo', 'Global Sandbox', 'USD', 'ACTIVE', 'np_live_key_demo_112233', 'np_sec_live_demo_998877', date('Y-m-d H:i:s')]
            ];
            $uStmt = $pdo->prepare("INSERT INTO `users` (`id`, `role`, `name`, `email`, `password_hash`, `company_name`, `operator_id`, `country`, `currency`, `status`, `api_key`, `api_secret`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($defaultUsers as $u) {
                $uStmt->execute($u);
            }
            $stats['rows_seeded']['users'] = count($defaultUsers);
        }

        // 6. Seed Default Operators
        $opCount = (int)$pdo->query("SELECT COUNT(*) FROM `operators`")->fetchColumn();
        if ($opCount === 0) {
            $defaultOperators = [
                [
                    'id' => 'op_bengalbet',
                    'name' => 'BengalBet Casino Portal',
                    'code' => 'BENGALBET',
                    'email' => 'operations@bengalbet.com',
                    'country' => 'Bangladesh (BDT Certified)',
                    'status' => 'ACTIVE',
                    'currency' => 'BDT',
                    'allowed_currencies_json' => json_encode(['BDT', 'USD', 'INR', 'EUR']),
                    'api_key' => 'np_live_key_bengalbet_883921',
                    'api_secret' => 'np_sec_live_bengalbet_55a9c3d1e2f4',
                    'webhook_url' => 'http://localhost/backend-database/bengalbet/api.php?action=webhook',
                    'webhook_secret' => 'whsec_bengalbet_live_77123984',
                    'company_balance' => 5000000.00,
                    'total_turnover' => 1250000.00,
                    'total_ggr' => 84000.00,
                    'total_bets_count' => 1420,
                    'total_wins_count' => 890,
                    'total_payout' => 1166000.00,
                    'created_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 'op_global_demo',
                    'name' => 'NeextPlay Global Sandbox',
                    'code' => 'DEMO_SANDBOX',
                    'email' => 'dev@neextplay.com',
                    'country' => 'Global Sandbox',
                    'status' => 'ACTIVE',
                    'currency' => 'USD',
                    'allowed_currencies_json' => json_encode(['USD', 'BDT', 'EUR']),
                    'api_key' => 'np_live_key_demo_112233',
                    'api_secret' => 'np_sec_live_demo_998877',
                    'webhook_url' => null,
                    'webhook_secret' => null,
                    'company_balance' => 100000.00,
                    'total_turnover' => 25000.00,
                    'total_ggr' => 1500.00,
                    'total_bets_count' => 45,
                    'total_wins_count' => 28,
                    'total_payout' => 23500.00,
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ];

            $stmtIns = $pdo->prepare("INSERT INTO `operators` 
                (`id`, `name`, `code`, `email`, `country`, `status`, `currency`, `allowed_currencies_json`, `api_key`, `api_secret`, `webhook_url`, `webhook_secret`, `company_balance`, `total_turnover`, `total_ggr`, `total_bets_count`, `total_wins_count`, `total_payout`, `created_at`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($defaultOperators as $op) {
                $stmtIns->execute(array_values($op));
            }
            $stats['rows_seeded']['operators'] = count($defaultOperators);
        }

        $stats['execution_time_ms'] = round((microtime(true) - $startTime) * 1000, 2);

        if ($returnArray) {
            return $stats;
        }

        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['success' => true, 'stats' => $stats], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;

    } catch (Exception $e) {
        $stats['status'] = 'error';
        $stats['errors'][] = $e->getMessage();
        if ($returnArray) return $stats;
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage(), 'stats' => $stats]);
        exit;
    }
}

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    run_neextplay_process(false);
}
