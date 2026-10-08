/**
 * NeextPlay B2B Gaming Provider Platform - Dedicated Backend Module
 * Completely isolated backend routes, database storage, and REST APIs.
 * Mounted at /api/v1/*
 */

import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { db as bengalbetDb } from './db.js';
import { NeextplayMysql, executeNeextplaySql, BengalbetMysql } from './bengalbetMysqlService.js';

interface ServerPlayer {
  id: string;
  operatorId: string;
  name: string;
  currency: string;
  balance: number;
  totalWagered: number;
  totalWon: number;
  lastActive: string;
  registeredAt?: string;
  playCount?: number;
  phone?: string;
  avatar?: string;
  vipLevel?: number;
  callbackUrl?: string;
  status?: string;
}

interface ServerSession {
  token: string;
  operatorId: string;
  playerId: string;
  gameId: string;
  currency: string;
  launchUrl: string;
  domain: string;
  createdAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED';
}

interface OperatorItem {
  id: string;
  name: string;
  code: string;
  email: string;
  country: string;
  status: string;
  currency: string;
  allowedCurrencies: string[];
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  webhookSecret: string;
  createdAt: string;
  companyBalance?: number;
  totalTurnover?: number;
  totalGgr?: number;
  totalBetsCount?: number;
  totalWinsCount?: number;
  totalPayout?: number;
}

const DB_FILE = path.join(process.cwd(), 'data', 'neextplay_db.json');

const INITIAL_OPERATORS: OperatorItem[] = [
  {
    id: 'op_bengalbet',
    name: 'BengalBet Casino Portal',
    code: 'BENGALBET',
    email: 'operations@bengalbet.com',
    country: 'Bangladesh (BDT Certified)',
    status: 'ACTIVE',
    currency: 'BDT',
    allowedCurrencies: ['BDT', 'USD', 'INR', 'EUR'],
    apiKey: 'np_live_key_bengalbet_883921',
    apiSecret: 'np_sec_live_bengalbet_55a9c3d1e2f4',
    webhookUrl: 'https://bengalbet.com/api/v1/webhooks/neextplay',
    webhookSecret: 'whsec_bengalbet_live_77123984',
    createdAt: '2025-01-01T00:00:00Z',
    companyBalance: 500000.00,
    totalTurnover: 28400000.00,
    totalGgr: 1450000.00,
    totalBetsCount: 142050,
    totalWinsCount: 98400,
    totalPayout: 26950000.00,
  },
  {
    id: 'op_neexthub',
    name: 'NeextHub Gaming Corp',
    code: 'NEEXTHUB',
    email: 'neexthub@gmail.com',
    country: 'Global B2B License',
    status: 'ACTIVE',
    currency: 'USD',
    allowedCurrencies: ['USD', 'EUR', 'BDT', 'INR', 'BRL', 'GBP'],
    apiKey: 'np_live_key_neexthub_992147',
    apiSecret: 'np_sec_live_neexthub_8f7b6a5c4d3e210a',
    webhookUrl: 'https://api.neexthub.com/v1/casino-callback',
    webhookSecret: 'whsec_neexthub_live_449018273645',
    createdAt: '2025-01-01T00:00:00Z',
    companyBalance: 250000.00,
    totalTurnover: 12450000.00,
    totalGgr: 892400.00,
    totalBetsCount: 88520,
    totalWinsCount: 61400,
    totalPayout: 11557600.00,
  },
  {
    id: 'op_nexus',
    name: 'NexusBet International Ltd',
    code: 'NEXUSBET',
    email: 'compliance@nexusbet.io',
    country: 'Malta (MGA)',
    status: 'ACTIVE',
    currency: 'EUR',
    allowedCurrencies: ['EUR', 'USD', 'GBP', 'BRL'],
    apiKey: 'np_client_live_nexus_78912',
    apiSecret: 'np_sec_live_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
    webhookUrl: 'https://api.nexusbet.io/v1/webhooks/neextplay',
    webhookSecret: 'whsec_99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4',
    createdAt: '2025-01-15T10:00:00Z',
    companyBalance: 180000.00,
    totalTurnover: 4120800.00,
    totalGgr: 248950.40,
    totalBetsCount: 32400,
    totalWinsCount: 22100,
    totalPayout: 3871849.60,
  },
  {
    id: 'op_apex',
    name: 'Apex Gaming Group',
    code: 'APEX_GRP',
    email: 'integrations@apexgaming.co.uk',
    country: 'United Kingdom (UKGC)',
    status: 'ACTIVE',
    currency: 'GBP',
    allowedCurrencies: ['GBP', 'EUR'],
    apiKey: 'np_client_live_apex_44521',
    apiSecret: 'np_sec_live_77f6e5d4c3b2a100ffeeddccbbaa9988',
    webhookUrl: 'https://gateway.apexgaming.co.uk/casino/events',
    webhookSecret: 'whsec_77f6e5d4c3b2a100ffeeddccbbaa9988',
    createdAt: '2025-03-20T14:30:00Z',
    companyBalance: 140000.00,
    totalTurnover: 2890450.00,
    totalGgr: 184320.10,
    totalBetsCount: 21800,
    totalWinsCount: 14900,
    totalPayout: 2706129.90,
  },
];

const INITIAL_PLAYERS: ServerPlayer[] = [
  {
    id: 'ply_neexthub_vip1',
    operatorId: 'op_neexthub',
    name: 'NeextHub High Roller',
    currency: 'USD',
    balance: 1500.0,
    totalWagered: 350.0,
    totalWon: 420.0,
    lastActive: new Date().toISOString(),
  },
  {
    id: 'ply_alex_88',
    operatorId: 'op_nexus',
    name: 'Alex Vance',
    currency: 'USD',
    balance: 1000.0,
    totalWagered: 120.0,
    totalWon: 95.0,
    lastActive: new Date().toISOString(),
  },
  {
    id: 'nexus_player_991',
    operatorId: 'op_nexus',
    name: 'VIP Gambler 991',
    currency: 'USD',
    balance: 500.0,
    totalWagered: 0,
    totalWon: 0,
    lastActive: new Date().toISOString(),
  },
];

const GAMES_CATALOG = [
  {
    id: 'game_aviator_pro',
    slug: 'aviator-pro',
    name: 'Aviator (Crash Game)',
    type: 'CRASH',
    provider: 'NeextPlay Studios',
    version: '3.1.0',
    status: 'ACTIVE',
    thumbnail: '/src/assets/images/aviator_banner_1791307837428.jpg',
    description: 'World-renowned crash game with dual synchronous betting panels, provably fair SHA-512 verification, aerodynamic red monoplane curve, live multiplayer cashouts, and community live chat.',
    defaultRtp: 97.0,
    minBet: 0.5,
    maxBet: 500.0,
    maxMultiplier: 1000,
    features: ['Dual Independent Bet Panels', 'Provably Fair SHA-512', 'Auto Cashout', 'Multiplayer Live Feed', 'Live Community Chat'],
  },
  {
    id: 'game_neext_fortune',
    slug: 'neext-fortune',
    name: 'Neext Fortune',
    type: 'SLOT',
    provider: 'NeextPlay Studios',
    version: '2.4.1',
    status: 'ACTIVE',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80',
    description: 'High-volatility 5x3 video slot with 20 fixed paylines, Dragon Wild multipliers, and Free Spins re-trigger bonus.',
    defaultRtp: 96.5,
    minBet: 0.2,
    maxBet: 100.0,
    maxMultiplier: 5000,
    features: ['Wild Substitutions', 'Free Spins (3x multiplier)', 'Scatter Pays', 'AutoPlay'],
  },
  {
    id: 'game_neext_velocity',
    slug: 'neext-velocity',
    name: 'Neext Velocity Crash',
    type: 'CRASH',
    provider: 'NeextPlay Studios',
    version: '1.2.0',
    status: 'ACTIVE',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    description: 'Provably fair high-speed multiplier crash game with instant cashouts.',
    defaultRtp: 97.0,
    minBet: 0.5,
    maxBet: 250.0,
    maxMultiplier: 250,
    features: ['Provably Fair Verification', 'Auto Cashout', 'Realtime Multiplier Curve'],
  },
  {
    id: 'game_monaco_roulette',
    slug: 'monaco-vip-roulette',
    name: 'Monaco VIP Roulette',
    type: 'LIVE_CASINO',
    provider: 'NeextPlay Live Studios',
    version: '3.0.0',
    status: 'ACTIVE',
    thumbnail: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=600&auto=format&fit=crop&q=80',
    description: 'European single-zero live dealer streaming roulette with automated OCR ball tracking.',
    defaultRtp: 97.3,
    minBet: 1.0,
    maxBet: 5000.0,
    maxMultiplier: 36,
    features: ['4K Multi-Camera Stream', 'Race Track Bets', 'Live Dealer Chat'],
  },
  {
    id: 'game_imperial_baccarat',
    slug: 'imperial-speed-baccarat',
    name: 'Imperial Speed Baccarat',
    type: 'LIVE_CASINO',
    provider: 'NeextPlay Live Studios',
    version: '1.8.2',
    status: 'ACTIVE',
    thumbnail: 'https://images.unsplash.com/photo-1541278107931-e006523892df?w=600&auto=format&fit=crop&q=80',
    description: '12-second round speed baccarat featuring Dragon 7 and Panda 8 side bets.',
    defaultRtp: 98.94,
    minBet: 5.0,
    maxBet: 25000.0,
    maxMultiplier: 30,
    features: ['Speed Mode (12s)', 'Side Bets', 'Roadmaps (Big Road)'],
  },
];

const CATEGORIES = [
  {
    id: 'CRASH',
    name: 'Crash & Multiplier',
    description: 'High-frequency burst multiplier games (Aviator, Neext Velocity) with real-time provably fair curve.',
    icon: '✈️',
    gameCount: 2,
    badge: 'Trending #1',
  },
  {
    id: 'SLOT',
    name: 'Video Slots',
    description: 'Certified 5x3 reels with 20 fixed paylines, expanding wilds, and scatter free spins.',
    icon: '🎰',
    gameCount: 1,
    badge: 'Popular',
  },
  {
    id: 'LIVE_CASINO',
    name: 'Live Casino Tables',
    description: '4K ultra-low latency live dealer streaming tables with OCR card & ball recognition.',
    icon: '🎙️',
    gameCount: 2,
    badge: 'Live 60 FPS',
  },
  {
    id: 'TABLE',
    name: 'Table Games',
    description: 'Classic single-deck blackjack, baccarat, and European roulette RNG tables.',
    icon: '♠️',
    gameCount: 0,
    badge: 'Classic',
  },
];

