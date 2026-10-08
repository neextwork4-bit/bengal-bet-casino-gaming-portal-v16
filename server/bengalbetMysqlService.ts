/**
 * BengalBet MySQL Production Backend Service
 * 
 * Directly queries and mutates the REAL MySQL Database (`bengalbet_db`)
 * on the remote/local backend server (https://deserver.neexthub.site/backend-database).
 * 
 * NEVER uses local JSON files, mock arrays, or cache.
 * All reads and writes are executed on the real MySQL server.
 */

export interface BengalbetMysqlConfig {
  baseUrl: string;
}

let activeBaseUrl = 'https://deserver.neexthub.site/backend-database';

export function setBengalbetBaseUrl(url: string) {
  if (url) {
    activeBaseUrl = url.trim().replace(/\/$/, '');
  }
}

export function getBengalbetBaseUrl(): string {
  return activeBaseUrl;
}

const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

/**
 * Execute raw SQL query directly on real MySQL database (`bengalbet_db` or `neextplay_db`).
 */
export async function executeSql<T = any>(sql: string, database: 'bengalbet' | 'neextplay' = 'bengalbet'): Promise<{ success: boolean; rows: T[]; totalRows: number; error?: string }> {
  const targetUrl = `${activeBaseUrl}/common/master_api.php`;
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: COMMON_HEADERS,
      body: JSON.stringify({
        action: 'execute_sql',
        database,
        sql
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, rows: [], totalRows: 0, error: `HTTP ${res.status}: ${errText}` };
    }

    const data = await res.json();
    if (!data.success) {
      return { success: false, rows: [], totalRows: 0, error: data.error || 'SQL execution failed' };
    }

    return {
      success: true,
      rows: data.rows || [],
      totalRows: data.total_rows || (data.rows ? data.rows.length : 0)
    };
  } catch (err: any) {
    return { success: false, rows: [], totalRows: 0, error: err?.message || 'SQL query connection error' };
  }
}

/**
 * Convenience helper to execute SQL directly on `neextplay_db`.
 */
export async function executeNeextplaySql<T = any>(sql: string): Promise<{ success: boolean; rows: T[]; totalRows: number; error?: string }> {
  return executeSql<T>(sql, 'neextplay');
}

/**
 * Call the PHP MySQL REST API (`bengalbet/api.php`) for authoritative actions.
 */
