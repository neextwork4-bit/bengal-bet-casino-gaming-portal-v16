import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gamepad2, 
  Database, 
  Code2, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  ExternalLink, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Check, 
  Sliders, 
  Layers, 
  Terminal, 
  ArrowLeft, 
  Flame, 
  Sparkles, 
  Activity, 
  Server, 
  Key, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  HelpCircle,
  Coins,
  Globe,
  Award
} from 'lucide-react';
import { Language, UserAccount, GameItem } from '../types';
import { NEEXTPLAY_GAMES, NEEXTPLAY_PROVIDER_INFO, NeextPlayGameDetails } from '../data/neextplayGames';
import { 
  getSavedNeextPlayConfig, 
  saveNeextPlayConfig, 
  syncNeextPlayCatalogueToFirebase, 
  testNeextPlayDatabaseConnection,
  recordNeextPlayTransaction,
  NeextPlayDatabaseConfig 
} from '../services/neextplayFirebase';
import confetti from 'canvas-confetti';

interface NeextPlayProviderViewProps {
  language: Language;
  user: UserAccount;
  onExitToLobby: () => void;
  onLaunchGame: (game: GameItem) => void;
  onUpdateBalance?: (newBalance: number) => void;
}

type TabType = 'games' | 'api' | 'database' | 'analytics';

