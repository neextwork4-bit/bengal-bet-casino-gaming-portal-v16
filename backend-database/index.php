<?php
/**
 * BengalBet & NeextPlay - MySQL Database Backend Portal
 * Web Interface at: http://localhost/backend-database/
 */

require_once __DIR__ . '/common/cors.php';
require_once __DIR__ . '/bengalbet/config.php';
require_once __DIR__ . '/neextplay/config.php';

// Quick check and auto-creation of connectivity
$bengalbetOk = false;
$neextplayOk = false;
$bbTables = [];
$npTables = [];

try {
    $bbPdo = get_bengalbet_db(true);
    $bbTables = $bbPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $bengalbetOk = true;
} catch (Exception $e) {}

try {
    $npPdo = get_neextplay_db(true);
    $npTables = $npPdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $neextplayOk = true;
} catch (Exception $e) {}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Backend Management - BengalBet & NeextPlay</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #060d13;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 30px 20px;
      line-height: 1.6;
    }
    .container { max-width: 1100px; margin: 0 auto; }
    .hero {
      background: radial-gradient(circle at top right, #0d3827 0%, #061710 100%);
      border: 1px solid #10b981;
      border-radius: 20px;
      padding: 32px 36px;
      margin-bottom: 28px;
      box-shadow: 0 12px 35px rgba(0,0,0,0.6);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .hero-title { font-size: 26px; font-weight: 900; color: #facc15; }
    .hero-desc { color: #94a3b8; font-size: 14px; margin-top: 6px; max-width: 650px; }
    .btn-run {
      background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
      color: #000;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 14px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 20px rgba(234, 179, 8, 0.4);
      transition: all 0.2s;
    }
    .btn-run:hover { transform: translateY(-2px); filter: brightness(1.1); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
    .card {
      background: #0b151f;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 24px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .card-title { font-size: 18px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
    .badge-ok { background: #059669; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .badge-warn { background: #d97706; color: #fff; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
    .table-count-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 12px;
      font-family: monospace;
      font-size: 12px;
    }
    .table-tag {
      background: #070e16;
      border: 1px solid #1e293b;
      padding: 6px 10px;
      border-radius: 6px;
      color: #cbd5e1;
    }
    .api-box {
      background: #081018;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
      font-size: 12px;
      font-family: monospace;
    }
    .api-link { color: #38bdf8; text-decoration: none; word-break: break-all; }
    .api-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <div>
        <div class="hero-title">🚀 MySQL Database Backend System</div>
        <div class="hero-desc">
          Unified API and auto-process database server for <strong>BengalBet Casino</strong> and <strong>NeextPlay B2B Gaming</strong>. Runs on separate server at <code>http://localhost/</code> or custom host.
        </div>
      </div>
      <div>
        <a href="process.php" class="btn-run">
          ⚡ Run Master Process URL
        </a>
      </div>
    </div>

    <div class="grid">
      <!-- BengalBet DB Section -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🐅 BengalBet Database</div>
          <?php if ($bengalbetOk): ?>
            <span class="badge-ok">CONNECTED (<?= count($bbTables) ?> Tables)</span>
          <?php else: ?>
            <span class="badge-warn">REQUIRES RUN PROCESS</span>
          <?php endif; ?>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">
          Stores players, balances, VIP progression, cashout wallets, transactions, bet history, and promo messages.
        </p>

        <div class="table-count-list">
          <?php foreach ($bbTables as $tbl): ?>
            <div class="table-tag"><?= htmlspecialchars($tbl) ?></div>
          <?php endforeach; ?>
          <?php if (empty($bbTables)): ?>
            <div style="grid-column: 1 / -1; color: #f59e0b; padding: 10px;">
              Click "Run Master Process URL" to create all tables automatically.
            </div>
          <?php endif; ?>
        </div>

        <div class="api-box">
          <div style="color: #64748b; margin-bottom: 4px;">Direct REST API:</div>
          <a class="api-link" href="bengalbet/api.php?action=stats" target="_blank">/backend-database/bengalbet/api.php?action=stats</a>
        </div>
      </div>

      <!-- NeextPlay DB Section -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🎮 NeextPlay B2B Database</div>
          <?php if ($neextplayOk): ?>
            <span class="badge-ok">CONNECTED (<?= count($npTables) ?> Tables)</span>
          <?php else: ?>
            <span class="badge-warn">REQUIRES RUN PROCESS</span>
          <?php endif; ?>
        </div>
        <p style="font-size: 13px; color: #94a3b8;">
          Stores operators, API keys, launch sessions, Aviator/Crash multipliers, multiplayer bets, and win control RTP algorithms.
        </p>

        <div class="table-count-list">
          <?php foreach ($npTables as $tbl): ?>
            <div class="table-tag"><?= htmlspecialchars($tbl) ?></div>
          <?php endforeach; ?>
          <?php if (empty($npTables)): ?>
            <div style="grid-column: 1 / -1; color: #f59e0b; padding: 10px;">
              Click "Run Master Process URL" to create all tables automatically.
            </div>
          <?php endif; ?>
        </div>

        <div class="api-box">
          <div style="color: #64748b; margin-bottom: 4px;">Direct REST API:</div>
          <a class="api-link" href="neextplay/api.php?action=stats" target="_blank">/backend-database/neextplay/api.php?action=stats</a>
        </div>
      </div>
    </div>

    <!-- Integration & Process URL Info -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">⚙️ Process URL & Auto-Update Specifications</div>
      </div>
      <div style="font-size: 13px; color: #cbd5e1; display: flex; flex-direction: column; gap: 10px;">
        <div>
          <strong>1. Single Process URL:</strong> You can call <code>http://localhost/backend-database/process.php</code> (or <code>/process.php</code>) at any time. It creates databases <code>bengalbet_db</code> and <code>neextplay_db</code> if they don't exist, checks and executes all table schemas, adds missing columns, and seeds default records.
        </div>
        <div>
          <strong>2. JSON Output:</strong> Pass <code>?format=json</code> or header <code>Accept: application/json</code> for programmatic integration:
          <pre style="background: #04080d; padding: 10px; border-radius: 8px; margin-top: 6px; overflow-x: auto;">curl -X POST http://localhost/backend-database/process.php?format=json</pre>
        </div>
        <div>
          <strong>3. Hosting on Separate Server:</strong> Copy this <code>backend-database</code> directory to your Apache/XAMPP <code>htdocs/</code> or VPS root. The React app connects via proxy or direct fetch to <code>http://localhost/backend-database/</code>!
        </div>
      </div>
    </div>
  </div>
</body>
</html>