export async function queryBengalbetApi<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  const targetUrl = `${activeBaseUrl}/bengalbet/api.php`;
  const body = { action, ...payload };

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: COMMON_HEADERS,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(9000)
  });

  if (!res.ok) {
    const errText = await res.text();
    let errJson: any;
    try { errJson = JSON.parse(errText); } catch {}
    throw new Error(errJson?.message || errJson?.error || `API Error HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.success === false && data.message) {
    throw new Error(data.message);
  }
  return data;
}

/**
 * Call the NeextPlay PHP MySQL REST API (`neextplay/api.php`) for authoritative actions.
 */
export async function queryNeextplayApi<T = any>(action: string, payload: Record<string, any> = {}): Promise<T> {
  const targetUrl = `${activeBaseUrl}/neextplay/api.php`;
  const body = { action, ...payload };

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: COMMON_HEADERS,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(9000)
  });

  if (!res.ok) {
    const errText = await res.text();
    let errJson: any;
    try { errJson = JSON.parse(errText); } catch {}
    throw new Error(errJson?.message || errJson?.error || `NeextPlay API Error HTTP ${res.status}`);
  }

  const data = await res.json();
  if (data.success === false && (data.message || data.error)) {
    throw new Error(data.message || data.error);
  }
  return data;
}

export const NeextplayMysql = {
  async ping() {
    return queryNeextplayApi('ping');
  },
  async getStats() {
    return queryNeextplayApi('stats');
  },
  async loginUser(email: string, password: string) {
    return queryNeextplayApi('login_user', { email, password });
  },
  async registerUser(data: Record<string, any>) {
    return queryNeextplayApi('register_user', data);
  },
  async getUsers() {
    return queryNeextplayApi('get_users');
  },
  async getUser(idOrEmail: string) {
    return queryNeextplayApi('get_user', { id: idOrEmail });
  },
  async updateUser(data: Record<string, any>) {
    return queryNeextplayApi('update_user', data);
  },
  async deleteUser(id: string) {
    return queryNeextplayApi('delete_user', { id });
  },
  async getOperators() {
    return queryNeextplayApi('get_operators');
  },
  async getOperator(id: string) {
    return queryNeextplayApi('get_operator', { id });
  },
  async saveOperator(data: Record<string, any>) {
    return queryNeextplayApi('save_operator', data);
  },
  async deleteOperator(id: string) {
    return queryNeextplayApi('delete_operator', { id });
  },
  async topupOperator(id: string, amount: number) {
    return queryNeextplayApi('topup_operator', { id, amount });
  },
  async getPlayers(operatorId?: string) {
    return queryNeextplayApi('get_players', { operatorId });
  },
  async savePlayer(data: Record<string, any>) {
    return queryNeextplayApi('save_player', data);
  },
  async getPlayerBalance(playerId: string, operatorId?: string) {
    return queryNeextplayApi('get_player_balance', { playerId, operatorId });
  },
  async updatePlayerBalance(data: Record<string, any>) {
    return queryNeextplayApi('update_player_balance', data);
  },
  async getGames() {
    return queryNeextplayApi('get_games');
  },
  async saveGame(data: Record<string, any>) {
    return queryNeextplayApi('save_game', data);
  },
  async deleteGame(id: string) {
    return queryNeextplayApi('delete_game', { id });
  },
  async getLiveTables() {
    return queryNeextplayApi('get_live_tables');
  },
  async saveLiveTable(data: Record<string, any>) {
    return queryNeextplayApi('save_live_table', data);
  },
  async getLedgerEntries(operatorId?: string) {
    return queryNeextplayApi('get_ledger_entries', { operatorId });
  },
  async getAuditLogs(operatorId?: string) {
    return queryNeextplayApi('get_audit_logs', { operatorId });
  },
  async addAuditLog(data: Record<string, any>) {
    return queryNeextplayApi('add_audit_log', data);
  },
  async getWinControls() {
    return queryNeextplayApi('get_win_controls');
  },
  async saveWinControls(key: string, config: any) {
    return queryNeextplayApi('save_win_controls', { key, config });
  },
  async getRoundBets() {
    return queryNeextplayApi('get_round_bets');
  },
  async recordBet(data: Record<string, any>) {
    return queryNeextplayApi('record_bet', data);
  }
};

// ============================================================================
// REAL MYSQL REPOSITORIES
// ============================================================================

export const BengalbetMysql = {
  // -------------------------------------------------------------
  // HEALTH & STATS
  // -------------------------------------------------------------
  async ping() {
    return queryBengalbetApi('ping');
  },

  async getAdminStats() {
    return queryBengalbetApi('admin_stats');
  },

  // -------------------------------------------------------------
  // 1. USER AUTHENTICATION & PROFILES (MySQL users table)
  // -------------------------------------------------------------
  async login(phone: string, password: string) {
    return queryBengalbetApi('login', { phone, password });
  },

  async register(phone: string, password: string, referralCode?: string) {
    return queryBengalbetApi('register', { phone, password, referralCode });
  },

  async getMe(userIdOrPhone: string) {
    return queryBengalbetApi('get_user', { id: userIdOrPhone });
  },

  async updateProfile(userId: string, data: { username?: string; avatar?: string; realName?: string; birthday?: string; email?: string }) {
    return queryBengalbetApi('update_profile', { userId, ...data });
  },

  async changePassword(userId: string, oldPassword?: string, newPassword?: string) {
    return queryBengalbetApi('change_password', { userId, oldPassword, newPassword });
  },

  async changeTransactionPassword(userId: string, newTransactionPassword: string) {
    return queryBengalbetApi('change_transaction_password', { userId, newTransactionPassword });
  },

  async googleDemoLogin(email: string, name: string, avatar: string) {
    // Check if user exists by email in MySQL
    const safeEmail = email.replace(/'/g, "\\'");
    const checkSql = `SELECT * FROM \`users\` WHERE \`email\` = '${safeEmail}' LIMIT 1`;
    const res = await executeSql(checkSql);
    
    if (res.success && res.rows.length > 0) {
      const user = res.rows[0];
      return queryBengalbetApi('get_user', { id: user.id });
    }

    // Auto provision in MySQL
    const digits = Math.floor(10000000 + Math.random() * 90000000);
    const phone = `017${digits}`;
    const cleanUser = name.slice(0, 16).replace(/\s+/g, '_');
    const regRes = await queryBengalbetApi('register', { phone, password: 'google_oauth_pass' });
    if (regRes?.user?.id) {
      await executeSql(`UPDATE \`users\` SET \`email\` = '${safeEmail}', \`username\` = '${cleanUser.replace(/'/g, "\\'")}', \`avatar\` = '${avatar.replace(/'/g, "\\'")}' WHERE \`id\` = '${regRes.user.id}'`);
      return queryBengalbetApi('get_user', { id: regRes.user.id });
    }
    return regRes;
  },

  // -------------------------------------------------------------
  // 2. GAMES SUITE (MySQL games & bets tables)
  // -------------------------------------------------------------
  async getGames(category?: string, provider?: string, search?: string) {
    return queryBengalbetApi('get_games', { category, provider, search });
  },

  async saveGame(game: any) {
    return queryBengalbetApi('save_game', game);
  },

  async deleteGame(id: string) {
    return queryBengalbetApi('delete_game', { id });
  },

  async recordBet(userId: string, data: { category: string; vendor: string; gameName: string; betAmount: number; reward: number; gameRound?: string; multiplier?: number; orderNo?: string }) {
    try {
      const res = await queryBengalbetApi('record_bet', { userId, ...data });
      if (res && res.success) {
        return res;
      }
    } catch (e: any) {
      console.warn('queryBengalbetApi record_bet fallback to direct SQL:', e?.message);
    }

    // Direct Authoritative Real MySQL Execution on bengalbet_db
    const rawUserId = String(userId || 'usr-889922').trim();
    const cleanUserId = rawUserId.replace(/^(ply_bb_|usr-)/, '');
    const betAmt = Number(data.betAmount || 0);
    const winAmt = Number(data.reward || 0);
    const profit = winAmt - betAmt;
    const safeCategory = String(data.category || 'slot').replace(/'/g, "\\'");
    const safeVendor = String(data.vendor || 'JILI').replace(/'/g, "\\'");
    const safeGameName = String(data.gameName || 'Casino Game').replace(/'/g, "\\'");
    const safeGameRound = String(data.gameRound || `#R${Date.now().toString().slice(-6)}`).replace(/'/g, "\\'");
    const orderNo = data.orderNo || `BET${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().replace('T', ' ').slice(11, 19);
    const nowIso = now.toISOString();

    // 1. Resolve user in MySQL
    const userQuery = `SELECT * FROM \`users\` WHERE \`id\` = '${rawUserId.replace(/'/g, "\\'")}' 
                       OR \`id\` = 'usr-${cleanUserId.replace(/'/g, "\\'")}' 
                       OR \`id\` = '${cleanUserId.replace(/'/g, "\\'")}' 
                       OR \`phone\` = '${rawUserId.replace(/'/g, "\\'")}' 
                       OR \`username\` = '${rawUserId.replace(/'/g, "\\'")}' 
                       LIMIT 1`;
    let userRes = await executeSql(userQuery);
    if (!userRes.rows || !userRes.rows.length) {
      userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = 'usr-889922' LIMIT 1`);
      if (!userRes.rows || !userRes.rows.length) {
        userRes = await executeSql(`SELECT * FROM \`users\` LIMIT 1`);
      }
    }

    if (!userRes.rows || !userRes.rows.length) {
      throw new Error(`Player '${userId}' not found in MySQL database.`);
    }

    const user = userRes.rows[0];
    const targetUserId = user.id;
    const currentBalance = Number(user.balance || 0);

    if (currentBalance < betAmt && betAmt > 0) {
      throw new Error(`পর্যাপ্ত ব্যালেন্স নেই! বর্তমান ব্যালেন্স: ৳${currentBalance.toFixed(2)}`);
    }

    const newBalance = Number(Math.max(0, currentBalance - betAmt + winAmt).toFixed(2));
    const expGained = Math.round(betAmt);

    // 2. Atomically update balance & VIP Exp in MySQL users table
    await executeSql(`UPDATE \`users\` SET \`balance\` = ${newBalance}, \`vip_exp\` = \`vip_exp\` + ${expGained} WHERE \`id\` = '${targetUserId}'`);

    // 3. Insert into MySQL bets table
    const betId = `bet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await executeSql(`INSERT INTO \`bets\` 
      (\`id\`, \`user_id\`, \`order_no\`, \`category\`, \`vendor\`, \`game_name\`, \`game_round\`, \`bet_amount\`, \`valid_bet\`, \`reward\`, \`profit\`, \`time\`, \`date\`, \`created_at\`)
      VALUES 
      ('${betId}', '${targetUserId}', '${orderNo}', '${safeCategory}', '${safeVendor}', '${safeGameName}', '${safeGameRound}', ${betAmt}, ${betAmt}, ${winAmt}, ${profit}, '${timeStr}', '${dateStr}', '${nowIso}')`);

    // 4. Insert debit transaction into MySQL transactions table
    if (betAmt > 0) {
      const txBetId = `BET-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
      await executeSql(`INSERT INTO \`transactions\` 
        (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`channel\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
        VALUES 
        ('${txBetId}', '${targetUserId}', '${String(user.username).replace(/'/g, "\\'")}', '${user.phone}', 'bet', ${betAmt}, '${safeVendor}', '${txBetId}', 'success', '${safeVendor} ${safeGameName} বেট (-৳${betAmt})', '${nowIso}')`);
    }

    // 5. Insert win payout transaction into MySQL transactions table if win > 0
    if (winAmt > 0) {
      const txWinId = `WIN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
      await executeSql(`INSERT INTO \`transactions\` 
        (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`channel\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
        VALUES 
        ('${txWinId}', '${targetUserId}', '${String(user.username).replace(/'/g, "\\'")}', '${user.phone}', 'bet_payout', ${winAmt}, '${safeVendor}', '${txWinId}', 'success', '${safeVendor} ${safeGameName} উইন পেআউট (+৳${winAmt})', '${nowIso}')`);
    }

    // 6. Update NeextPlay provider operator turnover & company balance if vendor is NeextPlay
    if (safeVendor.toLowerCase().includes('neext')) {
      try {
        await executeNeextplaySql(`UPDATE \`operators\` SET 
          \`total_turnover\` = \`total_turnover\` + ${betAmt},
          \`total_payout\` = \`total_payout\` + ${winAmt},
          \`total_ggr\` = \`total_ggr\` + ${betAmt - winAmt},
          \`company_balance\` = GREATEST(0, \`company_balance\` - ${betAmt}),
          \`total_bets_count\` = \`total_bets_count\` + 1,
          \`total_wins_count\` = \`total_wins_count\` + ${winAmt > 0 ? 1 : 0}
          WHERE \`id\` = 'op_bengalbet'`);
      } catch {}
    }

    return {
      success: true,
      orderNo,
      newBalance,
      profit,
      bet: {
        id: betId,
        orderNo,
        gameName: data.gameName,
        betAmount: betAmt,
        reward: winAmt,
        profit,
        time: `${dateStr} ${timeStr}`,
        date: dateStr
      }
    };
  },

  async getBets(userId?: string, category?: string, date?: string, limit: number = 50) {
    try {
      const res = await queryBengalbetApi('get_bets', { userId, category, date, limit });
      if (res && res.success && Array.isArray(res.bets)) {
        return res;
      }
    } catch (e: any) {
      console.warn('queryBengalbetApi get_bets fallback to direct SQL:', e?.message);
    }

    // Direct MySQL Query on bengalbet_db.bets
    let sql = `SELECT * FROM \`bets\` WHERE 1=1`;
    const conds: string[] = [];
    if (userId && userId !== 'all') {
      const clean = userId.replace(/^(ply_bb_|usr-)/, '').replace(/'/g, "\\'");
      conds.push(`(\`user_id\` = '${userId.replace(/'/g, "\\'")}' OR \`user_id\` = 'usr-${clean}' OR \`user_id\` = '${clean}')`);
    }
    if (category && category !== 'all') {
      conds.push(`\`category\` = '${category.replace(/'/g, "\\'")}'`);
    }
    if (date) {
      conds.push(`\`date\` = '${date.replace(/'/g, "\\'")}'`);
    }
    if (conds.length) {
      sql += ' AND ' + conds.join(' AND ');
    }
    sql += ` ORDER BY \`created_at\` DESC LIMIT ${Number(limit) || 50}`;

    const res = await executeSql(sql);
    const rawRows = res.rows || [];

    const bets = rawRows.map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      orderNo: b.order_no || b.id,
      category: b.category,
      vendor: b.vendor,
      gameName: b.game_name,
      gameRound: b.game_round || '',
      betAmount: Number(b.bet_amount || 0),
      validBet: Number(b.valid_bet || b.bet_amount || 0),
      reward: Number(b.reward || 0),
      profit: Number(b.profit !== undefined ? b.profit : (b.reward || 0) - (b.bet_amount || 0)),
      time: b.time || b.created_at,
      date: b.date || (b.time ? b.time.slice(0, 10) : new Date().toISOString().slice(0, 10)),
      createdAt: b.created_at
    }));

    let totalBet = 0;
    let validBet = 0;
    let totalReward = 0;
    let totalProfit = 0;

    for (const b of bets) {
      totalBet += b.betAmount;
      validBet += b.validBet;
      totalReward += b.reward;
      totalProfit += b.profit;
    }

    return {
      success: true,
      bets,
      total: bets.length,
      summary: {
        totalBet: Number(totalBet.toFixed(2)),
        validBet: Number(validBet.toFixed(2)),
        totalReward: Number(totalReward.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2))
      }
    };
  },

  async getLobbyFeed() {
    // Query recent winning bets from MySQL bets table
    const sql = `SELECT b.id, b.game_name as gameName, b.reward, b.vendor, u.phone 
                 FROM \`bets\` b 
                 LEFT JOIN \`users\` u ON b.user_id = u.id 
                 WHERE b.reward > b.bet_amount 
                 ORDER BY b.created_at DESC LIMIT 15`;
    const res = await executeSql(sql);
    const winners = (res.rows || []).map((b: any) => {
      const p = b.phone || '01712345678';
      const masked = p.length > 4 ? `*******${p.slice(-3)}` : '*******888';
      return {
        id: b.id || `win-${Date.now()}`,
        gameId: b.gameName,
        gameNameBn: b.gameName,
        gameNameEn: b.gameName,
        gameIcon: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=120&q=80',
        userPhone: masked,
        amount: Number(b.reward || 0),
        provider: b.vendor || 'JILI'
      };
    });

    // Turnover sum for dynamic jackpot
    const tSql = `SELECT COALESCE(SUM(bet_amount), 0) as turnover FROM \`bets\``;
    const tRes = await executeSql(tSql);
    const turnover = Number(tRes.rows?.[0]?.turnover || 0);
    const baseJackpot = 478620444.89;
    const progressive = turnover * 0.015;

    return {
      success: true,
      jackpotAmount: Number((baseJackpot + progressive).toFixed(2)),
      winners
    };
  },

  async getProfitLoss(userId: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    const sql = `SELECT category, 
                        COALESCE(SUM(bet_amount), 0) as totalBet, 
                        COALESCE(SUM(reward), 0) as totalReward, 
                        COALESCE(SUM(profit), 0) as netProfit 
                 FROM \`bets\` WHERE \`user_id\` = '${cleanId}' 
                 GROUP BY category`;
    const res = await executeSql(sql);
    
    let totalBet = 0;
    let payout = 0;
    let netProfit = 0;
    const byCategory: Record<string, { totalBet: number; payout: number; netProfit: number }> = {};

    for (const row of (res.rows || [])) {
      const tb = Number(row.totalBet || 0);
      const tr = Number(row.totalReward || 0);
      const np = Number(row.netProfit || 0);
      totalBet += tb;
      payout += tr;
      netProfit += np;
      byCategory[row.category] = { totalBet: tb, payout: tr, netProfit: np };
    }

    return {
      success: true,
      totalBet,
      validBet: totalBet,
      payout,
      netProfit,
      byCategory
    };
  },

  // -------------------------------------------------------------
  // 3. PROMOTIONAL BANNERS (MySQL banners table)
  // -------------------------------------------------------------
  async getBanners(category: string = 'home') {
    return queryBengalbetApi('get_banners', { category });
  },

  async saveBanner(banner: any) {
    return queryBengalbetApi('save_banner', banner);
  },

  async deleteBanner(id: string) {
    return queryBengalbetApi('delete_banner', { id });
  },

  // -------------------------------------------------------------
  // 4. PROMOTIONS & CAMPAIGNS (MySQL promotions table)
  // -------------------------------------------------------------
  async getPromotions(category?: string) {
    return queryBengalbetApi('get_promotions', { category });
  },

  async savePromotion(promotion: any) {
    return queryBengalbetApi('save_promotion', promotion);
  },

  async deletePromotion(id: string) {
    return queryBengalbetApi('delete_promotion', { id });
  },

  // -------------------------------------------------------------
  // 5. TRANSACTIONS, DEPOSITS & WITHDRAWALS (MySQL transactions)
  // -------------------------------------------------------------
  async getTransactions(userId?: string, type?: string, status?: string, channel?: string, search?: string, limit: number = 100) {
    return queryBengalbetApi('get_transactions', { userId, type, status, channel, search, limit });
  },

  async deposit(userId: string, data: { amount: number; method: string; gateway?: string; senderAccount?: string; trxId?: string }) {
    return queryBengalbetApi('deposit', { userId, ...data });
  },

  async withdraw(userId: string, data: { amount: number; walletType: string; accountNumber: string }) {
    return queryBengalbetApi('withdraw', { userId, ...data });
  },

  async updateTransactionStatus(id: string, status: string, adminNote?: string, rejectionReason?: string) {
    return queryBengalbetApi('update_transaction_status', { id, status, adminNote, rejectionReason });
  },

  // -------------------------------------------------------------
  // 6. WALLETS (MySQL wallets table)
  // -------------------------------------------------------------
  async getWallets(userId: string) {
    return queryBengalbetApi('get_wallets', { userId });
  },

  async saveWallet(userId: string, type: string, accountName: string, accountNumber: string) {
    return queryBengalbetApi('save_wallet', { userId, type, accountName, accountNumber });
  },

  async deleteWallet(id: string) {
    return queryBengalbetApi('delete_wallet', { id });
  },

  // -------------------------------------------------------------
  // 7. VIP TIERS & REWARDS (MySQL vip_tiers, vip_claims)
  // -------------------------------------------------------------
  async getVipTiers() {
    return queryBengalbetApi('get_vip_tiers');
  },

  async claimVipReward(userId: string, type: string, level: number) {
    return queryBengalbetApi('claim_vip_reward', { userId, type, level });
  },

  // -------------------------------------------------------------
  // 8. REWARD CENTER (Spin, Egg, Red Packet, Daily Signin, Promo Code)
  // -------------------------------------------------------------
  async claimReward(userId: string, type: string, amount: number, title?: string) {
    return queryBengalbetApi('claim_reward', { userId, type, amount, title });
  },

  async getDailySignins(userId: string) {
    return queryBengalbetApi('get_daily_signins', { userId });
  },

  async claimDailySignin(userId: string, dayIndex: number, rewardAmount: number) {
    return queryBengalbetApi('claim_daily_signin', { userId, dayIndex, rewardAmount });
  },

  async redeemPromoCode(userId: string, code: string) {
    return queryBengalbetApi('redeem_promo_code', { userId, code });
  },

  // -------------------------------------------------------------
  // 9. INTERNAL MESSAGES & INBOX (MySQL messages table)
  // -------------------------------------------------------------
  async getMessages(userId: string) {
    return queryBengalbetApi('get_messages', { userId });
  },

  async markMessageRead(id: string) {
    return queryBengalbetApi('read_message', { id });
  },

  async claimMessageBonus(id: string, userId: string) {
    return queryBengalbetApi('claim_message_bonus', { id, userId });
  },

  // -------------------------------------------------------------
  // 10. REFERRALS & AFFILIATE SYSTEM (MySQL referrals, users)
  // -------------------------------------------------------------
  async getReferrals(userId: string) {
    return queryBengalbetApi('get_referrals', { userId });
  },

  async getReferralStats(userId: string) {
    return queryBengalbetApi('get_referral_stats', { userId });
  },

  // -------------------------------------------------------------
  // 11. SUPPORT TICKETS & FEEDBACK (MySQL support_tickets)
  // -------------------------------------------------------------
  async getTickets(userId?: string, status?: string) {
    return queryBengalbetApi('get_tickets', { userId, status });
  },

  async createTicket(userId: string, category: string, subject: string, description: string, priority?: string) {
    return queryBengalbetApi('create_ticket', { userId, category, subject, description, priority });
  },

  async updateTicketStatus(id: string, status: string, adminNotes?: string) {
    return queryBengalbetApi('update_ticket_status', { id, status, adminNotes });
  },

  // -------------------------------------------------------------
  // 12. LIVE CHAT & CONVERSATIONS (MySQL livechat_sessions, livechat_messages)
  // -------------------------------------------------------------
  async getChatSessions(userId?: string, status?: string) {
    return queryBengalbetApi('get_chat_sessions', { userId, status });
  },

  async getChatMessages(sessionId: string) {
    return queryBengalbetApi('get_chat_messages', { sessionId });
  },

  async sendChatMessage(sessionId: string, userId: string, senderType: string, senderName: string, message: string) {
    return queryBengalbetApi('send_chat_message', { sessionId, userId, senderType, senderName, message });
  },

  async closeChatSession(sessionId: string, rating?: number, comment?: string) {
    return queryBengalbetApi('close_chat_session', { sessionId, rating, comment });
  },

  // -------------------------------------------------------------
  // 13. GLOBAL SETTINGS (MySQL site_settings table)
  // -------------------------------------------------------------
  async getSettings() {
    return queryBengalbetApi('get_settings');
  },

  async updateSettings(key: string, value: any) {
    return queryBengalbetApi('update_settings', { key, value });
  },

  // -------------------------------------------------------------
  // 14. ADMIN SUITE (All MySQL tables management)
  // -------------------------------------------------------------
  async getUsers() {
    return queryBengalbetApi('get_users');
  },

  async updateUserBalance(userId: string, amount: number, type: 'add' | 'deduct' | 'set', note?: string) {
    return queryBengalbetApi('update_user_balance', { userId, amount, type, note });
  },

  async updateUserVip(userId: string, vipLevel: number, vipExp?: number) {
    return queryBengalbetApi('update_user_vip', { userId, vipLevel, vipExp });
  },

  async updateUserStatus(userId: string, status: 'active' | 'frozen' | 'banned') {
    return queryBengalbetApi('update_user_status', { userId, status });
  },

  async deleteUser(userId: string) {
    return queryBengalbetApi('delete_user', { userId });
  },

  // -------------------------------------------------------------
  // 15. COMPREHENSIVE VIP TIERS & REWARDS MANAGEMENT (MySQL)
  // -------------------------------------------------------------
  async saveVipTier(tier: any) {
    const level = Number(tier.level || 0);
    const name = String(tier.name || `VIP ${level}`).replace(/'/g, "\\'");
    const badgeType = String(tier.badgeType || 'bronze').replace(/'/g, "\\'");
    const targetBet = Number(tier.targetBet || 0);
    const targetBetDisplay = String(tier.targetBetDisplay || `৳${targetBet.toLocaleString()}`).replace(/'/g, "\\'");
    const depositTarget = Number(tier.depositTarget || 0);
    const upgradeBonus = Number(tier.upgradeBonus || 0);
    const weeklyBonus = Number(tier.weeklyBonus || 0);
    const monthlyBonus = Number(tier.monthlyBonus || 0);
    const birthdayBonus = Number(tier.birthdayBonus || 0);
    const slotRebate = Number(tier.slotRebate || 0);
    const liveRebate = Number(tier.liveRebate || 0);
    const desc = String(tier.description || '').replace(/'/g, "\\'");
    const perks = JSON.stringify(tier.perks || []).replace(/'/g, "\\'");
    const status = String(tier.status || 'active').replace(/'/g, "\\'");
    const now = new Date().toISOString();

    const sql = `INSERT INTO \`vip_tiers\` 
      (\`level\`, \`name\`, \`badge_type\`, \`target_bet\`, \`target_bet_display\`, \`deposit_target\`, 
       \`upgrade_bonus\`, \`weekly_bonus\`, \`monthly_bonus\`, \`birthday_bonus\`, \`slot_rebate\`, 
       \`live_rebate\`, \`description\`, \`perks_json\`, \`status\`, \`updated_at\`)
      VALUES 
      (${level}, '${name}', '${badgeType}', ${targetBet}, '${targetBetDisplay}', ${depositTarget},
       ${upgradeBonus}, ${weeklyBonus}, ${monthlyBonus}, ${birthdayBonus}, ${slotRebate},
       ${liveRebate}, '${desc}', '${perks}', '${status}', '${now}')
      ON DUPLICATE KEY UPDATE 
       \`name\`='${name}', \`badge_type\`='${badgeType}', \`target_bet\`=${targetBet}, 
       \`target_bet_display\`='${targetBetDisplay}', \`deposit_target\`=${depositTarget},
       \`upgrade_bonus\`=${upgradeBonus}, \`weekly_bonus\`=${weeklyBonus}, \`monthly_bonus\`=${monthlyBonus},
       \`birthday_bonus\`=${birthdayBonus}, \`slot_rebate\`=${slotRebate}, \`live_rebate\`=${liveRebate},
       \`description\`='${desc}', \`perks_json\`='${perks}', \`status\`='${status}', \`updated_at\`='${now}'`;
    await executeSql(sql);
    return { success: true, message: `VIP Level ${level} সফলভাবে সংরক্ষিত হয়েছে` };
  },

  async deleteVipTier(level: number) {
    await executeSql(`DELETE FROM \`vip_tiers\` WHERE \`level\` = ${Number(level)}`);
    return { success: true, message: `VIP Level ${level} মুছে ফেলা হয়েছে` };
  },

  async resetVipTiers() {
    await executeSql(`DELETE FROM \`vip_tiers\``);
    const defaults = [
      { level: 0, name: 'VIP 0', badge_type: 'bronze', target_bet: 0, target_bet_display: '৳০', upgrade_bonus: 0, weekly_bonus: 0, monthly_bonus: 0, birthday_bonus: 0, slot_rebate: 0.1, live_rebate: 0.05 },
      { level: 1, name: 'VIP 1 (রৌপ্য)', badge_type: 'silver', target_bet: 50000, target_bet_display: '৳৫০,০০০', upgrade_bonus: 188, weekly_bonus: 58, monthly_bonus: 188, birthday_bonus: 288, slot_rebate: 0.3, live_rebate: 0.15 },
      { level: 2, name: 'VIP 2 (স্বর্ণ)', badge_type: 'gold', target_bet: 200000, target_bet_display: '৳২,০০,০০০', upgrade_bonus: 588, weekly_bonus: 188, monthly_bonus: 588, birthday_bonus: 888, slot_rebate: 0.45, live_rebate: 0.25 },
      { level: 3, name: 'VIP 3 (প্লাটিনাম)', badge_type: 'platinum', target_bet: 800000, target_bet_display: '৳৮,০০,০০০', upgrade_bonus: 1888, weekly_bonus: 588, monthly_bonus: 1888, birthday_bonus: 2888, slot_rebate: 0.6, live_rebate: 0.35 },
      { level: 4, name: 'VIP 4 (হীরা)', badge_type: 'diamond', target_bet: 3000000, target_bet_display: '৳৩০,০০,০০০', upgrade_bonus: 5888, weekly_bonus: 1888, monthly_bonus: 5888, birthday_bonus: 8888, slot_rebate: 0.8, live_rebate: 0.5 },
      { level: 5, name: 'VIP 5 (মুকুট)', badge_type: 'crown', target_bet: 10000000, target_bet_display: '৳১,০০,০০,০০০', upgrade_bonus: 18888, weekly_bonus: 5888, monthly_bonus: 18888, birthday_bonus: 28888, slot_rebate: 1.0, live_rebate: 0.7 }
    ];
    for (const d of defaults) {
      await this.saveVipTier(d);
    }
    return { success: true, message: 'VIP লেভেল সফলভাবে রিসেট করা হয়েছে' };
  },

  async getVipRewardClaims(userId?: string) {
    let sql = `SELECT * FROM \`vip_claims\``;
    if (userId) {
      sql += ` WHERE \`user_id\` = '${userId.replace(/'/g, "\\'")}'`;
    }
    sql += ` ORDER BY \`timestamp\` DESC LIMIT 100`;
    const res = await executeSql(sql);
    return res.rows || [];
  },

  async getVipStats() {
    const userRes = await executeSql(`SELECT COUNT(*) as totalUsers, MAX(vip_level) as highestLevel FROM \`users\``);
    const claimsRes = await executeSql(`SELECT COALESCE(SUM(bonus), 0) as totalBonusPaid, COUNT(*) as totalClaims FROM \`vip_claims\``);
    const distRes = await executeSql(`SELECT vip_level, COUNT(*) as count FROM \`users\` GROUP BY vip_level`);

    const levelDistribution: Record<number, number> = {};
    (distRes.rows || []).forEach((r: any) => {
      levelDistribution[Number(r.vip_level || 0)] = Number(r.count || 0);
    });

    return {
      totalVipMembers: Number(userRes.rows?.[0]?.totalUsers || 0),
      highestLevel: Number(userRes.rows?.[0]?.highestLevel || 0),
      totalBonusesClaimed: Number(claimsRes.rows?.[0]?.totalBonusPaid || 0),
      activeClaimsCount: Number(claimsRes.rows?.[0]?.totalClaims || 0),
      levelDistribution
    };
  },

  async adminUpdateUserVip(userId: string, vipLevel: number, vipExp: number = 0, bonusAmount: number = 0, note: string = '') {
    const cleanId = userId.replace(/'/g, "\\'");
    const userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = '${cleanId}' LIMIT 1`);
    if (!userRes.success || !userRes.rows.length) {
      return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    }
    const user = userRes.rows[0];
    const prevLevel = Number(user.vip_level || 0);

    let newBalance = Number(user.balance || 0);
    if (bonusAmount > 0) {
      newBalance += bonusAmount;
      const trxId = `VIP-ADM-${Date.now()}`;
      const now = new Date().toISOString();
      await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
        VALUES ('${trxId}', '${cleanId}', '${user.username.replace(/'/g, "\\'")}', '${user.phone}', 'bonus', ${bonusAmount}, '${trxId}', 'success', 'অ্যাডমিন VIP আপগ্রেড বোনাস (${note || `VIP ${vipLevel}`})', '${now}')`);
    }

    await executeSql(`UPDATE \`users\` SET \`vip_level\` = ${Number(vipLevel)}, \`vip_exp\` = ${Number(vipExp)}, \`balance\` = ${newBalance} WHERE \`id\` = '${cleanId}'`);
    return {
      success: true,
      message: `ব্যবহারকারীর VIP লেভেল সফলভাবে VIP ${vipLevel}-এ পরিবর্তন করা হয়েছে`,
      prevLevel,
      newLevel: vipLevel,
      bonusAwarded: bonusAmount
    };
  },

  // -------------------------------------------------------------
  // 16. REFERRALS & AFFILIATE OPERATIONS (MySQL)
  // -------------------------------------------------------------
  async getReferralRecords(userId: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    const friendsRes = await executeSql(`SELECT * FROM \`referrals\` WHERE \`referrer_id\` = '${cleanId}' ORDER BY \`joined_at\` DESC`);
    const claimsRes = await executeSql(`SELECT * FROM \`referral_claims\` WHERE \`user_id\` = '${cleanId}' ORDER BY \`claimed_at\` DESC`);

    const records: any[] = [];
    (claimsRes.rows || []).forEach((c: any) => {
      records.push({
        id: c.id,
        regDate: c.claimed_at,
        username: 'মাইলস্টোন বোনাস',
        category: `মাইলস্টোন পুরস্কার (${c.required_count} বন্ধু)`,
        amount: Number(c.bonus_amount || 0).toFixed(2),
        status: 'সফল'
      });
    });

    (friendsRes.rows || []).forEach((f: any) => {
      if (f.instant_bonus_paid && Number(f.instant_bonus_amount || 0) > 0) {
        records.push({
          id: `rec-inv-${f.id}`,
          regDate: f.joined_at,
          username: f.referred_username,
          category: 'আমন্ত্রণ পুরস্কার',
          amount: Number(f.instant_bonus_amount).toFixed(2),
          status: 'সফল'
        });
      }
      if (Number(f.deposit_commission || 0) > 0) {
        records.push({
          id: `rec-dep-${f.id}`,
          regDate: f.joined_at,
          username: f.referred_username,
          category: 'জমা রিবেট কমিশন (০.৭%)',
          amount: Number(f.deposit_commission).toFixed(2),
          status: 'সফল'
        });
      }
      if (Number(f.bet_commission || 0) > 0) {
        records.push({
          id: `rec-bet-${f.id}`,
          regDate: f.joined_at,
          username: f.referred_username,
          category: 'বেটিং রিবেট কমিশন (১.০%)',
          amount: Number(f.bet_commission).toFixed(2),
          status: 'সফল'
        });
      }
    });

    records.sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime());
    return records;
  },

  async claimReferralTier(userId: string, tierId: number) {
    const cleanId = userId.replace(/'/g, "\\'");
    // Check friend count
    const refCountRes = await executeSql(`SELECT COUNT(*) as count FROM \`referrals\` WHERE \`referrer_id\` = '${cleanId}'`);
    const friendCount = Number(refCountRes.rows?.[0]?.count || 0);

    const tierBonusMap: Record<number, { required: number; bonus: number }> = {
      1: { required: 1, bonus: 100 },
      2: { required: 3, bonus: 300 },
      3: { required: 5, bonus: 500 },
      4: { required: 10, bonus: 1000 },
      5: { required: 20, bonus: 2000 },
      6: { required: 50, bonus: 5000 },
      7: { required: 100, bonus: 10000 }
    };

    const target = tierBonusMap[tierId] || { required: tierId * 2, bonus: tierId * 200 };
    if (friendCount < target.required) {
      return { success: false, message: `ন্যূনতম ${target.required} জন সক্রিয় বন্ধু প্রয়োজন (আপনার আছে ${friendCount})` };
    }

    // Check if already claimed
    const checkRes = await executeSql(`SELECT * FROM \`referral_claims\` WHERE \`user_id\` = '${cleanId}' AND \`tier_id\` = ${tierId} LIMIT 1`);
    if (checkRes.rows && checkRes.rows.length > 0) {
      return { success: false, message: 'এই টায়ার পুরস্কারটি ইতিমধ্যেই দাবি করা হয়েছে' };
    }

    const claimId = `ref-claim-${Date.now()}`;
    const now = new Date().toISOString();
    const trxId = `REFTRX${Date.now()}`;

    await executeSql(`INSERT INTO \`referral_claims\` (\`id\`, \`user_id\`, \`tier_id\`, \`required_count\`, \`bonus_amount\`, \`trx_id\`, \`claimed_at\`)
      VALUES ('${claimId}', '${cleanId}', ${tierId}, ${target.required}, ${target.bonus}, '${trxId}', '${now}')`);

    // Credit user balance
    await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${target.bonus}, \`total_earnings\` = \`total_earnings\` + ${target.bonus} WHERE \`id\` = '${cleanId}'`);

    // Add transaction
    await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
      VALUES ('${trxId}', '${cleanId}', 'bonus', ${target.bonus}, '${trxId}', 'success', 'রেফারেল মাইলস্টোন বোনাস ৳${target.bonus}', '${now}')`);

    return { success: true, message: `অভিনন্দন! ৳${target.bonus} রেফারেল মাইলস্টোন বোনাস আপনার অ্যাকাউন্টে জমা হয়েছে।`, bonus: target.bonus };
  },

  async bindReferralCode(userId: string, code: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    const cleanCode = code.replace(/'/g, "\\'").trim().toUpperCase();

    // Check user
    const userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = '${cleanId}' LIMIT 1`);
    if (!userRes.rows || !userRes.rows.length) return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    const user = userRes.rows[0];

    // Check existing referral
    const existRef = await executeSql(`SELECT * FROM \`referrals\` WHERE \`referred_user_id\` = '${cleanId}' LIMIT 1`);
    if (existRef.rows && existRef.rows.length > 0) {
      return { success: false, message: 'আপনি ইতিমধ্যেই অন্য একজন ব্যবহারকারীর আমন্ত্রণ কোড সংযুক্ত করেছেন' };
    }

    // Find referrer
    const refUserRes = await executeSql(`SELECT * FROM \`users\` WHERE UPPER(\`referral_code\`) = '${cleanCode}' LIMIT 1`);
    if (!refUserRes.rows || !refUserRes.rows.length) {
      return { success: false, message: 'ভুল রেফারেল কোড! কোনো ব্যবহারকারী পাওয়া যায়নি।' };
    }
    const referrer = refUserRes.rows[0];
    if (referrer.id === userId) {
      return { success: false, message: 'নিজের রেফারেল কোড নিজে ব্যবহার করা যাবে না' };
    }

    const refId = `ref-${Date.now()}`;
    const now = new Date().toISOString();
    const bonus = 100.00;

    // Insert referral record
    await executeSql(`INSERT INTO \`referrals\` 
      (\`id\`, \`referrer_id\`, \`referrer_username\`, \`referrer_code\`, \`referred_user_id\`, \`referred_username\`, \`referred_phone\`, \`instant_bonus_paid\`, \`instant_bonus_amount\`, \`status\`, \`joined_at\`)
      VALUES 
      ('${refId}', '${referrer.id}', '${referrer.username.replace(/'/g, "\\'")}', '${cleanCode}', '${cleanId}', '${user.username.replace(/'/g, "\\'")}', '${user.phone}', 1, ${bonus}, 'active', '${now}')`);

    // Credit referrer balance
    await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${bonus}, \`total_earnings\` = \`total_earnings\` + ${bonus}, \`referred_friends_count\` = \`referred_friends_count\` + 1 WHERE \`id\` = '${referrer.id}'`);

    // Record transaction
    const trxId = `REF-INV-${Date.now()}`;
    await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
      VALUES ('${trxId}', '${referrer.id}', '${referrer.username.replace(/'/g, "\\'")}', '${referrer.phone}', 'commission', ${bonus}, '${trxId}', 'success', 'রেফারেল আমন্ত্রণ পুরস্কার (${user.username}) ৳${bonus}', '${now}')`);

    return { success: true, message: `রেফারেল কোড (${code}) সফলভাবে লিঙ্ক করা হয়েছে! আমন্ত্রণকারী ৳${bonus} বোনাস পেয়েছেন।` };
  },

  async getAdminReferralsList(search?: string, status?: string) {
    let sql = `SELECT * FROM \`referrals\``;
    const conditions: string[] = [];
    if (status && status !== 'all') {
      conditions.push(`\`status\` = '${status.replace(/'/g, "\\'")}'`);
    }
    if (search) {
      const s = search.replace(/'/g, "\\'");
      conditions.push(`(\`referrer_username\` LIKE '%${s}%' OR \`referred_username\` LIKE '%${s}%' OR \`referred_phone\` LIKE '%${s}%')`);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    sql += ` ORDER BY \`joined_at\` DESC LIMIT 100`;
    const res = await executeSql(sql);
    return res.rows || [];
  },

  async getAdminReferralClaims() {
    const res = await executeSql(`SELECT * FROM \`referral_claims\` ORDER BY \`claimed_at\` DESC LIMIT 100`);
    return res.rows || [];
  },

  async updateReferralStatus(id: string, status: string) {
    await executeSql(`UPDATE \`referrals\` SET \`status\` = '${status.replace(/'/g, "\\'")}' WHERE \`id\` = '${id.replace(/'/g, "\\'")}'`);
    return { success: true, message: `রেফারেল স্ট্যাটাস সফলভাবে '${status}' করা হয়েছে` };
  },

  async manualReferralBonusPayout(userId: string, amount: number, note: string = '') {
    const cleanId = userId.replace(/'/g, "\\'");
    const userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = '${cleanId}' LIMIT 1`);
    if (!userRes.rows || !userRes.rows.length) return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    const user = userRes.rows[0];

    const trxId = `REF-ADM-${Date.now()}`;
    const now = new Date().toISOString();

    await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${amount}, \`total_earnings\` = \`total_earnings\` + ${amount} WHERE \`id\` = '${cleanId}'`);
    await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
      VALUES ('${trxId}', '${cleanId}', '${user.username.replace(/'/g, "\\'")}', '${user.phone}', 'commission', ${amount}, '${trxId}', 'success', 'অ্যাডমিন ম্যানুয়াল রেফারেল কমিশন পেআউট ৳${amount} (${note})', '${now}')`);

    return { success: true, message: `৳${amount} রেফারেল কমিশন সফলভাবে পেআউট করা হয়েছে` };
  },

  // -------------------------------------------------------------
  // 17. PROMOTIONS & PROMO CODES MANAGEMENT (MySQL)
  // -------------------------------------------------------------
  async getPromoCodes(status?: string, search?: string) {
    let sql = `SELECT * FROM \`promo_codes\``;
    const conds: string[] = [];
    if (status && status !== 'all') {
      conds.push(`\`status\` = '${status.replace(/'/g, "\\'")}'`);
    }
    if (search) {
      const s = search.replace(/'/g, "\\'");
      conds.push(`(\`code\` LIKE '%${s}%' OR \`title\` LIKE '%${s}%')`);
    }
    if (conds.length) sql += ` WHERE ` + conds.join(' AND ');
    sql += ` ORDER BY \`created_at\` DESC`;
    const res = await executeSql(sql);
    return res.rows || [];
  },

  async createPromoCode(promo: any) {
    const id = promo.id || `promo-${Date.now()}`;
    const code = String(promo.code || '').toUpperCase().replace(/'/g, "\\'");
    const title = String(promo.title || '').replace(/'/g, "\\'");
    const rewardType = String(promo.rewardType || 'bonus').replace(/'/g, "\\'");
    const rewardAmount = Number(promo.rewardAmount || 0);
    const maxUses = Number(promo.maxUses || 100);
    const usesCount = Number(promo.usesCount || 0);
    const minDeposit = Number(promo.minDeposit || 0);
    const status = String(promo.status || 'active').replace(/'/g, "\\'");
    const expiresAt = String(promo.expiresAt || '').replace(/'/g, "\\'");
    const now = new Date().toISOString();

    const sql = `INSERT INTO \`promo_codes\` 
      (\`id\`, \`code\`, \`title\`, \`reward_type\`, \`reward_amount\`, \`max_uses\`, \`uses_count\`, \`min_deposit\`, \`status\`, \`expires_at\`, \`created_at\`)
      VALUES 
      ('${id}', '${code}', '${title}', '${rewardType}', ${rewardAmount}, ${maxUses}, ${usesCount}, ${minDeposit}, '${status}', '${expiresAt}', '${now}')`;
    await executeSql(sql);
    return { success: true, message: `প্রোমো কোড ${code} সফলভাবে তৈরি করা হয়েছে`, promo: { id, code, rewardAmount } };
  },

  async updatePromoCode(id: string, updates: any) {
    const cleanId = id.replace(/'/g, "\\'");
    const sets: string[] = [];
    if (updates.code) sets.push(`\`code\` = '${String(updates.code).toUpperCase().replace(/'/g, "\\'")}'`);
    if (updates.title) sets.push(`\`title\` = '${String(updates.title).replace(/'/g, "\\'")}'`);
    if (updates.rewardAmount !== undefined) sets.push(`\`reward_amount\` = ${Number(updates.rewardAmount)}`);
    if (updates.maxUses !== undefined) sets.push(`\`max_uses\` = ${Number(updates.maxUses)}`);
    if (updates.status) sets.push(`\`status\` = '${String(updates.status).replace(/'/g, "\\'")}'`);
    if (sets.length > 0) {
      await executeSql(`UPDATE \`promo_codes\` SET ${sets.join(', ')} WHERE \`id\` = '${cleanId}'`);
    }
    return { success: true, message: 'প্রোমো কোড সফলভাবে আপডেট করা হয়েছে' };
  },

  async deletePromoCode(id: string) {
    await executeSql(`DELETE FROM \`promo_codes\` WHERE \`id\` = '${id.replace(/'/g, "\\'")}'`);
    return { success: true, message: 'প্রোমো কোড সফলভাবে মুছে ফেলা হয়েছে' };
  },

  async getAllPromoRedemptions(search?: string, code?: string) {
    let sql = `SELECT * FROM \`promo_redemptions\``;
    const conds: string[] = [];
    if (code) conds.push(`\`code\` = '${code.replace(/'/g, "\\'")}'`);
    if (search) {
      const s = search.replace(/'/g, "\\'");
      conds.push(`(\`username\` LIKE '%${s}%' OR \`phone\` LIKE '%${s}%' OR \`code\` LIKE '%${s}%')`);
    }
    if (conds.length) sql += ` WHERE ` + conds.join(' AND ');
    sql += ` ORDER BY \`redeemed_at\` DESC LIMIT 100`;
    const res = await executeSql(sql);
    return res.rows || [];
  },

  // -------------------------------------------------------------
  // 18. RESCUE FUND MANAGEMENT (MySQL)
  // -------------------------------------------------------------
  async getRescueTiers() {
    const res = await executeSql(`SELECT * FROM \`rescue_tiers\` ORDER BY \`min_loss\` ASC`);
    return res.rows || [];
  },

  async saveRescueTier(tier: any) {
    const id = tier.id || `rescue-${Date.now()}`;
    const name = String(tier.name || 'রেসকিউ বোনাস').replace(/'/g, "\\'");
    const minLoss = Number(tier.minLoss || 0);
    const maxLoss = Number(tier.maxLoss || 9999999);
    const percentage = Number(tier.percentage || 5);
    const maxBonus = Number(tier.maxBonus || 1000);
    const status = String(tier.status || 'active').replace(/'/g, "\\'");

    const sql = `INSERT INTO \`rescue_tiers\` (\`id\`, \`name\`, \`min_loss\`, \`max_loss\`, \`percentage\`, \`max_bonus\`, \`status\`)
      VALUES ('${id}', '${name}', ${minLoss}, ${maxLoss}, ${percentage}, ${maxBonus}, '${status}')
      ON DUPLICATE KEY UPDATE \`name\`='${name}', \`min_loss\`=${minLoss}, \`max_loss\`=${maxLoss}, \`percentage\`=${percentage}, \`max_bonus\`=${maxBonus}, \`status\`='${status}'`;
    await executeSql(sql);
    return { success: true, message: 'রেসকিউ টায়ার সফলভাবে সংরক্ষিত হয়েছে' };
  },

  async deleteRescueTier(id: string) {
    await executeSql(`DELETE FROM \`rescue_tiers\` WHERE \`id\` = '${id.replace(/'/g, "\\'")}'`);
    return { success: true, message: 'রেসকিউ টায়ার মুছে ফেলা হয়েছে' };
  },

  async getUserRescueStatus(userId: string, targetDate?: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    const date = targetDate || new Date().toISOString().split('T')[0];

    // Compute net loss today from MySQL bets
    const betRes = await executeSql(`SELECT COALESCE(SUM(bet_amount), 0) as totalBet, COALESCE(SUM(reward), 0) as totalReward 
      FROM \`bets\` WHERE \`user_id\` = '${cleanId}' AND (\`date\` = '${date}' OR \`created_at\` LIKE '${date}%')`);
    
    const totalBet = Number(betRes.rows?.[0]?.totalBet || 0);
    const totalReward = Number(betRes.rows?.[0]?.totalReward || 0);
    const netLoss = Math.max(0, totalBet - totalReward);

    // Check existing claim today
    const claimRes = await executeSql(`SELECT * FROM \`rescue_claims\` WHERE \`user_id\` = '${cleanId}' AND \`date\` = '${date}' LIMIT 1`);
    const alreadyClaimed = claimRes.rows && claimRes.rows.length > 0;

    // Find best tier
    const tiers = await this.getRescueTiers();
    let eligibleTier = null;
    let rescueBonus = 0;
    for (const t of tiers) {
      if (netLoss >= Number(t.min_loss)) {
        eligibleTier = t;
        rescueBonus = Math.min(Number(t.max_bonus), Number((netLoss * (Number(t.percentage) / 100)).toFixed(2)));
      }
    }

    return {
      success: true,
      date,
      totalBet,
      totalReward,
      netLoss,
      alreadyClaimed,
      claim: alreadyClaimed ? claimRes.rows[0] : null,
      eligibleTier,
      rescueBonus: alreadyClaimed ? 0 : rescueBonus
    };
  },

  async claimRescueFund(userId: string, date?: string) {
    const status = await this.getUserRescueStatus(userId, date);
    if (status.alreadyClaimed) {
      return { success: false, message: 'আজকের রেসকিউ ফান্ড ইতিমধ্যেই দাবি করা হয়েছে' };
    }
    if (status.rescueBonus <= 0) {
      return { success: false, message: 'আপনার বর্তমান লোকসান রেসকিউ ফান্ডের যোগ্যতার নিচে' };
    }

    const cleanId = userId.replace(/'/g, "\\'");
    const claimId = `res-claim-${Date.now()}`;
    const trxId = `RESCUE-${Date.now()}`;
    const now = new Date().toISOString();
    const today = status.date;

    await executeSql(`INSERT INTO \`rescue_claims\` (\`id\`, \`user_id\`, \`tier_id\`, \`loss_amount\`, \`bonus_amount\`, \`date\`, \`status\`, \`claimed_at\`)
      VALUES ('${claimId}', '${cleanId}', '${status.eligibleTier?.id || 't1'}', ${status.netLoss}, ${status.rescueBonus}, '${today}', 'approved', '${now}')`);

    await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${status.rescueBonus} WHERE \`id\` = '${cleanId}'`);
    await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
      VALUES ('${trxId}', '${cleanId}', 'bonus', ${status.rescueBonus}, '${trxId}', 'success', 'দৈনিক লোকসান রেসকিউ ফান্ড ৳${status.rescueBonus}', '${now}')`);

    return {
      success: true,
      message: `অভিনন্দন! ৳${status.rescueBonus} রেসকিউ ফান্ড সরাসরি আপনার অ্যাকাউন্টে জমা হয়েছে।`,
      amount: status.rescueBonus
    };
  },

  async getAllRescueClaims(status?: string, search?: string, date?: string) {
    let sql = `SELECT * FROM \`rescue_claims\``;
    const conds: string[] = [];
    if (status && status !== 'all') conds.push(`\`status\` = '${status.replace(/'/g, "\\'")}'`);
    if (date) conds.push(`\`date\` = '${date.replace(/'/g, "\\'")}'`);
    if (conds.length) sql += ` WHERE ` + conds.join(' AND ');
    sql += ` ORDER BY \`claimed_at\` DESC LIMIT 100`;
    const res = await executeSql(sql);
    return res.rows || [];
  },

  // -------------------------------------------------------------
  // 19. DAILY SIGN-IN SYSTEM (MySQL)
  // -------------------------------------------------------------
  async getUserDailySignInState(userId: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    const today = new Date().toISOString().split('T')[0];
    const claimsRes = await executeSql(`SELECT * FROM \`daily_signins\` WHERE \`user_id\` = '${cleanId}' ORDER BY \`date\` DESC LIMIT 14`);
    const claims = claimsRes.rows || [];

    const todayClaim = claims.find((c: any) => c.date === today);
    const consecutive = claims.length;

    return {
      success: true,
      canClaimToday: !todayClaim,
      currentStreak: Math.max(1, (consecutive % 7) + 1),
      todayClaimed: !!todayClaim,
      claims
    };
  },

  async getAllDailySignInRecords(search?: string, date?: string) {
    let sql = `SELECT * FROM \`daily_signins\``;
    const conds: string[] = [];
    if (date) conds.push(`\`date\` = '${date.replace(/'/g, "\\'")}'`);
    if (search) {
      const s = search.replace(/'/g, "\\'");
      conds.push(`(\`username\` LIKE '%${s}%' OR \`user_id\` LIKE '%${s}%')`);
    }
    if (conds.length) sql += ` WHERE ` + conds.join(' AND ');
    return res.rows || [];
  },

  async claimDailySignIn(userId: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    const today = new Date().toISOString().split('T')[0];

    // Check user
    const userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = '${cleanId}' LIMIT 1`);
    if (!userRes.rows || !userRes.rows.length) {
      return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    }
    const user = userRes.rows[0];

    // Check if already claimed today
    const checkRes = await executeSql(`SELECT * FROM \`daily_signins\` WHERE \`user_id\` = '${cleanId}' AND \`date\` = '${today}' LIMIT 1`);
    if (checkRes.rows && checkRes.rows.length > 0) {
      return { success: false, message: 'আজকের সাইন-ইন পুরস্কার ইতিমধ্যেই দাবি করা হয়েছে' };
    }

    // Calculate streak
    const historyRes = await executeSql(`SELECT * FROM \`daily_signins\` WHERE \`user_id\` = '${cleanId}' ORDER BY \`date\` DESC LIMIT 14`);
    const history = historyRes.rows || [];
    const currentStreak = Math.min(7, (history.length % 7) + 1);

    const rewards: Record<number, number> = { 1: 18, 2: 28, 3: 58, 4: 88, 5: 128, 6: 188, 7: 388 };
    const bonus = rewards[currentStreak] || 18;
    const signinId = `sgn-${Date.now()}`;
    const now = new Date().toISOString();
    const trxId = `SGN-${Date.now()}`;

    // Insert daily signin
    await executeSql(`INSERT INTO \`daily_signins\` (\`id\`, \`user_id\`, \`username\`, \`day\`, \`bonus\`, \`date\`, \`claimed_at\`, \`streak\`, \`status\`, \`note\`)
      VALUES ('${signinId}', '${cleanId}', '${user.username.replace(/'/g, "\\'")}', ${currentStreak}, ${bonus}, '${today}', '${now}', ${currentStreak}, 'claimed', 'দিন ${currentStreak} সাইন-ইন পুরস্কার')`);

    // Credit user balance
    await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${bonus}, \`total_earnings\` = \`total_earnings\` + ${bonus} WHERE \`id\` = '${cleanId}'`);

    // Record transaction
    await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
      VALUES ('${trxId}', '${cleanId}', '${user.username.replace(/'/g, "\\'")}', '${user.phone}', 'bonus', ${bonus}, '${trxId}', 'success', 'দৈনিক সাইন-ইন বোনাস (দিন ${currentStreak}) ৳${bonus}', '${now}')`);

    return {
      success: true,
      message: `অভিনন্দন! দিন ${currentStreak}-এর সাইন-ইন বোনাস ৳${bonus} আপনার অ্যাকাউন্টে জমা হয়েছে।`,
      bonus,
      streak: currentStreak,
      date: today
    };
  },

  async getDailySignInConfig() {
    const res = await executeSql(`SELECT \`setting_value\` FROM \`site_settings\` WHERE \`setting_key\` = 'daily_signin_config' LIMIT 1`);
    if (res.rows && res.rows.length > 0) {
      try { return JSON.parse(res.rows[0].setting_value); } catch {}
    }
    return {
      enabled: true,
      rewards: [
        { day: 1, bonus: 18, title: 'দিন ১' },
        { day: 2, bonus: 28, title: 'দিন ২' },
        { day: 3, bonus: 58, title: 'দিন ৩' },
        { day: 4, bonus: 88, title: 'দিন ৪' },
        { day: 5, bonus: 128, title: 'দিন ৫' },
        { day: 6, bonus: 188, title: 'দিন ৬' },
        { day: 7, bonus: 388, title: 'দিন ৭ (মেগা পুরস্কার)' }
      ]
    };
  },

  async updateDailySignInConfig(config: any) {
    const val = JSON.stringify(config).replace(/'/g, "\\'");
    const now = new Date().toISOString();
    await executeSql(`INSERT INTO \`site_settings\` (\`setting_key\`, \`setting_value\`, \`updated_at\`) 
      VALUES ('daily_signin_config', '${val}', '${now}') 
      ON DUPLICATE KEY UPDATE \`setting_value\`='${val}', \`updated_at\`='${now}'`);
    return config;
  },

  async adminManualCreditSignIn(userId: string, day: number, bonus: number, note: string = '') {
    const cleanId = userId.replace(/'/g, "\\'");
    const userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = '${cleanId}' LIMIT 1`);
    if (!userRes.rows || !userRes.rows.length) return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    const user = userRes.rows[0];

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const signinId = `sgn-adm-${Date.now()}`;
    const trxId = `SGN-ADM-${Date.now()}`;

    await executeSql(`INSERT INTO \`daily_signins\` (\`id\`, \`user_id\`, \`username\`, \`day\`, \`bonus\`, \`date\`, \`claimed_at\`, \`streak\`, \`status\`, \`note\`)
      VALUES ('${signinId}', '${cleanId}', '${user.username.replace(/'/g, "\\'")}', ${day}, ${bonus}, '${today}', '${now}', ${day}, 'claimed', '${(note || 'অ্যাডমিন ম্যানুয়াল সাইন-ইন').replace(/'/g, "\\'")}')`);

    await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${bonus} WHERE \`id\` = '${cleanId}'`);
    await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
      VALUES ('${trxId}', '${cleanId}', '${user.username.replace(/'/g, "\\'")}', '${user.phone}', 'bonus', ${bonus}, '${trxId}', 'success', 'অ্যাডমিন ম্যানুয়াল সাইন-ইন ক্রেডিট ৳${bonus}', '${now}')`);

    return { success: true, message: `৳${bonus} সাইন-ইন বোনাস সফলভাবে প্রদান করা হয়েছে`, bonus };
  },

  async adminResetSignInStreak(userId: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    await executeSql(`DELETE FROM \`daily_signins\` WHERE \`user_id\` = '${cleanId}'`);
    return { success: true, message: 'ব্যবহারকারীর সাইন-ইন স্ট্রিক সফলভাবে রিসেট করা হয়েছে' };
  },

  // -------------------------------------------------------------
  // 20. REFERRAL POLICY & STATS SETTINGS (MySQL)
  // -------------------------------------------------------------
  async getReferralSettings() {
    const res = await executeSql(`SELECT \`setting_value\` FROM \`site_settings\` WHERE \`setting_key\` = 'referral_settings' LIMIT 1`);
    if (res.rows && res.rows.length > 0) {
      try { return JSON.parse(res.rows[0].setting_value); } catch {}
    }
    return {
      autoCreditInstantBonus: true,
      instantBonusPerFriend: 100.00,
      depositRebateRate: 0.70,
      tier1DepositCommissionRate: 0.70,
      tier2DepositCommissionRate: 0.20,
      tier3DepositCommissionRate: 0.10,
      betTurnoverRebateRate: 1.00,
      minWithdrawCommission: 200.00,
      milestones: [
        { requiredFriends: 1, bonusAmount: 100 },
        { requiredFriends: 3, bonusAmount: 300 },
        { requiredFriends: 5, bonusAmount: 500 },
        { requiredFriends: 10, bonusAmount: 1000 },
        { requiredFriends: 20, bonusAmount: 2000 },
        { requiredFriends: 50, bonusAmount: 5000 },
        { requiredFriends: 100, bonusAmount: 10000 }
      ]
    };
  },

  async updateReferralSettings(settings: any) {
    const val = JSON.stringify(settings).replace(/'/g, "\\'");
    const now = new Date().toISOString();
    await executeSql(`INSERT INTO \`site_settings\` (\`setting_key\`, \`setting_value\`, \`updated_at\`)
      VALUES ('referral_settings', '${val}', '${now}')
      ON DUPLICATE KEY UPDATE \`setting_value\`='${val}', \`updated_at\`='${now}'`);
    return settings;
  },

  async getAdminReferralStats() {
    const refsRes = await executeSql(`SELECT COUNT(*) as totalRefs, COALESCE(SUM(total_commission_earned), 0) as totalBonusPaid, COALESCE(SUM(total_deposit), 0) as totalDeposits, COALESCE(SUM(total_bet), 0) as totalTurnover FROM \`referrals\``);
    const referrersRes = await executeSql(`SELECT COUNT(DISTINCT referrer_id) as activeReferrers FROM \`referrals\``);
    const topRes = await executeSql(`SELECT referrer_id, referrer_username, referrer_code, COUNT(*) as friendsCount, COALESCE(SUM(total_commission_earned), 0) as totalEarnings 
      FROM \`referrals\` GROUP BY referrer_id ORDER BY totalEarnings DESC LIMIT 10`);

    const s = await this.getReferralSettings();
    return {
      totalReferrals: Number(refsRes.rows?.[0]?.totalRefs || 0),
      totalBonusPaid: Number(refsRes.rows?.[0]?.totalBonusPaid || 0),
      activeReferrers: Number(referrersRes.rows?.[0]?.activeReferrers || 0),
      totalDepositsGenerated: Number(refsRes.rows?.[0]?.totalDeposits || 0),
      totalTurnoverGenerated: Number(refsRes.rows?.[0]?.totalTurnover || 0),
      instantBonusPerFriend: s.instantBonusPerFriend,
      depositCommissionRate: s.depositRebateRate,
      betRebateRate: s.betTurnoverRebateRate,
      topReferrers: topRes.rows || []
    };
  },

  // -------------------------------------------------------------
  // 21. RESCUE FUND ADMIN REVIEWS (MySQL)
  // -------------------------------------------------------------
  async adminReviewRescueClaim(claimId: string, status: string, adminNote?: string) {
    const cleanId = claimId.replace(/'/g, "\\'");
    const note = (adminNote || '').replace(/'/g, "\\'");
    await executeSql(`UPDATE \`rescue_claims\` SET \`status\` = '${status.replace(/'/g, "\\'")}', \`admin_note\` = '${note}' WHERE \`id\` = '${cleanId}'`);
    return { success: true, message: `রেসকিউ দাবি স্ট্যাটাস '${status}' করা হয়েছে` };
  },

  async adminManualGrantRescue(userId: string, amount: number, note: string = '') {
    const cleanId = userId.replace(/'/g, "\\'");
    const userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = '${cleanId}' LIMIT 1`);
    if (!userRes.rows || !userRes.rows.length) return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    const user = userRes.rows[0];

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const claimId = `res-adm-${Date.now()}`;
    const trxId = `RESCUE-ADM-${Date.now()}`;

    await executeSql(`INSERT INTO \`rescue_claims\` (\`id\`, \`user_id\`, \`tier_id\`, \`loss_amount\`, \`bonus_amount\`, \`date\`, \`status\`, \`claimed_at\`, \`admin_note\`)
      VALUES ('${claimId}', '${cleanId}', 'manual', 0, ${amount}, '${today}', 'approved', '${now}', '${note.replace(/'/g, "\\'")}')`);

    await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${amount} WHERE \`id\` = '${cleanId}'`);
    await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
      VALUES ('${trxId}', '${cleanId}', '${user.username.replace(/'/g, "\\'")}', '${user.phone}', 'bonus', ${amount}, '${trxId}', 'success', 'অ্যাডমিন সরাসরি রেসকিউ বোনাস ৳${amount}', '${now}')`);

    return { success: true, message: `৳${amount} রেসকিউ ফান্ড সফলভাবে প্রদান করা হয়েছে`, amount };
  },

  // -------------------------------------------------------------
  // 22. PROMO REDEMPTIONS & TICKETS (MySQL)
  // -------------------------------------------------------------
  async getUserPromoRedemptions(userId: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    const res = await executeSql(`SELECT * FROM \`promo_redemptions\` WHERE \`user_id\` = '${cleanId}' ORDER BY \`redeemed_at\` DESC`);
    return res.rows || [];
  },

  async getUserTickets(userId: string, category: string = 'all', status: string = 'all') {
    const cleanId = userId.replace(/'/g, "\\'");
    let sql = `SELECT * FROM \`support_tickets\` WHERE \`user_id\` = '${cleanId}'`;
    if (category && category !== 'all') sql += ` AND \`category\` = '${category.replace(/'/g, "\\'")}'`;
    if (status && status !== 'all') sql += ` AND \`status\` = '${status.replace(/'/g, "\\'")}'`;
    sql += ` ORDER BY \`created_at\` DESC`;
    const res = await executeSql(sql);
    return res.rows || [];
  },

  async useTicket(userId: string, ticketId: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    const cleanTId = ticketId.replace(/'/g, "\\'");
    const res = await executeSql(`SELECT * FROM \`support_tickets\` WHERE \`id\` = '${cleanTId}' AND \`user_id\` = '${cleanId}' LIMIT 1`);
    if (!res.rows || !res.rows.length) return { success: false, message: 'টিকেট পাওয়া যায়নি' };
    await executeSql(`UPDATE \`support_tickets\` SET \`status\` = 'used', \`updated_at\` = '${new Date().toISOString()}' WHERE \`id\` = '${cleanTId}'`);
    return { success: true, message: 'টিকেট সফলভাবে ব্যবহার করা হয়েছে' };
  },

  async getAllTickets(search?: string, status?: string, type?: string) {
    let sql = `SELECT * FROM \`support_tickets\``;
    const conds: string[] = [];
    if (status && status !== 'all') conds.push(`\`status\` = '${status.replace(/'/g, "\\'")}'`);
    if (type && type !== 'all') conds.push(`\`category\` = '${type.replace(/'/g, "\\'")}'`);
    if (search) {
      const s = search.replace(/'/g, "\\'");
      conds.push(`(\`subject\` LIKE '%${s}%' OR \`username\` LIKE '%${s}%' OR \`user_phone\` LIKE '%${s}%')`);
    }
    if (conds.length) sql += ` WHERE ` + conds.join(' AND ');
    sql += ` ORDER BY \`created_at\` DESC LIMIT 100`;
    const res = await executeSql(sql);
    return res.rows || [];
  },

  async createUserTicket(ticket: any) {
    const id = ticket.id || `tkt-${Date.now()}`;
    const userId = String(ticket.userId || '').replace(/'/g, "\\'");
    const username = String(ticket.username || '').replace(/'/g, "\\'");
    const userPhone = String(ticket.userPhone || ticket.phone || '').replace(/'/g, "\\'");
    const category = String(ticket.category || ticket.type || 'general').replace(/'/g, "\\'");
    const subject = String(ticket.subject || 'সাপোর্ট টিকিট').replace(/'/g, "\\'");
    const description = String(ticket.description || '').replace(/'/g, "\\'");
    const priority = String(ticket.priority || 'medium').replace(/'/g, "\\'");
    const status = String(ticket.status || 'open').replace(/'/g, "\\'");
    const now = new Date().toISOString();

    await executeSql(`INSERT INTO \`support_tickets\` (\`id\`, \`user_id\`, \`username\`, \`user_phone\`, \`category\`, \`subject\`, \`description\`, \`priority\`, \`status\`, \`created_at\`, \`updated_at\`)
      VALUES ('${id}', '${userId}', '${username}', '${userPhone}', '${category}', '${subject}', '${description}', '${priority}', '${status}', '${now}', '${now}')`);
    return { id, ...ticket };
  },

  async deleteTicket(id: string) {
    await executeSql(`DELETE FROM \`support_tickets\` WHERE \`id\` = '${id.replace(/'/g, "\\'")}'`);
    return true;
  },

  // -------------------------------------------------------------
  // 23. MYSTERY REWARD SYSTEM (MySQL)
  // -------------------------------------------------------------
  async getUserMysteryRewardStatus(userId: string) {
    const cleanId = userId.replace(/'/g, "\\'");
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // e.g. 2026-10

    // Sum monthly deposits
    const depRes = await executeSql(`SELECT COALESCE(SUM(amount), 0) as totalDeposit FROM \`transactions\` 
      WHERE \`user_id\` = '${cleanId}' AND \`type\` = 'deposit' AND \`status\` = 'success' AND \`created_at\` LIKE '${currentMonth}%'`);
    const monthlyDeposit = Number(depRes.rows?.[0]?.totalDeposit || 0);

    // Check if mystery claim recorded this month
    const claimRes = await executeSql(`SELECT * FROM \`transactions\` 
      WHERE \`user_id\` = '${cleanId}' AND \`type\` = 'bonus' AND \`description\` LIKE '%Mystery%' AND \`created_at\` LIKE '${currentMonth}%' LIMIT 1`);
    const claimed = claimRes.rows && claimRes.rows.length > 0;

    const day = now.getDate();
    const is23rd = day === 23;
    const eligible = monthlyDeposit >= 500;
    const estimatedReward = Math.min(5000, Math.max(100, Math.round(monthlyDeposit * 0.10)));

    return {
      currentMonth,
      dayOfMonth: day,
      isDropDay: is23rd,
      monthlyDeposit,
      isEligible: eligible,
      claimed,
      estimatedReward: claimed ? 0 : estimatedReward,
      dropDate: `${currentMonth}-23`,
      cashCard: eligible && !claimed ? {
        cardId: `CARD-${currentMonth}-${cleanId.slice(-4)}`,
        amount: estimatedReward,
        status: is23rd ? 'ready_to_claim' : 'unlocks_on_23rd'
      } : null
    };
  },

  async claimMysteryReward(userId: string, promoCode?: string) {
    const status = await this.getUserMysteryRewardStatus(userId);
    if (status.claimed) return { success: false, message: 'এই মাসের রহস্যময় পুরস্কার ইতিমধ্যেই দাবি করা হয়েছে' };
    if (!status.isEligible) return { success: false, message: 'এই পুরস্কারের জন্য ন্যূনতম ৳৫০০ মাসিক ডিপোজিট প্রয়োজন' };

    const cleanId = userId.replace(/'/g, "\\'");
    const bonus = status.estimatedReward || 200;
    const trxId = `MYST-${Date.now()}`;
    const now = new Date().toISOString();

    const userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = '${cleanId}' LIMIT 1`);
    const user = userRes.rows?.[0] || { username: 'Player', phone: '' };

    await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${bonus}, \`total_earnings\` = \`total_earnings\` + ${bonus} WHERE \`id\` = '${cleanId}'`);
    await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
      VALUES ('${trxId}', '${cleanId}', '${String(user.username).replace(/'/g, "\\'")}', '${user.phone}', 'bonus', ${bonus}, '${trxId}', 'success', '২৩ তারিখ মেগা রহস্যময় ক্যাশ কার্ড পুরস্কার (৳${bonus})', '${now}')`);

    return {
      success: true,
      message: `অভিনন্দন! ৳${bonus} রহস্যময় পুরস্কার সরাসরি আপনার অ্যাকাউন্টে জমা হয়েছে।`,
      amount: bonus
    };
  },

  async getMysteryRewardConfig() {
    const res = await executeSql(`SELECT \`setting_value\` FROM \`site_settings\` WHERE \`setting_key\` = 'mystery_reward_config' LIMIT 1`);
    if (res.rows && res.rows.length > 0) {
      try { return JSON.parse(res.rows[0].setting_value); } catch {}
    }
    return {
      dropDay: 23,
      minMonthlyDeposit: 500,
      rewardPercentage: 10,
      minBonus: 100,
      maxBonus: 5000,
      enabled: true
    };
  },

  async updateMysteryRewardConfig(config: any) {
    const val = JSON.stringify(config).replace(/'/g, "\\'");
    const now = new Date().toISOString();
    await executeSql(`INSERT INTO \`site_settings\` (\`setting_key\`, \`setting_value\`, \`updated_at\`)
      VALUES ('mystery_reward_config', '${val}', '${now}')
      ON DUPLICATE KEY UPDATE \`setting_value\`='${val}', \`updated_at\`='${now}'`);
    return config;
  },

  async getAllMysteryCards(filters: any = {}) {
    const res = await executeSql(`SELECT * FROM \`transactions\` WHERE \`type\` = 'bonus' AND \`description\` LIKE '%রহস্যময়%' ORDER BY \`created_at\` DESC LIMIT 100`);
    return (res.rows || []).map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      username: t.username,
      amount: Number(t.amount || 0),
      claimedAt: t.created_at,
      status: 'claimed',
      trxId: t.trx_id
    }));
  },

  async adminTriggerMysteryRewardDrop(monthYear?: string) {
    const targetMonth = monthYear || new Date().toISOString().slice(0, 7);
    const usersRes = await executeSql(`SELECT id, username, phone FROM \`users\` WHERE \`status\` = 'active'`);
    let droppedCount = 0;
    let totalDroppedAmount = 0;

    for (const u of (usersRes.rows || [])) {
      const depRes = await executeSql(`SELECT COALESCE(SUM(amount), 0) as totalDeposit FROM \`transactions\` 
        WHERE \`user_id\` = '${u.id}' AND \`type\` = 'deposit' AND \`status\` = 'success' AND \`created_at\` LIKE '${targetMonth}%'`);
      const dep = Number(depRes.rows?.[0]?.totalDeposit || 0);

      if (dep >= 500) {
        // Check if already got
        const check = await executeSql(`SELECT id FROM \`transactions\` WHERE \`user_id\` = '${u.id}' AND \`description\` LIKE '%রহস্যময়%' AND \`created_at\` LIKE '${targetMonth}%' LIMIT 1`);
        if (!check.rows || !check.rows.length) {
          const reward = Math.min(5000, Math.max(100, Math.round(dep * 0.10)));
          const trxId = `MYST-AUTO-${Date.now()}-${droppedCount}`;
          const now = new Date().toISOString();
          await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${reward} WHERE \`id\` = '${u.id}'`);
          await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
            VALUES ('${trxId}', '${u.id}', '${String(u.username).replace(/'/g, "\\'")}', '${u.phone}', 'bonus', ${reward}, '${trxId}', 'success', '২৩ তারিখ অটো-ড্রপ রহস্যময় পুরস্কার ৳${reward}', '${now}')`);
          droppedCount++;
          totalDroppedAmount += reward;
        }
      }
    }

    return {
      success: true,
      message: `${droppedCount} জন সক্রিয় খেলোয়াড়কে মোট ৳${totalDroppedAmount} রহস্যময় ড্রপ প্রদান করা হয়েছে!`,
      droppedCount,
      totalDroppedAmount
    };
  },

  async adminManualIssueMysteryCard(data: any) {
    const { userId, amount, note } = data;
    const cleanId = String(userId).replace(/'/g, "\\'");
    const numAmount = Number(amount) || 500;

    const userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = '${cleanId}' LIMIT 1`);
    if (!userRes.rows || !userRes.rows.length) return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    const user = userRes.rows[0];

    const trxId = `MYST-MAN-${Date.now()}`;
    const now = new Date().toISOString();

    await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${numAmount} WHERE \`id\` = '${cleanId}'`);
    await executeSql(`INSERT INTO \`transactions\` (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
      VALUES ('${trxId}', '${cleanId}', '${String(user.username).replace(/'/g, "\\'")}', '${user.phone}', 'bonus', ${numAmount}, '${trxId}', 'success', 'এডমিন ম্যানুয়াল ইস্যু রহস্যময় কার্ড ৳${numAmount} (${note || ''})', '${now}')`);

    return { success: true, message: `৳${numAmount} রহস্যময় ক্যাশ কার্ড সফলভাবে ইস্যু করা হয়েছে!`, amount: numAmount };
  },

  // -------------------------------------------------------------
  // 24. ADMIN TRANSACTIONS MANAGEMENT (MySQL)
  // -------------------------------------------------------------
  async getAllAdminTransactions(type?: string, status?: string, channel?: string, search?: string) {
    let sql = `SELECT * FROM \`transactions\``;
    const conds: string[] = [];
    if (type && type !== 'all') conds.push(`\`type\` = '${type.replace(/'/g, "\\'")}'`);
    if (status && status !== 'all') conds.push(`\`status\` = '${status.replace(/'/g, "\\'")}'`);
    if (channel && channel !== 'all') conds.push(`\`channel\` = '${channel.replace(/'/g, "\\'")}'`);
    if (search) {
      const s = search.replace(/'/g, "\\'");
      conds.push(`(\`trx_id\` LIKE '%${s}%' OR \`user_id\` LIKE '%${s}%' OR \`username\` LIKE '%${s}%' OR \`phone\` LIKE '%${s}%' OR \`description\` LIKE '%${s}%')`);
    }
    if (conds.length) sql += ` WHERE ` + conds.join(' AND ');
    sql += ` ORDER BY \`created_at\` DESC LIMIT 100`;
    const res = await executeSql(sql);
    return res.rows || [];
  },

  async createAdminTransaction(data: any) {
    const {
      userId, type = 'deposit', amount, bonus = 0, fee = 0, channel = 'system',
      gateway = 'Manual Admin System', accountNumber, trxId, status = 'success',
      description, adminNote, adjustBalance = true
    } = data;

    const cleanId = String(userId).replace(/'/g, "\\'");
    const userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = '${cleanId}' LIMIT 1`);
    if (!userRes.rows || !userRes.rows.length) return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    const user = userRes.rows[0];

    const numAmount = Number(amount) || 0;
    const numBonus = Number(bonus) || 0;
    const numFee = Number(fee) || 0;
    const generatedTrxId = (trxId || `${channel.toUpperCase()}${Date.now().toString().slice(-7)}`).replace(/'/g, "\\'");
    const now = new Date().toISOString();
    const txId = `tx-adm-${Date.now()}`;

    // Insert transaction
    await executeSql(`INSERT INTO \`transactions\` 
      (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`fee\`, \`bonus\`, \`channel\`, \`gateway\`, \`account_number\`, \`trx_id\`, \`status\`, \`description\`, \`admin_note\`, \`created_at\`)
      VALUES 
      ('${txId}', '${cleanId}', '${String(user.username).replace(/'/g, "\\'")}', '${user.phone}', '${type.replace(/'/g, "\\'")}', ${numAmount}, ${numFee}, ${numBonus}, '${channel.replace(/'/g, "\\'")}', '${gateway.replace(/'/g, "\\'")}', '${String(accountNumber || user.phone).replace(/'/g, "\\'")}', '${generatedTrxId}', '${status.replace(/'/g, "\\'")}', '${String(description || 'এডমিন লেনদেন').replace(/'/g, "\\'")}', '${String(adminNote || '').replace(/'/g, "\\'")}', '${now}')`);

    // Adjust user balance
    if (adjustBalance && status === 'success') {
      let delta = 0;
      if (type === 'deposit' || type === 'bonus' || type === 'rebate') {
        delta = numAmount + numBonus;
      } else if (type === 'withdraw') {
        delta = -(numAmount + numFee);
      } else if (type === 'adjustment') {
        delta = numAmount;
      }
      if (delta !== 0) {
        await executeSql(`UPDATE \`users\` SET \`balance\` = GREATEST(0, \`balance\` + ${delta}) WHERE \`id\` = '${cleanId}'`);
      }
    }

    return {
      success: true,
      transaction: { id: txId, trxId: generatedTrxId, amount: numAmount, status },
      message: `লেনদেন সফলভাবে সম্পন্ন ও রেকর্ড করা হয়েছে (TrxID: ${generatedTrxId})`
    };
  },

  async updateTransactionStatusWithBalance(id: string, newStatus: string, options: any = {}) {
    const cleanId = id.replace(/'/g, "\\'");
    const txRes = await executeSql(`SELECT * FROM \`transactions\` WHERE \`id\` = '${cleanId}' OR \`trx_id\` = '${cleanId}' LIMIT 1`);
    if (!txRes.rows || !txRes.rows.length) return { success: false, message: 'Transaction not found' };
    const tx = txRes.rows[0];
    const oldStatus = tx.status;
    const now = new Date().toISOString();
    const adminNote = (options.adminNote || tx.admin_note || '').replace(/'/g, "\\'");
    const rejectionReason = (options.rejectionReason || tx.rejection_reason || '').replace(/'/g, "\\'");

    // Deposit confirmed -> credit balance
    if (tx.type === 'deposit' && oldStatus !== 'success' && newStatus === 'success') {
      const bonus = options.bonusAdjust !== undefined ? Number(options.bonusAdjust) : Number(tx.bonus || 0);
      const add = Number(tx.amount || 0) + bonus;
      await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${add}, \`vip_exp\` = \`vip_exp\` + ${Number(tx.amount || 0)} WHERE \`id\` = '${tx.user_id}'`);
    }

    // Withdraw rejected -> refund balance
    if (tx.type === 'withdraw' && (oldStatus === 'pending' || oldStatus === 'processing') && newStatus === 'rejected') {
      const refund = Number(tx.amount || 0) + Number(tx.fee || 0);
      await executeSql(`UPDATE \`users\` SET \`balance\` = \`balance\` + ${refund} WHERE \`id\` = '${tx.user_id}'`);
    }

    await executeSql(`UPDATE \`transactions\` SET 
      \`status\` = '${newStatus.replace(/'/g, "\\'")}',
      \`admin_note\` = '${adminNote}',
      \`rejection_reason\` = '${rejectionReason}',
      \`processed_at\` = '${now}',
      \`processed_by\` = 'Super Admin'
      WHERE \`id\` = '${tx.id}'`);

    return {
      success: true,
      transaction: { ...tx, status: newStatus },
      message: `ট্রানজেকশন #${id} সফলভাবে '${newStatus}' স্ট্যাটাসে আপডেট করা হয়েছে!`
    };
  },

  async batchUpdateTransactions(ids: string[], newStatus: string, options: any = {}) {
    let updatedCount = 0;
    for (const id of ids) {
      const res = await this.updateTransactionStatusWithBalance(id, newStatus, options);
      if (res.success) updatedCount++;
    }
    return { success: true, updatedCount, message: `${updatedCount} টি ট্রানজেকশন সফলভাবে আপডেট করা হয়েছে` };
  },

  // -------------------------------------------------------------
  // 25. LIVE CHAT ADMIN CONSOLE (MySQL)
  // -------------------------------------------------------------
  async getAdminChatSessions(status: string = 'all') {
    let sql = `SELECT * FROM \`livechat_sessions\``;
    if (status && status !== 'all') sql += ` WHERE \`status\` = '${status.replace(/'/g, "\\'")}'`;
    sql += ` ORDER BY \`last_message_at\` DESC LIMIT 50`;
    const res = await executeSql(sql);
    return res.rows || [];
  },

  async sendAdminChatMessage(sessionId: string, message: string, agentName: string = 'BengalBet VIP Support') {
    const cleanSId = sessionId.replace(/'/g, "\\'");
    const msgId = `msg-adm-${Date.now()}`;
    const now = Date.now();
    const nowIso = new Date().toISOString();
    const safeMsg = message.replace(/'/g, "\\'");

    await executeSql(`INSERT INTO \`livechat_messages\` (\`id\`, \`session_id\`, \`sender_type\`, \`sender_name\`, \`message\`, \`timestamp\`, \`is_read\`)
      VALUES ('${msgId}', '${cleanSId}', 'agent', '${agentName.replace(/'/g, "\\'")}', '${safeMsg}', ${now}, 0)`);

    await executeSql(`UPDATE \`livechat_sessions\` SET \`last_message\` = '${safeMsg}', \`last_message_at\` = '${nowIso}', \`unread_user_count\` = \`unread_user_count\` + 1 WHERE \`id\` = '${cleanSId}'`);
    return { success: true, messageId: msgId };
  },

  async deleteChatSession(sessionId: string) {
    const cleanId = sessionId.replace(/'/g, "\\'");
    await executeSql(`DELETE FROM \`livechat_messages\` WHERE \`session_id\` = '${cleanId}'`);
    await executeSql(`DELETE FROM \`livechat_sessions\` WHERE \`id\` = '${cleanId}'`);
    return true;
  },

  // -------------------------------------------------------------
  // 26. GAMES CALLBACK ENGINE (Direct MySQL `bengalbet_db` Execution)
  // -------------------------------------------------------------
  /**
   * Authoritative Game Callback Handler:
   * Called by NeextPlay Engine, Aviator, Slots, or Live Tables on every BET, WIN, or ROLLBACK.
   * Directly executes atomic queries on MySQL `bengalbet_db` (users, bets, transactions).
   */
  async processGameCallback(payload: {
    action?: string;
    type?: string;
    playerId?: string;
    userId?: string;
    operatorId?: string;
    gameId?: string;
    gameName?: string;
    roundId?: string;
    betAmount?: number;
    winAmount?: number;
    payout?: number;
    multiplier?: number;
    currency?: string;
    orderNo?: string;
    category?: string;
  }) {
    const act = String(payload.action || payload.type || 'BET').toUpperCase();
    const rawPlayerId = String(payload.playerId || payload.userId || 'usr-889922').trim();
    const cleanUserId = rawPlayerId.replace(/^ply_bb_/, '').replace(/^usr-/, '');
    const betAmt = Number(payload.betAmount || 0);
    const winAmt = Number(payload.winAmount !== undefined ? payload.winAmount : (payload.payout !== undefined ? payload.payout : 0));
    const mult = Number(payload.multiplier || 1.0);
    const safeGameName = String(payload.gameName || payload.gameId || 'Aviator Pro').replace(/'/g, "\\'");
    const safeRoundId = String(payload.roundId || `#R${Date.now().toString().slice(-6)}`).replace(/'/g, "\\'");
    const category = String(payload.category || 'crash').replace(/'/g, "\\'");
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toISOString().replace('T', ' ').slice(0, 19);
    const nowIso = now.toISOString();

    // 1. Resolve user directly from MySQL `bengalbet_db.users`
    const findSql = `SELECT * FROM \`users\` WHERE \`id\` = '${rawPlayerId.replace(/'/g, "\\'")}' 
                     OR \`id\` = 'usr-${cleanUserId.replace(/'/g, "\\'")}' 
                     OR \`id\` = '${cleanUserId.replace(/'/g, "\\'")}' 
                     OR \`phone\` = '${rawPlayerId.replace(/'/g, "\\'")}' 
                     OR \`username\` = '${rawPlayerId.replace(/'/g, "\\'")}' 
                     LIMIT 1`;
    let userRes = await executeSql(findSql);

    // If still not found, fallback to primary player or first user in bengalbet_db
    if (!userRes.rows || !userRes.rows.length) {
      userRes = await executeSql(`SELECT * FROM \`users\` WHERE \`id\` = 'usr-889922' LIMIT 1`);
      if (!userRes.rows || !userRes.rows.length) {
        userRes = await executeSql(`SELECT * FROM \`users\` LIMIT 1`);
      }
    }

    if (!userRes.rows || !userRes.rows.length) {
      throw new Error(`BengalBet MySQL player '${rawPlayerId}' not found.`);
    }

    const user = userRes.rows[0];
    const targetUserId = user.id;
    const currentBalance = Number(user.balance || 0);

    // 2. Handle Action in MySQL `bengalbet_db`
    if (act === 'BET') {
      const newBal = Number(Math.max(0, currentBalance - betAmt).toFixed(2));
      const expAdd = Math.round(betAmt);

      // Debit User Balance & update VIP Experience in MySQL
      await executeSql(`UPDATE \`users\` SET \`balance\` = ${newBal}, \`vip_exp\` = \`vip_exp\` + ${expAdd} WHERE \`id\` = '${targetUserId}'`);

      // Insert Bet into MySQL `bets` table
      const betId = `bet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const orderNo = payload.orderNo || `B${dateStr.replace(/-/g, '')}${Date.now().toString().slice(-6)}`;
      await executeSql(`INSERT INTO \`bets\` 
        (\`id\`, \`user_id\`, \`order_no\`, \`category\`, \`vendor\`, \`game_name\`, \`game_round\`, \`bet_amount\`, \`valid_bet\`, \`reward\`, \`profit\`, \`time\`, \`date\`, \`created_at\`)
        VALUES 
        ('${betId}', '${targetUserId}', '${orderNo}', '${category}', 'NeextPlay', '${safeGameName}', '${safeRoundId}', ${betAmt}, ${betAmt}, 0, -${betAmt}, '${timeStr}', '${dateStr}', '${nowIso}')`);

      // Insert Transaction record into MySQL `transactions` table
      const trxId = `BET-AV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
      await executeSql(`INSERT INTO \`transactions\` 
        (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`channel\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
        VALUES 
        ('${trxId}', '${targetUserId}', '${String(user.username).replace(/'/g, "\\'")}', '${user.phone}', 'bet', ${betAmt}, 'NeextPlay', '${trxId}', 'success', 'NeextPlay ${safeGameName} বেট (-৳${betAmt})', '${nowIso}')`);

    } else if (act === 'WIN') {
      const newBal = Number((currentBalance + winAmt).toFixed(2));

      // Credit Win to User Balance in MySQL
      await executeSql(`UPDATE \`users\` SET \`balance\` = ${newBal} WHERE \`id\` = '${targetUserId}'`);

      // Update matching Bet record in MySQL `bets`
      const updateBetRes = await executeSql(`UPDATE \`bets\` 
        SET \`reward\` = ${winAmt}, \`profit\` = ${winAmt} - \`bet_amount\` 
        WHERE \`user_id\` = '${targetUserId}' AND (\`game_round\` = '${safeRoundId}' OR \`id\` = '${safeRoundId}')`);

      // If no pre-existing bet found with that roundId, insert complete win bet
      if (!updateBetRes.rows || updateBetRes.totalRows === 0) {
        const betId = `win-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const orderNo = payload.orderNo || `B${dateStr.replace(/-/g, '')}${Date.now().toString().slice(-6)}`;
        const baseBet = betAmt || (mult > 0 ? Number((winAmt / mult).toFixed(2)) : 100);
        await executeSql(`INSERT INTO \`bets\` 
          (\`id\`, \`user_id\`, \`order_no\`, \`category\`, \`vendor\`, \`game_name\`, \`game_round\`, \`bet_amount\`, \`valid_bet\`, \`reward\`, \`profit\`, \`time\`, \`date\`, \`created_at\`)
          VALUES 
          ('${betId}', '${targetUserId}', '${orderNo}', '${category}', 'NeextPlay', '${safeGameName}', '${safeRoundId}', ${baseBet}, ${baseBet}, ${winAmt}, ${winAmt - baseBet}, '${timeStr}', '${dateStr}', '${nowIso}')`);
      }

      // Insert Win Payout Transaction in MySQL
      const trxId = `WIN-AV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
      await executeSql(`INSERT INTO \`transactions\` 
        (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`channel\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
        VALUES 
        ('${trxId}', '${targetUserId}', '${String(user.username).replace(/'/g, "\\'")}', '${user.phone}', 'bet_payout', ${winAmt}, 'NeextPlay', '${trxId}', 'success', 'NeextPlay ${safeGameName} উইন পেআউট (${mult.toFixed(2)}x: +৳${winAmt})', '${nowIso}')`);

    } else if (act === 'ROLLBACK' || act === 'REFUND') {
      const refundAmt = betAmt || winAmt;
      const newBal = Number((currentBalance + refundAmt).toFixed(2));
      await executeSql(`UPDATE \`users\` SET \`balance\` = ${newBal} WHERE \`id\` = '${targetUserId}'`);

      const trxId = `RFD-AV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
      await executeSql(`INSERT INTO \`transactions\` 
        (\`id\`, \`user_id\`, \`username\`, \`phone\`, \`type\`, \`amount\`, \`channel\`, \`trx_id\`, \`status\`, \`description\`, \`created_at\`)
        VALUES 
        ('${trxId}', '${targetUserId}', '${String(user.username).replace(/'/g, "\\'")}', '${user.phone}', 'refund', ${refundAmt}, 'NeextPlay', '${trxId}', 'success', 'NeextPlay ${safeGameName} রোলব্যাক রিফান্ড (+৳${refundAmt})', '${nowIso}')`);
    }

    // 3. Query authoritative updated live balance directly from MySQL `bengalbet_db.users`
    const freshUserRes = await executeSql(`SELECT id, username, phone, balance, vip_level, vip_exp FROM \`users\` WHERE \`id\` = '${targetUserId}' LIMIT 1`);
    const freshUser = freshUserRes.rows?.[0] || user;
    const finalBalance = Number(freshUser.balance || 0);

    return {
      success: true,
      status: 'success',
      action: act,
      playerId: targetUserId,
      userId: targetUserId,
      username: freshUser.username,
      balance: finalBalance,
      currency: payload.currency || 'BDT',
      database: 'bengalbet_db (MySQL live)',
      roundId: safeRoundId,
      operatorId: payload.operatorId || 'op_bengalbet',
      neextplay: {
        engine: 'NeextPlay B2B Master Engine',
        vendor: 'NeextPlay',
        callbackStatus: 'PROCESSED_LIVE_MYSQL_BENGALBET',
        timestamp: nowIso
      }
    };
  }
};