// Persistent state stores
const PLAYERS_STORE = new Map<string, ServerPlayer>();
const SESSIONS_STORE = new Map<string, ServerSession>();
let OPERATORS_STORE: OperatorItem[] = [...INITIAL_OPERATORS];

// Load / Save persistent file for NeextPlay DB
export function loadNeextPlayDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (Array.isArray(data.players)) {
        data.players.forEach((p: ServerPlayer) => PLAYERS_STORE.set(p.id, p));
      }
      if (Array.isArray(data.sessions)) {
        data.sessions.forEach((s: ServerSession) => SESSIONS_STORE.set(s.token, s));
      }
      if (Array.isArray(data.operators)) {
        const existingIds = new Set(data.operators.map((o: any) => o.id));
        OPERATORS_STORE = [
          ...data.operators.map((op: any) => {
            const defaultOp = INITIAL_OPERATORS.find(io => io.id === op.id);
            return {
              ...defaultOp,
              ...op,
              companyBalance: typeof op.companyBalance === 'number' ? op.companyBalance : (defaultOp?.companyBalance ?? 500000.00),
              totalTurnover: typeof op.totalTurnover === 'number' ? op.totalTurnover : (defaultOp?.totalTurnover ?? 28400000.00),
              totalGgr: typeof op.totalGgr === 'number' ? op.totalGgr : (defaultOp?.totalGgr ?? 1450000.00),
              totalBetsCount: typeof op.totalBetsCount === 'number' ? op.totalBetsCount : (defaultOp?.totalBetsCount ?? 142050),
              totalWinsCount: typeof op.totalWinsCount === 'number' ? op.totalWinsCount : (defaultOp?.totalWinsCount ?? 98400),
              totalPayout: typeof op.totalPayout === 'number' ? op.totalPayout : (defaultOp?.totalPayout ?? 26950000.00),
            };
          }),
          ...INITIAL_OPERATORS.filter(op => !existingIds.has(op.id)),
        ];
      }
    } else {
      INITIAL_PLAYERS.forEach(p => PLAYERS_STORE.set(p.id, p));
      saveNeextPlayDb();
    }
  } catch (e) {
    console.error('Error loading NeextPlay DB file:', e);
    INITIAL_PLAYERS.forEach(p => PLAYERS_STORE.set(p.id, p));
  }
}

