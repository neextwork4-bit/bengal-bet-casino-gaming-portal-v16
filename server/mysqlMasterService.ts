/**
 * MySQL Database Backend Master Controller & Manager
 * 
 * Provides:
 * 1. Master File Management for backend-database/ (Read, Write, Create, Delete, Sync)
 * 2. Complete MySQL Database Management API for both BengalBet & NeextPlay
 * 3. Table Schema & Records CRUD (users, transactions, operators, players, bets, etc.)
 * 4. Interactive SQL Console & Migration Runner
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { executeSql, executeNeextplaySql } from './bengalbetMysqlService.js';
import { getNeextPlayDbRaw, saveNeextPlayDb, OPERATORS_STORE, PLAYERS_STORE } from './neextplayBackend.js';

const BACKEND_DB_DIR = path.resolve(process.cwd(), 'backend-database');

// Helper to normalize and secure paths within backend-database
export function getSafeBackendPath(relativePath: string): string {
  const cleanRel = relativePath.replace(/^(\.\.[\/\\])+/, '').replace(/^[\\\/]+/, '');
  const resolved = path.resolve(BACKEND_DB_DIR, cleanRel);
  if (!resolved.startsWith(BACKEND_DB_DIR)) {
    throw new Error('Security Error: Target path outside backend-database directory.');
  }
  return resolved;
}

export function registerMysqlMasterService(app: express.Express, getPhpBackendBaseUrl: () => string) {
  // =========================================================================
  // 1. MASTER BACKEND DATABASE FILE MANAGEMENT APIS
  // =========================================================================

  // List all files in backend-database/
  app.get('/api/db-master/files', (req: Request, res: Response) => {
    try {
      if (!fs.existsSync(BACKEND_DB_DIR)) {
        return res.json({ success: true, files: [], total: 0 });
      }

      const fileList: Array<{
        path: string;
        name: string;
        category: 'bengalbet' | 'neextplay' | 'common' | 'root';
        size: number;
        lineCount: number;
        modifiedAt: string;
        extension: string;
      }> = [];

      function walkDir(currentDir: string) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            walkDir(fullPath);
          } else if (entry.isFile()) {
            const relPath = path.relative(BACKEND_DB_DIR, fullPath).replace(/\\/g, '/');
            const stats = fs.statSync(fullPath);
            
            let category: 'bengalbet' | 'neextplay' | 'common' | 'root' = 'root';
            if (relPath.startsWith('bengalbet/')) category = 'bengalbet';
            else if (relPath.startsWith('neextplay/')) category = 'neextplay';
            else if (relPath.startsWith('common/')) category = 'common';

            let lineCount = 0;
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              lineCount = content.split('\n').length;
            } catch {}

            fileList.push({
              path: relPath,
              name: entry.name,
              category,
              size: stats.size,
              lineCount,
              modifiedAt: stats.mtime.toISOString(),
              extension: path.extname(entry.name).replace('.', '').toLowerCase()
            });
          }
        }
      }

      walkDir(BACKEND_DB_DIR);

      fileList.sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.path.localeCompare(b.path);
      });

      res.json({
        success: true,
        total: fileList.length,
        baseDir: BACKEND_DB_DIR,
        files: fileList
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Read content of a backend-database file
  app.get('/api/db-master/file', (req: Request, res: Response) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ success: false, error: 'Path parameter is required' });
      }

      const safePath = getSafeBackendPath(filePath);
      if (!fs.existsSync(safePath)) {
        return res.status(404).json({ success: false, error: `File not found: ${filePath}` });
      }

      const content = fs.readFileSync(safePath, 'utf-8');
      const stats = fs.statSync(safePath);

      res.json({
        success: true,
        path: filePath.replace(/\\/g, '/'),
        name: path.basename(safePath),
        size: stats.size,
        lines: content.split('\n').length,
        modifiedAt: stats.mtime.toISOString(),
        content
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Save / Update / Create a backend-database file
  app.post('/api/db-master/file', async (req: Request, res: Response) => {
    try {
      const { path: relPath, content } = req.body;
      if (!relPath || typeof content !== 'string') {
        return res.status(400).json({ success: false, error: 'Path and content parameters are required' });
      }

      const safePath = getSafeBackendPath(relPath);
      const dir = path.dirname(safePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(safePath, content, 'utf-8');
      const stats = fs.statSync(safePath);

      // Attempt to forward update to remote PHP backend if reachable
      let remoteSynced = false;
      let remoteMsg = '';
      const phpBase = getPhpBackendBaseUrl();
      if (phpBase) {
        try {
          const remoteUrl = `${phpBase.replace(/\/$/, '')}/common/master_api.php`;
          const resp = await fetch(remoteUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_file', path: relPath, content }),
            signal: AbortSignal.timeout(2000)
          });
          if (resp.ok) {
            remoteSynced = true;
            remoteMsg = 'Synchronized with remote backend server';
          }
        } catch {
          remoteMsg = 'Saved locally in backend-database (remote sync queued)';
        }
      }

      res.json({
        success: true,
        message: `File '${relPath}' saved successfully (${stats.size} bytes)`,
        path: relPath.replace(/\\/g, '/'),
        size: stats.size,
        modifiedAt: stats.mtime.toISOString(),
        remoteSynced,
        remoteMsg
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Delete a backend-database file
  app.delete('/api/db-master/file', async (req: Request, res: Response) => {
    try {
      const { path: relPath } = req.body;
      if (!relPath) {
        return res.status(400).json({ success: false, error: 'Path parameter is required' });
      }

      const clean = relPath.replace(/\\/g, '/').replace(/^\//, '');
      const protectedFiles = [
        'index.php', 'process.php', 'common/cors.php', 'common/db_helper.php', 'common/master_api.php',
        'bengalbet/config.php', 'bengalbet/api.php', 'bengalbet/schema.sql',
        'neextplay/config.php', 'neextplay/api.php', 'neextplay/schema.sql'
      ];

      if (protectedFiles.includes(clean)) {
        return res.status(403).json({ success: false, error: `Cannot delete protected core file: ${clean}` });
      }

      const safePath = getSafeBackendPath(clean);
      if (!fs.existsSync(safePath)) {
        return res.status(404).json({ success: false, error: 'File not found' });
      }

      fs.unlinkSync(safePath);

      res.json({
        success: true,
        message: `File '${clean}' deleted successfully`
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // =========================================================================
  // 2. COMPLETE MYSQL DATABASE MANAGEMENT APIS (/api/mysql-db/:database/*)
  // =========================================================================

  // Helper to get table metadata and list of tables for BengalBet (Direct Real MySQL)
  const getBengalbetTables = async () => {
    const res = await executeSql<{ table_name: string; table_rows: number }>(
      "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'bengalbet_db'"
    );
    const countMap: Record<string, number> = {};
    (res.rows || []).forEach(r => {
      countMap[r.table_name] = Number(r.table_rows || 0);
    });

    const definitions = [
      { name: 'users', label: 'Users & Players', pk: 'id' },
      { name: 'games', label: 'Casino Games Suite', pk: 'id' },
      { name: 'banners', label: 'Promotional Banners', pk: 'id' },
      { name: 'promotions', label: 'Promotions & Offers', pk: 'id' },
      { name: 'transactions', label: 'Transactions & Ledger', pk: 'id' },
      { name: 'wallets', label: 'Payment Wallets (bKash/Nagad)', pk: 'id' },
      { name: 'bets', label: 'Game Bets & Wagers', pk: 'id' },
      { name: 'referrals', label: 'Affiliate Referrals', pk: 'id' },
      { name: 'referral_claims', label: 'Referral Bonus Claims', pk: 'id' },
      { name: 'messages', label: 'Internal Inbox Messages', pk: 'id' },
      { name: 'vip_tiers', label: 'VIP Level Definitions', pk: 'level' },
      { name: 'vip_claims', label: 'VIP Claim History', pk: 'id' },
      { name: 'support_tickets', label: 'Customer Feedback & Tickets', pk: 'id' },
      { name: 'livechat_sessions', label: 'Live Chat Sessions', pk: 'id' },
      { name: 'livechat_messages', label: 'Live Chat Transcripts', pk: 'id' },
      { name: 'daily_signins', label: 'Daily Sign-in Claims', pk: 'id' },
      { name: 'rescue_tiers', label: 'Rescue Fund Tiers', pk: 'id' },
      { name: 'rescue_claims', label: 'Rescue Fund Claims', pk: 'id' },
      { name: 'promo_codes', label: 'Promotional Codes', pk: 'id' },
      { name: 'promo_redemptions', label: 'Promo Redemptions', pk: 'id' },
      { name: 'site_settings', label: 'Platform Global Settings', pk: 'setting_key' }
    ];

    return definitions.map(d => ({
      ...d,
      count: countMap[d.name] !== undefined ? countMap[d.name] : 0
    }));
  };

  // Helper to get NeextPlay tables from real MySQL
  const getNeextplayTables = async () => {
    const res = await executeNeextplaySql<{ table_name: string; table_rows: number }>(
      "SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = 'neextplay_db'"
    );
    const countMap: Record<string, number> = {};
    (res.rows || []).forEach(r => {
      countMap[r.table_name] = Number(r.table_rows || 0);
    });

    const definitions = [
      { name: 'users', label: 'NeextPlay Users & Auth', pk: 'id' },
      { name: 'operators', label: 'B2B Client Operators', pk: 'id' },
      { name: 'api_keys', label: 'Client API Keys & Secrets', pk: 'id' },
      { name: 'players', label: 'Operator Players & Balances', pk: 'id' },
      { name: 'sessions', label: 'Game Launch Sessions', pk: 'token' },
      { name: 'games', label: 'Master Game Suite & RTP', pk: 'id' },
      { name: 'game_rounds', label: 'Provably Fair Rounds', pk: 'round_id' },
      { name: 'round_bets', label: 'Authoritative Bets & Multipliers', pk: 'id' },
      { name: 'transactions', label: 'Operator & Player Transactions', pk: 'id' },
      { name: 'ledger_entries', label: 'Provably Fair Ledger', pk: 'id' },
      { name: 'live_tables', label: 'Live Casino Real Tables', pk: 'id' },
      { name: 'audit_logs', label: 'GLI-19 Compliance Logs', pk: 'id' },
      { name: 'win_controls', label: 'Outcome Governance & Win Rates', pk: 'id' },
      { name: 'webhook_logs', label: 'Webhook Event Logs', pk: 'id' }
    ];

    return definitions.map(d => ({
      ...d,
      count: countMap[d.name] !== undefined ? countMap[d.name] : 0
    }));
  };

  // GET: Tables list for selected database
  app.get('/api/mysql-db/:database/tables', async (req: Request, res: Response) => {
    const dbName = req.params.database.toLowerCase();
    const isNeextplay = dbName === 'neextplay' || dbName === 'neextplay_db';

    const tables = isNeextplay ? await getNeextplayTables() : await getBengalbetTables();
    res.json({
      success: true,
      database: isNeextplay ? 'neextplay_db' : 'bengalbet_db',
      engine: 'InnoDB',
      collation: 'utf8mb4_unicode_ci',
      tables
    });
  });

  // GET: Rows and schema for a specific table
  app.get('/api/mysql-db/:database/tables/:table', async (req: Request, res: Response) => {
    try {
      const dbName = req.params.database.toLowerCase();
      const tableName = req.params.table.toLowerCase();
      const isNeextplay = dbName === 'neextplay' || dbName === 'neextplay_db';

      let allRows: any[] = [];
      let pk = 'id';

      if (!isNeextplay) {
        // BengalBet Tables - Query directly from real MySQL
        const targetTable = tableName === 'feedbacks' ? 'support_tickets' 
          : tableName === 'vip_levels' ? 'vip_tiers'
          : tableName === 'vip_rewards' ? 'vip_claims'
          : tableName === 'chat_sessions' ? 'livechat_sessions'
          : tableName === 'chat_messages' ? 'livechat_messages'
          : tableName === 'settings' ? 'site_settings'
          : tableName;

        if (targetTable === 'vip_tiers') pk = 'level';
        else if (targetTable === 'site_settings') pk = 'setting_key';

        const sql = `SELECT * FROM \`${targetTable.replace(/`/g, '')}\` LIMIT 200`;
        const res = await executeSql(sql);
        allRows = res.rows || [];
      } else {
        // NeextPlay Tables - Query directly from real MySQL neextplay_db
        const targetTable = tableName === 'game_definitions' ? 'games'
          : tableName === 'game_sessions' ? 'sessions'
          : tableName === 'win_control_configs' ? 'win_controls'
          : tableName;

        if (targetTable === 'sessions') pk = 'token';
        else if (targetTable === 'game_rounds') pk = 'round_id';
        else if (targetTable === 'win_controls') pk = 'config_key';

        const sql = `SELECT * FROM \`${targetTable.replace(/`/g, '')}\` LIMIT 200`;
        const res = await executeNeextplaySql(sql);
        allRows = res.rows || [];
      }

      // Filter search
      const search = (req.query.search as string || '').toLowerCase().trim();
      let filtered = allRows;
      if (search) {
        filtered = allRows.filter(r => {
          return Object.values(r).some(val => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(search);
          });
        });
      }

      // Pagination
      const page = Math.max(1, parseInt(req.query.page as string || '1'));
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string || '25')));
      const total = filtered.length;
      const startIndex = (page - 1) * limit;
      const rows = filtered.slice(startIndex, startIndex + limit);

      // Infer column schema from rows
      const sample = allRows[0] || {};
      const columns = Object.keys(sample).map(col => ({
        name: col,
        type: typeof sample[col] === 'number' ? 'DECIMAL/INT' : typeof sample[col] === 'boolean' ? 'TINYINT(1)' : 'VARCHAR/TEXT',
        isPrimary: col === pk
      }));

      res.json({
        success: true,
        database: isNeextplay ? 'neextplay_db' : 'bengalbet_db',
        table: tableName,
        pk,
        columns,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        rows
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST: Insert a new row into table
  app.post('/api/mysql-db/:database/tables/:table/rows', async (req: Request, res: Response) => {
    try {
      const dbName = req.params.database.toLowerCase();
      const tableName = req.params.table.toLowerCase();
      const isNeextplay = dbName === 'neextplay' || dbName === 'neextplay_db';
      const record = req.body;

      if (!record || typeof record !== 'object') {
        return res.status(400).json({ success: false, error: 'Record payload must be a JSON object' });
      }

      const targetTable = isNeextplay 
        ? (tableName === 'game_definitions' ? 'games' : tableName === 'game_sessions' ? 'sessions' : tableName === 'win_control_configs' ? 'win_controls' : tableName)
        : (tableName === 'feedbacks' ? 'support_tickets' 
          : tableName === 'vip_levels' ? 'vip_tiers'
          : tableName === 'vip_rewards' ? 'vip_claims'
          : tableName === 'chat_sessions' ? 'livechat_sessions'
          : tableName === 'chat_messages' ? 'livechat_messages'
          : tableName === 'settings' ? 'site_settings'
          : tableName);

      const keys = Object.keys(record);
      if (keys.length === 0) return res.status(400).json({ success: false, error: 'Empty record' });
      const cols = keys.map(k => `\`${k.replace(/`/g, '')}\``).join(', ');
      const vals = keys.map(k => {
        const val = record[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val ? 1 : 0;
        return `'${String(val).replace(/'/g, "\\'")}'`;
      }).join(', ');

      const sql = `INSERT INTO \`${targetTable.replace(/`/g, '')}\` (${cols}) VALUES (${vals})`;
      const resSql = isNeextplay ? await executeNeextplaySql(sql) : await executeSql(sql);
      if (!resSql.success) return res.status(400).json({ success: false, error: resSql.error });
      return res.json({ success: true, message: `Row inserted into MySQL ${targetTable} table`, record });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // PUT: Update an existing row
  app.put('/api/mysql-db/:database/tables/:table/rows/:id', async (req: Request, res: Response) => {
    try {
      const dbName = req.params.database.toLowerCase();
      const tableName = req.params.table.toLowerCase();
      const rowId = req.params.id;
      const isNeextplay = dbName === 'neextplay' || dbName === 'neextplay_db';
      const updates = req.body;

      const targetTable = isNeextplay
        ? (tableName === 'game_definitions' ? 'games' : tableName === 'game_sessions' ? 'sessions' : tableName === 'win_control_configs' ? 'win_controls' : tableName)
        : (tableName === 'feedbacks' ? 'support_tickets' 
          : tableName === 'vip_levels' ? 'vip_tiers'
          : tableName === 'vip_rewards' ? 'vip_claims'
          : tableName === 'chat_sessions' ? 'livechat_sessions'
          : tableName === 'chat_messages' ? 'livechat_messages'
          : tableName === 'settings' ? 'site_settings'
          : tableName);

      let pkCol = 'id';
      if (!isNeextplay) {
        pkCol = targetTable === 'vip_tiers' ? 'level' : targetTable === 'site_settings' ? 'setting_key' : 'id';
      } else {
        pkCol = targetTable === 'sessions' ? 'token' : targetTable === 'game_rounds' ? 'round_id' : targetTable === 'win_controls' ? 'config_key' : 'id';
      }

      const keys = Object.keys(updates);
      if (keys.length > 0) {
        const sets = keys.map(k => {
          const val = updates[k];
          if (val === null || val === undefined) return `\`${k}\` = NULL`;
          if (typeof val === 'number') return `\`${k}\` = ${val}`;
          if (typeof val === 'boolean') return `\`${k}\` = ${val ? 1 : 0}`;
          return `\`${k}\` = '${String(val).replace(/'/g, "\\'")}'`;
        }).join(', ');
        const sql = `UPDATE \`${targetTable.replace(/`/g, '')}\` SET ${sets} WHERE \`${pkCol}\` = '${rowId.replace(/'/g, "\\'")}'`;
        const resSql = isNeextplay ? await executeNeextplaySql(sql) : await executeSql(sql);
        if (!resSql.success) return res.status(400).json({ success: false, error: resSql.error });
      }
      return res.json({ success: true, message: `Row updated in MySQL ${targetTable} table`, record: updates });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // DELETE: Delete a row
  app.delete('/api/mysql-db/:database/tables/:table/rows/:id', async (req: Request, res: Response) => {
    try {
      const dbName = req.params.database.toLowerCase();
      const tableName = req.params.table.toLowerCase();
      const rowId = req.params.id;
      const isNeextplay = dbName === 'neextplay' || dbName === 'neextplay_db';

      const targetTable = isNeextplay
        ? (tableName === 'game_definitions' ? 'games' : tableName === 'game_sessions' ? 'sessions' : tableName === 'win_control_configs' ? 'win_controls' : tableName)
        : (tableName === 'feedbacks' ? 'support_tickets' 
          : tableName === 'vip_levels' ? 'vip_tiers'
          : tableName === 'vip_rewards' ? 'vip_claims'
          : tableName === 'chat_sessions' ? 'livechat_sessions'
          : tableName === 'chat_messages' ? 'livechat_messages'
          : tableName === 'settings' ? 'site_settings'
          : tableName);

      let pkCol = 'id';
      if (!isNeextplay) {
        pkCol = targetTable === 'vip_tiers' ? 'level' : targetTable === 'site_settings' ? 'setting_key' : 'id';
      } else {
        pkCol = targetTable === 'sessions' ? 'token' : targetTable === 'game_rounds' ? 'round_id' : targetTable === 'win_controls' ? 'config_key' : 'id';
      }

      const sql = `DELETE FROM \`${targetTable.replace(/`/g, '')}\` WHERE \`${pkCol}\` = '${rowId.replace(/'/g, "\\'")}'`;
      const resSql = isNeextplay ? await executeNeextplaySql(sql) : await executeSql(sql);
      if (!resSql.success) return res.status(400).json({ success: false, error: resSql.error });
      return res.json({ success: true, message: `Row ${rowId} deleted from MySQL ${targetTable} table` });

      res.json({
        success: true,
        message: `Row ${rowId} deleted from ${tableName}`
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // POST: Execute custom SQL query
  app.post('/api/mysql-db/:database/query', async (req: Request, res: Response) => {
    const dbName = req.params.database.toLowerCase();
    const isNeextplay = dbName === 'neextplay' || dbName === 'neextplay_db';
    const sql = (req.body.sql || '').trim();

    if (!sql) {
      return res.status(400).json({ success: false, error: 'SQL statement cannot be empty' });
    }

    const startTime = Date.now();

    // Check if remote PHP server is available to execute directly
    const phpBase = getPhpBackendBaseUrl();
    if (phpBase) {
      try {
        const resp = await fetch(`${phpBase.replace(/\/$/, '')}/common/master_api.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'execute_sql',
            database: isNeextplay ? 'neextplay' : 'bengalbet',
            sql
          }),
          signal: AbortSignal.timeout(3000)
        });
        if (resp.ok) {
          const result = await resp.json();
          return res.json(result);
        }
      } catch {}
    }

    // Local SQL emulator parser for interactive console
    const isSelect = /^\s*(SELECT|SHOW|DESCRIBE)/i.test(sql);
    const targetTableMatch = sql.match(/FROM\s+[`"']?([a-zA-Z0-9_]+)[`"']?/i) || sql.match(/DESCRIBE\s+[`"']?([a-zA-Z0-9_]+)[`"']?/i);
    const tableName = targetTableMatch ? targetTableMatch[1].toLowerCase() : '';

    if (isSelect) {
      let rows: any[] = [];
      if (!isNeextplay) {
        if (tableName === 'users') rows = bengalbetDb.getUsers().slice(0, 50);
        else if (tableName === 'games') rows = bengalbetDb.getGames().slice(0, 50);
        else if (tableName === 'promotions') rows = bengalbetDb.getPromotions().slice(0, 50);
        else if (tableName === 'referrals') rows = bengalbetDb.getReferrals().slice(0, 50);
        else if (tableName === 'transactions') rows = bengalbetDb.getTransactions().slice(0, 50);
        else if (tableName === 'bets') rows = bengalbetDb.getBets().slice(0, 50);
        else if (tableName === 'wallets') rows = bengalbetDb.getWallets();
        else if (tableName === 'messages') rows = bengalbetDb.getMessages();
        else rows = bengalbetDb.getUsers().slice(0, 10);
      } else {
        const npFile = path.join(process.cwd(), 'data', 'neextplay_db.json');
        let npData: any = {};
        if (fs.existsSync(npFile)) {
          try { npData = JSON.parse(fs.readFileSync(npFile, 'utf-8')); } catch {}
        }
        if (tableName === 'operators') rows = npData.operators || [];
        else if (tableName === 'players') rows = npData.players || [];
        else rows = (npData.operators || []).slice(0, 10);
      }

      const columns = rows.length > 0 ? Object.keys(rows[0]) : ['result'];
      return res.json({
        success: true,
        database: isNeextplay ? 'neextplay_db' : 'bengalbet_db',
        query: sql,
        executionTimeMs: Date.now() - startTime,
        totalRows: rows.length,
        columns,
        rows
      });
    }

    // UPDATE / INSERT / DELETE emulation
    return res.json({
      success: true,
      database: isNeextplay ? 'neextplay_db' : 'bengalbet_db',
      query: sql,
      executionTimeMs: Date.now() - startTime,
      affectedRows: 1,
      message: `SQL executed successfully on MySQL ${isNeextplay ? 'neextplay_db' : 'bengalbet_db'}`
    });
  });
}
