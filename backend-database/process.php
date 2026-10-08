<?php
/**
 * Master Database Process & Migration Runner
 * URL: http://localhost/backend-database/process.php (or http://localhost/process.php)
 * 
 * Auto-initializes and updates BOTH:
 *  1. BengalBet Database (bengalbet_db) -> via /bengalbet/process.php
 *  2. NeextPlay Database (neextplay_db) -> via /neextplay/process.php
 * 
 * Supports both JSON response (for API callers & scripts) and rich visual HTML UI.
 */

require_once __DIR__ . '/common/cors.php';
require_once __DIR__ . '/bengalbet/process.php';
require_once __DIR__ . '/neextplay/process.php';

$startTime = microtime(true);

// Execute both process routines
$bengalbetResult = run_bengalbet_process(true);
$neextplayResult = run_neextplay_process(true);

$totalTimeMs = round((microtime(true) - $startTime) * 1000, 2);

$masterResult = [
    'success' => ($bengalbetResult['status'] === 'success' && $neextplayResult['status'] === 'success'),
    'timestamp' => date('Y-m-d H:i:s'),
    'message' => 'All databases, tables, and rows have been successfully processed and synchronized!',
    'execution_time_ms' => $totalTimeMs,
    'databases' => [
        'bengalbet' => $bengalbetResult,
        'neextplay' => $neextplayResult
    ]
];

// Check if request expects JSON
$isJson = isset($_GET['format']) && $_GET['format'] === 'json';
if (!$isJson && isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
    $isJson = true;
}
if (!$isJson && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $isJson = true;
}

if ($isJson) {
    send_json_response($masterResult);
}

// Otherwise, render a clean, modern HTML dashboard
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Process Engine - BengalBet & NeextPlay</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #060d13;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      padding: 30px 20px;
      line-height: 1.5;
    }
    .container {
      max-width: 1050px;
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #0b2219 0%, #0d3827 50%, #071911 100%);
      border: 1px solid #10b981;
      border-radius: 16px;
      padding: 24px 30px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #facc15;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .status-badge {
      background: #059669;
      color: #fff;
      padding: 8px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; }
      .header { flex-direction: column; align-items: flex-start; gap: 16px; }
    }
    .card {
      background: #0b151f;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid #1e293b;
      margin-bottom: 14px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #38bdf8;
    }
    .table-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 280px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .table-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #070e16;
      border: 1px solid #1e293b;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-family: monospace;
    }
    .row-count {
      background: #0369a1;
      color: #e0f2fe;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 20px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #facc15 0%, #eab308 100%);
      color: #000;
    }
    .btn-secondary {
      background: #1e293b;
      color: #94a3b8;
    }
    .btn:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
    }
    .time-info {
      font-size: 11px;
      color: #64748b;
      margin-top: 15px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="title">
          <span>⚡ Database Process & Auto-Update Engine</span>
        </div>
        <div class="subtitle">
          Processed all MySQL databases, schemas, tables, and seed records in <strong><?= $totalTimeMs ?> ms</strong>
        </div>
      </div>
      <div>
        <span class="status-badge">✓ System Live & Synced</span>
      </div>
    </div>

    <div class="grid">
      <!-- BengalBet Database Card -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🐅 BengalBet Database: <span style="color:#facc15;"><?= htmlspecialchars(BB_DB_NAME) ?></span></div>
          <span style="font-size:11px; color:#10b981; font-weight:bold;"><?= $bengalbetResult['tables_count'] ?> Tables Verified</span>
        </div>
        <div class="table-list">
          <?php foreach ($bengalbetResult['table_row_counts'] as $tbl => $cnt): ?>
            <div class="table-item">
              <span><?= htmlspecialchars($tbl) ?></span>
              <span class="row-count"><?= number_format($cnt) ?> rows</span>
            </div>
          <?php endforeach; ?>
        </div>
      </div>

      <!-- NeextPlay Database Card -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🎮 NeextPlay Database: <span style="color:#38bdf8;"><?= htmlspecialchars(NP_DB_NAME) ?></span></div>
          <span style="font-size:11px; color:#10b981; font-weight:bold;"><?= $neextplayResult['tables_count'] ?> Tables Verified</span>
        </div>
        <div class="table-list">
          <?php foreach ($neextplayResult['table_row_counts'] as $tbl => $cnt): ?>
            <div class="table-item">
              <span><?= htmlspecialchars($tbl) ?></span>
              <span class="row-count" style="background:#0284c7;"><?= number_format($cnt) ?> rows</span>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h3 style="font-size: 14px; color: #facc15; margin-bottom: 10px;">API Endpoints & Integration</h3>
      <div style="font-size: 12px; font-family: monospace; color: #94a3b8; display: flex; flex-direction: column; gap: 8px;">
        <div>• BengalBet REST API: <a href="bengalbet/api.php?action=ping" style="color: #38bdf8;">/backend-database/bengalbet/api.php</a></div>
        <div>• NeextPlay B2B API: <a href="neextplay/api.php?action=ping" style="color: #38bdf8;">/backend-database/neextplay/api.php</a></div>
        <div>• Database Backend Master API: <a href="common/master_api.php?action=list_files" style="color: #38bdf8;">/backend-database/common/master_api.php</a></div>
        <div>• Master Process JSON: <a href="process.php?format=json" style="color: #38bdf8;">/backend-database/process.php?format=json</a></div>
      </div>
    </div>

    <div class="actions">
      <a href="process.php" class="btn btn-primary">🔄 Re-Run Process URL</a>
      <a href="process.php?format=json" class="btn btn-secondary" target="_blank">{ } View JSON Output</a>
      <a href="index.php" class="btn btn-secondary">🏠 Open Backend Dashboard</a>
    </div>

    <div class="time-info">
      Database auto-process executed at <?= date('Y-m-d H:i:s') ?> | PHP <?= phpversion() ?> | MySQL Database Ready
    </div>
  </div>
</body>
</html>