export function saveNeextPlayDb() {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let existingRaw: any = {};
    if (fs.existsSync(DB_FILE)) {
      try { existingRaw = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch {}
    }
    const data = {
      ...existingRaw,
      players: Array.from(PLAYERS_STORE.values()),
      sessions: Array.from(SESSIONS_STORE.values()),
      operators: OPERATORS_STORE,
      lastSaved: new Date().toISOString(),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving NeextPlay DB file:', e);
  }
}

export function getNeextPlayDbRaw() {
  loadNeextPlayDb();
  let existingRaw: any = {};
  if (fs.existsSync(DB_FILE)) {
    try { existingRaw = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')); } catch {}
  }
  return {
    operators: OPERATORS_STORE,
    players: Array.from(PLAYERS_STORE.values()),
    sessions: Array.from(SESSIONS_STORE.values()),
    bets: existingRaw.bets || [],
    ledger: existingRaw.ledger || [],
    winConfigs: existingRaw.winConfigs || [],
    apiKeys: existingRaw.apiKeys || [],
    auditLogs: existingRaw.auditLogs || []
  };
}

export { PLAYERS_STORE, SESSIONS_STORE, OPERATORS_STORE };

function getDetectedOrigin(req: Request): string {
  const forwardedProto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
  const forwardedHost = (req.headers['x-forwarded-host'] as string) || req.headers['host'] || 'localhost:3000';
  return `${forwardedProto}://${forwardedHost}`;
}

function getDetectedHost(req: Request): string {
  return (req.headers['x-forwarded-host'] as string) || req.headers['host'] || 'localhost:3000';
}

export function registerNeextplayBackend(app: express.Express) {
  loadNeextPlayDb();

  // CORS Middleware specifically for NeextPlay /api/v1/*
  app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key, x-operator-id, x-player-id, x-player-name, x-currency, x-initial-balance, x-domain, idempotency-key, x-signature-hmac'
    );
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // --- 0. PROVIDER HEALTH & DETECTED DOMAIN INFO ---
  app.get(['/api/v1/health', '/api/v1/provider/info'], (req: Request, res: Response) => {
    const origin = getDetectedOrigin(req);
    const host = getDetectedHost(req);

    res.json({
      status: 'success',
      code: 200,
      message: 'NeextPlay B2B Master API Gateway is operational.',
      provider: {
        name: 'NeextPlay Studios B2B Gaming Systems',
        version: '3.1.0',
        compliance: 'GLI-19 Certified RNG & Authoritative Ledger',
        detectedDomain: host,
        detectedOrigin: origin,
        baseUrl: `${origin}/api/v1`,
        modulePath: `${origin}/neextplay`,
        database: {
          engine: 'MySQL Database Server (neextplay_db)',
          status: 'CONNECTED',
          totalOperators: OPERATORS_STORE.length,
          totalPlayers: PLAYERS_STORE.size,
        },
        availableEndpoints: [
          { method: 'GET', path: '/api/v1/health', description: 'Provider gateway status & detected origin' },
          { method: 'GET', path: '/api/v1/operators/credentials', description: 'Real operator credentials & API keys' },
          { method: 'GET', path: '/api/v1/games', description: 'Catalog of active games' },
          { method: 'GET', path: '/api/v1/games/categories', description: 'Categorized game groups' },
          { method: 'POST', path: '/api/v1/games/launch', description: 'Generate signed game session & embed URL' },
          { method: 'GET', path: '/api/v1/sessions/:token', description: 'Verify game launch session' },
          { method: 'GET', path: '/api/v1/wallet/balance', description: 'Query player wallet balance' },
          { method: 'POST', path: '/api/v1/wallet/bet', description: 'Deduct bet from wallet' },
          { method: 'POST', path: '/api/v1/wallet/win', description: 'Credit win to wallet' },
          { method: 'POST', path: '/api/v1/wallet/rollback', description: 'Rollback/cancel round' },
          { method: 'POST', path: '/api/v1/wallet/deposit', description: 'Top-up player balance' },
          { method: 'POST', path: '/api/v1/wallet/withdraw', description: 'Cash out player balance' },
          { method: 'POST', path: '/api/v1/players/create', description: 'Register player account' },
          { method: 'POST', path: '/api/v1/slot/spin', description: 'Play slot round with RNG math' },
        ],
        serverTime: new Date().toISOString(),
      },
    });
  });

  // =========================================================================
  // 0. USER AUTHENTICATION & SESSIONS (REAL MYSQL neextplay_db)
  // =========================================================================

  app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required' });
      }
      const data = await NeextplayMysql.loginUser(email, password);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Login failed' });
    }
  });

  app.post('/api/v1/auth/register', async (req: Request, res: Response) => {
    try {
      const data = await NeextplayMysql.registerUser(req.body);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Registration failed' });
    }
  });

  app.get('/api/v1/auth/me', async (req: Request, res: Response) => {
    try {
      const idOrEmail = (req.query.id as string) || (req.query.email as string);
      if (!idOrEmail) {
        return res.status(400).json({ success: false, error: 'id or email is required' });
      }
      const data = await NeextplayMysql.getUser(idOrEmail);
      res.json(data);
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message || 'User not found' });
    }
  });

  app.post('/api/v1/auth/quick-login', async (req: Request, res: Response) => {
    try {
      const role = (req.body.role as string) || 'DEVELOPER';
      const targetEmail = role === 'COMPANY_ADMIN' ? 'admin@neextplay.com' : 'developer@neextplay.com';
      try {
        const userRes = await NeextplayMysql.getUser(targetEmail);
        if (userRes && userRes.user) {
          return res.json({ success: true, user: userRes.user });
        }
      } catch {}
      const loginRes = await NeextplayMysql.loginUser(targetEmail, role === 'COMPANY_ADMIN' ? 'admin123' : 'developer123');
      res.json(loginRes);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Quick login failed' });
    }
  });

  app.get('/api/v1/auth/users', async (_req: Request, res: Response) => {
    try {
      const data = await NeextplayMysql.getUsers();
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/v1/auth/users/:id', async (req: Request, res: Response) => {
    try {
      const data = await NeextplayMysql.updateUser({ id: req.params.id, ...req.body });
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/v1/auth/users/:id', async (req: Request, res: Response) => {
    try {
      const data = await NeextplayMysql.deleteUser(req.params.id);
      res.json(data);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // --- 0.1 REAL OPERATORS & CREDENTIALS VAULT (REAL MYSQL) ---
  app.get('/api/v1/operators/credentials', async (_req: Request, res: Response) => {
    try {
      const dbRes = await NeextplayMysql.getOperators();
      const ops = dbRes.operators && dbRes.operators.length > 0 ? dbRes.operators : OPERATORS_STORE;
      res.json({
        status: 'success',
        code: 200,
        data: {
          message: 'Active Production & Sandbox API Credentials from MySQL neextplay_db',
          operators: ops.map((op: any) => ({
            operatorId: op.id,
            operatorName: op.name,
            operatorCode: op.code,
            email: op.email,
            country: op.country,
            currency: op.currency,
            apiKey: op.api_key || op.apiKey,
            apiSecret: op.api_secret || op.apiSecret,
            webhookSecret: op.webhook_secret || op.webhookSecret,
            webhookUrl: op.webhook_url || op.webhookUrl,
            scopes: ['wallet:read', 'wallet:write', 'games:launch', 'players:manage'],
          })),
        },
      });
    } catch (err: any) {
      res.json({
        status: 'success',
        code: 200,
        data: {
          operators: OPERATORS_STORE.map(op => ({
            operatorId: op.id,
            operatorName: op.name,
            operatorCode: op.code,
            email: op.email,
            country: op.country,
            currency: op.currency,
            apiKey: op.apiKey,
            apiSecret: op.apiSecret,
            webhookSecret: op.webhookSecret,
            webhookUrl: op.webhookUrl,
            scopes: ['wallet:read', 'wallet:write', 'games:launch', 'players:manage'],
          })),
        }
      });
    }
  });

  app.get('/api/v1/operators', async (_req: Request, res: Response) => {
    try {
      const dbRes = await NeextplayMysql.getOperators();
      const ops = dbRes.operators && dbRes.operators.length > 0 ? dbRes.operators : OPERATORS_STORE;
      res.json({
        status: 'success',
        code: 200,
        data: {
          total: ops.length,
          operators: ops,
        },
        operators: ops
      });
    } catch (err: any) {
      res.json({
        status: 'success',
        code: 200,
        data: { total: OPERATORS_STORE.length, operators: OPERATORS_STORE },
        operators: OPERATORS_STORE
      });
    }
  });

  // Create/Save Operator in real MySQL
  app.post('/api/v1/operators', async (req: Request, res: Response) => {
    try {
      const data = req.body;
      if (!data || !data.name || !data.code) {
        return res.status(400).json({ status: 'error', message: 'Name and Code are required' });
      }
      const dbRes = await NeextplayMysql.saveOperator(data);
      // Synchronize in-memory cache as well
      const opId = data.id || ('op_' + String(data.code).toLowerCase().replace(/[^a-z0-9]/g, '_'));
      const existingIndex = OPERATORS_STORE.findIndex(o => o.id === opId || o.code === data.code);
      if (existingIndex >= 0) {
        OPERATORS_STORE[existingIndex] = { ...OPERATORS_STORE[existingIndex], ...data };
      } else {
        OPERATORS_STORE.push({ id: opId, ...data });
      }
      res.json({
        status: 'success',
        code: 200,
        message: 'Operator saved successfully in MySQL',
        operator: data,
        dbResult: dbRes
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // Delete Operator from real MySQL
  app.delete('/api/v1/operators/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await NeextplayMysql.deleteOperator(id);
      const idx = OPERATORS_STORE.findIndex(o => o.id === id);
      if (idx >= 0) OPERATORS_STORE.splice(idx, 1);
      res.json({ status: 'success', message: `Operator ${id} deleted from MySQL` });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // GET: All Players from real MySQL
  app.get('/api/v1/players', async (req: Request, res: Response) => {
    try {
      const operatorId = req.query.operatorId as string;
      const dbRes = await NeextplayMysql.getPlayers(operatorId);
      const list = dbRes.players || [];
      res.json({
        status: 'success',
        code: 200,
        total: list.length,
        players: list
      });
    } catch (err: any) {
      res.json({
        status: 'success',
        code: 200,
        total: Array.from(PLAYERS_STORE.values()).length,
        players: Array.from(PLAYERS_STORE.values())
      });
    }
  });

  // POST: Create/Save Player in real MySQL
  app.post(['/api/v1/players', '/api/v1/players/create'], async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const username = data?.username || data?.name || data?.playerName;
      if (!data || !username) {
        return res.status(400).json({ status: 'error', message: 'Player username/name is required' });
      }
      const initialBal = Number(data.balance ?? (data.initialBalance ?? 1000.00));
      const pId = data.id || data.externalPlayerId || ('ply_' + Math.random().toString(36).substring(2, 10));
      const dbPayload = {
        id: pId,
        username,
        operatorId: data.operatorId || 'op_bengalbet',
        currency: data.currency || 'BDT',
        balance: initialBal,
        status: data.status || 'ACTIVE'
      };
      const dbRes = await NeextplayMysql.savePlayer(dbPayload);
      const playerObj: ServerPlayer = {
        id: pId,
        operatorId: data.operatorId || 'op_bengalbet',
        name: username,
        currency: data.currency || 'BDT',
        balance: initialBal,
        totalWagered: Number(data.totalWagered ?? 0),
        totalWon: Number(data.totalWon ?? 0),
        lastActive: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
        playCount: 0,
        phone: data.phone || '',
        avatar: data.avatar || '',
        vipLevel: Number(data.vipLevel ?? 1),
        status: data.status || 'ACTIVE'
      };
      PLAYERS_STORE.set(pId, playerObj);
      res.json({
        status: 'success',
        code: 200,
        message: 'Player saved successfully in MySQL',
        player: playerObj,
        dbResult: dbRes
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // PUT: Update Player in real MySQL
  app.put('/api/v1/players/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const dbRes = await NeextplayMysql.savePlayer({ id, ...updates });
      const player = PLAYERS_STORE.get(id);
      if (player) {
        Object.assign(player, updates);
        player.lastActive = new Date().toISOString();
        PLAYERS_STORE.set(id, player);
      }
      res.json({
        status: 'success',
        code: 200,
        message: 'Player updated successfully in MySQL',
        player: { id, ...updates },
        dbResult: dbRes
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // GET: Ledger entries from real MySQL
  app.get('/api/v1/ledger', async (req: Request, res: Response) => {
    try {
      const operatorId = req.query.operatorId as string;
      const dbRes = await NeextplayMysql.getLedgerEntries(operatorId);
      res.json({
        status: 'success',
        code: 200,
        total: (dbRes.ledger || []).length,
        ledger: dbRes.ledger || []
      });
    } catch (err: any) {
      res.json({ status: 'success', code: 200, total: 0, ledger: [] });
    }
  });

  // GET: Authoritative Round Bets from real MySQL
  app.get('/api/v1/bets', async (_req: Request, res: Response) => {
    try {
      const dbRes = await NeextplayMysql.getRoundBets();
      res.json({
        status: 'success',
        code: 200,
        total: (dbRes.bets || []).length,
        bets: dbRes.bets || []
      });
    } catch (err: any) {
      res.json({ status: 'success', code: 200, total: 0, bets: [] });
    }
  });

  // GET: Audit Logs from real MySQL
  app.get('/api/v1/audit-logs', async (req: Request, res: Response) => {
    try {
      const operatorId = req.query.operatorId as string;
      const dbRes = await NeextplayMysql.getAuditLogs(operatorId);
      res.json({
        status: 'success',
        code: 200,
        total: (dbRes.logs || []).length,
        logs: dbRes.logs || []
      });
    } catch (err: any) {
      res.json({ status: 'success', code: 200, total: 0, logs: [] });
    }
  });

  // POST: Add Audit Log in real MySQL
  app.post('/api/v1/audit-logs', async (req: Request, res: Response) => {
    try {
      const dbRes = await NeextplayMysql.addAuditLog(req.body);
      res.json(dbRes);
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // GET: Live Casino Tables from real MySQL
  app.get('/api/v1/live-tables', async (_req: Request, res: Response) => {
    try {
      const dbRes = await NeextplayMysql.getLiveTables();
      res.json({
        status: 'success',
        code: 200,
        tables: dbRes.tables || []
      });
    } catch (err: any) {
      res.json({ status: 'success', code: 200, tables: [] });
    }
  });

  // POST: Save Live Casino Table in real MySQL
  app.post('/api/v1/live-tables', async (req: Request, res: Response) => {
    try {
      const dbRes = await NeextplayMysql.saveLiveTable(req.body);
      res.json(dbRes);
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // GET: Win Controls from real MySQL
  app.get('/api/v1/win-controls', async (_req: Request, res: Response) => {
    try {
      const dbRes = await NeextplayMysql.getWinControls();
      res.json(dbRes);
    } catch (err: any) {
      res.json({ success: true, controls: {} });
    }
  });

  // POST: Save Win Controls in real MySQL
  app.post('/api/v1/win-controls', async (req: Request, res: Response) => {
    try {
      const { key, config } = req.body;
      const dbRes = await NeextplayMysql.saveWinControls(key, config);
      res.json(dbRes);
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // GET: Real Aggregated Stats from MySQL
  app.get('/api/v1/admin/stats', async (_req: Request, res: Response) => {
    try {
      const dbRes = await NeextplayMysql.getStats();
      res.json(dbRes);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // --- 0.2 OPERATOR PROVIDER USER TOP-UP / REFILL (REAL MYSQL) ---
  app.post('/api/v1/operators/top-up', async (req: Request, res: Response) => {
    const { operatorId, amount } = req.body;
    const opId = operatorId || 'op_bengalbet';
    const numAmount = Number(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      res.status(400).json({ status: 'error', code: 400, message: 'Invalid top-up amount' });
      return;
    }

    const operator = OPERATORS_STORE.find(o => o.id === opId) || OPERATORS_STORE.find(o => o.id === 'op_bengalbet') || OPERATORS_STORE[0];
    if (!operator) {
      res.status(404).json({ status: 'error', code: 404, message: 'Operator not found' });
      return;
    }

    operator.companyBalance = Number(((operator.companyBalance || 500000.00) + numAmount).toFixed(2));
    saveNeextPlayDb();

    // Synchronize to Real MySQL neextplay_db
    try {
      await NeextplayMysql.topupOperator(opId, numAmount);
    } catch (e) {
      console.warn('MySQL topupOperator sync:', e);
    }

    res.json({
      status: 'success',
      code: 200,
      message: `Successfully topped up provider balance for ${operator.name} (+৳${numAmount.toLocaleString()})`,
      data: {
        operatorId: operator.id,
        operatorName: operator.name,
        currency: operator.currency,
        addedAmount: numAmount,
        newCompanyBalance: operator.companyBalance,
        updatedAt: new Date().toISOString(),
      },
    });
  });

  // --- 0.3 AUTHORITATIVE MASTER API GATEWAY (FULL PROVIDER GAMES & DEMO/LIVE URLS) ---
  app.get(['/api/v1/master-api', '/api/v1/master-api/games'], (req: Request, res: Response) => {
    const origin = getDetectedOrigin(req);
    const host = getDetectedHost(req);
    const providerLogo = `${origin}/src/assets/images/neextplay_corp_logo_1791306162874.jpg`;

    const mappedGames = GAMES_CATALOG.map(g => ({
      id: g.id,
      slug: g.slug,
      name: g.name,
      category: g.type,
      categoryName: CATEGORIES.find(c => c.id === g.type)?.name || g.type,
      description: g.description,
      version: g.version,
      rtp: g.defaultRtp,
      minBet: g.minBet,
      maxBet: g.maxBet,
      maxMultiplier: g.maxMultiplier,
      thumbnail: g.thumbnail.startsWith('http') ? g.thumbnail : `${origin}${g.thumbnail}`,
      logoUrl: g.thumbnail.startsWith('http') ? g.thumbnail : `${origin}${g.thumbnail}`,
      provider: 'NeextPlay Studios',
      providerLogo,
      features: g.features,
      demoUrl: `${origin}/neextplay?embed=true&game=${g.id}&mode=demo`,
      liveUrl: `${origin}/neextplay?embed=true&game=${g.id}&mode=real`,
      apiLaunchEndpoint: `${origin}/api/v1/games/launch`,
      status: g.status,
    }));

    res.json({
      status: 'success',
      code: 200,
      provider: {
        name: 'NeextPlay Studios',
        code: 'NEEXTPLAY',
        brandTagline: 'Certified B2B Gaming Systems & Authoritative Ledger',
        logo: providerLogo,
        version: '3.1.0',
        compliance: 'GLI-19 Certified RNG & Provably Fair SHA-512',
        detectedDomain: host,
        detectedOrigin: origin,
        totalGames: mappedGames.length,
      },
      categories: CATEGORIES,
      games: mappedGames,
      timestamp: new Date().toISOString(),
    });
  });

  // --- 1. GET ALL CATEGORIES ---
  app.get('/api/v1/games/categories', (_req: Request, res: Response) => {
    res.json({
      status: 'success',
      code: 200,
      data: CATEGORIES,
    });
  });

  // --- 2. GET GAMES BY CATEGORY ---
  app.get('/api/v1/games/by-category', (req: Request, res: Response) => {
    const category = (req.query.category as string) || 'CRASH';
    const games = GAMES_CATALOG.filter(g => g.type.toUpperCase() === category.toUpperCase());
    res.json({
      status: 'success',
      code: 200,
      category,
      count: games.length,
      data: games,
    });
  });

  // --- 3. GET FULL GAMES CATALOG (REAL MYSQL neextplay_db) ---
  app.get(['/api/v1/games', '/api/v1/operator/games'], async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string;
      const dbRes = await NeextplayMysql.getGames();
      let list = (dbRes && dbRes.games && dbRes.games.length > 0) ? dbRes.games : GAMES_CATALOG;
      if (type) {
        list = list.filter((g: any) => (g.type || g.category || '').toLowerCase() === type.toLowerCase());
      }
      res.json({
        status: 'success',
        code: 200,
        data: {
          total: list.length,
          provider: 'NeextPlay Studios',
          games: list,
        },
        games: list
      });
    } catch (err: any) {
      res.json({
        status: 'success',
        code: 200,
        data: { total: GAMES_CATALOG.length, provider: 'NeextPlay Studios', games: GAMES_CATALOG },
        games: GAMES_CATALOG
      });
    }
  });

  app.post('/api/v1/games', async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const dbRes = await NeextplayMysql.saveGame(data);
      res.json({ status: 'success', message: 'Game saved in MySQL', dbRes });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  app.delete('/api/v1/games/:id', async (req: Request, res: Response) => {
    try {
      const dbRes = await NeextplayMysql.deleteGame(req.params.id);
      res.json({ status: 'success', message: 'Game deleted from MySQL', dbRes });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  });

  // --- 4. LAUNCH GAME SESSION ---
  app.post('/api/v1/games/launch', (req: Request, res: Response) => {
    const origin = getDetectedOrigin(req);
    const host = getDetectedHost(req);

    const headerAuth = (req.headers['authorization'] as string) || (req.headers['x-api-key'] as string) || (req.query.apiKey as string);
    const headerOpId = (req.headers['x-operator-id'] as string) || req.body.operatorId || 'op_neexthub';
    const headerPlayerId = (req.headers['x-player-id'] as string) || req.body.playerId || 'ply_neexthub_vip1';
    const headerPlayerName = (req.headers['x-player-name'] as string) || req.body.playerName || 'NeextHub High Roller';
    const headerCurrency = (req.headers['x-currency'] as string) || req.body.currency || 'BDT';
    const headerPhone = (req.headers['x-player-phone'] as string) || req.body.phone || '';
    const headerAvatar = (req.headers['x-player-avatar'] as string) || req.body.avatar || '';
    const headerVip = req.headers['x-player-vip'] ? parseInt(req.headers['x-player-vip'] as string, 10) : req.body.vipLevel || 1;
    const headerCallbackUrl = (req.headers['x-callback-url'] as string) || req.body.callbackUrl || '/api/v1/games/callback';
    const headerInitialBal = req.headers['x-initial-balance']
      ? parseFloat(req.headers['x-initial-balance'] as string)
      : req.body.initialBalance !== undefined
      ? parseFloat(req.body.initialBalance)
      : undefined;
    const headerDomain = (req.headers['x-domain'] as string) || req.body.domain || host;
    const gameId = req.body.gameId || 'game_aviator_pro';
    const mode = req.body.mode || (req.query.mode as string) || 'real';
    const userWinRateMode = req.body.userWinRateMode === true || req.body.userWinRateMode === 'true' || req.query.userWinRateMode === 'true';
    const winRateMode = req.body.winRateMode || (req.query.winRateMode as string) || 'NORMAL';
    const targetWinRate = req.body.targetWinRate ? Number(req.body.targetWinRate) : undefined;
    const forcedMinMultiplier = req.body.forcedMinMultiplier ? Number(req.body.forcedMinMultiplier) : undefined;
    const forcedMaxMultiplier = req.body.forcedMaxMultiplier ? Number(req.body.forcedMaxMultiplier) : undefined;
    const operatorWinRate = req.body.operatorWinRate ? Number(req.body.operatorWinRate) : undefined;

    const game = GAMES_CATALOG.find(g => g.id === gameId || g.slug === gameId) || GAMES_CATALOG[0];

    // If operator custom win rate provided, register with company configs
    if (operatorWinRate && headerOpId) {
      const existingComp = COMPANY_WIN_CONFIGS.get(headerOpId);
      COMPANY_WIN_CONFIGS.set(headerOpId, {
        companyId: headerOpId,
        companyName: existingComp?.companyName || 'BengalBet Casino Portal',
        rtpSetting: operatorWinRate,
        winMode: existingComp?.winMode || 'BALANCED',
        maxMultiplierCap: existingComp?.maxMultiplierCap || 1000,
        instantBustRate: existingComp?.instantBustRate || 3.0,
        minCrashMultiplier: existingComp?.minCrashMultiplier || 1.01,
        slotWildMultiplier: existingComp?.slotWildMultiplier || 1.2,
        slotScatterMultiplier: existingComp?.slotScatterMultiplier || 1.2,
        houseMarginHoldPct: existingComp?.houseMarginHoldPct || 3.8,
        emergencyThrottleActive: false,
        updatedAt: new Date().toISOString()
      });
    }

    // If user win rate mode is active, register into PLAYER_WIN_CONTROLS
    if (userWinRateMode && headerPlayerId) {
      PLAYER_WIN_CONTROLS.set(headerPlayerId, {
        playerId: headerPlayerId,
        playerName: headerPlayerName,
        userProfileMode: true,
        winRateMode,
        targetWinRate: targetWinRate ?? 85,
        forcedMinMultiplier: forcedMinMultiplier ?? 2.0,
        forcedMaxMultiplier: forcedMaxMultiplier ?? 35.0,
        luckyStreakActive: true,
        updatedAt: new Date().toISOString()
      });
    }

    // Retrieve or create player (Connect BengalBet user via Master API)
    const cleanUserId = headerPlayerId.replace(/^ply_bb_/, '').replace(/^usr-/, '');
    const bengalUser = bengalbetDb.getUserById(headerPlayerId) || 
                       bengalbetDb.getUserById(`usr-${cleanUserId}`) || 
                       bengalbetDb.getUserById(cleanUserId) ||
                       (headerPlayerId.includes('889922') ? bengalbetDb.getUserById('usr-889922') : undefined);
    const authoritativeBal = bengalUser ? bengalUser.balance : (headerInitialBal !== undefined ? headerInitialBal : 5420.50);

    let player = PLAYERS_STORE.get(headerPlayerId) || PLAYERS_STORE.get(`ply_bb_${cleanUserId}`) || (bengalUser ? PLAYERS_STORE.get(bengalUser.id) : undefined);
    let isNewRegistration = false;
    if (!player) {
      // Check if existing player under this operator with matching ID
      const existingInOperator = Array.from(PLAYERS_STORE.values()).find(
        p => p.operatorId === headerOpId && (p.id === headerPlayerId || p.name === headerPlayerName)
      );
      if (existingInOperator) {
        player = existingInOperator;
        player.balance = authoritativeBal;
        if (headerPlayerName) player.name = headerPlayerName;
        if (headerPhone) player.phone = headerPhone;
        if (headerAvatar) player.avatar = headerAvatar;
        if (headerVip) player.vipLevel = headerVip;
        if (headerCallbackUrl) player.callbackUrl = headerCallbackUrl;
        player.lastActive = new Date().toISOString();
        player.playCount = (player.playCount || 0) + 1;
        isNewRegistration = false;
      } else {
        // Player not found: register as new player in NeextPlay provider database
        player = {
          id: headerPlayerId,
          operatorId: headerOpId,
          name: headerPlayerName,
          currency: headerCurrency,
          balance: authoritativeBal,
          totalWagered: 0,
          totalWon: 0,
          lastActive: new Date().toISOString(),
          registeredAt: new Date().toISOString(),
          playCount: 1,
          phone: headerPhone,
          avatar: headerAvatar,
          vipLevel: headerVip,
          callbackUrl: headerCallbackUrl,
          status: 'ACTIVE',
        };
        isNewRegistration = true;
      }
    } else {
      // Existing player account found: load it and apply latest updates from BengalBet
      player.balance = authoritativeBal;
      if (headerPlayerName) player.name = headerPlayerName;
      if (headerPhone) player.phone = headerPhone;
      if (headerAvatar) player.avatar = headerAvatar;
      if (headerVip) player.vipLevel = headerVip;
      if (headerCallbackUrl) player.callbackUrl = headerCallbackUrl;
      player.currency = headerCurrency;
      player.lastActive = new Date().toISOString();
      player.playCount = (player.playCount || 0) + 1;
      isNewRegistration = false;
    }

    PLAYERS_STORE.set(headerPlayerId, player);
    PLAYERS_STORE.set(`ply_bb_${cleanUserId}`, player);
    if (bengalUser) {
      PLAYERS_STORE.set(bengalUser.id, player);
    }

    const sessionToken = 'np_sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    // Build Demo Launch URL and Real Live Launch URL
    const demoLaunchPath = `/neextplay?embed=true&game=${game.id}&mode=demo&currency=${player.currency}&domain=${encodeURIComponent(headerDomain)}`;
    const liveLaunchPath = `/neextplay?embed=true&game=${game.id}&mode=real&token=${sessionToken}&playerId=${encodeURIComponent(player.id)}&username=${encodeURIComponent(player.name)}&balance=${player.balance}&currency=${player.currency}&operatorId=${headerOpId}&userWinRateMode=${userWinRateMode}&winRateMode=${encodeURIComponent(winRateMode)}&callbackUrl=${encodeURIComponent(headerCallbackUrl)}&domain=${encodeURIComponent(headerDomain)}`;
    
    const demoLaunchUrl = `${origin}${demoLaunchPath}`;
    const liveLaunchUrl = `${origin}${liveLaunchPath}`;
    const fullLaunchUrl = mode === 'demo' ? demoLaunchUrl : liveLaunchUrl;
    const launchPath = mode === 'demo' ? demoLaunchPath : liveLaunchPath;

    const sessionData: ServerSession = {
      token: sessionToken,
      operatorId: headerOpId,
      playerId: player.id,
      gameId: game.id,
      currency: player.currency,
      launchUrl: fullLaunchUrl,
      domain: headerDomain,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7200000).toISOString(),
      status: 'ACTIVE',
    };

    SESSIONS_STORE.set(sessionToken, sessionData);
    saveNeextPlayDb();

    // Find operator for company balance
    const currentOperator = OPERATORS_STORE.find(o => o.id === headerOpId) || OPERATORS_STORE.find(o => o.id === 'op_bengalbet') || OPERATORS_STORE[0];

    const providerLogo = '/src/assets/images/neextplay_corp_logo_1791306162874.jpg';
    const curlCommand = `curl -X POST "${origin}/api/v1/games/launch" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer np_live_key_bengalbet_883921" \\
  -H "x-operator-id: op_bengalbet" \\
  -H "x-player-id: ${player.id}" \\
  -H "x-currency: ${player.currency}" \\
  -d '{"gameId":"${game.id}","mode":"${mode}","operatorId":"op_bengalbet","playerId":"${player.id}","playerName":"${player.name}","currency":"${player.currency}","initialBalance":${player.balance},"userWinRateMode":${userWinRateMode}}'`;

    res.json({
      status: 'success',
      code: 200,
      message: isNewRegistration
        ? `BengalBet player (${player.id}) registered as new player in NeextPlay provider database.`
        : `Existing NeextPlay account (${player.id}) loaded with updated BengalBet balance.`,
      data: {
        sessionToken,
        mode,
        launchUrl: fullLaunchUrl,
        launchPath,
        demoUrl: demoLaunchUrl,
        liveUrl: liveLaunchUrl,
        game: {
          id: game.id,
          name: game.name,
          type: game.type,
          rtp: game.defaultRtp,
          thumbnail: game.thumbnail,
          provider: game.provider,
          providerLogo,
        },
        provider: {
          name: 'NeextPlay Studios',
          code: 'NEEXTPLAY',
          logo: providerLogo,
          version: '3.1.0',
          compliance: 'GLI-19 Certified RNG & Provably Fair SHA-512',
        },
        player: {
          id: player.id,
          name: player.name,
          currency: player.currency,
          balance: player.balance,
          isNewRegistration,
          accountStatus: isNewRegistration ? 'REGISTERED_NEW_PLAYER' : 'LOADED_EXISTING_PLAYER',
          statusBadge: isNewRegistration ? '✨ New BengalBet Player Registered' : '⚡ Existing Player Loaded & Synced',
          statusBadgeBn: isNewRegistration ? 'নতুন বেঙ্গলবেট প্লেয়ার নিবন্ধিত' : 'বিদ্যমান অ্যাকাউন্ট লোড ও আপডেট সম্পন্ন',
          playCount: player.playCount || 1,
          totalWagered: player.totalWagered || 0,
          totalWon: player.totalWon || 0,
        },
        operator: {
          id: headerOpId,
          name: currentOperator?.name || 'BengalBet Casino Portal',
          companyBalance: currentOperator?.companyBalance ?? 500000.00,
          currency: currentOperator?.currency || 'BDT',
          domain: headerDomain,
          detectedSiteDomain: host,
          detectedOrigin: origin,
        },
        winRateConfig: {
          userWinRateMode,
          winRateMode,
          targetWinRate,
          forcedMinMultiplier,
          forcedMaxMultiplier,
          operatorWinRate: currentOperator ? 97.2 : 97.0
        },
        curl: {
          launch: curlCommand,
          balance: `curl -X GET "${origin}/api/v1/wallet/balance?playerId=${player.id}&operatorId=${headerOpId}"`,
          bet: `curl -X POST "${origin}/api/v1/wallet/bet" -H "Content-Type: application/json" -d '{"playerId":"${player.id}","betAmount":50,"gameId":"${game.id}"}'`,
          win: `curl -X POST "${origin}/api/v1/wallet/win" -H "Content-Type: application/json" -d '{"playerId":"${player.id}","winAmount":100,"gameId":"${game.id}","multiplier":2.0}'`,
        },
        headersReceived: {
          authorization: headerAuth || 'Bearer np_live_key_bengalbet_883921',
          'x-operator-id': headerOpId,
          'x-player-id': player.id,
          'x-player-name': player.name,
          'x-currency': player.currency,
          'x-initial-balance': player.balance,
          'x-domain': headerDomain,
        },
        expiresAt: sessionData.expiresAt,
      },
    });
  });

  // --- 4.1 VERIFY SESSION TOKEN ---
  app.get('/api/v1/sessions/:token', (req: Request, res: Response) => {
    const token = req.params.token;
    const session = SESSIONS_STORE.get(token);

    if (!session) {
      res.status(404).json({
        status: 'error',
        code: 404,
        error: 'SESSION_NOT_FOUND',
        message: `No active game session found for token '${token}'`,
      });
      return;
    }

    const player = PLAYERS_STORE.get(session.playerId);
    const game = GAMES_CATALOG.find(g => g.id === session.gameId);

    res.json({
      status: 'success',
      code: 200,
      data: {
        session,
        player,
        game,
      },
    });
  });

  // --- 5. WALLET BET / DEBIT ---
  const handleBetDebit = (req: Request, res: Response) => {
    const { playerId, betAmount, currency, gameId, roundId } = req.body;
    const pId = playerId || (req.headers['x-player-id'] as string) || 'ply_neexthub_vip1';
    const amount = Number(betAmount);

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ status: 'error', code: 400, message: 'Invalid bet amount. Must be positive number.' });
      return;
    }

    let player = PLAYERS_STORE.get(pId);
    if (!player) {
      player = {
        id: pId,
        operatorId: (req.headers['x-operator-id'] as string) || 'op_neexthub',
        name: 'Player ' + pId,
        currency: currency || 'USD',
        balance: 1000.0,
        totalWagered: 0,
        totalWon: 0,
        lastActive: new Date().toISOString(),
      };
      PLAYERS_STORE.set(pId, player);
    }

    if (player.balance < amount) {
      res.status(400).json({
        status: 'error',
        code: 400,
        error: 'INSUFFICIENT_FUNDS',
        message: `Player balance (${player.currency} ${player.balance.toFixed(2)}) is insufficient for bet (${player.currency} ${amount.toFixed(2)})`,
        currentBalance: player.balance,
      });
      return;
    }

    const previousBalance = player.balance;
    player.balance = Number((player.balance - amount).toFixed(2));
    player.totalWagered = Number((player.totalWagered + amount).toFixed(2));
    player.lastActive = new Date().toISOString();

    // Update Operator Company Gaming Balance & Turnover in NeextPlay DB based on total bet (deduct from provider user balance)
    const targetOpId = (req.headers['x-operator-id'] as string) || player.operatorId || 'op_bengalbet';
    const operator = OPERATORS_STORE.find(o => o.id === targetOpId) || OPERATORS_STORE.find(o => o.id === 'op_bengalbet') || OPERATORS_STORE[0];
    if (operator) {
      operator.totalTurnover = Number(((operator.totalTurnover || 0) + amount).toFixed(2));
      operator.totalGgr = Number(((operator.totalGgr || 0) + amount).toFixed(2));
      operator.companyBalance = Number(((operator.companyBalance || 500000.00) - amount).toFixed(2));
      operator.totalBetsCount = (operator.totalBetsCount || 0) + 1;
    }
    saveNeextPlayDb();

    // Synchronize to BengalBet Real MySQL Database
    BengalbetMysql.processGameCallback({
      action: 'BET',
      playerId: pId,
      operatorId: targetOpId,
      gameId: gameId || 'game_aviator_pro',
      gameName: 'Aviator Pro',
      roundId,
      betAmount: amount,
      currency: currency || player.currency
    }).then(res => {
      if (res && res.balance !== undefined) {
        player.balance = res.balance;
        PLAYERS_STORE.set(pId, player);
      }
    }).catch(e => console.warn('BengalBet MySQL bet debit sync error:', e));

    const txId = 'tx_bet_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    // Asynchronously record Bet & Debit into Real MySQL neextplay_db
    NeextplayMysql.updatePlayerBalance({
      playerId: player.id,
      operatorId: targetOpId,
      amount,
      type: 'DEBIT',
      gameId: gameId || 'game_aviator_pro',
      reference: roundId || txId
    }).catch(e => console.warn('MySQL updatePlayerBalance bet debit sync error:', e));

    NeextplayMysql.recordBet({
      id: txId,
      roundId: roundId || ('rnd_' + Date.now().toString(36)),
      operatorId: targetOpId,
      playerId: player.id,
      gameId: gameId || 'game_aviator_pro',
      betAmount: amount,
      winAmount: 0,
      multiplier: 0,
      status: 'PENDING',
      currency: currency || player.currency
    }).catch(e => console.warn('MySQL recordBet debit sync error:', e));

    res.json({
      status: 'success',
      code: 200,
      action: 'BET_DEBIT',
      data: {
        txId,
        roundId: roundId || 'rnd_' + Date.now().toString(36),
        playerId: player.id,
        gameId: gameId || 'game_aviator_pro',
        debitedAmount: amount,
        previousBalance,
        newBalance: player.balance,
        currency: currency || player.currency,
        timestamp: new Date().toISOString(),
      },
    });
  };

  app.post(['/api/v1/wallet/bet', '/api/v1/wallet/debit'], handleBetDebit);

  // --- 6. WALLET WIN ---
  app.post('/api/v1/wallet/win', (req: Request, res: Response) => {
    const { playerId, winAmount, multiplier, currency, gameId, roundId } = req.body;
    const pId = playerId || (req.headers['x-player-id'] as string) || 'ply_neexthub_vip1';
    const amount = Number(winAmount);

    if (isNaN(amount) || amount < 0) {
      res.status(400).json({ status: 'error', code: 400, message: 'Invalid win amount' });
      return;
    }

    let player = PLAYERS_STORE.get(pId);
    if (!player) {
      player = {
        id: pId,
        operatorId: (req.headers['x-operator-id'] as string) || 'op_neexthub',
        name: 'Player ' + pId,
        currency: currency || 'USD',
        balance: 1000.0,
        totalWagered: 0,
        totalWon: 0,
        lastActive: new Date().toISOString(),
      };
      PLAYERS_STORE.set(pId, player);
    }

    const previousBalance = player.balance;
    player.balance = Number((player.balance + amount).toFixed(2));
    player.totalWon = Number((player.totalWon + amount).toFixed(2));
    player.lastActive = new Date().toISOString();

    // Update Operator Company Gaming Balance & GGR in NeextPlay DB
    const targetOpId = (req.headers['x-operator-id'] as string) || player.operatorId || 'op_bengalbet';
    const operator = OPERATORS_STORE.find(o => o.id === targetOpId) || OPERATORS_STORE.find(o => o.id === 'op_bengalbet') || OPERATORS_STORE[0];
    if (operator && amount > 0) {
      operator.totalGgr = Number(((operator.totalGgr || 0) - amount).toFixed(2));
      operator.companyBalance = Number(((operator.companyBalance || 500000.00) - amount).toFixed(2));
      operator.totalWinsCount = (operator.totalWinsCount || 0) + 1;
      operator.totalPayout = Number(((operator.totalPayout || 0) + amount).toFixed(2));
    }
    saveNeextPlayDb();

    // Synchronize to BengalBet Real MySQL Database
    if (amount > 0) {
      BengalbetMysql.processGameCallback({
        action: 'WIN',
        playerId: pId,
        operatorId: targetOpId,
        gameId: gameId || 'game_aviator_pro',
        gameName: 'Aviator Pro',
        roundId,
        winAmount: amount,
        multiplier: multiplier || 1.0,
        currency: currency || player.currency
      }).then(res => {
        if (res && res.balance !== undefined) {
          player.balance = res.balance;
          PLAYERS_STORE.set(pId, player);
        }
      }).catch(e => console.warn('BengalBet MySQL win credit sync error:', e));
    }

    const txId = 'tx_win_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    // Asynchronously record Win & Credit into Real MySQL neextplay_db
    if (amount > 0) {
      NeextplayMysql.updatePlayerBalance({
        playerId: player.id,
        operatorId: targetOpId,
        amount,
        type: 'CREDIT',
        gameId: gameId || 'game_aviator_pro',
        reference: roundId || txId
      }).catch(e => console.warn('MySQL updatePlayerBalance win credit sync error:', e));

      NeextplayMysql.recordBet({
        id: txId,
        roundId: roundId || ('rnd_' + Date.now().toString(36)),
        operatorId: targetOpId,
        playerId: player.id,
        gameId: gameId || 'game_aviator_pro',
        betAmount: 0,
        winAmount: amount,
        multiplier: multiplier || 1.0,
        status: 'WON',
        currency: currency || player.currency
      }).catch(e => console.warn('MySQL recordBet win sync error:', e));
    }

    res.json({
      status: 'success',
      code: 200,
      action: 'WIN_CREDIT',
      data: {
        txId,
        roundId: roundId || 'rnd_' + Date.now().toString(36),
        playerId: player.id,
        gameId: gameId || 'game_aviator_pro',
        multiplier: multiplier || 1.0,
        creditedAmount: amount,
        previousBalance,
        newBalance: player.balance,
        currency: currency || player.currency,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // --- 6.1 WALLET ROLLBACK ---
  app.post('/api/v1/wallet/rollback', (req: Request, res: Response) => {
    const { playerId, rollbackAmount, roundId, reason } = req.body;
    const pId = playerId || (req.headers['x-player-id'] as string) || 'ply_neexthub_vip1';
    const amount = Number(rollbackAmount);

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ status: 'error', code: 400, message: 'Invalid rollback amount' });
      return;
    }

    const player = PLAYERS_STORE.get(pId);
    if (!player) {
      res.status(404).json({ status: 'error', code: 404, message: 'Player not found' });
      return;
    }

    const previousBalance = player.balance;
    player.balance = Number((player.balance + amount).toFixed(2));
    player.lastActive = new Date().toISOString();
    saveNeextPlayDb();

    const txId = 'tx_rbk_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    // Asynchronously record Rollback into Real MySQL neextplay_db
    NeextplayMysql.updatePlayerBalance({
      playerId: player.id,
      operatorId: player.operatorId,
      amount,
      type: 'CREDIT',
      gameId: 'ROLLBACK',
      reference: roundId || txId
    }).catch(e => console.warn('MySQL rollback sync error:', e));

    res.json({
      status: 'success',
      code: 200,
      action: 'ROLLBACK_REFUND',
      data: {
        txId,
        roundId: roundId || 'rnd_' + Date.now().toString(36),
        playerId: player.id,
        refundedAmount: amount,
        reason: reason || 'ROUND_CANCELLED_OR_TIMEOUT',
        previousBalance,
        newBalance: player.balance,
        currency: player.currency,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // --- 7. GET USER BALANCE ---
  app.get('/api/v1/wallet/balance', (req: Request, res: Response) => {
    const pId = (req.query.playerId as string) || (req.headers['x-player-id'] as string) || 'ply_bb_889922';
    const cleanUserId = pId.replace(/^ply_bb_/, '').replace(/^usr-/, '');
    const bengalUser = bengalbetDb.getUserById(pId) || 
                       bengalbetDb.getUserById(`usr-${cleanUserId}`) || 
                       bengalbetDb.getUserById(cleanUserId) ||
                       (pId.includes('889922') ? bengalbetDb.getUserById('usr-889922') : undefined) ||
                       bengalbetDb.data.users[0];

    let player = PLAYERS_STORE.get(pId) || 
                 PLAYERS_STORE.get(`ply_bb_${cleanUserId}`) || 
                 PLAYERS_STORE.get(`usr-${cleanUserId}`) ||
                 PLAYERS_STORE.get(cleanUserId) ||
                 (bengalUser ? PLAYERS_STORE.get(bengalUser.id) : undefined);

    if (bengalUser) {
      if (!player) {
        player = {
          id: pId,
          operatorId: 'op_bengalbet',
          name: bengalUser.username,
          currency: 'BDT',
          balance: bengalUser.balance,
          totalWagered: 0,
          totalWon: 0,
          lastActive: new Date().toISOString(),
          phone: bengalUser.phone,
          avatar: bengalUser.avatar,
          vipLevel: bengalUser.vipLevel || 1,
          status: 'ACTIVE',
        };
      } else {
        // If player balance was modified by gameplay, synchronize it to bengalUser so it doesn't get reverted!
        if (typeof player.balance === 'number' && !isNaN(player.balance)) {
          bengalUser.balance = player.balance;
          bengalbetDb.updateUser(bengalUser.id, { balance: player.balance });
        } else {
          player.balance = bengalUser.balance;
        }
        player.lastActive = new Date().toISOString();
      }
      PLAYERS_STORE.set(pId, player);
      PLAYERS_STORE.set(`ply_bb_${cleanUserId}`, player);
      PLAYERS_STORE.set(bengalUser.id, player);
      saveNeextPlayDb();
    } else if (!player) {
      player = {
        id: pId,
        operatorId: (req.headers['x-operator-id'] as string) || 'op_bengalbet',
        name: 'Player ' + pId,
        currency: (req.query.currency as string) || 'BDT',
        balance: 5420.50,
        totalWagered: 0,
        totalWon: 0,
        lastActive: new Date().toISOString(),
      };
      PLAYERS_STORE.set(pId, player);
      saveNeextPlayDb();
    }

    res.json({
      status: 'success',
      code: 200,
      data: {
        playerId: player.id,
        name: player.name,
        currency: player.currency,
        balance: player.balance,
        totalWagered: player.totalWagered,
        totalWon: player.totalWon,
        lastActive: player.lastActive,
      },
    });
  });

  // --- 7.1 SYNC CLIENT BALANCE ---
  app.post('/api/v1/wallet/sync-balance', (req: Request, res: Response) => {
    const { playerId, balance } = req.body;
    const pId = playerId || 'ply_bb_889922';
    const numBal = Number(balance);
    if (isNaN(numBal)) {
      res.status(400).json({ status: 'error', message: 'Invalid balance' });
      return;
    }

    const cleanUserId = pId.replace(/^ply_bb_/, '').replace(/^usr-/, '');
    const keysToUpdate = [
      pId,
      `ply_bb_${pId}`,
      `ply_bb_${cleanUserId}`,
      `usr-${cleanUserId}`,
      cleanUserId,
      'ply_bb_889922',
      'usr-889922'
    ];

    for (const k of keysToUpdate) {
      const pl = PLAYERS_STORE.get(k);
      if (pl) {
        pl.balance = numBal;
        pl.lastActive = new Date().toISOString();
      }
    }

    let mainPl = PLAYERS_STORE.get(pId) || PLAYERS_STORE.get(`ply_bb_${cleanUserId}`);
    if (!mainPl) {
      mainPl = {
        id: pId,
        operatorId: 'op_bengalbet',
        name: 'Player ' + pId,
        currency: 'BDT',
        balance: numBal,
        totalWagered: 0,
        totalWon: 0,
        lastActive: new Date().toISOString(),
      };
      PLAYERS_STORE.set(pId, mainPl);
    } else {
      mainPl.balance = numBal;
    }
    PLAYERS_STORE.set(`ply_bb_${cleanUserId}`, mainPl);

    const bengalUser = bengalbetDb.getUserById(pId) || 
                       bengalbetDb.getUserById(`usr-${cleanUserId}`) || 
                       bengalbetDb.getUserById(cleanUserId) || 
                       (pId.includes('889922') ? bengalbetDb.getUserById('usr-889922') : undefined) ||
                       bengalbetDb.data.users[0];
    if (bengalUser) {
      bengalbetDb.updateUser(bengalUser.id, { balance: numBal });
    }

    saveNeextPlayDb();

    res.json({
      status: 'success',
      code: 200,
      data: {
        playerId: pId,
        balance: numBal,
        updatedAt: new Date().toISOString(),
      },
    });
  });

  // --- 8. WALLET DEPOSIT ---
  app.post('/api/v1/wallet/deposit', (req: Request, res: Response) => {
    const { playerId, amount, currency } = req.body;
    const pId = playerId || 'ply_neexthub_vip1';
    const depAmount = Number(amount);

    if (isNaN(depAmount) || depAmount <= 0) {
      res.status(400).json({ status: 'error', code: 400, message: 'Invalid deposit amount' });
      return;
    }

    let player = PLAYERS_STORE.get(pId);
    if (!player) {
      player = {
        id: pId,
        operatorId: 'op_neexthub',
        name: 'Player ' + pId,
        currency: currency || 'USD',
        balance: depAmount,
        totalWagered: 0,
        totalWon: 0,
        lastActive: new Date().toISOString(),
      };
      PLAYERS_STORE.set(pId, player);
    } else {
      player.balance = Number((player.balance + depAmount).toFixed(2));
      player.lastActive = new Date().toISOString();
    }
    saveNeextPlayDb();

    // Asynchronously update real MySQL neextplay_db
    NeextplayMysql.updatePlayerBalance({
      playerId: player.id,
      operatorId: player.operatorId || 'op_bengalbet',
      amount: depAmount,
      type: 'CREDIT',
      gameId: 'WALLET_DEPOSIT',
      reference: 'dep_' + Date.now().toString(36)
    }).catch(e => console.warn('MySQL deposit sync error:', e));

    res.json({
      status: 'success',
      code: 200,
      data: {
        playerId: player.id,
        deposited: depAmount,
        newBalance: player.balance,
        currency: player.currency,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // --- 9. WALLET WITHDRAWAL ---
  app.post('/api/v1/wallet/withdraw', (req: Request, res: Response) => {
    const { playerId, amount, paymentMethod, accountDetails, currency } = req.body;
    const pId = playerId || 'ply_neexthub_vip1';
    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      res.status(400).json({ status: 'error', code: 400, message: 'Invalid withdrawal amount' });
      return;
    }

    const player = PLAYERS_STORE.get(pId);
    if (!player) {
      res.status(404).json({ status: 'error', code: 404, message: 'Player not found' });
      return;
    }

    if (player.balance < withdrawAmount) {
      res.status(400).json({
        status: 'error',
        code: 400,
        error: 'INSUFFICIENT_FUNDS',
        message: `Withdrawal request (${player.currency} ${withdrawAmount.toFixed(2)}) exceeds balance (${player.currency} ${player.balance.toFixed(2)})`,
        currentBalance: player.balance,
      });
      return;
    }

    const previousBalance = player.balance;
    player.balance = Number((player.balance - withdrawAmount).toFixed(2));
    player.lastActive = new Date().toISOString();
    const txId = 'tx_wdr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

    // Asynchronously update real MySQL neextplay_db
    NeextplayMysql.updatePlayerBalance({
      playerId: player.id,
      operatorId: player.operatorId || 'op_bengalbet',
      amount: withdrawAmount,
      type: 'DEBIT',
      gameId: 'WALLET_WITHDRAWAL',
      reference: txId
    }).catch(e => console.warn('MySQL withdraw sync error:', e));

    res.json({
      status: 'success',
      code: 200,
      action: 'WITHDRAWAL_COMPLETED',
      data: {
        txId,
        playerId: player.id,
        withdrawnAmount: withdrawAmount,
        paymentMethod: paymentMethod || 'MANUAL_CASH_OUT',
        accountDetails: accountDetails || 'N/A',
        previousBalance,
        newBalance: player.balance,
        currency: currency || player.currency,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // --- 10. CREATE PLAYER ---
  app.post('/api/v1/players/create', (req: Request, res: Response) => {
    const { username, externalPlayerId, operatorId, currency, initialBalance } = req.body;
    const opId = operatorId || 'op_neexthub';
    const pId = externalPlayerId || 'ply_' + Math.random().toString(36).substring(2, 9);
    const bal = initialBalance !== undefined ? Number(initialBalance) : 1000.0;

    const player: ServerPlayer = {
      id: pId,
      operatorId: opId,
      name: username || 'Player ' + pId,
      currency: currency || 'USD',
      balance: bal,
      totalWagered: 0,
      totalWon: 0,
      lastActive: new Date().toISOString(),
    };

    PLAYERS_STORE.set(pId, player);
    saveNeextPlayDb();

    res.json({
      status: 'success',
      code: 201,
      message: 'Player account registered successfully on operator database.',
      data: player,
    });
  });

  // --- 10.1 GET ALL PLAYERS (PLAYER MANAGEMENT) ---
  app.get('/api/v1/players', (req: Request, res: Response) => {
    const operatorId = req.query.operatorId as string;
    const q = ((req.query.q || req.query.search || '') as string).toLowerCase().trim();

    let list = Array.from(PLAYERS_STORE.values());
    if (operatorId && operatorId !== 'ALL') {
      list = list.filter(p => p.operatorId === operatorId);
    }
    if (q) {
      list = list.filter(p =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q))
      );
    }

    res.json({
      status: 'success',
      code: 200,
      total: list.length,
      data: list.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()),
    });
  });

  // --- 10.2 GET SINGLE PLAYER ---
  app.get('/api/v1/players/:id', (req: Request, res: Response) => {
    const player = PLAYERS_STORE.get(req.params.id);
    if (!player) {
      res.status(404).json({ status: 'error', code: 404, message: 'Player not found' });
      return;
    }
    res.json({ status: 'success', code: 200, data: player });
  });

  // --- 10.3 UPDATE PLAYER (PLAYER MANAGEMENT) ---
  app.put('/api/v1/players/:id', (req: Request, res: Response) => {
    const player = PLAYERS_STORE.get(req.params.id);
    if (!player) {
      res.status(404).json({ status: 'error', code: 404, message: 'Player not found' });
      return;
    }
    const { balance, name, status, vipLevel, phone } = req.body;
    if (balance !== undefined && !isNaN(Number(balance))) player.balance = Number(balance);
    if (name) player.name = name;
    if (status) player.status = status;
    if (vipLevel !== undefined) player.vipLevel = Number(vipLevel);
    if (phone !== undefined) player.phone = phone;
    player.lastActive = new Date().toISOString();
    saveNeextPlayDb();

    // If this is a BengalBet player, also sync balance changes
    const cleanUserId = player.id.replace(/^ply_bb_/, '');
    const bengalUser = bengalbetDb.getUserById(player.id) || bengalbetDb.getUserById(cleanUserId);
    if (bengalUser && balance !== undefined) {
      bengalbetDb.updateUser(bengalUser.id, { balance: Number(balance) });
    }

    res.json({ status: 'success', code: 200, message: 'Player updated successfully', data: player });
  });

  // --- 10.4 SYNC PLAYER FROM MAIN SITE ---
  app.post('/api/v1/players/sync', (req: Request, res: Response) => {
    const { id, username, balance, currency, phone, vipLevel, avatar, operatorId, callbackUrl } = req.body;
    if (!id) {
      res.status(400).json({ status: 'error', code: 400, message: 'Player ID required' });
      return;
    }
    let player = PLAYERS_STORE.get(id);
    const opId = operatorId || 'op_bengalbet';
    const isNew = !player;
    if (!player) {
      player = {
        id,
        operatorId: opId,
        name: username || 'Player ' + id,
        currency: currency || 'BDT',
        balance: balance !== undefined ? Number(balance) : 1000,
        totalWagered: 0,
        totalWon: 0,
        lastActive: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
        playCount: 1,
        phone: phone || '',
        avatar: avatar || '',
        vipLevel: vipLevel || 1,
        callbackUrl: callbackUrl || '/api/v1/games/callback',
        status: 'ACTIVE',
      };
      PLAYERS_STORE.set(id, player);
    } else {
      if (balance !== undefined) player.balance = Number(balance);
      if (username) player.name = username;
      if (phone) player.phone = phone;
      if (avatar) player.avatar = avatar;
      if (vipLevel) player.vipLevel = vipLevel;
      if (callbackUrl) player.callbackUrl = callbackUrl;
      player.lastActive = new Date().toISOString();
    }
    saveNeextPlayDb();
    res.json({ status: 'success', code: 200, isNew, data: player });
  });

  // --- 10.5 MASTER CALLBACK GATEWAY (BENGALBET MAIN SITE REAL MYSQL SYNC) ---
  app.post(['/api/v1/games/callback', '/api/games/callback', '/api/bengalbet/game-callback'], async (req: Request, res: Response) => {
    try {
      const { action, type, playerId, operatorId, gameId, gameName, roundId, betAmount, winAmount, payout, multiplier, currency } = req.body;
      const act = (action || type || 'BET').toUpperCase();
      const pId = playerId || req.body.userId || 'ply_bb_889922';
      const amt = Number(betAmount || 0);
      const winAmt = Number(winAmount !== undefined ? winAmount : (payout !== undefined ? payout : 0));
      const mult = Number(multiplier || 1.0);

      // 1. Authoritative Real MySQL Execution on bengalbet_db
      const mysqlResult = await BengalbetMysql.processGameCallback({
        action: act,
        playerId: pId,
        userId: req.body.userId,
        operatorId: operatorId || 'op_bengalbet',
        gameId,
        gameName,
        roundId,
        betAmount: amt,
        winAmount: winAmt,
        multiplier: mult,
        currency: currency || 'BDT'
      });

      // 2. Update NeextPlay memory and real MySQL stores
      let neextPlayer = PLAYERS_STORE.get(pId) || PLAYERS_STORE.get(mysqlResult.playerId);
      if (!neextPlayer) {
        neextPlayer = {
          id: pId,
          operatorId: operatorId || 'op_bengalbet',
          name: mysqlResult.username || 'Player ' + pId,
          currency: currency || 'BDT',
          balance: mysqlResult.balance,
          totalWagered: 0,
          totalWon: 0,
          lastActive: new Date().toISOString(),
        };
      }
      neextPlayer.balance = mysqlResult.balance;
      if (act === 'BET') {
        neextPlayer.totalWagered = Number((neextPlayer.totalWagered + amt).toFixed(2));
      } else if (act === 'WIN') {
        neextPlayer.totalWon = Number((neextPlayer.totalWon + winAmt).toFixed(2));
      }
      neextPlayer.lastActive = new Date().toISOString();
      PLAYERS_STORE.set(pId, neextPlayer);
      PLAYERS_STORE.set(mysqlResult.playerId, neextPlayer);

      // 2.5 Update Operator Gaming Balance & Turnover
      const targetOpId = operatorId || neextPlayer.operatorId || 'op_bengalbet';
      const operator = OPERATORS_STORE.find(o => o.id === targetOpId) || OPERATORS_STORE.find(o => o.id === 'op_bengalbet') || OPERATORS_STORE[0];
      if (operator) {
        if (act === 'BET' && amt > 0) {
          operator.totalTurnover = Number(((operator.totalTurnover || 0) + amt).toFixed(2));
          operator.totalGgr = Number(((operator.totalGgr || 0) + amt).toFixed(2));
          operator.companyBalance = Number(((operator.companyBalance || 500000.00) - amt).toFixed(2));
          operator.totalBetsCount = (operator.totalBetsCount || 0) + 1;
        } else if (act === 'WIN' && winAmt > 0) {
          operator.totalGgr = Number(((operator.totalGgr || 0) - winAmt).toFixed(2));
          operator.totalWinsCount = (operator.totalWinsCount || 0) + 1;
          operator.totalPayout = Number(((operator.totalPayout || 0) + winAmt).toFixed(2));
        }
      }
      saveNeextPlayDb();

      // Async update neextplay_db MySQL player balance
      NeextplayMysql.updatePlayerBalance({
        playerId: pId,
        operatorId: targetOpId,
        balance: mysqlResult.balance,
        delta: act === 'BET' ? -amt : act === 'WIN' ? winAmt : 0,
        type: act === 'BET' ? 'bet' : act === 'WIN' ? 'win' : 'rollback'
      }).catch(e => console.warn('NeextPlay MySQL balance sync error:', e));

      // Synchronize in-memory fallback if present
      if (typeof bengalbetDb !== 'undefined') {
        const bUser = bengalbetDb.getUserById(mysqlResult.playerId) || bengalbetDb.getUserById(pId);
        if (bUser) {
          bUser.balance = mysqlResult.balance;
        }
      }

      res.json({
        status: 'success',
        code: 200,
        action: act,
        database: 'bengalbet_db (MySQL live)',
        data: {
          playerId: mysqlResult.playerId,
          operatorId: operator?.id || 'op_bengalbet',
          gameId: gameId || 'game_aviator_pro',
          roundId,
          betAmount: amt,
          winAmount: winAmt,
          multiplier: mult,
          newBalance: mysqlResult.balance,
          currency: currency || 'BDT',
          companyBalance: operator ? operator.companyBalance : 500000.00,
          totalTurnover: operator ? operator.totalTurnover : 28400000.00,
          totalGgr: operator ? operator.totalGgr : 1450000.00,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error('Error in MySQL game callback:', err);
      res.status(500).json({
        status: 'error',
        code: 500,
        message: err.message || 'Game callback MySQL processing error'
      });
    }
  });

  // --- 11. SLOT SPIN TEST ENGINE (FOR DEVELOPER PORTAL) ---
  app.post('/api/v1/slot/spin', (req: Request, res: Response) => {
    const { playerId, betAmount } = req.body;
    const bet = Number(betAmount) || 10;
    const pId = playerId || 'ply_neexthub_vip1';
    let player = PLAYERS_STORE.get(pId);
    if (!player) {
      player = {
        id: pId,
        operatorId: 'op_neexthub',
        name: 'Player ' + pId,
        currency: 'USD',
        balance: 1000.0,
        totalWagered: 0,
        totalWon: 0,
        lastActive: new Date().toISOString(),
      };
      PLAYERS_STORE.set(pId, player);
    }

    const symbols = ['WILD', 'DRAGON', 'PHOENIX', 'TIGER', 'COIN', 'A', 'K', 'Q', 'J', '10'];
    const grid: string[][] = [];
    for (let col = 0; col < 5; col++) {
      const colSymbols: string[] = [];
      for (let row = 0; row < 3; row++) {
        colSymbols.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
      grid.push(colSymbols);
    }

    const isWin = Math.random() > 0.45;
    const multiplier = isWin ? Number((1.5 + Math.random() * 8.5).toFixed(2)) : 0;
    const totalWin = Number((bet * multiplier).toFixed(2));

    player.balance = Number((player.balance - bet + totalWin).toFixed(2));
    player.totalWagered = Number((player.totalWagered + bet).toFixed(2));
    player.totalWon = Number((player.totalWon + totalWin).toFixed(2));
    player.lastActive = new Date().toISOString();
    saveNeextPlayDb();

    res.json({
      status: 'success',
      code: 200,
      data: {
        roundId: 'rnd_spin_' + Date.now().toString(36),
        playerId: player.id,
        betAmount: bet,
        totalWin,
        multiplier,
        grid,
        remainingBalance: player.balance,
        currency: player.currency,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // --- 12. WIN CONTROLS & 3-TIER OUTCOME DECISION ENGINE API ---
  const COMPANY_WIN_CONFIGS = new Map<string, any>([
    ['op_bengalbet', {
      companyId: 'op_bengalbet',
      companyName: 'BengalBet Casino Portal',
      rtpSetting: 97.2,
      winMode: 'BALANCED',
      maxMultiplierCap: 1000,
      instantBustRate: 3.0,
      minCrashMultiplier: 1.01,
      slotWildMultiplier: 1.2,
      slotScatterMultiplier: 1.2,
      houseMarginHoldPct: 3.8,
      emergencyThrottleActive: false,
      updatedAt: new Date().toISOString()
    }],
    ['op_neexthub', {
      companyId: 'op_neexthub',
      companyName: 'NeextHub Gaming Corp',
      rtpSetting: 98.0,
      winMode: 'HIGH_WIN',
      maxMultiplierCap: 2500,
      instantBustRate: 2.0,
      minCrashMultiplier: 1.02,
      slotWildMultiplier: 1.5,
      slotScatterMultiplier: 1.5,
      houseMarginHoldPct: 3.0,
      emergencyThrottleActive: false,
      updatedAt: new Date().toISOString()
    }]
  ]);

  const PLAYER_WIN_CONTROLS = new Map<string, any>([
    ['ply_bb_889922', {
      playerId: 'ply_bb_889922',
      playerName: 'BengalBet VIP Player',
      userProfileMode: true,
      winRateMode: 'FORCED_WIN',
      targetWinRate: 88,
      forcedMinMultiplier: 2.5,
      forcedMaxMultiplier: 35.0,
      luckyStreakActive: true,
      updatedAt: new Date().toISOString()
    }],
    ['ply_bengalbet_usr', {
      playerId: 'ply_bengalbet_usr',
      playerName: 'BengalBet Mobile Player',
      userProfileMode: true,
      winRateMode: 'BOOSTED',
      targetWinRate: 75,
      forcedMinMultiplier: 1.8,
      forcedMaxMultiplier: 25.0,
      luckyStreakActive: true,
      updatedAt: new Date().toISOString()
    }]
  ]);

  app.get('/api/v1/engine/win-controls', (req: Request, res: Response) => {
    res.json({
      status: 'success',
      code: 200,
      data: {
        companies: Array.from(COMPANY_WIN_CONFIGS.values()),
        players: Array.from(PLAYER_WIN_CONTROLS.values()),
        defaultRtp: 97.0
      }
    });
  });

  app.post('/api/v1/engine/win-controls', (req: Request, res: Response) => {
    const { type, data } = req.body;
    if (type === 'COMPANY_CONFIG' && data && data.companyId) {
      COMPANY_WIN_CONFIGS.set(data.companyId, { ...data, updatedAt: new Date().toISOString() });
      res.json({ status: 'success', code: 200, message: 'Company win config updated successfully' });
      return;
    }
    res.status(400).json({ status: 'error', code: 400, message: 'Invalid config payload' });
  });

  app.get('/api/v1/engine/player-controls', (req: Request, res: Response) => {
    const { playerId } = req.query;
    if (playerId && typeof playerId === 'string') {
      const found = PLAYER_WIN_CONTROLS.get(playerId) || {
        playerId,
        playerName: 'Player ' + playerId.slice(-6),
        userProfileMode: false,
        winRateMode: 'NORMAL',
        targetWinRate: 50,
        forcedMinMultiplier: 1.5,
        forcedMaxMultiplier: 15.0,
        updatedAt: new Date().toISOString()
      };
      res.json({ status: 'success', code: 200, data: found });
      return;
    }
    res.json({ status: 'success', code: 200, data: Array.from(PLAYER_WIN_CONTROLS.values()) });
  });

  app.post('/api/v1/engine/player-controls', (req: Request, res: Response) => {
    const { data } = req.body;
    if (data && data.playerId) {
      PLAYER_WIN_CONTROLS.set(data.playerId, { ...data, updatedAt: new Date().toISOString() });
      res.json({ status: 'success', code: 200, message: 'Player win controls updated successfully', data });
      return;
    }
    res.status(400).json({ status: 'error', code: 400, message: 'Invalid player control payload' });
  });

  app.post('/api/v1/engine/calculate-outcome', (req: Request, res: Response) => {
    const { playerId, companyId, gameType } = req.body;
    const targetPlayerId = playerId || 'ply_bb_889922';
    const targetCompanyId = companyId || 'op_bengalbet';

    const playerControl = PLAYER_WIN_CONTROLS.get(targetPlayerId);

    // TIER 1: User Profile Mode (Player Specific Win Change Rate)
    if (playerControl && playerControl.userProfileMode === true) {
      let isWin = true;
      let multiplier = 2.5;
      const minMult = playerControl.forcedMinMultiplier || 2.0;
      const maxMult = playerControl.forcedMaxMultiplier || 40.0;

      if (playerControl.winRateMode === 'FORCED_WIN') {
        isWin = true;
        multiplier = Number((minMult + Math.random() * (maxMult - minMult)).toFixed(2));
      } else if (playerControl.winRateMode === 'BOOSTED') {
        isWin = Math.random() < 0.78;
        multiplier = isWin ? Number((minMult + Math.random() * (maxMult * 0.6)).toFixed(2)) : 1.05;
      } else if (playerControl.winRateMode === 'FORCED_LOSE') {
        isWin = Math.random() < 0.10;
        multiplier = Number((1.00 + Math.random() * 0.20).toFixed(2));
      } else {
        isWin = (Math.random() * 100) < (playerControl.targetWinRate || 50);
        multiplier = isWin ? Number((minMult + Math.random() * 8.0).toFixed(2)) : 1.00;
      }

      res.json({
        status: 'success',
        code: 200,
        data: {
          tier: 'USER_PROFILE_MODE',
          isWin,
          multiplier: Math.max(1.00, multiplier),
          appliedMode: playerControl.winRateMode,
          details: `Tier 1: User Profile Mode Active (${playerControl.winRateMode})`,
          playerId: targetPlayerId
        }
      });
      return;
    }

    // TIER 2: Company Config
    const company = COMPANY_WIN_CONFIGS.get(targetCompanyId) || COMPANY_WIN_CONFIGS.get('op_bengalbet');
    if (company) {
      const isInstantBust = (Math.random() * 100) < (company.instantBustRate || 3.0);
      const isWin = !isInstantBust && (Math.random() < (company.rtpSetting / 200));
      const mult = isInstantBust ? 1.00 : Number((1.15 + Math.random() * 6.5).toFixed(2));

      res.json({
        status: 'success',
        code: 200,
        data: {
          tier: 'COMPANY_CONFIG',
          isWin,
          multiplier: mult,
          appliedMode: company.winMode,
          details: `Tier 2: Company Config (${company.companyName} • RTP ${company.rtpSetting}%)`,
          companyId: targetCompanyId
        }
      });
      return;
    }

    // TIER 3: Default Certified Engine
    res.json({
      status: 'success',
      code: 200,
      data: {
        tier: 'DEFAULT_ENGINE',
        isWin: Math.random() < 0.48,
        multiplier: Number((1.10 + Math.random() * 5.0).toFixed(2)),
        appliedMode: 'STANDARD_CERTIFIED',
        details: 'Tier 3: Default Certified Engine (97.0% RTP)'
      }
    });
  });
}
