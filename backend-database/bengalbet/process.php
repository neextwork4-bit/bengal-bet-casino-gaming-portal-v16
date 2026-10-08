<?php
/**
 * BengalBet Dedicated Database Migration & Auto-Process Script
 * Auto-creates database, creates/updates all tables, columns, indexes, and seeds default records.
 * Can be run stand-alone or included by /backend-database/process.php
 */

require_once __DIR__ . '/config.php';

function run_bengalbet_process($returnArray = false, $existingPdo = null, $customDbName = null) {
    $startTime = microtime(true);
    $log = [];
    $targetDb = $customDbName ?: BB_DB_NAME;
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
            ensure_database_exists(BB_DB_HOST, BB_DB_PORT, BB_DB_USER, BB_DB_PASS, $targetDb);
            $log[] = "Verified database: " . $targetDb;

            // 2. Connect to database
            $pdo = get_bengalbet_db(true);
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

        // 5. Seed Default VIP Tiers (VIP0 to VIP10)
        $vipCount = (int)$pdo->query("SELECT COUNT(*) FROM `vip_tiers`")->fetchColumn();
        if ($vipCount === 0) {
            $defaultVipTiers = [
                [0, 'VIP0', 'bronze', 2000, '2,000.00', 500, 0, 0, 0, 0, 0.20, 0.10, 'নতুন সদস্য লেভেল'],
                [1, 'VIP1', 'silver', 20000, '20,000.00', 2000, 50, 20, 50, 50, 0.40, 0.30, 'সিলভার ভিআইপি সদস্য'],
                [2, 'VIP2', 'silver', 100000, '100,000.00', 10000, 180, 60, 150, 100, 0.60, 0.40, 'সিলভার স্টার সদস্য'],
                [3, 'VIP3', 'gold', 500000, '500,000.00', 50000, 588, 188, 500, 200, 0.80, 0.50, 'গোল্ড ভিআইপি সদস্য'],
                [4, 'VIP4', 'gold', 2000000, '2,000,000.00', 200000, 1888, 588, 1500, 500, 1.00, 0.70, 'গোল্ড মাস্টার সদস্য'],
                [5, 'VIP5', 'platinum', 5000000, '5,000,000.00', 500000, 5888, 1888, 5000, 1000, 1.20, 0.90, 'প্লাটিনাম এলিট সদস্য'],
                [6, 'VIP6', 'platinum', 10000000, '10,000,000.00', 1000000, 12888, 3888, 10000, 2000, 1.50, 1.10, 'প্লাটিনাম কিং সদস্য'],
                [7, 'VIP7', 'diamond', 25000000, '25,000,000.00', 2500000, 28888, 8888, 25000, 5000, 1.80, 1.30, 'ডায়মন্ড প্রিভিলেজ সদস্য'],
                [8, 'VIP8', 'diamond', 50000000, '50,000,000.00', 5000000, 58888, 18888, 50000, 10000, 2.20, 1.60, 'ডায়মন্ড রয়্যাল সদস্য'],
                [9, 'VIP9', 'crown', 100000000, '100,000,000.00', 10000000, 128888, 38888, 100000, 20000, 2.60, 1.80, 'ক্রাউন সুপার ভিআইপি'],
                [10, 'VIP10', 'crown', 200000000, '200,000,000.00', 20000000, 300000, 88888, 200000, 50000, 3.00, 2.00, 'রয়্যাল অ্যাম্বাসেডর কিং']
            ];

            $insertVip = $pdo->prepare("INSERT INTO `vip_tiers` 
                (`level`, `name`, `badge_type`, `target_bet`, `target_bet_display`, `deposit_target`, `upgrade_bonus`, `weekly_bonus`, `monthly_bonus`, `birthday_bonus`, `slot_rebate`, `live_rebate`, `description`, `status`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
            foreach ($defaultVipTiers as $tier) {
                $insertVip->execute($tier);
            }
            $stats['rows_seeded']['vip_tiers'] = count($defaultVipTiers);
            $log[] = "Seeded " . count($defaultVipTiers) . " VIP tiers";
        }

        // 6. Seed Default Site Settings
        $settingsCount = (int)$pdo->query("SELECT COUNT(*) FROM `site_settings`")->fetchColumn();
        if ($settingsCount === 0) {
            $defaultSettings = [
                'bkash_number' => '01712345678',
                'nagad_number' => '01812345678',
                'rocket_number' => '01912345678',
                'usdt_address' => 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                'min_deposit' => 300,
                'max_deposit' => 100000,
                'min_withdraw' => 500,
                'max_withdraw' => 50000,
                'maintenance_mode' => 0,
                'game_engine' => json_encode([
                    'globalRtp' => 96.5,
                    'engineMode' => 'normal',
                    'volatility' => 'medium',
                    'dynamicBalancing' => true
                ], JSON_UNESCAPED_UNICODE),
                'site_notice' => json_encode([
                    'enabled' => true,
                    'titleBn' => 'বেঙ্গলবেটে স্বাগতম! মেগা ১০০% ডিপোজিট বোনাস ও প্রতিদিন ২০০% রেবেট',
                    'titleEn' => 'Welcome to BengalBet! 100% First Deposit Bonus & Instant Rebates',
                    'contentBn' => 'বাংলাদেশের এক নম্বর গেমিং প্ল্যাটফর্মে প্রতিদিন জিতুন বিশাল জ্যাকপট ও রিওয়ার্ড!',
                    'contentEn' => 'Play the highest RTP slot & crash games in Bangladesh with bKash/Nagad instant cashout!'
                ], JSON_UNESCAPED_UNICODE)
            ];

            $insertSetting = $pdo->prepare("INSERT INTO `site_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES (?, ?, ?)");
            $now = date('Y-m-d H:i:s');
            foreach ($defaultSettings as $k => $v) {
                $insertSetting->execute([$k, is_string($v) ? $v : (string)$v, $now]);
            }
            $stats['rows_seeded']['site_settings'] = count($defaultSettings);
            $log[] = "Seeded default site settings";
        }

        // 7. Seed Default Admin & Player Accounts if users table empty
        $usersCount = (int)$pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
        if ($usersCount === 0) {
            $defaultUsers = [
                [
                    'id' => 'usr-889922',
                    'username' => 'BengalMaster',
                    'phone' => '01700000000',
                    'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                    'balance' => 25800.50,
                    'vip_level' => 3,
                    'vip_exp' => 4500,
                    'vip_max_exp' => 5000,
                    'free_spins' => 8,
                    'red_packets_available' => 3,
                    'golden_eggs_available' => 2,
                    'unread_notifications' => 5,
                    'referral_code' => 'BENGAL8899',
                    'total_earnings' => 15200.00,
                    'referred_friends_count' => 14,
                    'avatar' => '/src/assets/images/real_tiger_face_1790007904695.jpg',
                    'real_name' => 'Royal Bengal Master',
                    'email' => 'master@bengalbet.vip',
                    'status' => 'active',
                    'created_at' => date('Y-m-d H:i:s')
                ],
                [
                    'id' => 'usr-demo01',
                    'username' => 'ShakibPlayer',
                    'phone' => '01811223344',
                    'password_hash' => password_hash('123456', PASSWORD_DEFAULT),
                    'balance' => 5400.00,
                    'vip_level' => 1,
                    'vip_exp' => 1200,
                    'vip_max_exp' => 2000,
                    'free_spins' => 3,
                    'red_packets_available' => 1,
                    'golden_eggs_available' => 1,
                    'unread_notifications' => 2,
                    'referral_code' => 'SHAKIB77',
                    'total_earnings' => 2400.00,
                    'referred_friends_count' => 3,
                    'avatar' => '/src/assets/images/tiger_face_cutout.png',
                    'real_name' => 'Shakib Al Hasan',
                    'email' => 'shakib@bengalbet.vip',
                    'status' => 'active',
                    'created_at' => date('Y-m-d H:i:s')
                ]
            ];

            $insertUser = $pdo->prepare("INSERT INTO `users` 
                (`id`, `username`, `phone`, `password_hash`, `balance`, `vip_level`, `vip_exp`, `vip_max_exp`, `free_spins`, `red_packets_available`, `golden_eggs_available`, `unread_notifications`, `referral_code`, `total_earnings`, `referred_friends_count`, `avatar`, `real_name`, `email`, `status`, `created_at`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($defaultUsers as $u) {
                $insertUser->execute(array_values($u));
            }
            $stats['rows_seeded']['users'] = count($defaultUsers);
            $log[] = "Seeded " . count($defaultUsers) . " default users";
        }

        // 8. Seed Default Games Suite into MySQL if empty
        $gamesCount = (int)$pdo->query("SELECT COUNT(*) FROM `games`")->fetchColumn();
        if ($gamesCount === 0) {
            $defaultGames = [
                ['game-aviator', 'Aviator Crash', 'এভিয়েটর ক্র্যাশ', 'SPRIBE', 'crash', '/src/assets/images/aviator_game_logo_1791312129943.jpg', 1, 0, 48000000.00, 97.00, 125000, 'High', 'active'],
                ['game-super-ace', 'Super Ace Deluxe', 'সুপার এস ডিলাক্স', 'JILI', 'slot', '/src/assets/images/super_ace_2_icon_1789325204493.jpg', 1, 0, 15000000.00, 97.40, 89400, 'Medium', 'active'],
                ['game-fortune-tree', 'Fortune Tree', 'ফরচুন ট্রি (ভাগ্য গাছ)', 'JILI', 'slot', '/src/assets/images/fortune_tree_icon_1789326882984.jpg', 1, 0, 14200000.00, 96.80, 41200, 'Medium', 'active'],
                ['game-alibaba-cave', 'Alibaba Cave', 'আলিবাবা কেভ অফ ট্রেজার্স', 'JILI', 'slot', '/src/assets/images/alibaba_cave_icon_1789327670216.jpg', 1, 1, 19800000.00, 97.20, 52400, 'High', 'active'],
                ['game-crazy-777', 'Crazy 777 Deluxe', 'ক্রেজি ৭৭৭ ডিলাক্স', 'JILI', 'slot', '/src/assets/images/crazy_777_icon_1789328037942.jpg', 1, 0, 22000000.00, 96.90, 63800, 'Medium', 'active'],
                ['game-seven-coins', '777 Coins Hold & Win', '৭৭৭ কয়েনস হোল্ড & উইন', 'JILI', 'slot', '/src/assets/images/seven_coins_icon_1789328050971.jpg', 1, 1, 26500000.00, 97.10, 47900, 'High', 'active'],
                ['game-anubis-wrath', 'Anubis Wrath', 'আনুবিস র্যাথ', 'Pocket Games Soft', 'slot', '/src/assets/images/anubis_wrath_icon_1789328514214.jpg', 1, 1, 31200000.00, 96.85, 38900, 'Extreme', 'active'],
                ['game-pinata-wins', 'Piñata Wins', 'পিনাটা উইনস (মাল্টিপ্লায়ার)', 'Pocket Games Soft', 'slot', '/src/assets/images/pinata_wins_icon_1789328528210.jpg', 1, 1, 18500000.00, 96.75, 41500, 'Medium', 'active'],
                ['game-money-coming', 'Money Coming', 'মানি কামিং', 'JILI', 'slot', '/src/assets/images/money_coming_icon_1789330321878.jpg', 1, 1, 15500000.00, 97.80, 46800, 'High', 'active'],
                ['game-magic-ace', 'Magic Ace', 'ম্যাজিক এস (ওয়াইল্ড লক)', 'JILI', 'slot', '/src/assets/images/magic_ace_icon_1789330338430.jpg', 1, 1, 18200000.00, 97.60, 51200, 'Extreme', 'active'],
                ['game-sweet-bonanza', 'Sweet Bonanza', 'সুইট বোনানজা (ক্যান্ডি)', 'Pragmatic Play', 'slot', '/src/assets/images/sweet_bonanza_icon_1789330361177.jpg', 1, 1, 24500000.00, 96.60, 58900, 'High', 'active'],
                ['game-treasures-aztec', 'Treasures of Aztec', 'ট্রেজার্স অফ আজটেক', 'Pocket Games Soft', 'slot', '/src/assets/images/treasures_aztec_icon_1789330776428.jpg', 1, 1, 28500000.00, 96.71, 48900, 'High', 'active'],
                ['game-gates-of-olympus', 'Gates of Olympus', 'গেটস অফ অলিম্পাস', 'Pragmatic Play', 'slot', '/src/assets/images/gates_olympus_icon_1789330801506.jpg', 1, 1, 32000000.00, 96.50, 64200, 'Extreme', 'active'],
                ['game-circus-joker', 'Circus Joker 4096', 'সার্কাস জোকার ৪০৯৬', 'JILI', 'slot', '/src/assets/images/circus_joker_icon_1789330788237.jpg', 1, 1, 16800000.00, 97.20, 39600, 'High', 'active'],
                ['game-fortune-gems-3', 'Fortune Gems 3', 'ফরচুন জেমস ৩', 'JILI', 'slot', '/src/assets/images/fortune_gems_3_1789325632226.jpg', 1, 0, 17200000.00, 97.10, 48500, 'Medium', 'active'],
                ['game-boxing-king', 'Boxing King', 'বক্সিং কিং', 'JILI', 'slot', '/src/assets/images/boxing_king_icon_1789325912862.jpg', 1, 0, 14800000.00, 97.00, 36200, 'High', 'active'],
                ['game-wild-bounty', 'Wild Bounty Showdown', 'ওয়াইল্ড বাউন্টি শোডাউন', 'Pocket Games Soft', 'slot', '/src/assets/images/wild_bounty_showdown_1789326457687.jpg', 1, 0, 19400000.00, 96.75, 42100, 'High', 'active'],
                ['game-happy-fishing', 'Happy Fishing', 'হ্যাপি ফিশিং', 'JILI', 'fishing', '/src/assets/images/happy_fishing_icon_1789326697876.jpg', 1, 0, 9200000.00, 97.10, 31200, 'Medium', 'active'],
                ['game-head-tail', 'Head & Tail 3D', 'হেড & টেইল থ্রিডি', 'KingMaker', 'poker', '/src/assets/images/head_tail_icon_1789325177529.jpg', 1, 0, 5000000.00, 98.00, 24100, 'Low', 'active'],
                ['game-lightning-roulette', 'Lightning Roulette', 'লাইটনিং রুলেট', 'Evolution Gaming', 'live', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=500&q=85', 1, 0, 0.00, 97.30, 52000, 'High', 'active'],
                ['game-cricket-live', 'Cricket Live Pro', 'লাইভ ক্রিকেট বেটিং', 'Saba Sports', 'sports', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=500&q=85', 1, 1, 0.00, 96.80, 62000, 'Medium', 'active']
            ];

            $insertGame = $pdo->prepare("INSERT INTO `games` 
                (`id`, `name`, `name_bn`, `provider`, `category`, `image`, `is_hot`, `is_new`, `jackpot`, `rtp`, `players_count`, `volatility`, `status`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($defaultGames as $g) {
                $insertGame->execute($g);
            }
            $stats['rows_seeded']['games'] = count($defaultGames);
            $log[] = "Seeded " . count($defaultGames) . " casino games";
        }

        // 9. Seed Default Promotions into MySQL if empty
        $promoCount = (int)$pdo->query("SELECT COUNT(*) FROM `promotions`")->fetchColumn();
        if ($promoCount === 0) {
            $defaultPromotions = [
                ['promo-mystery-23', 'রহস্যময় পুরস্কার প্রতি মাসের ২৩ তারিখ', 'hot', 'মাসের ১ থেকে ২২ তারিখ বাজি ধরলে ২৩ তারিখ সন্ধ্যা ৬টায় অটোমেটিক বোনাস ড্র!', '/src/assets/images/bn_promo_mystery_1790173769456.jpg', '৳ ১,০০০ - ৳ ৫০,০০০', 'মাসের ১-২২ তারিখ ন্যূনতম ৫০০ টাকা বাজি ধরতে হবে। ১x ভেগারিং।', 'active', date('Y-m-d H:i:s')],
                ['promo-referral-300', '১ জনকে আমন্ত্রণ করুন, আয় করুন ৩০০ টাকা + ০.৭% ডিপোজিট + ১% বেট', 'hot', 'প্রতিটি সফল রেফারেলে ৩০০ টাকা এবং লাইফটাইম কমিশন উপভোগ করুন।', '/src/assets/images/bn_promo_invite_1790173787979.jpg', '৳৩০০ + ১% কমিশন', 'আমন্ত্রিত বন্ধুর প্রথম ডিপোজিট বাধ্যতামূলক। কমিশন প্রতিদিন অটো যোগ হয়।', 'active', date('Y-m-d H:i:s')],
                ['promo-first-deposit', 'প্রথম জমার উপর ৪৭% পর্যন্ত স্বাগতম বোনাস', 'deposit', 'নতুন রেজিস্ট্রেশন করে প্রথম জমার সাথে সাথেই ৪৭% বোনাস ক্রেডিট!', '/src/assets/images/bn_promo_first_dep_1790173806277.jpg', 'সর্বোচ্চ ৳২০,০০০', 'ন্যূনতম ডিপোজিট ৳৫০০। ভেগারিং ১x মাত্র। সমস্ত গেমে কার্যকর।', 'active', date('Y-m-d H:i:s')],
                ['promo-vip-upgrade', 'ভিআইপি এক্সক্লুসিভ লেভেল আপগ্রেড ও মাসিক ক্যাশব্যাক', 'vip', 'ভিআইপি স্তর বাড়ার সাথে সাথে ৩ লাখ টাকা পর্যন্ত নগদ পুরস্কার।', '/src/assets/images/bn_promo_vip_1790173825343.jpg', 'সর্বোচ্চ ৳৩,০০,০০০ নগদ', 'টার্গেট বাজি সম্পন্ন হলে অটো আনলক। প্রতি লেভেলে একবার ক্লেইমেবল।', 'active', date('Y-m-d H:i:s')],
                ['promo-daily-slots', 'প্রতিদিনের স্লট বাজিতে ১০% অতিরিক্ত রিলোড বোনাস', 'slot', 'প্রতিদিন স্লট স্পিনে অতিরিক্ত ক্যাশ রিওয়ার্ড জিতুন।', '/src/assets/images/bn_promo_slots_1790173843512.jpg', '১০% রিলোড বোনাস', 'স্লট গেমসে দৈনিক ১০০+ স্পিন। ১x ভেগারিং।', 'active', date('Y-m-d H:i:s')],
                ['promo-app-download', 'অ্যাপ ডাউনলোড বোনাস ৳ ১৮৮ ফ্রি ক্যাশ', 'special', 'BengalBet অফিসিয়াল অ্যান্ড্রয়েড/আইওএস অ্যাপ ইন্সটল করলেই ফ্রি ক্যাশ!', '/src/assets/images/bn_promo_app_1790173858946.jpg', '৳ ১৮৮ ফ্রি ক্যাশ', 'অ্যাপ লগইন করে প্রোফাইল থেকে ক্লেইম করুন।', 'active', date('Y-m-d H:i:s')],
                ['promo-loss-rescue', 'দৈনিক লস রেসকিউ ফান্ড - হারলেও পাবেন ৫% ব্যাক', 'hot', 'দৈনিক লসের উপর ৫% পর্যন্ত উদ্ধার তহবিল সরাসরি ক্যাশ ওয়ালেটে।', '/src/assets/images/bn_promo_rescue_1790173874285.jpg', '৫% পর্যন্ত উদ্ধার তহবিল', 'দৈনিক নেট লস ৫০০ টাকার বেশি হলে প্রযোজ্য।', 'active', date('Y-m-d H:i:s')],
                ['promo-golden-egg', 'সোনার ডিম ভেঙে জিতে নিন ৳ ৩,৮৮৮ পর্যন্ত ক্যাশ', 'special', 'গোল্ডেন এগ স্ম্যাশ করে সরাসরি ক্যাশ ও ফ্রি স্পিন জিতুন!', '/src/assets/images/bn_promo_egg_1790173893915.jpg', '৳ ৩,৮৮৮ পর্যন্ত ক্যাশ', 'প্রতি ডিপোজিটে ১টি ফ্রি স্ম্যাশ হ্যামার।', 'active', date('Y-m-d H:i:s')],
                ['promo-red-packet', 'রেড এনভেলপ রেইন - প্রতিদিন রাত ৮টায় লাল খাম বৃষ্টি', 'special', 'প্রতিদিন নির্দিষ্ট সময়ে লাল খাম উন্মুক্ত করে বোনাস জিতে নিন।', '/src/assets/images/bn_promo_packet_1790173911880.jpg', 'প্রতিদিন রাত ৮টায়', 'সক্রিয় একাউন্টে প্রতিদিন ২ বার সুযোগ।', 'active', date('Y-m-d H:i:s')],
                ['promo-iphone17', 'আইফোন ১৭ প্রো ম্যাক্স লাকি ড্র গিভঅ্যাওয়ে', 'special', 'মেগা ডিপোজিট ড্র-তে অংশ নিয়ে জিতে নিন ব্র্যান্ড নিউ আইফোন ১৭!', '/src/assets/images/bn_promo_iphone_1790173931015.jpg', 'iPhone 17 Pro Max', 'প্রতি ১,০০০ টাকা জমার জন্য ১টি লাকি ড্র টিকেট।', 'active', date('Y-m-d H:i:s')],
                ['promo-member-day', 'সুপার মেম্বার ডে - প্রতি মাসের ৭, ১৭ ও ২৭ তারিখ বিশেষ উপহার', 'hot', 'সদস্য দিবসে দ্বিগুণ রেবেট ও এক্সক্লুসিভ রিওয়ার্ড ড্র!', '/src/assets/images/bn_promo_member_1790173950780.jpg', 'ডাবল রেবেট & উপহার', 'মাসের ৭, ১৭ ও ২৭ তারিখে বিশেষ ইভেন্ট।', 'active', date('Y-m-d H:i:s')],
                ['promo-rebate', 'রিয়েল-টাইম আনলিমিটেড রেবেট ১.২% পর্যন্ত', 'hot', 'প্রতিটি বাজিতে তাৎক্ষণিক ক্যাশব্যাক রেবেট আপনার একাউন্টে যুক্ত হবে।', '/src/assets/images/bn_promo_rebate_1790173969832.jpg', '১.২% আনলিমিটেড রেবেট', 'কোনো টার্নওভার বাধ্যবাধকতা নেই। সাথে সাথে উইথড্রযোগ্য।', 'active', date('Y-m-d H:i:s')]
            ];

            $insertPromo = $pdo->prepare("INSERT INTO `promotions` 
                (`id`, `title`, `category`, `description`, `banner`, `bonus_value`, `rules`, `status`, `created_at`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($defaultPromotions as $p) {
                $insertPromo->execute($p);
            }
            $stats['rows_seeded']['promotions'] = count($defaultPromotions);
            $log[] = "Seeded " . count($defaultPromotions) . " promotions";
        }

        // 10. Seed Default Banners into MySQL if empty
        $bannerCount = (int)$pdo->query("SELECT COUNT(*) FROM `banners`")->fetchColumn();
        if ($bannerCount === 0) {
            $defaultBanners = [
                ['ban-first-deposit', 'প্রথম ডিপোজিট বোনাস ১০০%', 'ডিপোজিট করুন আর দ্বিগুণ ক্যাশ দিয়ে খেলুন', '/src/assets/images/bengal_deposit_banner_1790008299014.jpg', 'home', '/promotions', 'navigate', 1, 'active', date('Y-m-d H:i:s')],
                ['ban-refer-rewards', 'আমন্ত্রণ রিওয়ার্ডস & ১% আজীবন কমিশন', 'বন্ধুদের ইনভাইট করুন আর আয় করুন আনলিমিটেড', '/src/assets/images/bengalbet_refer_rewards_banner_1790186975892.jpg', 'home', '/refer', 'navigate', 2, 'active', date('Y-m-d H:i:s')],
                ['ban-vip-club', 'রয়্যাল বেঙ্গল ভিআইপি ক্লাব এক্সক্লুসিভ', 'ভিআইপি আপগ্রেডে ৩ লাখ টাকা পর্যন্ত বোনাস', '/src/assets/images/bengal_vip_banner_1790008315416.jpg', 'home', '/vip', 'navigate', 3, 'active', date('Y-m-d H:i:s')],
                ['ban-aviator-suite', 'এভিয়েটর প্রো মেগা ক্র্যাশ গেম', '৯৭% আরটিপি সহ দ্রুততম পেআউট', '/src/assets/images/aviator_banner_1791307837428.jpg', 'home', '/aviator-pro', 'game', 4, 'active', date('Y-m-d H:i:s')]
            ];

            $insertBanner = $pdo->prepare("INSERT INTO `banners` 
                (`id`, `title`, `subtitle`, `image`, `category`, `link_url`, `action_type`, `display_order`, `status`, `created_at`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($defaultBanners as $b) {
                $insertBanner->execute($b);
            }
            $stats['rows_seeded']['banners'] = count($defaultBanners);
            $log[] = "Seeded " . count($defaultBanners) . " banners";
        }

        // 11. Seed Rescue Fund Tiers if empty
        $rescueTiersCount = (int)$pdo->query("SELECT COUNT(*) FROM `rescue_tiers`")->fetchColumn();
        if ($rescueTiersCount === 0) {
            $defaultRescueTiers = [
                [1, 500, 2000, 3.00, 60, 1.00, 'লেভেল ১ রেসকিউ (৩%)', 'active'],
                [2, 2001, 5000, 4.00, 200, 1.00, 'লেভেল ২ রেসকিউ (৪%)', 'active'],
                [3, 5001, 15000, 5.00, 750, 1.00, 'লেভেল ৩ রেসকিউ (৫%)', 'active'],
                [4, 15001, 50000, 6.00, 3000, 1.00, 'লেভেল ৪ রেসকিউ (৬%)', 'active'],
                [5, 50001, 150000, 7.00, 10500, 1.00, 'লেভেল ৫ রেসকিউ (৭%)', 'active'],
                [6, 150001, 500000, 8.00, 40000, 1.00, 'লেভেল ৬ রেসকিউ (৮%)', 'active'],
                [7, 500001, null, 10.00, 100000, 1.00, 'ভিআইপি মেগা রেসকিউ (১০%)', 'active']
            ];

            $insertRescue = $pdo->prepare("INSERT INTO `rescue_tiers` 
                (`id`, `min_loss`, `max_loss`, `bonus_percent`, `max_bonus`, `wagering`, `description`, `status`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($defaultRescueTiers as $rt) {
                $insertRescue->execute($rt);
            }
            $stats['rows_seeded']['rescue_tiers'] = count($defaultRescueTiers);
            $log[] = "Seeded " . count($defaultRescueTiers) . " rescue tiers";
        }

        // 12. Seed Default Promo Codes if empty
        $promoCodeCount = (int)$pdo->query("SELECT COUNT(*) FROM `promo_codes`")->fetchColumn();
        if ($promoCodeCount === 0) {
            $defaultCodes = [
                ['pc-1', 'BENGALBETVIP', 'ভিআইপি মেগা স্বাগতম কোড', 500.00, 500.00, 1.00, 5000, 0, '2027-12-31', 'active', date('Y-m-d H:i:s')],
                ['pc-2', 'WELCOME100', 'নতুন মেম্বার ১০০% এক্সট্রা ক্যাশ', 1000.00, 1000.00, 1.00, 10000, 0, '2027-12-31', 'active', date('Y-m-d H:i:s')],
                ['pc-3', 'LUCKY888', 'লাকি ত্রিপল এইট ড্র কোড', 888.00, 800.00, 1.00, 8888, 0, '2027-12-31', 'active', date('Y-m-d H:i:s')]
            ];

            $insertCode = $pdo->prepare("INSERT INTO `promo_codes` 
                (`id`, `code`, `name`, `bonus_amount`, `min_deposit`, `wagering_multiplier`, `max_redemptions`, `used_count`, `expires_at`, `status`, `created_at`) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach ($defaultCodes as $c) {
                $insertCode->execute($c);
            }
            $stats['rows_seeded']['promo_codes'] = count($defaultCodes);
            $log[] = "Seeded " . count($defaultCodes) . " promo codes";
        }

        // 13. Gather current table counts
        $tableCounts = [];
        foreach ($allTables as $table) {
            try {
                $tableCounts[$table] = (int)$pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
            } catch (Exception $e) {
                $tableCounts[$table] = 0;
            }
        }
        $stats['table_row_counts'] = $tableCounts;

    } catch (Exception $e) {
        $stats['status'] = 'error';
        $stats['errors'][] = $e->getMessage();
    }

    $executionMs = round((microtime(true) - $startTime) * 1000, 2);
    $stats['execution_time_ms'] = $executionMs;
    $stats['log'] = $log;

    if ($returnArray) {
        return $stats;
    }

    send_json_response($stats);
}

// If accessed directly from browser or curl
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    run_bengalbet_process(false);
}