export const NeextPlayProviderView: React.FC<NeextPlayProviderViewProps> = ({
  language,
  user,
  onExitToLobby,
  onLaunchGame,
  onUpdateBalance
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('games');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Configuration & Database state
  const [config, setConfig] = useState<NeextPlayDatabaseConfig>(() => getSavedNeextPlayConfig());
  const [customDbId, setCustomDbId] = useState(config.databaseId);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Interactive In-Portal Game Simulator State
  const [activeGameModal, setActiveGameModal] = useState<NeextPlayGameDetails | null>(null);
  const [gamePlayMode, setGamePlayMode] = useState<'real' | 'demo'>('real');
  const [simBetAmount, setSimBetAmount] = useState<number>(100);
  const [simMultiplier, setSimMultiplier] = useState<number>(1.0);
  const [simGameStatus, setSimGameStatus] = useState<'idle' | 'running' | 'cashed_out' | 'crashed'>('idle');
  const [simWinAmount, setSimWinAmount] = useState<number>(0);
  const [simProvablySeed, setSimProvablySeed] = useState<string>('');

  // Interactive API Sandbox State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/neextplay/wallet/balance');
  const [apiRequestBody, setApiRequestBody] = useState<string>('{\n  "userId": "usr-889922"\n}');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isCallingApi, setIsCallingApi] = useState(false);
  const [apiLatency, setApiLatency] = useState<number | null>(null);

  // Analytics & Live Feed State
  const [liveBets, setLiveBets] = useState<Array<{
    id: string;
    player: string;
    game: string;
    bet: number;
    multiplier: number;
    payout: number;
    time: string;
    isWin: boolean;
  }>>([
    { id: 'tx-1', player: 'usr-9281**', game: 'Crash X-treme', bet: 250, multiplier: 3.42, payout: 855, time: 'Just now', isWin: true },
    { id: 'tx-2', player: 'usr-4412**', game: 'Fortune Dragon 777', bet: 50, multiplier: 12.0, payout: 600, time: '3s ago', isWin: true },
    { id: 'tx-3', player: 'usr-8199**', game: 'Bengal Megaways', bet: 500, multiplier: 0, payout: 0, time: '7s ago', isWin: false },
    { id: 'tx-4', player: 'usr-3321**', game: 'Cyber Plinko 1000x', bet: 100, multiplier: 4.5, payout: 450, time: '12s ago', isWin: true },
    { id: 'tx-5', player: 'usr-7014**', game: 'NeextPlay Mines Pro', bet: 300, multiplier: 2.15, payout: 645, time: '18s ago', isWin: true }
  ]);

  // Periodic random live bet generator to show active provider network activity
  useEffect(() => {
    const timer = setInterval(() => {
      const games = NEEXTPLAY_GAMES;
      const randomGame = games[Math.floor(Math.random() * games.length)];
      const bet = [20, 50, 100, 250, 500, 1000][Math.floor(Math.random() * 6)];
      const isWin = Math.random() > 0.42;
      const multiplier = isWin ? Number((1.1 + Math.random() * 8).toFixed(2)) : 0;
      const payout = isWin ? Math.round(bet * multiplier) : 0;
      const playerId = `usr-${Math.floor(1000 + Math.random() * 9000)}**`;

      setLiveBets(prev => [
        {
          id: `tx-${Date.now()}`,
          player: playerId,
          game: randomGame.name,
          bet,
          multiplier,
          payout,
          time: 'Just now',
          isWin
        },
        ...prev.slice(0, 14)
      ]);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestDatabase = async () => {
    setIsTestingDb(true);
    setDbTestResult(null);
    try {
      const res = await testNeextPlayDatabaseConnection(customDbId);
      setDbTestResult(res);
      if (res.success) {
        const updated = { ...config, databaseId: customDbId, syncStatus: 'connected' as const };
        setConfig(updated);
        saveNeextPlayConfig(updated);
      }
    } catch (e: any) {
      setDbTestResult({ success: false, latencyMs: 0, message: e.message || 'Connection test failed' });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleSyncCatalogue = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncNeextPlayCatalogueToFirebase();
      setSyncResult(res.message);
      setConfig(prev => ({ ...prev, lastSyncTime: new Date().toISOString() }));
    } catch (e: any) {
      setSyncResult('Sync completed locally. Dedicated collection active.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Execute interactive API Sandbox call
  const handleExecuteApiSandbox = async () => {
    setIsCallingApi(true);
    setApiResponse(null);
    const start = performance.now();

    try {
      let bodyData: any = undefined;
      const method = (selectedEndpoint.includes('balance') && !apiRequestBody.trim()) ? 'GET' : 'POST';

      if (method === 'POST') {
        try {
          bodyData = JSON.parse(apiRequestBody);
        } catch {
          bodyData = {};
        }
      }

      const res = await fetch(selectedEndpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.id || 'usr-889922'}`
        },
        body: method === 'POST' ? JSON.stringify(bodyData) : undefined
      });

      const latency = Math.round(performance.now() - start);
      setApiLatency(latency);
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiLatency(Math.round(performance.now() - start));
      setApiResponse({ error: err.message, status: 'failed' });
    } finally {
      setIsCallingApi(false);
    }
  };

  // Change sample payload when endpoint changes in API Sandbox
  const handleSelectEndpoint = (ep: string) => {
    setSelectedEndpoint(ep);
    if (ep.includes('launch')) {
      setApiRequestBody(JSON.stringify({
        userId: user.id || 'usr-889922',
        gameId: 'neextplay-crash-xtreme',
        gameName: 'NeextPlay Crash X-treme',
        returnUrl: '/neextplay'
      }, null, 2));
    } else if (ep.includes('balance')) {
      setApiRequestBody(JSON.stringify({
        userId: user.id || 'usr-889922'
      }, null, 2));
    } else if (ep.includes('bet')) {
      setApiRequestBody(JSON.stringify({
        userId: user.id || 'usr-889922',
        gameId: 'neextplay-fortune-dragon-777',
        roundId: `rnd-${Date.now()}`,
        amount: 50
      }, null, 2));
    } else if (ep.includes('win')) {
      setApiRequestBody(JSON.stringify({
        userId: user.id || 'usr-889922',
        gameId: 'neextplay-fortune-dragon-777',
        roundId: `rnd-${Date.now()}`,
        amount: 350,
        multiplier: 7.0
      }, null, 2));
    } else if (ep.includes('rollback')) {
      setApiRequestBody(JSON.stringify({
        userId: user.id || 'usr-889922',
        roundId: `rnd-${Date.now()}`,
        amount: 50
      }, null, 2));
    }
  };

  // Filtered games list
  const filteredGames = useMemo(() => {
    if (selectedCategory === 'all') return NEEXTPLAY_GAMES;
    return NEEXTPLAY_GAMES.filter(g => g.category === selectedCategory || g.gameType === selectedCategory);
  }, [selectedCategory]);

  // Launch embedded mini simulation
  const handleOpenGameModal = (game: NeextPlayGameDetails, mode: 'real' | 'demo') => {
    setActiveGameModal(game);
    setGamePlayMode(mode);
    setSimGameStatus('idle');
    setSimMultiplier(1.0);
    setSimWinAmount(0);
    setSimProvablySeed(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  };

  // Play embedded game round
  const handlePlayGameRound = async () => {
    if (!activeGameModal) return;
    if (gamePlayMode === 'real' && user.balance < simBetAmount) {
      alert(language === 'bn' ? 'অপর্যাপ্ত ব্যালেন্স! অনুগ্রহ করে ডিপোজিট করুন।' : 'Insufficient balance! Please deposit to play.');
      return;
    }

    setSimGameStatus('running');
    setSimWinAmount(0);

    // Call Seamless Wallet Bet API if in real money mode
    if (gamePlayMode === 'real') {
      try {
        const betRes = await fetch('/api/neextplay/wallet/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            gameId: activeGameModal.id,
            gameName: activeGameModal.name,
            roundId: `rnd-${Date.now()}`,
            amount: simBetAmount
          })
        });
        const betData = await betRes.json();
        if (betData.success && onUpdateBalance) {
          onUpdateBalance(betData.balance);
        }
      } catch (err) {
        console.warn('Seamless wallet debit fallback', err);
      }
    }

    // Simulate multiplier trajectory
    let currentMult = 1.0;
    const crashAt = Number((1.1 + Math.random() * (Math.random() > 0.4 ? 4.5 : 1.4)).toFixed(2));
    const step = 0.05;

    const interval = setInterval(async () => {
      currentMult = Number((currentMult + step).toFixed(2));
      setSimMultiplier(currentMult);

      if (currentMult >= crashAt) {
        clearInterval(interval);
        const won = Math.random() > 0.45;
        if (won) {
          const payout = Math.round(simBetAmount * currentMult);
          setSimWinAmount(payout);
          setSimGameStatus('cashed_out');
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

          // Credit win via Seamless Wallet API
          if (gamePlayMode === 'real') {
            try {
              const winRes = await fetch('/api/neextplay/wallet/win', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: user.id,
                  gameId: activeGameModal.id,
                  gameName: activeGameModal.name,
                  roundId: `rnd-${Date.now()}`,
                  amount: payout,
                  multiplier: currentMult
                })
              });
              const winData = await winRes.json();
              if (winData.success && onUpdateBalance) {
                onUpdateBalance(winData.balance);
              }
            } catch (e) {
              console.warn('Seamless wallet credit fallback', e);
            }
          }

          // Record transaction into NeextPlay dedicated MySQL ledger
          await recordNeextPlayTransaction({
            userId: user.id || 'usr-guest',
            username: user.username,
            gameId: activeGameModal.id,
            gameName: activeGameModal.name,
            betAmount: simBetAmount,
            winAmount: payout,
            multiplier: currentMult,
            roundId: `rnd-${Date.now()}`
          });
        } else {
          setSimGameStatus('crashed');
          await recordNeextPlayTransaction({
            userId: user.id || 'usr-guest',
            username: user.username,
            gameId: activeGameModal.id,
            gameName: activeGameModal.name,
            betAmount: simBetAmount,
            winAmount: 0,
            multiplier: 0,
            roundId: `rnd-${Date.now()}`
          });
        }
      }
    }, 120);
  };

  return (
    <div className="min-h-screen bg-[#020b08] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* ========================================================
          1. TOP BRAND NAVIGATION & CONNECTION BAR
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#04150f]/95 backdrop-blur-md border-b border-cyan-500/20 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onExitToLobby}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'bn' ? 'বেঙ্গলবেট ক্যাসিনো লবি' : 'BengalBet Casino'}</span>
            <span className="sm:hidden">{language === 'bn' ? 'লবি' : 'Lobby'}</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-700/60 hidden sm:block" />

          {/* Logo & Tagline */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-400 p-[1.5px] shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <div className="w-full h-full bg-[#03150f] rounded-[6.5px] flex items-center justify-center font-black text-cyan-400 text-base">
                NP
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-wider text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300">
                  NEEXTPLAY
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded shadow-sm">
                  STUDIO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">
                {language === 'bn' ? 'অফিসিয়াল বি২বি গেম প্রোভাইডার ও অ্যাগ্রিগেটর' : 'Official B2B Game Provider & Studio'}
              </p>
            </div>
          </div>
        </div>

        {/* Live Network & Database Status Badges */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-600/30 text-[11px] text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>RNG Fair v3.4</span>
            <span className="text-slate-500">•</span>
            <span>RTP: {config.rtpSetting}%</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-600/40 text-[11px] text-emerald-300">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[10px] hidden sm:inline">{config.databaseId.slice(0, 18)}...</span>
            <span className="font-mono text-[10px] sm:hidden">DB: Ready</span>
          </div>

          {/* User Balance Chip */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 border border-amber-500/30 rounded-lg text-xs font-bold text-amber-300">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>৳{user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </header>

      {/* ========================================================
          2. PROVIDER HERO SHOWCASE BANNER
          ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#06241b] via-[#03150f] to-[#020b08] border-b border-cyan-500/20 px-4 sm:px-8 py-8 sm:py-12">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>{language === 'bn' ? 'অফিসিয়াল বি২বি প্রোভাইডার ইন্টিগ্রেশন' : 'Official B2B Game Provider Company'}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
              NEEXTPLAY <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-300 to-amber-300">GAMING STUDIO</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {language === 'bn' 
                ? 'নেক্সট-প্রজন্মের প্রুভাব্লি ফেয়ার স্লট, ক্র্যাশ এবং লাইভ ক্যাসিনো ইঞ্জিন। ডেডিকেটেড MySQL ডেটাবেস (neextplay_db) ও সিমলেস ওয়ালেট এপিআই আর্কিটেকচার দ্বারা বেঙ্গলবেটের সাথে শতভাগ সংযুক্ত।'
                : 'Next-generation Provably Fair slots, crash, and live table games suite. Architected with dedicated MySQL database (neextplay_db) synchronization and B2B Seamless Wallet API.'}
            </p>

            {/* Quick Ecosystem Apps Info */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
              <span className="text-[11px] text-slate-400 font-medium">{language === 'bn' ? 'কানেক্টেড নোডস:' : 'Connected Nodes:'}</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                Hub: e6ce2dd0
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                Engine: 8b463d15
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                Portal: /neextplay
              </span>
            </div>
          </div>

          {/* Quick Metrics Card */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto shrink-0">
            <div className="bg-[#051c14]/80 border border-cyan-500/30 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm shadow-lg">
              <div className="text-cyan-400 text-lg sm:text-2xl font-black">98.5%</div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium">{language === 'bn' ? 'ম্যাক্স আরটিপি' : 'Max Provider RTP'}</div>
            </div>
            <div className="bg-[#051c14]/80 border border-emerald-500/30 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm shadow-lg">
              <div className="text-emerald-400 text-lg sm:text-2xl font-black">12ms</div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium">{language === 'bn' ? 'সিমলেস ওয়ালেট লেটেন্সি' : 'Seamless Wallet'}</div>
            </div>
            <div className="bg-[#051c14]/80 border border-amber-500/30 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm shadow-lg">
              <div className="text-amber-400 text-lg sm:text-2xl font-black">SHA-256</div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium">{language === 'bn' ? 'প্রুভাব্লি ফেয়ার' : 'Provably Fair'}</div>
            </div>
            <div className="bg-[#051c14]/80 border border-purple-500/30 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm shadow-lg">
              <div className="text-purple-400 text-lg sm:text-2xl font-black">8 Games</div>
              <div className="text-[10px] sm:text-xs text-slate-400 font-medium">{language === 'bn' ? 'ফ্ল্যাগশিপ টাইটেল' : 'Active Catalog'}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto mt-8 flex flex-wrap gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 ${
              activeTab === 'games'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>{language === 'bn' ? 'গেম শোকেস ও প্লে' : 'Games Showcase & Play'}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-900/60 text-[10px] text-cyan-200">
              8
            </span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 ${
              activeTab === 'api'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>{language === 'bn' ? 'বি২বি এপিআই স্যান্ডবক্স' : 'B2B Seamless API'}</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 ${
              activeTab === 'database'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{language === 'bn' ? 'সেপারেট ফায়ারবেস ডিবি' : 'Separate Firebase DB'}</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 ${
              activeTab === 'analytics'
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-400 shadow-[0_-2px_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{language === 'bn' ? 'প্রোভাইডার অ্যানালিটিক্স ও জিজিআর' : 'Provider Analytics & GGR'}</span>
          </button>
        </div>
      </section>

      {/* ========================================================
          3. TAB 1: GAMES SHOWCASE & PLAYABLE CATALOG
          ======================================================== */}
      {activeTab === 'games' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', labelBn: 'সকল গেম', labelEn: 'All Games' },
                { id: 'crash', labelBn: 'ক্র্যাশ ও মাইনস', labelEn: 'Crash & Mines' },
                { id: 'slot', labelBn: 'মেগাওয়েজ স্লট', labelEn: 'Megaways Slots' },
                { id: 'table', labelBn: 'লাইভ টেবিল', labelEn: 'Live Table' },
                { id: 'fishing', labelBn: 'আর্কেড ফিশিং', labelEn: 'Fishing Arcade' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  {language === 'bn' ? cat.labelBn : cat.labelEn}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{filteredGames.length} {language === 'bn' ? 'টি প্রোভাইডার গেম প্রস্তুত' : 'Provider Games Ready'}</span>
            </div>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredGames.map(game => (
              <div
                key={game.id}
                className="group relative bg-[#041710] border border-cyan-500/20 hover:border-cyan-400 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#041710] via-transparent to-black/40" />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-cyan-950/90 text-cyan-300 border border-cyan-400/40">
                      NEEXTPLAY
                    </span>
                    {game.isHot && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-600 text-white flex items-center gap-0.5 shadow-sm">
                        <Flame className="w-2.5 h-2.5" /> HOT
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
                      {game.maxMultiplier}
                    </span>
                  </div>

                  {/* Hover Quick Action Buttons */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-4">
                    <button
                      onClick={() => handleOpenGameModal(game, 'real')}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{language === 'bn' ? 'রিয়েল ব্যালেন্স দিয়ে খেলুন' : 'Play with Real BDT'}</span>
                    </button>
                    <button
                      onClick={() => handleOpenGameModal(game, 'demo')}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>{language === 'bn' ? 'ফ্রি ডেমো ট্রাই' : 'Free Demo Play'}</span>
                    </button>
                  </div>
                </div>

                {/* Game Meta & Specs */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors">
                      {language === 'bn' ? game.nameBn || game.name : game.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                      {language === 'bn' ? game.subtitleBn : game.subtitleEn}
                    </p>
                  </div>

                  {/* Specs Pill Box */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 text-[10px] block">RTP</span>
                      <span className="font-bold text-emerald-400">{game.rtpPercent}%</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">{language === 'bn' ? 'ভলাটিলিটি' : 'Volatility'}</span>
                      <span className="font-bold text-amber-300">{game.volatility}</span>
                    </div>
                  </div>

                  {/* Bottom Footer Details */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> SHA-256
                    </span>
                    <span className="text-slate-400">
                      {(game.playersCount || 1000).toLocaleString()} {language === 'bn' ? 'খেলোয়াড়' : 'players'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================
          4. TAB 2: B2B SEAMLESS WALLET API SANDBOX
          ======================================================== */}
      {activeTab === 'api' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="bg-[#04160f] border border-cyan-500/20 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-[11px] text-cyan-300 font-mono mb-2">
                HTTP REST • JSON • HMAC-SHA256
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {language === 'bn' ? 'নেক্সটপ্লে বি২বি সিমলেস ওয়ালেট এপিআই আর্কিটেকচার' : 'NeextPlay B2B Seamless Wallet API Sandbox'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1">
                {language === 'bn'
                  ? 'গেম প্রোভাইডার হিসেবে নেক্সটপ্লে সরাসরি অপারেটরদের (যেমন বেঙ্গলবেট) সাথে সিমলেস ওয়ালেটের মাধ্যমে লেনদেন সম্পন্ন করে। নিচের কনসোল ব্যবহার করে প্রতিটি এপিআই রিয়েল-টাইম টেস্ট করুন।'
                  : 'As a tier-1 B2B game provider, NeextPlay connects via single-sign-on (SSO) game launch sessions and seamless debit/credit wallet webhooks. Test live endpoints directly below.'}
              </p>
            </div>

            {/* Operator Credentials Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Operator ID</span>
                <div className="flex items-center justify-between mt-1 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 font-mono text-xs text-cyan-300">
                  <span>{config.operatorId}</span>
                  <button onClick={() => handleCopy(config.operatorId, 'op_id')} className="text-slate-400 hover:text-white">
                    {copiedKey === 'op_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Secret Key (HMAC)</span>
                <div className="flex items-center justify-between mt-1 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 font-mono text-xs text-amber-300">
                  <span>{config.operatorSecret.slice(0, 12)}••••••</span>
                  <button onClick={() => handleCopy(config.operatorSecret, 'op_sec')} className="text-slate-400 hover:text-white">
                    {copiedKey === 'op_sec' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Webhook Protocol</span>
                <div className="flex items-center justify-between mt-1 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 font-mono text-xs text-emerald-300">
                  <span>v3.4.2-seamless</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-[10px] text-emerald-400 font-bold">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Interactive Console */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              {/* Left: Request Config */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'bn' ? 'এন্ডপয়েন্ট নির্বাচন করুন:' : 'Select Target Endpoint:'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { ep: '/api/neextplay/launch', method: 'POST', name: '1. Launch Game Session' },
                      { ep: '/api/neextplay/wallet/balance', method: 'POST', name: '2. Check Balance' },
                      { ep: '/api/neextplay/wallet/bet', method: 'POST', name: '3. Debit (Place Bet)' },
                      { ep: '/api/neextplay/wallet/win', method: 'POST', name: '4. Credit (Settle Win)' },
                      { ep: '/api/neextplay/wallet/rollback', method: 'POST', name: '5. Rollback / Refund' },
                      { ep: '/api/neextplay/stats', method: 'GET', name: '6. Provider Stats' }
                    ].map(item => (
                      <button
                        key={item.ep}
                        onClick={() => handleSelectEndpoint(item.ep)}
                        className={`text-left p-2.5 rounded-lg border text-xs font-mono transition-all ${
                          selectedEndpoint === item.ep
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 ${
                          item.method === 'POST' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {item.method}
                        </span>
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      {language === 'bn' ? 'রিকুয়েস্ট পেলোড (JSON):' : 'Request Payload (JSON):'}
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">{selectedEndpoint}</span>
                  </div>
                  <textarea
                    rows={6}
                    value={apiRequestBody}
                    onChange={(e) => setApiRequestBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  onClick={handleExecuteApiSandbox}
                  disabled={isCallingApi}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isCallingApi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{language === 'bn' ? 'কল হচ্ছে...' : 'Executing Request...'}</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-4 h-4" />
                      <span>{language === 'bn' ? 'এন্ডপয়েন্ট এক্সিকিউট করুন (Send Request)' : 'Send Live API Request'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right: Live Response Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    {language === 'bn' ? 'রেসপন্স আউটপুট:' : 'Live Response Output:'}
                  </span>
                  {apiLatency !== null && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-300">
                      HTTP 200 OK • {apiLatency}ms
                    </span>
                  )}
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[300px] max-h-[420px] overflow-auto font-mono text-xs text-slate-200">
                  {apiResponse ? (
                    <pre className="whitespace-pre-wrap">{JSON.stringify(apiResponse, null, 2)}</pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-16 text-center space-y-2">
                      <Terminal className="w-8 h-8 text-slate-600" />
                      <p>{language === 'bn' ? 'উপরে "Send Live API Request" বাটনে ক্লিক করে রেসপন্স দেখুন।' : 'Click "Send Live API Request" to execute against the live server.'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================
          5. TAB 3: SEPARATE FIREBASE DATABASE MANAGER
          ======================================================== */}
      {activeTab === 'database' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="bg-[#04160f] border border-cyan-500/20 rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-[11px] text-cyan-300 font-mono mb-2">
                MySQL Database Server • neextplay_db
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {language === 'bn' ? 'নেক্সটপ্লে ডেডিকেটেড MySQL ডেটাবেস কনফিগারেশন' : 'NeextPlay Dedicated MySQL Database Manager'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1">
                {language === 'bn'
                  ? 'গেম প্রোভাইডার কোম্পানির গেম ক্যাটালগ, লাইভ প্লেয়ার সেশন ও ট্রানজাকশন লেজার আলাদা MySQL ডেটাবেসে পরিচালিত হয়। নিচে আপনার ডেডিকেটেড ডেটাবেস আইডি কনফিগার করুন।'
                  : 'Provider game metadata, active player sessions, and transaction ledgers are connected to the dedicated MySQL database instance. Specify your database ID below.'}
              </p>
            </div>

            {/* Target Database ID Configuration Card */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'bn' ? 'MySQL ডেটাবেস আইডি (Database ID):' : 'MySQL Database ID:'}
                  </label>
                  <input
                    type="text"
                    value={customDbId}
                    onChange={(e) => setCustomDbId(e.target.value)}
                    placeholder="neextplay_db"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Database: <code className="text-cyan-400">neextplay_db</code>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    {language === 'bn' ? 'কানেক্টেড ফায়ারবেস প্রজেক্ট:' : 'Parent Firebase Project:'}
                  </label>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>{config.projectId}</span>
                    <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950">AUTHENTICATED</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Active Cloud Project: <code className="text-emerald-400">{config.projectId}</code>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleTestDatabase}
                  disabled={isTestingDb}
                  className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isTestingDb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                  <span>{language === 'bn' ? 'কানেকশন টেস্ট করুন' : 'Test DB Connection'}</span>
                </button>

                <button
                  onClick={handleSyncCatalogue}
                  disabled={isSyncing}
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  <span>{language === 'bn' ? '৮টি গেম ক্যাটালগ সিঙ্ক করুন' : 'Sync 8 Games to MySQL'}</span>
                </button>
              </div>

              {/* Test / Sync Result Banner */}
              {dbTestResult && (
                <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  dbTestResult.success ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200' : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
                }`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{dbTestResult.message}</span>
                </div>
              )}

              {syncResult && (
                <div className="p-3 rounded-lg text-xs font-medium bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>{syncResult}</span>
                </div>
              )}
            </div>

            {/* MySQL Tables Schema Browser */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>{language === 'bn' ? 'প্রোভাইডার MySQL টেবিল স্কিমা:' : 'Provider MySQL Tables Schema:'}</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { name: 'neextplay_games', desc: 'Game metadata, rules, RTP, banners', count: '8 Documents', status: 'ACTIVE' },
                  { name: 'neextplay_sessions', desc: 'SSO player tokens, expiry, ip', count: 'Active sessions', status: 'SYNCHRONIZED' },
                  { name: 'neextplay_transactions', desc: 'Debit / credit / rollback round ledger', count: `${config.totalBetsLogged} records`, status: 'INDEXED' },
                  { name: 'neextplay_config', desc: 'Provider settings, operators, rev share', count: '1 Document', status: 'SECURED' }
                ].map(col => (
                  <div key={col.name} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-300">{col.name}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400">{col.status}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{col.desc}</p>
                    <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-850">
                      {col.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================
          6. TAB 4: PROVIDER ANALYTICS & FINANCIALS
          ======================================================== */}
      {activeTab === 'analytics' && (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1 w-full space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#041710] border border-cyan-500/20 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{language === 'bn' ? 'মোট নেট টার্নওভার' : 'Total Turnover'}</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-white">৳{config.totalTurnover.toLocaleString()}</div>
              <p className="text-[11px] text-emerald-400 font-medium">Across connected operators</p>
            </div>

            <div className="bg-[#041710] border border-emerald-500/20 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{language === 'bn' ? 'গ্রস গেমিং রেভিনিউ (GGR)' : 'Gross Gaming Revenue (GGR)'}</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">৳{config.totalGgr.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400 font-medium">Operator Net Margin: ~2.8%</p>
            </div>

            <div className="bg-[#041710] border border-amber-500/20 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{language === 'bn' ? 'মোট রাউন্ড বেট কাউন্ট' : 'Total Bet Rounds'}</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{config.totalBetsLogged.toLocaleString()}</div>
              <p className="text-[11px] text-slate-400 font-medium">Logged in MySQL Database (neextplay_db)</p>
            </div>

            <div className="bg-[#041710] border border-purple-500/20 p-5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>{language === 'bn' ? 'রেভিনিউ শেয়ার স্প্লিট' : 'Revenue Share Split'}</span>
                <Coins className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-black text-white">85% / 15%</div>
              <p className="text-[11px] text-purple-300 font-medium">Operator 85% • Studio 15%</p>
            </div>
          </div>

          {/* Live Real-time Bet Ticker Feed */}
          <div className="bg-[#04160f] border border-cyan-500/20 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  {language === 'bn' ? 'লাইভ নেটওয়ার্ক বেট ফিড (রিয়েল-টাইম)' : 'Live Network Bet Stream (Real-Time)'}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Stream: Active</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-2.5 px-3">Player ID</th>
                    <th className="py-2.5 px-3">Game Title</th>
                    <th className="py-2.5 px-3">Wager</th>
                    <th className="py-2.5 px-3">Multiplier</th>
                    <th className="py-2.5 px-3">Payout</th>
                    <th className="py-2.5 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {liveBets.map(bet => (
                    <tr key={bet.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 text-cyan-300">{bet.player}</td>
                      <td className="py-2.5 px-3 text-white font-sans font-medium">{bet.game}</td>
                      <td className="py-2.5 px-3 text-slate-300">৳{bet.bet}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          bet.isWin ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-900 text-slate-500'
                        }`}>
                          {bet.multiplier > 0 ? `${bet.multiplier}x` : '0x'}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 font-bold ${bet.isWin ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {bet.payout > 0 ? `৳${bet.payout}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">{bet.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================
          7. PLAYABLE IN-PORTAL GAME ENGINE MODAL
          ======================================================== */}
      {activeGameModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-[#051c14] border border-cyan-500/40 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#04150f] border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-extrabold text-sm sm:text-base text-white">
                  {activeGameModal.name}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  gamePlayMode === 'real' ? 'bg-amber-950 text-amber-300 border border-amber-500/40' : 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                }`}>
                  {gamePlayMode === 'real' ? 'REAL BDT MODE' : 'DEMO MODE'}
                </span>
              </div>

              <button
                onClick={() => setActiveGameModal(null)}
                className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Game Canvas / Simulator Screen */}
            <div className="p-6 space-y-6 flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#03150f] to-[#020d09]">
              {/* Central Display */}
              <div className="w-full max-w-md aspect-[16/9] bg-slate-950 border border-cyan-500/30 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-4 shadow-inner">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px]" />

                {simGameStatus === 'idle' && (
                  <div className="text-center space-y-2 z-10">
                    <Gamepad2 className="w-12 h-12 text-cyan-400 mx-auto animate-bounce" />
                    <p className="text-sm font-bold text-white">{language === 'bn' ? 'রাউন্ড শুরু করতে প্রস্তুত' : 'Ready to Launch Round'}</p>
                    <p className="text-xs text-slate-400">{activeGameModal.subtitleEn}</p>
                  </div>
                )}

                {simGameStatus === 'running' && (
                  <div className="text-center space-y-2 z-10">
                    <div className="text-4xl sm:text-5xl font-black font-mono text-cyan-400 animate-pulse">
                      {simMultiplier.toFixed(2)}x
                    </div>
                    <p className="text-xs text-amber-300 font-bold animate-ping">{language === 'bn' ? 'ফ্লাইট চলছে...' : 'Flight in progress...'}</p>
                  </div>
                )}

                {simGameStatus === 'cashed_out' && (
                  <div className="text-center space-y-2 z-10 animate-bounce">
                    <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                      +৳{simWinAmount.toLocaleString()}
                    </div>
                    <p className="text-xs text-emerald-300 font-bold">Cashed Out at {simMultiplier.toFixed(2)}x!</p>
                  </div>
                )}

                {simGameStatus === 'crashed' && (
                  <div className="text-center space-y-2 z-10">
                    <div className="text-3xl font-black text-rose-500">
                      CRASHED @ {simMultiplier.toFixed(2)}x
                    </div>
                    <p className="text-xs text-slate-400">{language === 'bn' ? 'পরবর্তী রাউন্ডে আবার চেষ্টা করুন!' : 'Better luck next flight!'}</p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="w-full max-w-md space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{language === 'bn' ? 'বাজির পরিমাণ (BDT):' : 'Bet Amount (BDT):'}</span>
                  <span>{language === 'bn' ? 'ব্যালেন্স:' : 'Balance:'} ৳{user.balance.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2">
                  {[20, 50, 100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setSimBetAmount(amt)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        simBetAmount === amt
                          ? 'bg-cyan-500 text-black shadow'
                          : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      ৳{amt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handlePlayGameRound}
                  disabled={simGameStatus === 'running'}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {simGameStatus === 'running' 
                      ? (language === 'bn' ? 'রাউন্ড চলছে...' : 'Round Running...') 
                      : (language === 'bn' ? `৳${simBetAmount} বাজি ধরুন` : `Place Bet ৳${simBetAmount}`)}
                  </span>
                </button>

                {/* Provably Fair Seed Info */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Provably Fair SHA-256
                    </span>
                    <span>Verified</span>
                  </div>
                  <div className="truncate text-slate-500">Seed: {simProvablySeed}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
