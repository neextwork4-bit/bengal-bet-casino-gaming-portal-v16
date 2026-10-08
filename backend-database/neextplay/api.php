<?php
/**
 * NeextPlay B2B Gaming Systems - Production MySQL REST API Controller
 * Real MySQL Backend for User Auth, Operators, Players, Games, Ledger & Admin Management
 */

require_once __DIR__ . '/config.php';

try {
    $pdo = get_neextplay_db(true);
    // Auto-initialize tables if empty
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'operators'")->fetchColumn();
    if (!$tableCheck && file_exists(__DIR__ . '/process.php')) {
        require_once __DIR__ . '/process.php';
        run_neextplay_process(true);
    }
} catch (Exception $e) {
    send_json_response([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ], 500);
}

$input = get_request_data();
$action = $input['action'] ?? ($_GET['action'] ?? 'ping');

switch ($action) {
    // -------------------------------------------------------------
    // 0. HEALTH & PING
    // -------------------------------------------------------------
    case 'ping':
    case 'health':
        $opCount = (int)$pdo->query("SELECT COUNT(*) FROM `operators`")->fetchColumn();
        $userCount = (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
        send_json_response([
            'success' => true,
            'service' => 'neextplay_b2b_mysql_api',
            'database' => NP_DB_NAME,
            'server_time' => date('Y-m-d H:i:s'),
            'total_operators' => $opCount,
            'total_users' => $userCount
        ]);
        break;

    // -------------------------------------------------------------
    // 1. STATS SUMMARY (SUPER ADMIN)
    // -------------------------------------------------------------
    case 'stats':
        $totalOperators = (int)$pdo->query("SELECT COUNT(*) FROM `operators`")->fetchColumn();
        $totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
        $totalPlayers = (int)$pdo->query("SELECT COUNT(*) FROM `players`")->fetchColumn();
        $totalTurnover = (float)$pdo->query("SELECT COALESCE(SUM(total_turnover), 0) FROM `operators`")->fetchColumn();
        $totalGgr = (float)$pdo->query("SELECT COALESCE(SUM(total_ggr), 0) FROM `operators`")->fetchColumn();
        $totalRounds = (int)$pdo->query("SELECT COUNT(*) FROM `game_rounds`")->fetchColumn();
        $totalBets = (int)$pdo->query("SELECT COUNT(*) FROM `round_bets`")->fetchColumn();
        $totalGames = (int)$pdo->query("SELECT COUNT(*) FROM `games`")->fetchColumn();
        $totalLiveTables = (int)$pdo->query("SELECT COUNT(*) FROM `live_tables`")->fetchColumn();

        send_json_response([
            'success' => true,
            'stats' => [
                'totalOperators' => $totalOperators,
                'totalUsers' => $totalUsers,
                'totalPlayers' => $totalPlayers,
                'totalTurnover' => $totalTurnover,
                'totalGgr' => $totalGgr,
                'totalRounds' => $totalRounds,
                'totalBets' => $totalBets,
                'totalGames' => $totalGames,
                'totalLiveTables' => $totalLiveTables,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ]);
        break;

    // -------------------------------------------------------------
    // 2. USER AUTHENTICATION & ACCOUNTS (REAL MYSQL)
    // -------------------------------------------------------------
    case 'login_user':
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');

        if (empty($email) || empty($password)) {
            send_json_response(['success' => false, 'error' => 'Email and password are required'], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM `users` WHERE `email` = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            send_json_response(['success' => false, 'error' => 'Account not found with this email address.'], 404);
        }

        // Check password (supports plain or hash match for flexibility)
        if ($user['password_hash'] !== $password && !password_verify($password, $user['password_hash'])) {
            send_json_response(['success' => false, 'error' => 'Invalid password credentials.'], 401);
        }

        if ($user['status'] === 'SUSPENDED') {
            send_json_response(['success' => false, 'error' => 'This account has been suspended by compliance.'], 403);
        }

        // Update last login timestamp in MySQL
        $now = date('Y-m-d H:i:s');
        $upStmt = $pdo->prepare("UPDATE `users` SET `last_login` = ? WHERE `id` = ?");
        $upStmt->execute([$now, $user['id']]);
        $user['last_login'] = $now;

        // Log audit in MySQL
        $pdo->prepare("INSERT INTO `audit_logs` (`id`, `operator_id`, `actor`, `action`, `category`, `details`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?, ?)")
            ->execute(['aud_' . uniqid(), $user['operator_id'], $user['email'], 'USER_LOGIN', 'AUTH', "Logged in as {$user['role']}", $now]);

        unset($user['password_hash']);
        send_json_response(['success' => true, 'user' => $user]);
        break;

    case 'register_user':
        $name = trim($input['name'] ?? ($input['companyName'] ?? 'Developer Partner'));
        $email = trim($input['email'] ?? '');
        $password = trim($input['password'] ?? '');
        $companyName = trim($input['companyName'] ?? $name);
        $country = trim($input['country'] ?? 'Bangladesh');
        $currency = trim($input['currency'] ?? 'BDT');
        $role = trim($input['role'] ?? 'DEVELOPER');

        if (empty($email) || empty($password)) {
            send_json_response(['success' => false, 'error' => 'Email and password are required'], 400);
        }

        // Check existing user
        $checkStmt = $pdo->prepare("SELECT `id` FROM `users` WHERE `email` = ? LIMIT 1");
        $checkStmt->execute([$email]);
        if ($checkStmt->fetch()) {
            send_json_response(['success' => false, 'error' => 'An account with this email already exists.'], 409);
        }

        $userId = 'usr_' . bin2hex(random_bytes(6));
        $opId = 'op_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '_', substr($companyName, 0, 16)));
        $apiKey = 'np_live_key_' . bin2hex(random_bytes(8));
        $apiSecret = 'np_sec_live_' . bin2hex(random_bytes(16));
        $now = date('Y-m-d H:i:s');

        // Create Operator if role is DEVELOPER and operator doesn't exist yet
        if ($role === 'DEVELOPER') {
            $opCheck = $pdo->prepare("SELECT `id` FROM `operators` WHERE `id` = ? LIMIT 1");
            $opCheck->execute([$opId]);
            if (!$opCheck->fetch()) {
                $code = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $companyName), 0, 8));
                if (empty($code)) $code = 'DEV';
                $currenciesJson = json_encode([$currency, 'USD', 'EUR'], JSON_UNESCAPED_UNICODE);
                $insOp = $pdo->prepare("INSERT INTO `operators` 
                    (`id`, `name`, `code`, `email`, `country`, `currency`, `allowed_currencies_json`, `api_key`, `api_secret`, `company_balance`, `created_at`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 50000.00, ?)");
                $insOp->execute([$opId, $companyName, $code, $email, $country, $currency, $currenciesJson, $apiKey, $apiSecret, $now]);
            }
        }

        // Insert User into MySQL
        $insUser = $pdo->prepare("INSERT INTO `users` 
            (`id`, `role`, `name`, `email`, `password_hash`, `company_name`, `operator_id`, `country`, `currency`, `status`, `api_key`, `api_secret`, `created_at`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)");
        $insUser->execute([$userId, $role, $name, $email, $password, $companyName, $opId, $country, $currency, $apiKey, $apiSecret, $now]);

        $fetchStmt = $pdo->prepare("SELECT * FROM `users` WHERE `id` = ? LIMIT 1");
        $fetchStmt->execute([$userId]);
        $newUser = $fetchStmt->fetch();
        unset($newUser['password_hash']);

        send_json_response(['success' => true, 'user' => $newUser, 'message' => 'User registered successfully']);
        break;

    case 'get_users':
        $stmt = $pdo->query("SELECT `id`, `role`, `name`, `email`, `company_name`, `operator_id`, `country`, `currency`, `status`, `api_key`, `last_login`, `created_at` FROM `users` ORDER BY `created_at` DESC");
        send_json_response(['success' => true, 'users' => $stmt->fetchAll()]);
        break;

    case 'get_user':
        $id = $input['id'] ?? ($input['email'] ?? '');
        $stmt = $pdo->prepare("SELECT `id`, `role`, `name`, `email`, `company_name`, `operator_id`, `country`, `currency`, `status`, `api_key`, `last_login`, `created_at` FROM `users` WHERE `id` = ? OR `email` = ? LIMIT 1");
        $stmt->execute([$id, $id]);
        $user = $stmt->fetch();
        if ($user) {
            send_json_response(['success' => true, 'user' => $user]);
        } else {
            send_json_response(['success' => false, 'error' => 'User not found'], 404);
        }
        break;

    case 'update_user':
        $userId = $input['id'] ?? '';
        if (empty($userId)) {
            send_json_response(['success' => false, 'error' => 'User ID is required'], 400);
        }

        $fields = [];
        $params = [];
        $allowed = ['name', 'company_name', 'country', 'currency', 'status', 'role', 'api_key', 'api_secret'];
        foreach ($allowed as $f) {
            if (isset($input[$f])) {
                $fields[] = "`$f` = ?";
                $params[] = $input[$f];
            }
        }
        if (isset($input['password']) && !empty($input['password'])) {
            $fields[] = "`password_hash` = ?";
            $params[] = $input['password'];
        }

        if (empty($fields)) {
            send_json_response(['success' => false, 'error' => 'No valid fields to update'], 400);
        }

        $fields[] = "`updated_at` = ?";
        $params[] = date('Y-m-d H:i:s');
        $params[] = $userId;

        $sql = "UPDATE `users` SET " . implode(', ', $fields) . " WHERE `id` = ?";
        $pdo->prepare($sql)->execute($params);

        send_json_response(['success' => true, 'message' => 'User account updated in MySQL']);
        break;

    case 'delete_user':
        $userId = $input['id'] ?? '';
        if (empty($userId)) {
            send_json_response(['success' => false, 'error' => 'User ID is required'], 400);
        }
        $pdo->prepare("DELETE FROM `users` WHERE `id` = ?")->execute([$userId]);
        send_json_response(['success' => true, 'message' => "User {$userId} deleted from MySQL"]);
        break;

    // -------------------------------------------------------------
    // 3. OPERATORS MANAGEMENT (REAL MYSQL)
    // -------------------------------------------------------------
    case 'get_operators':
        $stmt = $pdo->query("SELECT * FROM `operators` ORDER BY `total_turnover` DESC");
        $ops = $stmt->fetchAll();
        foreach ($ops as &$op) {
            $op['allowed_currencies'] = json_decode($op['allowed_currencies_json'] ?? '[]', true);
        }
        send_json_response(['success' => true, 'operators' => $ops]);
        break;

    case 'get_operator':
        $opId = $input['id'] ?? ($input['operatorId'] ?? '');
        $stmt = $pdo->prepare("SELECT * FROM `operators` WHERE `id` = ? OR `code` = ? OR `api_key` = ? LIMIT 1");
        $stmt->execute([$opId, $opId, $opId]);
        $op = $stmt->fetch();
        if ($op) {
            $op['allowed_currencies'] = json_decode($op['allowed_currencies_json'] ?? '[]', true);
            send_json_response(['success' => true, 'operator' => $op]);
        } else {
            send_json_response(['success' => false, 'error' => 'Operator not found'], 404);
        }
        break;

    case 'save_operator':
        $id = $input['id'] ?? ('op_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $input['code'] ?? uniqid())));
        $name = $input['name'] ?? 'Partner Casino';
        $code = strtoupper($input['code'] ?? 'CASINO');
        $email = $input['email'] ?? 'support@casino.com';
        $country = $input['country'] ?? 'Global';
        $currency = $input['currency'] ?? 'BDT';
        $currencies = json_encode($input['allowedCurrencies'] ?? [$currency], JSON_UNESCAPED_UNICODE);
        $apiKey = $input['apiKey'] ?? ($input['api_key'] ?? ('np_live_key_' . bin2hex(random_bytes(8))));
        $apiSecret = $input['apiSecret'] ?? ($input['api_secret'] ?? ('np_sec_live_' . bin2hex(random_bytes(16))));
        $webhookUrl = $input['webhookUrl'] ?? ($input['webhook_url'] ?? null);
        $webhookSecret = $input['webhookSecret'] ?? ($input['webhook_secret'] ?? ('whsec_' . bin2hex(random_bytes(12))));
        $status = $input['status'] ?? 'ACTIVE';
        $balance = isset($input['companyBalance']) ? (float)$input['companyBalance'] : (isset($input['company_balance']) ? (float)$input['company_balance'] : 500000.00);

        $stmtCheck = $pdo->prepare("SELECT id FROM `operators` WHERE `id` = ? OR `code` = ?");
        $stmtCheck->execute([$id, $code]);
        $existing = $stmtCheck->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE `operators` SET 
                `name` = ?, `email` = ?, `country` = ?, `currency` = ?, `allowed_currencies_json` = ?, `webhook_url` = ?, `status` = ?, `company_balance` = ?, `updated_at` = ?
                WHERE `id` = ?");
            $stmt->execute([$name, $email, $country, $currency, $currencies, $webhookUrl, $status, $balance, date('Y-m-d H:i:s'), $existing['id']]);
            $opId = $existing['id'];
        } else {
            $stmt = $pdo->prepare("INSERT INTO `operators` 
                (`id`, `name`, `code`, `email`, `country`, `currency`, `allowed_currencies_json`, `api_key`, `api_secret`, `webhook_url`, `webhook_secret`, `company_balance`, `status`, `created_at`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $name, $code, $email, $country, $currency, $currencies, $apiKey, $apiSecret, $webhookUrl, $webhookSecret, $balance, $status, date('Y-m-d H:i:s')]);
            $opId = $id;
        }

        send_json_response(['success' => true, 'id' => $opId, 'message' => 'Operator saved in MySQL']);
        break;

    case 'delete_operator':
        $opId = $input['id'] ?? '';
        if (empty($opId)) {
            send_json_response(['success' => false, 'error' => 'Operator ID is required'], 400);
        }
        $pdo->prepare("DELETE FROM `operators` WHERE `id` = ?")->execute([$opId]);
        send_json_response(['success' => true, 'message' => "Operator {$opId} deleted from MySQL"]);
        break;

    case 'topup_operator':
        $opId = $input['id'] ?? ($input['operatorId'] ?? 'op_bengalbet');
        $amount = (float)($input['amount'] ?? 0);
        if ($amount <= 0) {
            send_json_response(['success' => false, 'error' => 'Invalid top-up amount'], 400);
        }
        $pdo->prepare("UPDATE `operators` SET `company_balance` = `company_balance` + ? WHERE `id` = ?")->execute([$amount, $opId]);
        $fetchOp = $pdo->prepare("SELECT `id`, `name`, `currency`, `company_balance` FROM `operators` WHERE `id` = ? LIMIT 1");
        $fetchOp->execute([$opId]);
        $updated = $fetchOp->fetch();
        send_json_response(['success' => true, 'message' => "Operator {$opId} topped up by {$amount}", 'operator' => $updated]);
        break;

    // -------------------------------------------------------------
    // 4. PLAYERS & BALANCES (REAL MYSQL)
    // -------------------------------------------------------------
    case 'get_players':
        $opId = $input['operatorId'] ?? null;
        if ($opId && $opId !== 'ALL') {
            $stmt = $pdo->prepare("SELECT * FROM `players` WHERE `operator_id` = ? ORDER BY `balance` DESC");
            $stmt->execute([$opId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM `players` ORDER BY `balance` DESC LIMIT 150");
        }
        send_json_response(['success' => true, 'players' => $stmt->fetchAll()]);
        break;

    case 'save_player':
        $id = $input['id'] ?? ('ply_' . uniqid());
        $opId = $input['operatorId'] ?? 'op_bengalbet';
        $name = $input['name'] ?? ($input['username'] ?? 'Player');
        $currency = $input['currency'] ?? 'BDT';
        $balance = (float)($input['balance'] ?? 1000.00);
        $status = $input['status'] ?? 'ACTIVE';

        $check = $pdo->prepare("SELECT `id` FROM `players` WHERE `id` = ? LIMIT 1");
        $check->execute([$id]);
        if ($check->fetch()) {
            $pdo->prepare("UPDATE `players` SET `name` = ?, `balance` = ?, `status` = ?, `last_active` = ? WHERE `id` = ?")
                ->execute([$name, $balance, $status, date('Y-m-d H:i:s'), $id]);
        } else {
            $pdo->prepare("INSERT INTO `players` (`id`, `operator_id`, `name`, `currency`, `balance`, `status`, `registered_at`, `last_active`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
                ->execute([$id, $opId, $name, $currency, $balance, $status, date('Y-m-d H:i:s'), date('Y-m-d H:i:s')]);
        }
        send_json_response(['success' => true, 'id' => $id, 'message' => 'Player saved in MySQL']);
        break;

    case 'get_player_balance':
        $playerId = $input['playerId'] ?? '';
        $opId = $input['operatorId'] ?? '';
        $stmt = $pdo->prepare("SELECT balance, currency, name FROM `players` WHERE `id` = ? AND (`operator_id` = ? OR ? = '') LIMIT 1");
        $stmt->execute([$playerId, $opId, $opId]);
        $player = $stmt->fetch();
        if ($player) {
            send_json_response(['success' => true, 'balance' => (float)$player['balance'], 'currency' => $player['currency'], 'name' => $player['name']]);
        } else {
            send_json_response(['success' => false, 'error' => 'Player not found'], 404);
        }
        break;

    case 'update_player_balance':
        $playerId = $input['playerId'] ?? '';
        $opId = $input['operatorId'] ?? 'op_bengalbet';
        $amount = (float)($input['amount'] ?? 0);
        $type = strtoupper($input['type'] ?? 'DEBIT'); // 'DEBIT' or 'CREDIT'
        $gameId = $input['gameId'] ?? 'game_aviator_pro';
        $reference = $input['reference'] ?? ($input['roundId'] ?? ('ref_' . uniqid()));

        $stmt = $pdo->prepare("SELECT * FROM `players` WHERE `id` = ?");
        $stmt->execute([$playerId]);
        $player = $stmt->fetch();

        $now = date('Y-m-d H:i:s');
        if (!$player) {
            // Auto register player if first time
            $initialBal = ($type === 'CREDIT') ? $amount : 1000.00;
            $stmtInsert = $pdo->prepare("INSERT INTO `players` (`id`, `operator_id`, `name`, `currency`, `balance`, `last_active`, `registered_at`) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmtInsert->execute([$playerId, $opId, 'Player ' . substr($playerId, -4), 'BDT', $initialBal, $now, $now]);
            $prevBal = $initialBal;
            $newBal = $initialBal;
        } else {
            $prevBal = (float)$player['balance'];
            $newBal = ($type === 'DEBIT') ? max(0, $prevBal - $amount) : ($prevBal + $amount);
            $stmtUpdate = $pdo->prepare("UPDATE `players` SET `balance` = ?, `last_active` = ? WHERE `id` = ?");
            $stmtUpdate->execute([$newBal, $now, $playerId]);
        }

        // Record in transactions
        $trxId = 'trx_' . uniqid();
        $stmtTrx = $pdo->prepare("INSERT INTO `transactions` (`id`, `operator_id`, `player_id`, `type`, `amount`, `status`, `currency`, `reference_id`, `created_at`) VALUES (?, ?, ?, ?, ?, 'SUCCESS', ?, ?, ?)");
        $stmtTrx->execute([$trxId, $opId, $playerId, $type, $amount, $player['currency'] ?? 'BDT', $reference, $now]);

        // Record in Provably Fair Ledger Entries
        $ledgId = 'ledg_' . uniqid();
        $pdo->prepare("INSERT INTO `ledger_entries` (`id`, `operator_id`, `player_id`, `type`, `amount`, `balance_before`, `balance_after`, `currency`, `reference`, `description`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
            ->execute([$ledgId, $opId, $playerId, $type, $amount, $prevBal, $newBal, $player['currency'] ?? 'BDT', $reference, "Balance update for $gameId", $now]);

        send_json_response(['success' => true, 'newBalance' => $newBal, 'previousBalance' => $prevBal, 'transactionId' => $trxId]);
        break;

    // -------------------------------------------------------------
    // 5. SESSIONS & LAUNCH URLS
    // -------------------------------------------------------------
    case 'create_session':
        $token = 'np_sess_' . bin2hex(random_bytes(16));
        $opId = $input['operatorId'] ?? 'op_bengalbet';
        $playerId = $input['playerId'] ?? 'usr-889922';
        $gameId = $input['gameId'] ?? 'game-neextplay-aviator-pro';
        $currency = $input['currency'] ?? 'BDT';
        $domain = $input['domain'] ?? 'http://localhost:3000';
        $launchUrl = "{$domain}/?embed=true&token={$token}&gameId={$gameId}";

        $now = date('Y-m-d H:i:s');
        $expires = date('Y-m-d H:i:s', strtotime('+2 hours'));

        $stmt = $pdo->prepare("INSERT INTO `sessions` 
            (`token`, `operator_id`, `player_id`, `game_id`, `currency`, `launch_url`, `domain`, `created_at`, `expires_at`, `status`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')");
        $stmt->execute([$token, $opId, $playerId, $gameId, $currency, $launchUrl, $domain, $now, $expires]);

        send_json_response([
            'success' => true,
            'token' => $token,
            'launchUrl' => $launchUrl,
            'expiresAt' => $expires
        ]);
        break;

    case 'verify_session':
        $token = $input['token'] ?? '';
        $stmt = $pdo->prepare("SELECT * FROM `sessions` WHERE `token` = ? AND `status` = 'ACTIVE' LIMIT 1");
        $stmt->execute([$token]);
        $session = $stmt->fetch();
        if ($session) {
            send_json_response(['success' => true, 'session' => $session]);
        } else {
            send_json_response(['success' => false, 'error' => 'Invalid or expired session token'], 401);
        }
        break;

    // -------------------------------------------------------------
    // 6. GAMES CATALOG
    // -------------------------------------------------------------
    case 'get_games':
        $stmt = $pdo->query("SELECT * FROM `games` ORDER BY `category`, `title`");
        send_json_response(['success' => true, 'games' => $stmt->fetchAll()]);
        break;

    case 'save_game':
        $id = $input['id'] ?? ('game_' . uniqid());
        $title = $input['title'] ?? ($input['name'] ?? 'New Game');
        $type = strtoupper($input['type'] ?? 'SLOT');
        $category = strtolower($input['category'] ?? 'slot');
        $rtp = (float)($input['rtp'] ?? 96.5);
        $provider = $input['provider'] ?? 'NeextPlay Studios';
        $status = $input['status'] ?? 'ACTIVE';

        $stmt = $pdo->prepare("INSERT INTO `games` (`id`, `title`, `type`, `category`, `rtp`, `provider`, `status`, `created_at`) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `type` = VALUES(`type`), `category` = VALUES(`category`), `rtp` = VALUES(`rtp`), `provider` = VALUES(`provider`), `status` = VALUES(`status`)");
        $stmt->execute([$id, $title, $type, $category, $rtp, $provider, $status]);

        send_json_response(['success' => true, 'message' => "Game '{$title}' saved in MySQL"]);
        break;

    case 'delete_game':
        $id = $input['id'] ?? '';
        $pdo->prepare("DELETE FROM `games` WHERE `id` = ?")->execute([$id]);
        send_json_response(['success' => true, 'message' => "Game {$id} deleted from MySQL"]);
        break;

    // -------------------------------------------------------------
    // 7. LIVE CASINO TABLES
    // -------------------------------------------------------------
    case 'get_live_tables':
        $stmt = $pdo->query("SELECT * FROM `live_tables` ORDER BY `name`");
        send_json_response(['success' => true, 'tables' => $stmt->fetchAll()]);
        break;

    case 'save_live_table':
        $id = $input['id'] ?? ('lt_' . uniqid());
        $name = $input['name'] ?? 'Live Table';
        $gameType = strtoupper($input['gameType'] ?? ($input['game_type'] ?? 'ROULETTE'));
        $dealerName = $input['dealerName'] ?? ($input['dealer_name'] ?? 'Dealer');
        $status = $input['status'] ?? 'ACTIVE';
        $minBet = (float)($input['minBet'] ?? ($input['min_bet'] ?? 1.00));
        $maxBet = (float)($input['maxBet'] ?? ($input['max_bet'] ?? 5000.00));
        $players = (int)($input['currentPlayers'] ?? ($input['current_players'] ?? 10));

        $stmt = $pdo->prepare("INSERT INTO `live_tables` (`id`, `name`, `game_type`, `dealer_name`, `status`, `min_bet`, `max_bet`, `current_players`, `created_at`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `game_type` = VALUES(`game_type`), `dealer_name` = VALUES(`dealer_name`), `status` = VALUES(`status`), `min_bet` = VALUES(`min_bet`), `max_bet` = VALUES(`max_bet`), `current_players` = VALUES(`current_players`)");
        $stmt->execute([$id, $name, $gameType, $dealerName, $status, $minBet, $maxBet, $players]);

        send_json_response(['success' => true, 'message' => "Live table '{$name}' saved in MySQL"]);
        break;

    // -------------------------------------------------------------
    // 8. LEDGER ENTRIES & AUDIT LOGS
    // -------------------------------------------------------------
    case 'get_ledger_entries':
        $opId = $input['operatorId'] ?? null;
        if ($opId && $opId !== 'ALL') {
            $stmt = $pdo->prepare("SELECT * FROM `ledger_entries` WHERE `operator_id` = ? ORDER BY `created_at` DESC LIMIT 100");
            $stmt->execute([$opId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM `ledger_entries` ORDER BY `created_at` DESC LIMIT 100");
        }
        send_json_response(['success' => true, 'ledger' => $stmt->fetchAll()]);
        break;

    case 'get_audit_logs':
        $opId = $input['operatorId'] ?? null;
        if ($opId && $opId !== 'ALL') {
            $stmt = $pdo->prepare("SELECT * FROM `audit_logs` WHERE `operator_id` = ? ORDER BY `timestamp` DESC LIMIT 100");
            $stmt->execute([$opId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM `audit_logs` ORDER BY `timestamp` DESC LIMIT 100");
        }
        send_json_response(['success' => true, 'logs' => $stmt->fetchAll()]);
        break;

    case 'add_audit_log':
        $id = 'aud_' . uniqid();
        $opId = $input['operatorId'] ?? null;
        $actor = $input['actor'] ?? 'SYSTEM';
        $logAction = $input['eventAction'] ?? ($input['action'] ?? 'EVENT');
        $category = $input['category'] ?? 'SECURITY';
        $details = $input['details'] ?? '';
        $ip = $input['ip'] ?? '127.0.0.1';
        $now = date('Y-m-d H:i:s');

        $pdo->prepare("INSERT INTO `audit_logs` (`id`, `operator_id`, `actor`, `action`, `category`, `details`, `ip`, `timestamp`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
            ->execute([$id, $opId, $actor, $logAction, $category, $details, $ip, $now]);

        send_json_response(['success' => true, 'id' => $id]);
        break;

    // -------------------------------------------------------------
    // 9. WIN CONTROLS & RTP
    // -------------------------------------------------------------
    case 'get_win_controls':
        $stmt = $pdo->query("SELECT * FROM `win_controls`");
        $rows = $stmt->fetchAll();
        $controls = [];
        foreach ($rows as $r) {
            $controls[$r['config_key']] = json_decode($r['config_json'], true);
        }
        send_json_response(['success' => true, 'controls' => $controls]);
        break;

    case 'save_win_controls':
        $key = $input['key'] ?? 'global_rtp_engine';
        $config = $input['config'] ?? [];
        $configJson = json_encode($config, JSON_UNESCAPED_UNICODE);

        $stmt = $pdo->prepare("INSERT INTO `win_controls` (`id`, `config_key`, `config_json`, `updated_at`) 
            VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `config_json` = VALUES(`config_json`), `updated_at` = VALUES(`updated_at`)");
        $stmt->execute(['wc-' . uniqid(), $key, $configJson, date('Y-m-d H:i:s')]);

        send_json_response(['success' => true, 'message' => "Win controls saved in MySQL for '{$key}'"]);
        break;

    // -------------------------------------------------------------
    // 10. ROUND BETS & BETTING
    // -------------------------------------------------------------
    case 'get_round_bets':
        $stmt = $pdo->query("SELECT * FROM `round_bets` ORDER BY `timestamp` DESC LIMIT 100");
        send_json_response(['success' => true, 'bets' => $stmt->fetchAll()]);
        break;

    case 'record_bet':
        $id = $input['id'] ?? ('bet_' . uniqid());
        $roundId = $input['roundId'] ?? ('rnd_' . uniqid());
        $opId = $input['operatorId'] ?? 'op_bengalbet';
        $playerId = $input['playerId'] ?? 'usr-889922';
        $gameId = $input['gameId'] ?? 'game_aviator_pro';
        $betAmount = (float)($input['betAmount'] ?? 0);
        $winAmount = (float)($input['winAmount'] ?? 0);
        $multiplier = (float)($input['multiplier'] ?? 1.0);
        $status = $input['status'] ?? ($winAmount > 0 ? 'WON' : 'LOST');
        $currency = $input['currency'] ?? 'BDT';
        $ts = time();

        $stmt = $pdo->prepare("INSERT INTO `round_bets` (`id`, `round_id`, `operator_id`, `player_id`, `game_id`, `bet_amount`, `win_amount`, `multiplier`, `status`, `currency`, `timestamp`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $roundId, $opId, $playerId, $gameId, $betAmount, $winAmount, $multiplier, $status, $currency, $ts, date('Y-m-d H:i:s')]);

        // Update operator statistics in MySQL
        $pdo->prepare("UPDATE `operators` SET 
            `total_turnover` = `total_turnover` + ?,
            `total_payout` = `total_payout` + ?,
            `total_ggr` = `total_ggr` + (? - ?),
            `total_bets_count` = `total_bets_count` + 1,
            `total_wins_count` = `total_wins_count` + ?
            WHERE `id` = ?")
            ->execute([$betAmount, $winAmount, $betAmount, $winAmount, ($winAmount > 0 ? 1 : 0), $opId]);

        send_json_response(['success' => true, 'betId' => $id, 'message' => 'Bet recorded in MySQL']);
        break;

    default:
        send_json_response(['success' => false, 'error' => "Unknown action '{$action}'"], 404);
}
