import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { registerNeextplayBackend } from './server/neextplayBackend.js';
import { registerMysqlMasterService } from './server/mysqlMasterService.js';
import { BengalbetMysql, setBengalbetBaseUrl } from './server/bengalbetMysqlService.js';
// Configuration for separate PHP MySQL Backend Server
let phpBackendBaseUrl = process.env.PHP_DATABASE_URL || 'https://deserver.neexthub.site/backend-database';
setBengalbetBaseUrl(phpBackendBaseUrl);

async function queryPhpBackend(endpoint: string, options: RequestInit = {}) {
  const url = `${phpBackendBaseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const resp = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!resp.ok) {
    throw new Error(`PHP Server responded with HTTP ${resp.status}`);
  }
  return resp.json();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Register dedicated NeextPlay B2B Master API Gateway (/api/v1/*)
  registerNeextplayBackend(app);

  // Register MySQL Database Backend Master Controller & Manager (/api/db-master/* & /api/mysql-db/*)
  registerMysqlMasterService(app, () => phpBackendBaseUrl);

  // Comprehensive session/auth helper: get user from header, body, query or default
  const getAuthUserId = (req: Request): string => {
    const authHeader = req.headers['authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token && token !== 'null' && token !== 'undefined') {
        return token;
      }
    }
    const headerId = (req.headers['x-player-id'] || req.headers['x-user-id']) as string;
    if (headerId && typeof headerId === 'string' && headerId.trim()) {
      return headerId.trim();
    }
    const bodyUserId = req.body && (req.body.userId || req.body.playerId);
    if (bodyUserId && typeof bodyUserId === 'string' && bodyUserId.trim()) {
      return bodyUserId.trim();
    }
    const queryUserId = req.query.userId as string;
    if (queryUserId && typeof queryUserId === 'string' && queryUserId.trim()) {
      return queryUserId.trim();
    }
    return 'usr-889922'; // Primary authenticated player
  };

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ==========================================
  // PHP MYSQL DATABASE BACKEND SYSTEM ROUTES
  // ==========================================
  app.get('/api/php-db/config', (req: Request, res: Response) => {
    res.json({
      success: true,
      baseUrl: phpBackendBaseUrl,
      processUrl: `${phpBackendBaseUrl}/process.php`,
      bengalbetApiUrl: `${phpBackendBaseUrl}/bengalbet/api.php`,
      neextplayApiUrl: `${phpBackendBaseUrl}/neextplay/api.php`,
      databases: {
        bengalbet: 'bengalbet_db',
        neextplay: 'neextplay_db'
      }
    });
  });

  app.post('/api/php-db/config', (req: Request, res: Response) => {
    const { baseUrl } = req.body;
    if (baseUrl && typeof baseUrl === 'string') {
      phpBackendBaseUrl = baseUrl.trim().replace(/\/$/, '');
      setBengalbetBaseUrl(phpBackendBaseUrl);
      return res.json({ success: true, message: `PHP Backend URL updated to ${phpBackendBaseUrl}`, baseUrl: phpBackendBaseUrl });
    }
    res.status(400).json({ success: false, error: 'Invalid baseUrl parameter' });
  });

  app.get('/api/php-db/status', async (req: Request, res: Response) => {
    try {
      const candidates = [
        phpBackendBaseUrl,
        'https://deserver.neexthub.site/backend-database',
        'https://deserver.neexthub.site',
        'http://deserver.neexthub.site/backend-database',
        'http://deserver.neexthub.site',
        'http://localhost/backend-database',
        'http://localhost',
        'http://127.0.0.1/backend-database',
        'http://127.0.0.1'
      ];

      let connectedUrl: string | null = null;
      let bbStats: any = null;
      let npStats: any = null;
      let lastErr: string | null = null;

      for (const cand of candidates) {
        try {
          const bbRes = await fetch(`${cand}/bengalbet/api.php?action=ping`, { signal: AbortSignal.timeout(1500) });
          if (bbRes.ok) {
            bbStats = await bbRes.json().catch(() => null);
            connectedUrl = cand;
            phpBackendBaseUrl = cand;
            setBengalbetBaseUrl(cand);
            break;
          }
        } catch (e: any) {
          lastErr = e?.message || 'Connection failed';
        }
      }

      if (connectedUrl) {
        try {
          const npRes = await fetch(`${connectedUrl}/neextplay/api.php?action=ping`, { signal: AbortSignal.timeout(1500) });
          if (npRes.ok) {
            npStats = await npRes.json().catch(() => null);
          }
        } catch {}

        return res.json({
          success: true,
          connected: true,
          baseUrl: connectedUrl,
          bengalbet: bbStats || { status: 'connected' },
          neextplay: npStats || { status: 'connected' },
          message: `Connected to PHP MySQL backend at ${connectedUrl}`
        });
      }

      // If external PHP server is not yet online, return detailed state
      res.json({
        success: true,
        connected: false,
        baseUrl: phpBackendBaseUrl,
        processUrl: `${phpBackendBaseUrl}/process.php`,
        message: 'PHP MySQL Backend Server ready. Run process URL or host backend-database in XAMPP htdocs.',
        instructions: {
          step1: 'Copy folder "backend-database" to C:\\xampp\\htdocs\\backend-database',
          step2: 'Start Apache & MySQL in XAMPP',
          step3: `Click "Run Master Process URL" or visit ${phpBackendBaseUrl}/process.php`
        },
        lastError: lastErr
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Error checking PHP database status' });
    }
  });

  // RUN MASTER PROCESS URL (Auto-creates and migrates both databases)
  app.post('/api/php-db/process', async (req: Request, res: Response) => {
    try {
      const candidates = [
        `${phpBackendBaseUrl}/process.php?format=json`,
        'https://deserver.neexthub.site/backend-database/process.php?format=json',
        'https://deserver.neexthub.site/process.php?format=json',
        'http://localhost/backend-database/process.php?format=json',
        'http://localhost/process.php?format=json'
      ];

      let result: any = null;
      let executedUrl: string = '';
      let fetchError: string = '';

      for (const targetUrl of candidates) {
        try {
          const resp = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(6000)
          });
          if (resp.ok) {
            result = await resp.json();
            executedUrl = targetUrl;
            break;
          }
        } catch (e: any) {
          fetchError = e?.message || 'Failed';
        }
      }

      if (result) {
        return res.json({
          success: true,
          source: 'php_mysql_server',
          executedUrl,
          ...result
        });
      }

      // If remote PHP server is not currently reachable, report clear setup message
      res.json({
        success: false,
        message: `Could not contact PHP backend server at ${phpBackendBaseUrl}.`,
        targetUrl: `${phpBackendBaseUrl}/process.php`,
        error: fetchError || 'Connection timed out or host unreachable',
        guide: 'Please ensure your PHP/MySQL server at https://deserver.neexthub.site or local XAMPP is active and accessible.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Forward database operations to BengalBet PHP API
  app.post('/api/php-db/bengalbet', async (req: Request, res: Response) => {
    try {
      const result = await queryPhpBackend('/bengalbet/api.php', {
        method: 'POST',
        body: JSON.stringify(req.body)
      });
      res.json(result);
    } catch (err: any) {
      res.status(502).json({ success: false, error: err?.message || 'PHP API error' });
    }
  });

  // Forward database operations to NeextPlay PHP API
  app.post('/api/php-db/neextplay', async (req: Request, res: Response) => {
    try {
      const result = await queryPhpBackend('/neextplay/api.php', {
        method: 'POST',
        body: JSON.stringify(req.body)
      });
      res.json(result);
    } catch (err: any) {
      res.status(502).json({ success: false, error: err?.message || 'PHP API error' });
    }
  });

  // Schema downloads
  app.get('/api/php-db/schema/:system', (req: Request, res: Response) => {
    const { system } = req.params;
    const filename = system === 'neextplay' ? 'neextplay/schema.sql' : 'bengalbet/schema.sql';
    const filePath = path.resolve(process.cwd(), 'backend-database', filename);
    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${system}_schema.sql"`);
      res.sendFile(filePath);
    } else {
      res.status(404).json({ success: false, error: 'Schema file not found' });
    }
  });

  // Helper for Google OAuth redirect URI
  const getRedirectUri = (req: Request): string => {
    const originQuery = req.query.origin as string;
    if (originQuery && originQuery.startsWith('http')) {
      return `${originQuery.replace(/\/$/, '')}/auth/callback`;
    }
    if (process.env.APP_URL) {
      return `${process.env.APP_URL.replace(/\/$/, '')}/auth/callback`;
    }
    const host = req.get('host') || 'localhost:3000';
    const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    return `${proto}://${host}/auth/callback`;
  };

  // ==========================================
  // GOOGLE OAUTH 2.0 ROUTES
  // ==========================================

  // 1. Get Google OAuth URL
  app.get('/api/auth/google/url', (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
    const redirectUri = getRedirectUri(req);

    if (!clientId) {
      return res.json({
        configured: false,
        message: 'Google Client ID is not configured in environment variables.',
        redirectUri
      });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.json({
      configured: true,
      url: authUrl,
      redirectUri
    });
  });

  // 2. Google OAuth Callback (Popup target)
  app.get(['/auth/callback', '/auth/callback/'], async (req: Request, res: Response) => {
    const { code, error } = req.query;
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;
    const redirectUri = getRedirectUri(req);

    if (error) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Sign-In Error</title></head>
          <body style="font-family: sans-serif; background: #062016; color: #fff; text-align: center; padding: 40px;">
            <h3 style="color: #f87171;">Google Login Canceled or Failed</h3>
            <p>${error}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error}' }, '*');
                setTimeout(() => window.close(), 1200);
              }
            </script>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Sign-In Missing Code</title></head>
          <body style="font-family: sans-serif; background: #062016; color: #fff; text-align: center; padding: 40px;">
            <h3 style="color: #fbbf24;">কোনো অথোরাইজেশন কোড পাওয়া যায়নি</h3>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: 'No code returned' }, '*');
                setTimeout(() => window.close(), 1200);
              }
            </script>
          </body>
        </html>
      `);
    }

    try {
      if (!clientId || !clientSecret) {
        throw new Error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing on the server.');
      }

      // Exchange code for token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        console.error('Google token exchange failed:', errorText);
        throw new Error(`Google token error: ${tokenRes.status}`);
      }

      const tokenJson = await tokenRes.json();
      const accessToken = tokenJson.access_token;

      // Get Google user info
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!profileRes.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const profile = await profileRes.json();
      const email = profile.email;
      const name = profile.name || `User_${email.split('@')[0]}`;
      const avatar = profile.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';

      const googleResult = await BengalbetMysql.googleDemoLogin(email, name, avatar);
      const user = googleResult.user || googleResult;

      const safeUser = JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        balance: user.balance,
        vipLevel: user.vipLevel,
        vipExp: user.vipExp,
        vipMaxExp: user.vipMaxExp,
        freeSpins: user.freeSpins,
        redPacketsAvailable: user.redPacketsAvailable,
        goldenEggsAvailable: user.goldenEggsAvailable,
        unreadNotifications: user.unreadNotifications,
        referralCode: user.referralCode,
        avatar: user.avatar,
        isLoggedIn: true
      });

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Google Sign-In Successful</title>
            <style>
              body {
                background: #062016;
                color: #ecfdf5;
                font-family: system-ui, -apple-system, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                text-align: center;
              }
              .spinner {
                width: 44px;
                height: 44px;
                border: 4px solid rgba(250, 204, 21, 0.2);
                border-top-color: #facc15;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin-bottom: 18px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              h2 { color: #facc15; margin: 0 0 8px; font-size: 22px; }
              p { color: #a7f3d0; font-size: 14px; margin: 0; }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2>Google দিয়ে সাইন ইন সফল হয়েছে!</h2>
            <p>অনুগ্রহ করে অপেক্ষা করুন, উইন্ডোটি স্বয়ংক্রিয়ভাবে বন্ধ হবে...</p>
            <script>
              try {
                if (window.opener) {
                  window.opener.postMessage({
                    type: 'OAUTH_AUTH_SUCCESS',
                    provider: 'google',
                    token: '${user.id}',
                    user: ${safeUser}
                  }, '*');
                  setTimeout(function() { window.close(); }, 600);
                } else {
                  window.location.href = '/';
                }
              } catch (e) {
                console.error(e);
                window.location.href = '/';
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Google OAuth callback handler error:', err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Google Sign-In Error</title></head>
          <body style="font-family: sans-serif; background: #062016; color: #fff; text-align: center; padding: 40px;">
            <h3 style="color: #f87171;">Google প্রমাণীকরণ ত্রুটি</h3>
            <p style="color: #fca5a5;">${err.message || 'Error processing Google sign-in'}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${err.message}' }, '*');
                setTimeout(() => window.close(), 2500);
              }
            </script>
          </body>
        </html>
      `);
    }
  });

  // 3. Demo / Instant Google Sign-In (Connected to REAL MySQL users)
  app.post('/api/auth/google/demo', async (req: Request, res: Response) => {
    try {
      const { email, name, avatar } = req.body;
      const userEmail = email || 'workpkx1@gmail.com';
      const userName = name || userEmail.split('@')[0];
      const userAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80';
      const result = await BengalbetMysql.googleDemoLogin(userEmail, userName, userAvatar);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'Google Sign-in failed' });
    }
  });

  // ==========================================
  // AUTHENTICATION ROUTES (REAL MYSQL USERS)
  // ==========================================

  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { phone, password } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'ফোন নম্বর এবং পাসওয়ার্ড প্রদান করুন' });
      }
      const result = await BengalbetMysql.login(phone, password);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।' });
    }
  });

  // Register
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { phone, password, referralCode } = req.body;
      if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'ফোন নম্বর এবং পাসওয়ার্ড আবশ্যক' });
      }
      const result = await BengalbetMysql.register(phone, password, referralCode);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' });
    }
  });

  // Current session user
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const result = await BengalbetMysql.getMe(userId);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ success: false, message: err?.message || 'ব্যবহারকারী পাওয়া যায়নি' });
    }
  });

  // Update profile
  app.post('/api/auth/update-profile', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const result = await BengalbetMysql.updateProfile(userId, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'প্রোফাইল আপডেট ব্যর্থ' });
    }
  });

  // Change Password
  app.post('/api/auth/change-password', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { oldPassword, newPassword } = req.body;
      const result = await BengalbetMysql.changePassword(userId, oldPassword, newPassword);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ' });
    }
  });

  // Change Transaction Password (পিন)
  app.post('/api/auth/change-transaction-password', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { newTransactionPassword } = req.body;
      const result = await BengalbetMysql.changeTransactionPassword(userId, newTransactionPassword);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'ট্রানজেকশন পাসওয়ার্ড সেট ব্যর্থ' });
    }
  });

  // ==========================================
  // REFERRAL & COMMISSION API ROUTES
  // ==========================================

  // 1. Get current user's referral summary & milestones
  app.get('/api/referral/stats', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const stats = db.getReferralStats(userId);
    res.json({ success: true, ...stats });
  });

  // 2. Get list of invited friends
  app.get('/api/referral/friends', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const friends = db.getReferrals(userId);
    res.json({ success: true, friends, total: friends.length });
  });

  // 3. Get referral payout and commission records
  app.get('/api/referral/records', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const friends = db.getReferrals(userId);
    const claims = db.getReferralClaims(userId);

    // Build unified chronological record list
    const records: any[] = [];

    // Add milestone claims
    claims.forEach(c => {
      records.push({
        id: c.id,
        regDate: c.claimedAt,
        username: 'মাইলস্টোন বোনাস',
        category: `মাইলস্টোন পুরস্কার (${c.requiredCount} বন্ধু)`,
        amount: c.bonusAmount.toFixed(2),
        status: 'সফল'
      });
    });

    // Add friend instant rewards and commissions
    friends.forEach(f => {
      if (f.instantBonusPaid && f.instantBonusAmount > 0) {
        records.push({
          id: `rec-inv-${f.id}`,
          regDate: f.joinedAt,
          username: f.referredUsername,
          category: 'আমন্ত্রণ পুরস্কার',
          amount: f.instantBonusAmount.toFixed(2),
          status: 'সফল'
        });
      }
      if (f.depositCommission > 0) {
        records.push({
          id: `rec-dep-${f.id}`,
          regDate: f.joinedAt,
          username: f.referredUsername,
          category: 'জমা রিবেট কমিশন (০.৭%)',
          amount: f.depositCommission.toFixed(2),
          status: 'সফল'
        });
      }
      if (f.betCommission > 0) {
        records.push({
          id: `rec-bet-${f.id}`,
          regDate: f.joinedAt,
          username: f.referredUsername,
          category: 'বেটিং রিবেট কমিশন (১.০%)',
          amount: f.betCommission.toFixed(2),
          status: 'সফল'
        });
      }
    });

    records.sort((a, b) => new Date(b.regDate).getTime() - new Date(a.regDate).getTime());

    res.json({ success: true, records, total: records.length });
  });

  // 4. Claim a milestone tier reward
  app.post('/api/referral/claim-tier', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const { tierId } = req.body;
    if (!tierId) {
      return res.status(400).json({ success: false, message: 'টায়ার আইডি আবশ্যক' });
    }

    const result = db.claimReferralTier(userId, Number(tierId));
    res.json(result);
  });

  // 5. Bind referral code for existing user
  app.post('/api/referral/bind-code', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'রেফারেল কোড আবশ্যক' });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    const referrer = db.getUserByReferralCode(code);
    if (!referrer) {
      return res.status(400).json({ success: false, message: 'অকার্যকর রেফারেল কোড!' });
    }

    if (referrer.id === userId) {
      return res.status(400).json({ success: false, message: 'নিজের রেফারেল কোড ব্যবহার করা সম্ভব নয়!' });
    }

    // Check if already bound
    const allRefs = db.getAllReferrals();
    const alreadyBound = allRefs.some(r => r.referredUserId === userId);
    if (alreadyBound) {
      return res.status(400).json({ success: false, message: 'আপনি ইতিমধ্যে একজন আমন্ত্রকের সাথে যুক্ত আছেন!' });
    }

    const refSettings = db.getReferralSettings();
    const instantReward = refSettings.autoCreditInstantBonus ? refSettings.instantBonusPerFriend : 0;

    referrer.referredFriendsCount = (referrer.referredFriendsCount || 0) + 1;
    referrer.totalEarnings = (referrer.totalEarnings || 0) + instantReward;
    referrer.balance = Number(((referrer.balance || 0) + instantReward).toFixed(2));
    db.updateUser(referrer.id, {
      referredFriendsCount: referrer.referredFriendsCount,
      totalEarnings: referrer.totalEarnings,
      balance: referrer.balance
    });

    db.addReferral({
      referrerId: referrer.id,
      referrerUsername: referrer.username,
      referrerCode: referrer.referralCode,
      referredUserId: user.id,
      referredUsername: user.username,
      referredPhone: `${user.phone.slice(0, 3)}****${user.phone.slice(-2)}`,
      level: 1,
      instantBonusPaid: instantReward > 0,
      instantBonusAmount: instantReward,
      totalDeposit: 0,
      totalBet: 0,
      depositCommission: 0,
      betCommission: 0,
      totalCommissionEarned: instantReward,
      status: 'active'
    });

    if (instantReward > 0) {
      db.addTransaction({
        userId: referrer.id,
        type: 'bonus',
        amount: instantReward,
        channel: 'system',
        trxId: `REF${Date.now().toString().slice(-6)}`,
        status: 'success',
        description: `বন্ধু ${user.username} কোড বাইন্ড করায় রেফারেল বোনাস ৳${instantReward}`
      });
    }

    res.json({
      success: true,
      message: `অভিনন্দন! আমন্ত্রক ${referrer.username}-এর রেফারেল কোড সফলভাবে যুক্ত হয়েছে।`
    });
  });

  // ==========================================
  // ADMIN REFERRAL MANAGEMENT ROUTES
  // ==========================================

  // Admin referral stats & summary
  app.get('/api/admin/referrals/stats', (req: Request, res: Response) => {
    const referrals = db.getAllReferrals();
    const users = db.getUsers();
    const settings = db.getReferralSettings();

    const totalReferrals = referrals.length;
    const totalBonusPaid = referrals.reduce((sum, r) => sum + (r.totalCommissionEarned || 0), 0);
    const activeReferrers = new Set(referrals.map(r => r.referrerId)).size;
    const totalDepositsGenerated = referrals.reduce((sum, r) => sum + (r.totalDeposit || 0), 0);
    const totalTurnoverGenerated = referrals.reduce((sum, r) => sum + (r.totalBet || 0), 0);

    // Top 10 Referrers
    const referrerMap = new Map<string, { userId: string; username: string; phone: string; code: string; friendsCount: number; totalEarnings: number }>();
    referrals.forEach(r => {
      if (!referrerMap.has(r.referrerId)) {
        const u = users.find(usr => usr.id === r.referrerId);
        referrerMap.set(r.referrerId, {
          userId: r.referrerId,
          username: r.referrerUsername || u?.username || 'Unknown',
          phone: u?.phone || '',
          code: r.referrerCode,
          friendsCount: 0,
          totalEarnings: 0
        });
      }
      const entry = referrerMap.get(r.referrerId)!;
      entry.friendsCount += 1;
      entry.totalEarnings += (r.totalCommissionEarned || 0);
    });

    const topReferrers = Array.from(referrerMap.values())
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10);

    res.json({
      success: true,
      stats: {
        totalReferrals,
        totalBonusPaid: Number(totalBonusPaid.toFixed(2)),
        activeReferrers,
        totalDepositsGenerated: Number(totalDepositsGenerated.toFixed(2)),
        totalTurnoverGenerated: Number(totalTurnoverGenerated.toFixed(2)),
        instantBonusPerFriend: settings.instantBonusPerFriend,
        depositCommissionRate: settings.depositRebateRate ?? settings.tier1DepositCommissionRate ?? 0.70,
        betRebateRate: settings.betTurnoverRebateRate
      },
      topReferrers
    });
  });

  // Admin referral list with search & filter
  app.get('/api/admin/referrals/list', (req: Request, res: Response) => {
    const search = ((req.query.search as string) || '').toLowerCase();
    const status = (req.query.status as string) || 'all';

    let list = db.getAllReferrals();

    if (status !== 'all') {
      list = list.filter(r => r.status === status);
    }

    if (search) {
      list = list.filter(r =>
        r.referrerUsername.toLowerCase().includes(search) ||
        r.referrerCode.toLowerCase().includes(search) ||
        r.referredUsername.toLowerCase().includes(search) ||
        r.referredPhone.includes(search)
      );
    }

    res.json({ success: true, referrals: list, total: list.length });
  });

  // Admin referral settings
  app.get('/api/admin/referrals/settings', (req: Request, res: Response) => {
    const settings = db.getReferralSettings();
    res.json({ success: true, settings });
  });

  app.post('/api/admin/referrals/settings', (req: Request, res: Response) => {
    const updates = req.body;
    const updated = db.updateReferralSettings(updates);
    res.json({ success: true, message: 'রেফারেল সেটিংস সফলভাবে আপডেট হয়েছে!', settings: updated });
  });

  // Admin manual bonus payout
  app.post('/api/admin/referrals/bonus-payout', (req: Request, res: Response) => {
    const { userId, amount, note } = req.body;
    const numAmount = parseFloat(amount);
    if (!userId || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক ইউজার এবং বোনাস পরিমাণ উল্লেখ করুন' });
    }

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    user.balance = Number(((user.balance || 0) + numAmount).toFixed(2));
    user.totalEarnings = Number(((user.totalEarnings || 0) + numAmount).toFixed(2));

    const trx = db.addTransaction({
      userId,
      type: 'bonus',
      amount: numAmount,
      channel: 'system',
      trxId: `ADMREF${Date.now().toString().slice(-6)}`,
      status: 'success',
      description: `অ্যাডমিন স্পেশাল রেফারেল বোনাস: ${note || 'এজেন্ট কমিশন'}`
    });

    db.scheduleSave();

    res.json({
      success: true,
      message: `${user.username}-কে সফলভাবে ৳${numAmount} রেফারেল বোনাস প্রদান করা হয়েছে।`,
      newBalance: user.balance,
      transaction: trx
    });
  });

  // Admin update referral status (active / pending / frozen)
  app.post('/api/admin/referrals/status', (req: Request, res: Response) => {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, message: 'আইডি এবং নতুন স্ট্যাটাস আবশ্যক' });
    }

    const updated = db.updateReferral(id, { status });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'রেফারেল রেকর্ড খুঁজে পাওয়া যায়নি' });
    }

    res.json({
      success: true,
      message: `রেফারেল স্ট্যাটাস সফলভাবে "${status === 'active' ? 'সক্রিয়' : status === 'frozen' ? 'স্থগিত' : 'অপেক্ষমান'}" করা হয়েছে।`,
      referral: updated
    });
  });

  // Admin get all claims audit ledger
  app.get('/api/admin/referrals/claims', (req: Request, res: Response) => {
    const claims = db.getAllReferralClaims();
    const users = db.getUsers();
    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedClaims = claims.map(c => {
      const u = userMap.get(c.userId);
      return {
        ...c,
        username: u?.username || 'Unknown',
        phone: u?.phone || '',
        referralCode: u?.referralCode || ''
      };
    });

    res.json({
      success: true,
      claims: enrichedClaims,
      total: enrichedClaims.length
    });
  });

  // =========================================================================
  // VIP CLUB API ROUTES
  // =========================================================================

  // 1. Get all VIP tiers
  app.get('/api/vip/tiers', (req: Request, res: Response) => {
    try {
      const tiers = db.getVipTiers();
      res.json({ success: true, count: tiers.length, tiers });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'ত্রুটি ঘটেছে' });
    }
  });

  // 2. Add or update VIP tier (Admin)
  app.post('/api/vip/tiers', (req: Request, res: Response) => {
    try {
      const result = db.saveVipTier(req.body);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'লেভেল সংরক্ষণ করতে ব্যর্থ' });
    }
  });

  // 3. Update specific VIP tier by level (Admin)
  app.put('/api/vip/tiers/:level', (req: Request, res: Response) => {
    try {
      const level = parseInt(req.params.level, 10);
      const result = db.saveVipTier({ ...req.body, level });
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'লেভেল আপডেট করতে ব্যর্থ' });
    }
  });

  // 4. Delete VIP tier by level (Admin)
  app.delete('/api/vip/tiers/:level', (req: Request, res: Response) => {
    try {
      const level = parseInt(req.params.level, 10);
      const result = db.deleteVipTier(level);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'লেভেল মুছতে ব্যর্থ' });
    }
  });

  // 5. Reset VIP tiers to default BengalBet standard (Admin)
  app.post('/api/vip/tiers/reset', (req: Request, res: Response) => {
    try {
      const result = db.resetVipTiers();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'রিসেট ব্যর্থ' });
    }
  });

  // 6. Get VIP Reward History for logged in user
  app.get('/api/vip/history', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const history = db.getVipRewardClaims(userId);
      res.json({ success: true, count: history.length, history });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'ইতিহাস লোড করতে ব্যর্থ' });
    }
  });

  // 7. Claim VIP Reward (upgrade, weekly, monthly)
  app.post('/api/vip/claim', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { type, level } = req.body;
      if (!type || !['upgrade', 'weekly', 'monthly', 'birthday'].includes(type)) {
        return res.status(400).json({ success: false, message: 'সঠিক বোনাস টাইপ উল্লেখ করুন' });
      }

      const result = db.claimVipReward(userId, type, level);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'বোনাস ক্লেইম ব্যর্থ' });
    }
  });

  // 8. Admin VIP Overview Stats
  app.get('/api/admin/vip/stats', (req: Request, res: Response) => {
    try {
      const stats = db.getVipStats();
      res.json({ success: true, stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'পরিসংখ্যান লোড ব্যর্থ' });
    }
  });

  // 9. Admin VIP Claims Ledger
  app.get('/api/admin/vip/claims', (req: Request, res: Response) => {
    try {
      const claims = db.getVipRewardClaims();
      res.json({ success: true, count: claims.length, claims });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'ক্লেইম তালিকা লোড ব্যর্থ' });
    }
  });

  // 10. Admin Override User VIP Level & Grant VIP Bonus
  app.post('/api/admin/vip/override-user', (req: Request, res: Response) => {
    try {
      const { userId, vipLevel, vipExp, bonusAmount, note } = req.body;
      if (!userId || vipLevel === undefined) {
        return res.status(400).json({ success: false, message: 'ইউজার আইডি এবং নতুন VIP লেভেল আবশ্যক' });
      }

      const result = db.adminUpdateUserVip(userId, vipLevel, vipExp, bonusAmount, note);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'আপডেট করতে ব্যর্থ' });
    }
  });


  // ==========================================
  // WALLET, DEPOSIT & WITHDRAWAL ROUTES (REAL MYSQL)
  // ==========================================

  // Get balance
  app.get('/api/wallet/balance', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const userRes = await BengalbetMysql.getMe(userId);
      if (userRes.success && userRes.user) {
        res.json({
          success: true,
          balance: userRes.user.balance,
          vipLevel: userRes.user.vipLevel,
          vipExp: userRes.user.vipExp
        });
      } else {
        res.status(404).json({ success: false, balance: 0 });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Deposit
  app.post('/api/wallet/deposit', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { amount, method, gateway, senderAccount, trxId: customTrxId } = req.body;
      const parsedAmount = Number(amount);

      if (!parsedAmount || parsedAmount < 100) {
        return res.status(400).json({ success: false, message: 'সর্বনিম্ন ডিপোজিট পরিমাণ ৳১০০' });
      }

      const result = await BengalbetMysql.deposit(userId, {
        amount: parsedAmount,
        method: method || 'bkash',
        gateway,
        senderAccount,
        trxId: customTrxId
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'ডিপোজিট ব্যর্থ হয়েছে' });
    }
  });

  // Withdraw
  app.post('/api/wallet/withdraw', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { amount, walletType, accountNumber } = req.body;
      const parsedAmount = Number(amount);

      if (!parsedAmount || parsedAmount < 500) {
        return res.status(400).json({ success: false, message: 'সর্বনিম্ন উত্তোলন পরিমাণ ৳৫০০' });
      }

      const result = await BengalbetMysql.withdraw(userId, {
        amount: parsedAmount,
        walletType: walletType || 'bkash',
        accountNumber
      });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'উত্তোলন ব্যর্থ হয়েছে' });
    }
  });

  // Get Transaction History
  app.get('/api/wallet/transactions', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const type = req.query.type as string;
      const result = await BengalbetMysql.getTransactions(userId, type);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Bound Wallets
  app.get('/api/wallet/cards', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const result = await BengalbetMysql.getWallets(userId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/wallet/cards', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { type, accountName, accountNumber } = req.body;

      if (!type || !accountNumber) {
        return res.status(400).json({ success: false, message: 'ওয়ালেট ধরন এবং অ্যাকাউন্ট নম্বর প্রদান করুন' });
      }

      const result = await BengalbetMysql.saveWallet(userId, type, accountName, accountNumber);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  app.delete('/api/wallet/cards/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await BengalbetMysql.deleteWallet(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  // ==========================================
  // GAMES & BETS ROUTES (REAL MYSQL)
  // ==========================================

  // Place a bet and record result
  app.post('/api/games/bet', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const result = await BengalbetMysql.recordBet(userId, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'বেট রেকর্ড ব্যর্থ হয়েছে' });
    }
  });

  // Bet records query
  app.get('/api/games/records', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const category = req.query.category as string;
      const date = req.query.date as string;
      const result = await BengalbetMysql.getBets(userId, category, date);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Real server jackpot & live winners feed for Casino Lobby (MySQL bets)
  app.get('/api/games/lobby-feed', async (req: Request, res: Response) => {
    try {
      const feed = await BengalbetMysql.getLobbyFeed();
      res.json(feed);
    } catch (err: any) {
      console.error('Error in /api/games/lobby-feed:', err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Real games suite served from MySQL database
  app.get('/api/games', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const provider = req.query.provider as string;
      const search = req.query.search as string;
      const result = await BengalbetMysql.getGames(category, provider, search);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Real banners served from MySQL database
  app.get('/api/banners', async (req: Request, res: Response) => {
    try {
      const category = (req.query.category as string) || 'home';
      const result = await BengalbetMysql.getBanners(category);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Real promotions served from MySQL database
  app.get('/api/promotions', async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const result = await BengalbetMysql.getPromotions(category);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Profit and Loss query
  app.get('/api/games/profit-loss', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const result = await BengalbetMysql.getProfitLoss(userId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // ==========================================
  // REWARDS & PROMOTIONS ROUTES (REAL MYSQL)
  // ==========================================

  // Claim spin / egg / red envelope / mission / promo
  app.post('/api/rewards/claim', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { type, amount, title } = req.body;
      const parsedAmount = Number(amount) || 0;
      const result = await BengalbetMysql.claimReward(userId, type, parsedAmount, title);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message || 'পুরস্কার ক্লেইম ব্যর্থ' });
    }
  });

  // ==========================================
  // INTERNAL MESSAGES & MAIL ROUTES (REAL MYSQL)
  // ==========================================

  app.get('/api/messages', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const result = await BengalbetMysql.getMessages(userId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/messages/:id/read', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await BengalbetMysql.markMessageRead(id);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.delete('/api/messages/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await BengalbetMysql.executeSql(`DELETE FROM \`messages\` WHERE \`id\` = '${id.replace(/'/g, "\\'")}'`);
      res.json({ success: true, message: 'বার্তা মুছে ফেলা হয়েছে' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/messages/:id/claim', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { id } = req.params;
      const result = await BengalbetMysql.claimMessageBonus(id, userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  // ==========================================
  // FEEDBACK & SUPPORT TICKETS (REAL MYSQL)
  // ==========================================

  app.post('/api/feedback', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { type, subject, content, priority } = req.body;

      if (!type || !content) {
        return res.status(400).json({ success: false, message: 'অনুসন্ধানের ধরন এবং বিবরণ প্রদান করুন' });
      }

      const result = await BengalbetMysql.createTicket(userId, type, subject || 'সহায়তা টিকিট', content, priority);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  app.get('/api/feedback', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const result = await BengalbetMysql.getTickets(userId);
      const tickets = result.tickets || [];
      const pendingCount = tickets.filter((t: any) => t.status === 'open' || t.status === 'pending').length;
      const repliedCount = tickets.filter((t: any) => t.status === 'resolved' || t.status === 'replied').length;
      res.json({ success: true, feedbacks: tickets, pendingCount, repliedCount });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.get('/api/feedback/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resql = await BengalbetMysql.executeSql(`SELECT * FROM \`support_tickets\` WHERE \`id\` = '${id.replace(/'/g, "\\'")}' LIMIT 1`);
      if (resql.success && resql.rows.length > 0) {
        res.json({ success: true, feedback: resql.rows[0] });
      } else {
        res.status(404).json({ success: false, message: 'টিকিট পাওয়া যায়নি' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/feedback/:id/message', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { text, senderName } = req.body;
      const now = new Date().toISOString();
      await BengalbetMysql.executeSql(`UPDATE \`support_tickets\` SET \`description\` = CONCAT(\`description\`, '\n[${senderName || 'User'}]: ${String(text).replace(/'/g, "\\'")}'), \`updated_at\` = '${now}' WHERE \`id\` = '${id.replace(/'/g, "\\'")}'`);
      res.json({ success: true, message: 'বার্তা সফলভাবে সংযুক্ত হয়েছে' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.patch('/api/feedback/:id/resolve', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await BengalbetMysql.updateTicketStatus(id, 'resolved', 'User marked resolved');
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // ==========================================
  // 24/7 VIP LIVE CHAT CLIENT ROUTES (REAL MYSQL)
  // ==========================================

  app.get('/api/chat/session', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const result = await BengalbetMysql.getChatSessions(userId, 'active');
      let session = result.sessions?.[0];
      let messages: any[] = [];
      if (!session) {
        const uRes = await BengalbetMysql.getMe(userId);
        const name = uRes.user?.username || 'Player';
        await BengalbetMysql.sendChatMessage('', userId, 'user', name, 'হ্যালো, আমার সহায়তা প্রয়োজন।');
        const refRes = await BengalbetMysql.getChatSessions(userId);
        session = refRes.sessions?.[0];
      }
      if (session) {
        const msgRes = await BengalbetMysql.getChatMessages(session.id);
        messages = msgRes.messages || [];
      }
      res.json({ success: true, session, messages });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.get('/api/chat/messages/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const msgRes = await BengalbetMysql.getChatMessages(sessionId);
      res.json({ success: true, messages: msgRes.messages || [] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.post('/api/chat/send', async (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { sessionId, text, senderName } = req.body;
      const result = await BengalbetMysql.sendChatMessage(sessionId || '', userId, 'user', senderName || 'Player', text || '');
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  app.post('/api/chat/rate', async (req: Request, res: Response) => {
    try {
      const { sessionId, rating, comment } = req.body;
      const result = await BengalbetMysql.closeChatSession(sessionId, Number(rating) || 5, comment);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  app.post('/api/chat/close', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.body;
      const result = await BengalbetMysql.closeChatSession(sessionId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  // ==========================================
  // NEEXT HUB ADMIN ROUTES (REAL MYSQL DATABASE)
  // ==========================================

  // 1. Dashboard Overview Stats (REAL MYSQL)
  app.get('/api/admin/stats', async (req: Request, res: Response) => {
    try {
      const result = await BengalbetMysql.getAdminStats();
      if (result.success && result.stats) {
        return res.json({
          success: true,
          stats: {
            totalUsers: result.stats.totalUsers,
            totalUserBalance: result.stats.totalBalance,
            totalDepositAmount: result.stats.totalDeposits,
            totalWithdrawAmount: result.stats.totalWithdrawals,
            netGGR: result.stats.netRevenue,
            pendingDepositsCount: result.stats.pendingDeposits,
            pendingWithdrawalsCount: result.stats.pendingWithdrawals,
            totalTransactionsCount: result.stats.totalDeposits + result.stats.totalWithdrawals,
            totalFeedbacksCount: 0,
            pendingFeedbacksCount: 0,
            serverTime: result.stats.timestamp || new Date().toISOString()
          }
        });
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // 2. User Management (REAL MYSQL)
  app.get('/api/admin/users', async (req: Request, res: Response) => {
    try {
      const result = await BengalbetMysql.getUsers();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Create New User by Admin (REAL MYSQL)
  app.post('/api/admin/users', async (req: Request, res: Response) => {
    try {
      const { username, phone, password, balance, vipLevel, realName, email } = req.body;
      if (!username || !phone) {
        return res.status(400).json({ success: false, message: 'ইউজারনেম এবং ফোন নম্বর আবশ্যক' });
      }

      const regRes = await BengalbetMysql.register(phone.trim(), password || '123456');
      if (regRes.user?.id) {
        if (balance) {
          await BengalbetMysql.updateUserBalance(regRes.user.id, Number(balance), 'set', 'Initial Balance');
        }
        if (vipLevel) {
          await BengalbetMysql.updateUserVip(regRes.user.id, Number(vipLevel));
        }
        if (realName || email) {
          await BengalbetMysql.updateProfile(regRes.user.id, { realName, email });
        }
        const updated = await BengalbetMysql.getMe(regRes.user.id);
        return res.json({ success: true, user: updated.user, message: 'নতুন ইউজার সফলভাবে তৈরি করা হয়েছে!' });
      }
      res.json(regRes);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  // Update User Balance (REAL MYSQL)
  app.post('/api/admin/users/:id/balance', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { amount, type, note } = req.body;
      const result = await BengalbetMysql.updateUserBalance(id, Number(amount) || 0, type || 'add', note);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  // Update User VIP (REAL MYSQL)
  app.post('/api/admin/users/:id/vip', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { vipLevel, vipExp } = req.body;
      const result = await BengalbetMysql.updateUserVip(id, Number(vipLevel) || 1, vipExp ? Number(vipExp) : undefined);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  // Update User Status (REAL MYSQL)
  app.post('/api/admin/users/:id/status', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await BengalbetMysql.updateUserStatus(id, status || 'active');
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  // Delete User (REAL MYSQL)
  app.delete('/api/admin/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await BengalbetMysql.deleteUser(id);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err?.message });
    }
  });

  // 3. Transactions Management
  app.get('/api/admin/transactions', (req: Request, res: Response) => {
    const { type, status, channel, search } = req.query;
    let list = db.getAllTransactions();
    if (type && type !== 'all') {
      list = list.filter(t => t.type === type);
    }
    if (status && status !== 'all') {
      list = list.filter(t => t.status === status);
    }
    if (channel && channel !== 'all') {
      list = list.filter(t => t.channel === channel);
    }
    if (search) {
      const q = String(search).toLowerCase().trim();
      list = list.filter(t => 
        t.trxId.toLowerCase().includes(q) ||
        t.userId.toLowerCase().includes(q) ||
        (t.accountNumber && t.accountNumber.toLowerCase().includes(q)) ||
        (t.username && t.username.toLowerCase().includes(q)) ||
        (t.userPhone && t.userPhone.includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    res.json({ success: true, count: list.length, transactions: list });
  });

  // Create Manual Transaction (Deposit, Withdraw, Bonus, Adjustment)
  app.post('/api/admin/transactions/create', (req: Request, res: Response) => {
    const {
      userId,
      type, // 'deposit' | 'withdraw' | 'bonus' | 'rebate' | 'adjustment'
      amount,
      bonus,
      fee,
      channel, // 'bkash' | 'nagad' | 'rocket' | 'usdt' | 'bank' | 'system'
      gateway,
      accountNumber,
      trxId,
      status, // 'success' | 'pending' | 'processing' | 'rejected'
      description,
      adminNote,
      adjustBalance,
      notifyUser
    } = req.body;

    const user = db.getUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক টাকার পরিমাণ দিন' });
    }

    const parsedBonus = Number(bonus) || 0;
    const parsedFee = Number(fee) || 0;
    const generatedTrxId = trxId?.trim() || `${(channel || 'TRX').toUpperCase()}${Date.now().toString().slice(-7)}`;
    const txStatus = status || 'success';

    const newTx = db.addTransaction({
      userId,
      username: user.username,
      userPhone: user.phone,
      type: type || 'deposit',
      amount: parsedAmount,
      bonus: parsedBonus,
      fee: parsedFee,
      channel: channel || 'system',
      gateway: gateway || 'Manual Admin System',
      accountNumber: accountNumber || user.phone,
      trxId: generatedTrxId,
      status: txStatus,
      description: description || `এডমিন ম্যানুয়াল ${type === 'deposit' ? 'ডিপোজিট' : type === 'withdraw' ? 'উত্তোলন' : 'সমন্বয়'}`,
      adminNote: adminNote || 'ম্যানুয়ালি তৈরি করা লেনদেন'
    });

    // If balance adjustment requested or status is success
    if (adjustBalance) {
      let balanceDelta = 0;
      if (type === 'deposit' || type === 'bonus' || type === 'rebate') {
        balanceDelta = parsedAmount + parsedBonus;
      } else if (type === 'withdraw') {
        balanceDelta = -(parsedAmount + parsedFee);
      } else if (type === 'adjustment') {
        balanceDelta = parsedAmount; // Can be positive or negative
      }

      const finalBal = Math.max(0, Number((user.balance + balanceDelta).toFixed(2)));
      db.updateUser(userId, { balance: finalBal });
    }

    if (notifyUser) {
      db.addMessageToUser(
        userId,
        `লেনদেন নোটিশ: ${type === 'deposit' ? 'ডিপোজিট' : type === 'withdraw' ? 'উত্তোলন' : 'ব্যালেন্স আপডেট'}`,
        `আপনার একাউন্টে ৳${parsedAmount} লেনদেন সম্পন্ন হয়েছে (TrxID: ${generatedTrxId})। বর্তমান ব্যালেন্স চেক করুন।`,
        'Neext Hub Admin Finance'
      );
    }

    res.json({
      success: true,
      transaction: newTx,
      message: `লেনদেন সফলভাবে সম্পন্ন ও রেকর্ড করা হয়েছে (ID: ${newTx.id})`
    });
  });

  // Advanced Process / Update Transaction Status
  app.post('/api/admin/transactions/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      status, // 'success' | 'rejected' | 'processing' | 'flagged' | 'pending'
      adminNote,
      rejectionReason,
      bonusAdjust,
      feeAdjust,
      notifyUser
    } = req.body;

    const validStatuses = ['success', 'rejected', 'pending', 'processing', 'flagged'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const tx = db.getTransactionById(id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const oldStatus = tx.status;
    const user = db.getUserById(tx.userId);

    // If changing from non-success to success on a deposit -> credit user balance!
    if (tx.type === 'deposit' && oldStatus !== 'success' && status === 'success') {
      if (user) {
        const bonusToAdd = bonusAdjust !== undefined ? Number(bonusAdjust) : (tx.bonus || 0);
        const totalAdd = tx.amount + bonusToAdd;
        const newBal = Number((user.balance + totalAdd).toFixed(2));
        const newVipExp = (user.vipExp || 0) + tx.amount;
        const newVipLevel = Math.min(10, Math.floor(newVipExp / 3000) + 1);

        db.updateUser(tx.userId, {
          balance: newBal,
          vipExp: newVipExp,
          vipLevel: newVipLevel
        });

        if (bonusAdjust !== undefined) {
          db.updateTransaction(id, { bonus: Number(bonusAdjust) });
        }

        // Process referral commission for referrer on deposit confirmation
        db.processReferralCommission(tx.userId, 'deposit', tx.amount);
      }
    }

    // If rejecting a withdrawal that was pending or processing -> refund amount back to user!
    if (tx.type === 'withdraw' && (oldStatus === 'pending' || oldStatus === 'processing' || oldStatus === 'flagged') && status === 'rejected') {
      if (user) {
        const refundAmount = tx.amount + (tx.fee || 0);
        db.updateUser(tx.userId, {
          balance: Number((user.balance + refundAmount).toFixed(2))
        });
      }
    }

    const updatedTx = db.updateTransactionStatus(id, status, {
      adminNote: adminNote || tx.adminNote,
      rejectionReason: rejectionReason || (status === 'rejected' ? 'এডমিন কর্তৃক বাতিলকৃত' : undefined),
      processedBy: 'Super Admin'
    });

    // Notify user if requested or on major status change
    if (notifyUser || status === 'rejected' || status === 'success') {
      if (status === 'success') {
        db.addMessageToUser(
          tx.userId,
          `✅ আপনার ${tx.type === 'deposit' ? 'ডিপোজিট' : 'উত্তোলন'} অনুমোদিত হয়েছে!`,
          `প্রিয় গ্রাহক, আপনার ৳${tx.amount} এর ${tx.type === 'deposit' ? 'ডিপোজিট' : 'উত্তোলন'} সফলভাবে প্রসেস করা হয়েছে। TrxID: ${tx.trxId}। ধন্যবাদ আমাদের সাথে থাকার জন্য!`,
          'Finance Department'
        );
      } else if (status === 'rejected') {
        db.addMessageToUser(
          tx.userId,
          `❌ লেনদেন বাতিল নোটিশ (#${tx.trxId})`,
          `আপনার ৳${tx.amount} এর লেনদেনটি বাতিল করা হয়েছে। কারণ: ${rejectionReason || 'তথ্য সঠিক ছিল না'}। ${tx.type === 'withdraw' ? 'আপনার ব্যালেন্স একাউন্টে রিফান্ড করা হয়েছে।' : 'অনুগ্রহ করে সঠিক TrxID দিয়ে পুনরায় চেষ্টা করুন।'}`,
          'Finance Department'
        );
      } else if (status === 'processing') {
        db.addMessageToUser(
          tx.userId,
          `⏳ লেনদেন পর্যালোচনা চলছে (#${tx.trxId})`,
          `আপনার ৳${tx.amount} এর লেনদেনটি আমাদের ফিন্যান্স টিম বর্তমানে যাচাই করছে। কিছুক্ষণের মধ্যে আপডেট পাবেন।`,
          'Finance Department'
        );
      }
    }

    res.json({
      success: true,
      transaction: updatedTx,
      message: `ট্রানজেকশন #${id} সফলভাবে '${status}' স্ট্যাটাসে আপডেট করা হয়েছে!`
    });
  });

  // Batch Process Multiple Transactions
  app.post('/api/admin/transactions/batch', (req: Request, res: Response) => {
    const { ids, status, rejectionReason, adminNote, notifyUsers } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'কমপক্ষে একটি ট্রানজেকশন নির্বাচন করুন' });
    }

    let updatedCount = 0;
    for (const id of ids) {
      const tx = db.getTransactionById(id);
      if (!tx) continue;

      const oldStatus = tx.status;
      const user = db.getUserById(tx.userId);

      // Auto balance sync
      if (tx.type === 'deposit' && oldStatus !== 'success' && status === 'success') {
        if (user) {
          const totalAdd = tx.amount + (tx.bonus || 0);
          db.updateUser(tx.userId, { balance: Number((user.balance + totalAdd).toFixed(2)) });
        }
      } else if (tx.type === 'withdraw' && (oldStatus === 'pending' || oldStatus === 'processing') && status === 'rejected') {
        if (user) {
          db.updateUser(tx.userId, { balance: Number((user.balance + tx.amount).toFixed(2)) });
        }
      }

      db.updateTransactionStatus(id, status, {
        adminNote: adminNote || `ব্যাচ প্রসেসিং (${status})`,
        rejectionReason: status === 'rejected' ? (rejectionReason || 'ব্যাচ রিজেকশন') : undefined,
        processedBy: 'Super Admin'
      });

      if (notifyUsers) {
        db.addMessageToUser(
          tx.userId,
          status === 'success' ? 'লেনদেন সফল' : 'লেনদেন স্ট্যাটাস আপডেট',
          `আপনার #${tx.trxId} লেনদেনের স্ট্যাটাস '${status}' হিসেবে আপডেট করা হয়েছে।`,
          'Finance Department'
        );
      }
      updatedCount++;
    }

    res.json({
      success: true,
      updatedCount,
      message: `${updatedCount}টি লেনদেন সফলভাবে ব্যাচ প্রসেস করা হয়েছে!`
    });
  });

  // Edit Transaction Details
  app.post('/api/admin/transactions/:id/edit', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const tx = db.getTransactionById(id);
    if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const safeUpdates: Partial<typeof tx> = {};
    if (updates.trxId) safeUpdates.trxId = updates.trxId.trim();
    if (updates.amount !== undefined) safeUpdates.amount = Number(updates.amount);
    if (updates.bonus !== undefined) safeUpdates.bonus = Number(updates.bonus);
    if (updates.fee !== undefined) safeUpdates.fee = Number(updates.fee);
    if (updates.channel) safeUpdates.channel = updates.channel;
    if (updates.gateway) safeUpdates.gateway = updates.gateway;
    if (updates.accountNumber) safeUpdates.accountNumber = updates.accountNumber.trim();
    if (updates.description) safeUpdates.description = updates.description.trim();
    if (updates.adminNote !== undefined) safeUpdates.adminNote = updates.adminNote.trim();
    if (updates.rejectionReason !== undefined) safeUpdates.rejectionReason = updates.rejectionReason.trim();

    const updated = db.updateTransaction(id, safeUpdates);
    res.json({ success: true, transaction: updated, message: 'লেনদেনের বিবরণ সফলভাবে আপডেট হয়েছে' });
  });

  // Delete Transaction
  app.delete('/api/admin/transactions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const ok = db.deleteTransaction(id);
    res.json({
      success: ok,
      message: ok ? 'ট্রানজেকশন সফলভাবে মুছে ফেলা হয়েছে' : 'ট্রানজেকশন পাওয়া যায়নি'
    });
  });

  // 4. Site Settings & Game Engine (Gateways, Notice, RTP 0-100%, Maintenance)
  app.get('/api/settings', (req: Request, res: Response) => {
    const settings = db.getSettings();
    res.json({
      success: true,
      settings: {
        bkashNumber: settings.bkashNumber || '01874928172',
        nagadNumber: settings.nagadNumber || '01798321045',
        rocketNumber: settings.rocketNumber || '01984210982',
        usdtAddress: settings.usdtAddress || 'TYh8q7JzLqD8yU6EwPzL4tV1xQ2mK9pX8Z',
        siteNotice: settings.siteNotice,
        maintenanceMode: settings.maintenanceMode,
        minDeposit: settings.minDeposit,
        maxDeposit: settings.maxDeposit,
        minWithdraw: settings.minWithdraw,
        maxWithdraw: settings.maxWithdraw,
        gameEngine: settings.gameEngine
      }
    });
  });

  // Public Game Engine Config for active gameplay
  app.get('/api/game-engine/config', (req: Request, res: Response) => {
    const settings = db.getSettings();
    res.json({
      success: true,
      gameEngine: settings.gameEngine,
      gameRtp: settings.gameRtp
    });
  });

  app.get('/api/admin/settings', (req: Request, res: Response) => {
    const settings = db.getSettings();
    res.json({ success: true, settings });
  });

  app.post('/api/admin/settings', (req: Request, res: Response) => {
    const updates = req.body;
    const settings = db.updateSettings(updates);
    res.json({ success: true, settings, message: 'সাইট সেটিংস সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!' });
  });

  // Dedicated Game Engine Admin Endpoints
  app.get('/api/admin/game-engine', (req: Request, res: Response) => {
    const settings = db.getSettings();
    res.json({
      success: true,
      gameEngine: settings.gameEngine,
      gameRtp: settings.gameRtp
    });
  });

  app.post('/api/admin/game-engine', (req: Request, res: Response) => {
    const engineUpdates = req.body;
    const settings = db.updateSettings({
      gameEngine: engineUpdates,
      gameRtp: engineUpdates.gameRtp || {}
    });
    res.json({
      success: true,
      gameEngine: settings.gameEngine,
      gameRtp: settings.gameRtp,
      message: 'গেম ইঞ্জিন ও RTP সেটিংস সফলভাবে আপডেট ও সক্রিয় হয়েছে!'
    });
  });

  app.post('/api/admin/game-engine/reset-telemetry', (req: Request, res: Response) => {
    db.resetTelemetry();
    const settings = db.getSettings();
    res.json({
      success: true,
      telemetry: settings.gameEngine?.telemetry,
      message: 'রিয়েল-টাইম RTP টেলিমেট্রি সফলভাবে রিসেট করা হয়েছে!'
    });
  });

  // 5. Support Tickets & Feedbacks (সাপোর্ট টিকিট)
  app.get('/api/admin/feedbacks', (req: Request, res: Response) => {
    const feedbacks = db.getAllFeedbacks();
    const stats = {
      total: feedbacks.length,
      pending: feedbacks.filter(f => f.status === 'pending').length,
      in_progress: feedbacks.filter(f => f.status === 'in_progress').length,
      replied: feedbacks.filter(f => f.status === 'replied').length,
      resolved: feedbacks.filter(f => f.status === 'resolved').length,
      closed: feedbacks.filter(f => f.status === 'closed').length
    };
    res.json({ success: true, feedbacks, stats });
  });

  app.post('/api/admin/feedbacks/:id/reply', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reply, senderName, status } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ success: false, message: 'এডমিন উত্তর টেক্সট প্রদান করুন' });
    }

    const nextStatus = status || 'replied';
    const fb = db.updateFeedbackStatus(id, nextStatus, reply.trim());
    if (!fb) {
      return res.status(404).json({ success: false, message: 'টিকিট পাওয়া যায়নি' });
    }

    if (fb.userId) {
      db.addMessageToUser(
        fb.userId,
        `💬 সাপোর্ট টিকিট #${fb.ticketNumber || fb.id}: উত্তর পাঠানো হয়েছে`,
        `প্রিয় গ্রাহক, আপনার টিকিট "${fb.subject || fb.type}" এর সমাধান/উত্তর: ${reply.trim()}`,
        'Customer Support'
      );
    }

    res.json({ success: true, feedback: fb, message: 'উত্তর সফলভাবে পাঠানো হয়েছে এবং প্লেয়ারকে অবহিত করা হয়েছে' });
  });

  app.patch('/api/admin/feedbacks/:id/status', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'স্ট্যাটাস নির্বাচন করুন' });
    }

    const fb = db.updateFeedbackStatus(id, status);
    if (!fb) {
      return res.status(404).json({ success: false, message: 'টিকিট পাওয়া যায়নি' });
    }

    res.json({ success: true, feedback: fb, message: `টিকিট স্ট্যাটাস "${status}" এ পরিবর্তন করা হয়েছে` });
  });

  app.delete('/api/admin/feedbacks/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = db.deleteFeedback(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'টিকিট পাওয়া যায়নি' });
    }
    res.json({ success: true, message: 'টিকিট সফলভাবে মুছে ফেলা হয়েছে' });
  });

  // 6. Admin Internal Messages (অভ্যন্তরীণ বার্তা)
  app.get('/api/admin/messages', (req: Request, res: Response) => {
    const messages = db.getAllMessages();
    res.json({ success: true, messages });
  });

  app.post('/api/admin/messages/create', (req: Request, res: Response) => {
    const { userId, title, sender, category, claimableBonus, description, steps, rules, headline } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'বার্তার শিরোনাম আবশ্যক' });
    }

    const newMsg = db.createMessage({
      userId: userId || 'all',
      sender: sender || 'প্ল্যাটফর্ম',
      title: title.trim(),
      category: category || 'notice',
      claimableBonus: Number(claimableBonus) || 0,
      content: {
        headline: headline || title.trim(),
        description: description || '',
        howToGetTitle: 'নির্দেশনা:',
        howToGetSteps: steps && Array.isArray(steps) && steps.length > 0 ? steps : ['নোটিশটি পড়ুন এবং সংশ্লিষ্ট সুবিধা গ্রহণ করুন।'],
        rulesTitle: 'নিয়মাবলী ও শর্তাবলী:',
        rules: rules && Array.isArray(rules) && rules.length > 0 ? rules : ['১  BengalBet গেমিং শর্তাবলী প্রযোজ্য।'],
        officialLinksTitle: 'অফিসিয়াল লিংক:',
        officialLinks: ['BengalBet.vip', 'BengalBet.me']
      }
    });

    res.json({ success: true, message: 'অভ্যন্তরীণ বার্তা সফলভাবে প্রেরণ করা হয়েছে', messageRecord: newMsg });
  });

  app.delete('/api/admin/messages/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const ok = db.deleteMessage(id);
    res.json({ success: ok, message: ok ? 'বার্তা সফলভাবে মুছে ফেলা হয়েছে' : 'বার্তা খুঁজে পাওয়া যায়নি' });
  });

  // ==========================================
  // 7. 24/7 VIP LIVE CHAT OPERATOR CONSOLE ROUTES
  // ==========================================

  // List all live chat sessions + stats
  app.get('/api/admin/chat/sessions', (req: Request, res: Response) => {
    const sessions = db.getAllChatSessions();
    const stats = db.getChatStats();
    res.json({
      success: true,
      sessions,
      stats
    });
  });

  // Get specific session & full message thread (marks read for admin)
  app.get('/api/admin/chat/sessions/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = db.getChatSession(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'সেশন পাওয়া যায়নি' });

    db.markSessionMessagesRead(sessionId, 'admin');
    const messages = db.getChatMessages(sessionId);
    const userRec = db.getUserById(session.userId);

    res.json({
      success: true,
      session,
      messages,
      userDetails: userRec || null
    });
  });

  // Admin replies to player in live chat
  app.post('/api/admin/chat/sessions/:sessionId/reply', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { text, senderName, attachmentUrl, quickAction } = req.body;

    if ((!text || !text.trim()) && !attachmentUrl) {
      return res.status(400).json({ success: false, message: 'উত্তর প্রদান করুন' });
    }

    const session = db.getChatSession(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'সেশন নেই' });

    const agentName = senderName || session.assignedAgent?.name || 'BengalBet সাপোর্ট টিম';
    const agentAvatar = session.assignedAgent?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80';

    const { message: newMsg, session: updatedSession } = db.sendChatMessage({
      sessionId,
      sender: 'agent',
      senderName: agentName,
      senderAvatar: agentAvatar,
      text: (text || '').trim(),
      attachmentUrl,
      quickAction
    });

    res.json({
      success: true,
      message: 'উত্তর সফলভাবে পাঠানো হয়েছে',
      chatMessage: newMsg,
      session: updatedSession
    });
  });

  // Update session status (active / waiting / resolved / closed)
  app.patch('/api/admin/chat/sessions/:sessionId/status', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ success: false, message: 'স্ট্যাটাস আবশ্যক' });

    const updated = db.updateChatSession(sessionId, { status });
    if (!updated) return res.status(404).json({ success: false, message: 'সেশন নেই' });

    // Send system announcement if resolved or closed
    if (status === 'resolved' || status === 'closed') {
      db.sendChatMessage({
        sessionId,
        sender: 'system',
        senderName: 'BengalBet সিস্টেম',
        text: `সাপোর্ট এজেন্ট এই সেশনটিকে "${status === 'resolved' ? 'সমাধানকৃত' : 'সমাপ্ত'}" হিসেবে চিহ্নিত করেছেন। কোনো প্রয়োজনে পুনরায় নক করুন।`
      });
    }

    res.json({
      success: true,
      session: updated,
      message: `সেশন স্ট্যাটাস "${status}" এ আপডেট হয়েছে`
    });
  });

  // Assign staff operator to session
  app.post('/api/admin/chat/sessions/:sessionId/assign', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { name, avatar, role } = req.body;

    const assignedAgent = {
      id: `agent-${Date.now().toString().slice(-4)}`,
      name: name || 'সিনিয়র সাপোর্ট ম্যানেজার',
      avatar: avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      role: role || 'VIP সাপোর্ট এক্সিকিউটিভ'
    };

    const updated = db.updateChatSession(sessionId, { assignedAgent });
    if (!updated) return res.status(404).json({ success: false, message: 'সেশন নেই' });

    // Inform user in chat
    db.sendChatMessage({
      sessionId,
      sender: 'system',
      senderName: 'BengalBet সিস্টেম',
      text: `দায়িত্বপ্রাপ্ত প্রতিনিধি: ${assignedAgent.name} (${assignedAgent.role}) আপনার সাথে চ্যাটে যুক্ত আছেন।`
    });

    res.json({ success: true, session: updated });
  });

  // Save internal staff note
  app.post('/api/admin/chat/sessions/:sessionId/note', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { note } = req.body;

    const updated = db.updateChatSession(sessionId, { internalNote: note || '' });
    if (!updated) return res.status(404).json({ success: false, message: 'সেশন নেই' });

    res.json({ success: true, session: updated, message: 'অভ্যন্তরীণ নোট সেভ হয়েছে' });
  });

  // Quick Direct Balance / Bonus Credit from Chat Console
  app.post('/api/admin/chat/sessions/:sessionId/credit', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const { amount, note, type } = req.body;
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'সঠিক টাকার পরিমাণ প্রদান করুন' });
    }

    const session = db.getChatSession(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'সেশন পাওয়া যায়নি' });

    const user = db.getUserById(session.userId);
    if (!user) return res.status(404).json({ success: false, message: 'প্লেয়ার পাওয়া যায়নি' });

    const updatedBalance = Number((user.balance + numAmount).toFixed(2));
    db.updateUser(user.id, { balance: updatedBalance });

    // Record transaction
    const isBonus = type === 'bonus';
    db.addTransaction({
      userId: user.id,
      type: isBonus ? 'bonus' : 'deposit',
      amount: numAmount,
      channel: 'system',
      trxId: `CHAT${Date.now().toString().slice(-6)}`,
      status: 'success',
      description: note || (isBonus ? 'লাইভ চ্যাট স্পেশাল বোনাস' : 'সাপোর্ট ক্রেডিট অ্যাডজাস্টমেন্ট')
    });

    // Post card message in chat
    db.sendChatMessage({
      sessionId,
      sender: 'agent',
      senderName: session.assignedAgent?.name || 'BengalBet সাপোর্ট টিম',
      text: `🎉 প্রিয় ${user.username}, আপনার অ্যাকাউন্টে ৳${numAmount} ${isBonus ? 'বোনাস' : 'ক্রেডিট'} সফলভাবে যুক্ত করা হয়েছে! বর্তমান ব্যালেন্স: ৳${updatedBalance}।`,
      quickAction: { label: 'ব্যালেন্স রিফ্রেশ করুন', action: 'refresh_balance' }
    });

    // Update session userBalance
    db.updateChatSession(sessionId, { userBalance: updatedBalance });

    res.json({
      success: true,
      message: `৳${numAmount} সফলভাবে প্লেয়ারের অ্যাকাউন্টে যোগ করা হয়েছে!`,
      newBalance: updatedBalance
    });
  });

  // Delete / Archive chat session
  app.delete('/api/admin/chat/sessions/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const ok = db.deleteChatSession(sessionId);
    res.json({
      success: ok,
      message: ok ? 'চ্যাট সেশন সফলভাবে মুছে ফেলা হয়েছে' : 'সেশন পাওয়া যায়নি'
    });
  });

  // ==========================================
  // REFERRAL & COMMISSION API ROUTES
  // ==========================================

  // User: Get referral overview stats
  app.get('/api/referral/stats', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const stats = db.getReferralStats(userId);
    res.json({ success: true, ...stats });
  });

  // User: Get referred friends list
  app.get('/api/referral/friends', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const friends = db.getReferralFriends(userId);
    res.json({ success: true, friends, total: friends.length });
  });

  // User: Get referral reward / commission records
  app.get('/api/referral/records', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const records = db.getReferralRecords(userId);
    res.json({ success: true, records, total: records.length });
  });

  // User: Get active referral policy settings
  app.get('/api/referral/settings', (req: Request, res: Response) => {
    const settings = db.getReferralSettings();
    res.json({ success: true, settings });
  });

  // User: Claim milestone tier bonus
  app.post('/api/referral/claim-tier', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const { tierId } = req.body;
    const parsedTierId = Number(tierId);
    if (isNaN(parsedTierId)) {
      return res.status(400).json({ success: false, message: 'অকার্যকর পুরস্কার স্তর' });
    }
    const result = db.claimReferralTier(userId, parsedTierId);
    res.json(result);
  });

  // User: Claim sequential Poroskar level milestone
  app.post('/api/referral/claim-poroskar-level', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const { level } = req.body;
    const parsedLevel = Number(level);
    if (isNaN(parsedLevel) || parsedLevel <= 0) {
      return res.status(400).json({ success: false, message: 'অকার্যকর পুরস্কার লেভেল' });
    }
    const result = db.claimPoroskarLevel(userId, parsedLevel);
    res.json(result);
  });

  // User: Bind someone's referral code
  app.post('/api/referral/bind-code', (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    const { code } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ success: false, message: 'আমন্ত্রণ কোড প্রদান করুন' });
    }
    const result = db.bindReferralCode(userId, String(code).trim());
    res.json(result);
  });

  // Admin: Get overall referral program statistics
  app.get('/api/admin/referrals/stats', (req: Request, res: Response) => {
    const stats = db.getAdminReferralStats();
    res.json({ success: true, stats });
  });

  // Admin: Get paginated/filtered referrals list
  app.get('/api/admin/referrals/list', (req: Request, res: Response) => {
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || 'all';
    const list = db.getAdminReferralsList(search, status);
    res.json({ success: true, referrals: list, total: list.length });
  });

  // Admin: Get settings
  app.get('/api/admin/referrals/settings', (req: Request, res: Response) => {
    const settings = db.getReferralSettings();
    res.json({ success: true, settings });
  });

  // Admin: Update referral settings
  app.post('/api/admin/referrals/settings', (req: Request, res: Response) => {
    const updates = req.body;
    const updated = db.updateReferralSettings(updates);
    res.json({ success: true, message: 'রেফারেল ও কমিশন পলিসি সফলভাবে সংরক্ষিত হয়েছে', settings: updated });
  });

  // Admin: Manual bonus payout to user
  app.post('/api/admin/referrals/bonus-payout', (req: Request, res: Response) => {
    const { userId, amount, note } = req.body;
    if (!userId || !amount) {
      return res.status(400).json({ success: false, message: 'ইউজার ও টাকার পরিমাণ প্রদান করুন' });
    }
    const result = db.manualReferralBonusPayout(userId, Number(amount), note);
    res.json(result);
  });

  // Admin: Update referral status
  app.post('/api/admin/referrals/status', (req: Request, res: Response) => {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, message: 'আইডি ও স্ট্যাটাস প্রয়োজন' });
    }
    const updated = db.updateReferralStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'রেফারেল রেকর্ড পাওয়া যায়নি' });
    }
    res.json({ success: true, message: 'স্ট্যাটাস আপডেট হয়েছে', referral: updated });
  });

  // Admin: Get all milestone claims
  app.get('/api/admin/referrals/claims', (req: Request, res: Response) => {
    const claims = db.getAllReferralClaims();
    res.json({ success: true, claims, total: claims.length });
  });

  // =========================================================================
  // 1. DAILY SIGN-IN (দৈনিক সাইন-ইন কাজ) ROUTES
  // =========================================================================
  // User: Get daily sign-in state, streak, today's reward, history
  app.get('/api/daily-signin/status', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const state = db.getUserDailySignInState(userId);
      res.json({ success: true, ...state });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'সাইন-ইন তথ্য লোড করতে ব্যর্থ' });
    }
  });

  // User: Claim today's sign-in bonus
  app.post('/api/daily-signin/claim', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const result = db.claimDailySignIn(userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'সাইন-ইন দাবি ব্যর্থ হয়েছে' });
    }
  });

  // Admin: Get daily sign-in configuration
  app.get('/api/admin/daily-signin/config', (req: Request, res: Response) => {
    try {
      const config = db.getDailySignInConfig();
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Update daily sign-in configuration
  app.post('/api/admin/daily-signin/config', (req: Request, res: Response) => {
    try {
      const updated = db.updateDailySignInConfig(req.body);
      res.json({ success: true, message: 'সাইন-ইন কনফিগারেশন সফলভাবে আপডেট হয়েছে', config: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Get all daily sign-in claims/records
  app.get('/api/admin/daily-signin/records', (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string) || '';
      const date = (req.query.date as string) || '';
      const records = db.getAllDailySignInRecords(search, date);
      res.json({ success: true, records, total: records.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Manual credit sign-in bonus
  app.post('/api/admin/daily-signin/manual-credit', (req: Request, res: Response) => {
    try {
      const { userId, day, bonus, note } = req.body;
      if (!userId || day === undefined || bonus === undefined) {
        return res.status(400).json({ success: false, message: 'ইউজার, দিন ও বোনাসের পরিমাণ প্রদান করুন' });
      }
      const result = db.adminManualCreditSignIn(userId, Number(day), Number(bonus), note);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Reset user sign-in streak
  app.post('/api/admin/daily-signin/reset-streak', (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ success: false, message: 'ইউজার আইডি প্রয়োজন' });
      const result = db.adminResetSignInStreak(userId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // =========================================================================
  // 2. RESCUE FUND (লস রেসকিউ ফান্ড / উদ্ধার তহবিল) ROUTES
  // =========================================================================
  // User: Get rescue fund status, calculation, tiers, history
  app.get('/api/rescue/status', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const targetDate = req.query.date as string;
      const status = db.getUserRescueStatus(userId, targetDate);
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'উদ্ধার তহবিলের তথ্য লোড ব্যর্থ' });
    }
  });

  // User: Claim today's rescue fund
  app.post('/api/rescue/claim', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { date } = req.body;
      const result = db.claimRescueFund(userId, date);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'উদ্ধার তহবিল দাবি ব্যর্থ হয়েছে' });
    }
  });

  // Admin: Get rescue tiers
  app.get('/api/admin/rescue/tiers', (req: Request, res: Response) => {
    try {
      const tiers = db.getRescueTiers();
      res.json({ success: true, tiers });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Save or update rescue tier
  app.post('/api/admin/rescue/tiers', (req: Request, res: Response) => {
    try {
      const saved = db.saveRescueTier(req.body);
      res.json({ success: true, message: 'রেসকিউ টিয়ার সফলভাবে সংরক্ষিত হয়েছে', tier: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Delete rescue tier
  app.delete('/api/admin/rescue/tiers/:id', (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const deleted = db.deleteRescueTier(id);
      res.json({ success: deleted, message: deleted ? 'টিয়ার মুছে ফেলা হয়েছে' : 'টিয়ার পাওয়া যায়নি' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Get rescue claims list
  app.get('/api/admin/rescue/claims', (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string) || 'all';
      const search = (req.query.search as string) || '';
      const date = (req.query.date as string) || '';
      const claims = db.getAllRescueClaims(status, search, date);
      res.json({ success: true, claims, total: claims.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Review/approve/reject claim
  app.post('/api/admin/rescue/review', (req: Request, res: Response) => {
    try {
      const { claimId, status, adminNote } = req.body;
      if (!claimId || !status) {
        return res.status(400).json({ success: false, message: 'দাবি আইডি ও স্ট্যাটাস প্রয়োজন' });
      }
      const result = db.adminReviewRescueClaim(claimId, status, adminNote);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Directly grant rescue bonus to user
  app.post('/api/admin/rescue/manual-grant', (req: Request, res: Response) => {
    try {
      const { userId, amount, note } = req.body;
      if (!userId || !amount) {
        return res.status(400).json({ success: false, message: 'ইউজার ও টাকার পরিমাণ প্রদান করুন' });
      }
      const result = db.adminManualGrantRescue(userId, Number(amount), note);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // =========================================================================
  // 3. PROCHAR CODE / PROMO CODE ROUTES
  // =========================================================================
  // User/Public: Get promo codes (active list)
  app.get('/api/promos', (req: Request, res: Response) => {
    try {
      const promos = db.getPromoCodes('active');
      res.json({ success: true, promos });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // User: Redeem a promo code
  app.post('/api/promos/redeem', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { code } = req.body;
      if (!code || !String(code).trim()) {
        return res.status(400).json({ success: false, message: 'প্রচার কোড লিখুন' });
      }
      const result = db.redeemPromoCode(userId, String(code).trim());
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'কোড রিডিম ব্যর্থ হয়েছে' });
    }
  });

  // User: Get my redeemed promo codes
  app.get('/api/promos/my-redemptions', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const redemptions = db.getUserPromoRedemptions(userId);
      res.json({ success: true, redemptions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Get all promo codes with stats
  app.get('/api/admin/promos', (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string) || 'all';
      const search = (req.query.search as string) || '';
      const promos = db.getPromoCodes(status, search);
      res.json({ success: true, promos, total: promos.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Create new promo code
  app.post('/api/admin/promos', (req: Request, res: Response) => {
    try {
      const created = db.createPromoCode(req.body);
      res.json({ success: true, message: `প্রচার কোড "${created.code}" সফলভাবে তৈরি হয়েছে`, promo: created });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Update promo code
  app.put('/api/admin/promos/:id', (req: Request, res: Response) => {
    try {
      const updated = db.updatePromoCode(req.params.id, req.body);
      res.json({ success: true, message: 'প্রচার কোড সফলভাবে আপডেট করা হয়েছে', promo: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Delete promo code
  app.delete('/api/admin/promos/:id', (req: Request, res: Response) => {
    try {
      const deleted = db.deletePromoCode(req.params.id);
      res.json({ success: deleted, message: deleted ? 'প্রচার কোড মুছে ফেলা হয়েছে' : 'কোড পাওয়া যায়নি' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Get all promo redemptions
  app.get('/api/admin/promos/redemptions', (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string) || '';
      const code = (req.query.code as string) || '';
      const redemptions = db.getAllPromoRedemptions(search, code);
      res.json({ success: true, redemptions, total: redemptions.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // =========================================================================
  // 4. TICKET RECORD (টিকেট রেকর্ড) ROUTES
  // =========================================================================
  // User: Get ticket records with filter (today, yesterday, 7days, older / status)
  app.get('/api/tickets', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const category = (req.query.category as string) || 'all';
      const status = (req.query.status as string) || 'all';
      const tickets = db.getUserTickets(userId, category, status);
      res.json({ success: true, tickets, total: tickets.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // User: Use/redeem ticket
  app.post('/api/tickets/use', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { ticketId } = req.body;
      if (!ticketId) return res.status(400).json({ success: false, message: 'টিকিট আইডি প্রদান করুন' });
      const result = db.useTicket(userId, ticketId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Get all tickets across all users
  app.get('/api/admin/tickets', (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || 'all';
      const type = (req.query.type as string) || 'all';
      const tickets = db.getAllTickets(search, status, type);
      res.json({ success: true, tickets, total: tickets.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Create ticket for a user
  app.post('/api/admin/tickets', (req: Request, res: Response) => {
    try {
      const ticket = db.createUserTicket(req.body);
      res.json({ success: true, message: 'টিকিট সফলভাবে তৈরি হয়েছে', ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Update ticket status
  app.put('/api/admin/tickets/:id', (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ success: false, message: 'স্ট্যাটাস প্রয়োজন' });
      const updated = db.updateTicketStatus(req.params.id, status);
      res.json({ success: true, message: 'টিকিট স্ট্যাটাস আপডেট হয়েছে', ticket: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Delete ticket
  app.delete('/api/admin/tickets/:id', (req: Request, res: Response) => {
    try {
      const deleted = db.deleteTicket(req.params.id);
      res.json({ success: deleted, message: deleted ? 'টিকিট মুছে ফেলা হয়েছে' : 'টিকিট পাওয়া যায়নি' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // =========================================================================
  // 5. MYSTERY REWARD (প্রতি মাসের ২৩ তারিখ রহস্যময় পুরস্কার) ROUTES
  // =========================================================================
  // User: Get Mystery Reward status, eligibility & unlocked cash card
  app.get('/api/mystery-reward/status', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const status = db.getUserMysteryRewardStatus(userId);
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // User: Claim Mystery Reward / Cash Card
  app.post('/api/mystery-reward/claim', (req: Request, res: Response) => {
    try {
      const userId = getAuthUserId(req);
      const { promoCode } = req.body;
      const result = db.claimMysteryReward(userId, promoCode);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Get Mystery Reward Configuration
  app.get('/api/admin/mystery-reward/config', (req: Request, res: Response) => {
    try {
      const config = db.getMysteryRewardConfig();
      res.json({ success: true, config });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Update Mystery Reward Configuration
  app.put('/api/admin/mystery-reward/config', (req: Request, res: Response) => {
    try {
      const updated = db.updateMysteryRewardConfig(req.body);
      res.json({ success: true, message: '২৩ তারিখ রহস্যময় পুরস্কার কনফিগারেশন আপডেট হয়েছে', config: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Get all Mystery Cash Cards
  app.get('/api/admin/mystery-reward/cards', (req: Request, res: Response) => {
    try {
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || 'all';
      const monthYear = (req.query.monthYear as string) || 'all';
      const cards = db.getAllMysteryCards({ search, status, monthYear });
      res.json({ success: true, cards, total: cards.length });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Admin: Trigger instant Auto-Drop for all eligible users
  app.post('/api/admin/mystery-reward/trigger-drop', (req: Request, res: Response) => {
    try {
      const { monthYear } = req.body;
      const result = db.adminTriggerMysteryRewardDrop(monthYear);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // Admin: Manually issue Mystery Cash Card to a specific player
  app.post('/api/admin/mystery-reward/manual-issue', (req: Request, res: Response) => {
    try {
      const result = db.adminManualIssueMysteryCard(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // VITE DEV & STATIC PRODUCTION FALLBACK
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BengalBet Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
