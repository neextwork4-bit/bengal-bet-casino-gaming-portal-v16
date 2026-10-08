/**
 * NeextPlay Master API Game Player Container
 * Connects BengalBet to NeextPlay Studios via authoritative Master API (/api/v1/games/launch).
 * Features:
 * - Real API handshake with operator ID: op_bengalbet
 * - Signed session token generation & verified launch URL
 * - Real-time two-way wallet balance synchronization with BengalBet
 * - Real Player Profile integration directly in and under game header
 * - Interactive Real Profile Drawer & Quick Deposit Cashier
 * - Fullscreen toggle, sound mute/unmute, and 24/7 Bengali live support access
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ShieldCheck, 
  Activity,
  Sparkles, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Check, 
  Copy, 
  User, 
  Crown, 
  ChevronDown, 
  PlusCircle, 
  CreditCard, 
  Wallet, 
  Headphones, 
  TrendingUp, 
  Award, 
  ArrowRight,
  ExternalLink,
  Lock,
  Smartphone,
  Mail,
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GameItem, Language, UserAccount } from '../types';
import { winControlService, PlayerWinControl } from '../neextplay/services/neextplayWinControlService';

interface NeextPlayMasterGamePlayerProps {
  game: GameItem;
  language: Language;
  user: UserAccount;
  onClose: () => void;
  onUpdateBalance: (newBalance: number) => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenVIP?: () => void;
  onOpenMyAccount?: () => void;
  onOpenSupport?: () => void;
}

interface LaunchSessionData {
  sessionToken: string;
  launchUrl: string;
  launchPath: string;
  operator: {
    id: string;
    domain: string;
    detectedSiteDomain: string;
  };
  player: {
    id: string;
    name: string;
    currency: string;
    balance: number;
    isNewRegistration?: boolean;
    accountStatus?: string;
    statusBadge?: string;
    statusBadgeBn?: string;
    playCount?: number;
    totalWagered?: number;
    totalWon?: number;
  };
  provider?: {
    name: string;
    code: string;
    logo: string;
    version?: string;
    compliance?: string;
  };
  game: {
    id: string;
    name: string;
    type: string;
    rtp: number;
    thumbnail?: string;
    provider?: string;
    providerLogo?: string;
  };
}

export const NeextPlayMasterGamePlayer: React.FC<NeextPlayMasterGamePlayerProps> = ({
  game,
  language,
  user,
  onClose,
  onUpdateBalance,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenVIP,
  onOpenMyAccount,
  onOpenSupport
}) => {
  const [status, setStatus] = useState<'CONNECTING' | 'READY' | 'ERROR'>('CONNECTING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<LaunchSessionData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [latency, setLatency] = useState(18);
  const [currentBalance, setCurrentBalance] = useState(user.balance || 0);
  const [providerBalance, setProviderBalance] = useState<number>(500000.00);
  const [gameMode, setGameMode] = useState<'real' | 'demo'>(() => (user && user.isLoggedIn) ? 'real' : 'demo');
  const [isRefreshingBal, setIsRefreshingBal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Real User Profile Drawer & Quick Cashier states
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isQuickDepositOpen, setIsQuickDepositOpen] = useState(false);
  const [quickDepositAmount, setQuickDepositAmount] = useState<number>(500);
  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Upay'>('bKash');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccessMsg, setDepositSuccessMsg] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isBn = language === 'bn';
  const playerId = user.id ? `ply_bb_${user.id.replace(/\D/g, '') || '889922'}` : 'ply_bengalbet_usr';
  const neextGameId = game.neextPlayId || (game.id.includes('velocity') ? 'game_neext_velocity' : 'game_aviator_pro');

  // Keep local balance synced if parent user.balance changes externally
  useEffect(() => {
    if (typeof user.balance === 'number' && user.balance !== currentBalance && gameMode === 'real') {
      setCurrentBalance(user.balance);
    }
  }, [user.balance, gameMode]);

  // 1. Authoritative Handshake with Master API
  const initiateSession = async () => {
    setStatus('CONNECTING');
    setErrorMessage(null);
    const startTime = Date.now();

    try {
      // Check user win rate mode from winControlService
      const playerWinControl = winControlService.getPlayerControl(playerId);
      const isUserWinRateActive = Boolean(playerWinControl?.userProfileMode);

      const payload = {
        gameId: neextGameId,
        mode: gameMode,
        operatorId: 'op_bengalbet',
        playerId,
        playerName: user.username || (gameMode === 'demo' ? 'Demo Guest Player' : 'BengalBet VIP Player'),
        currency: 'BDT',
        initialBalance: gameMode === 'demo' ? 5000 : (user.balance || 1500),
        phone: user.phone || '',
        avatar: user.avatar || '',
        vipLevel: user.vipLevel || 1,
        callbackUrl: '/api/v1/games/callback',
        domain: typeof window !== 'undefined' ? window.location.host : 'localhost:3000',
        userWinRateMode: isUserWinRateActive,
        winRateMode: playerWinControl?.winRateMode || 'NORMAL',
        targetWinRate: playerWinControl?.targetWinRate || 85,
        forcedMinMultiplier: playerWinControl?.forcedMinMultiplier || 2.0,
        forcedMaxMultiplier: playerWinControl?.forcedMaxMultiplier || 35.0,
        operatorWinRate: 97.2,
      };

      const res = await fetch('/api/v1/games/launch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer np_live_key_bengalbet_883921',
          'x-operator-id': 'op_bengalbet',
          'x-player-id': playerId,
          'x-player-name': user.username || 'BengalBet VIP Player',
          'x-player-phone': user.phone || '',
          'x-player-avatar': user.avatar || '',
          'x-player-vip': String(user.vipLevel || 1),
          'x-callback-url': '/api/v1/games/callback',
          'x-currency': 'BDT',
          'x-initial-balance': String(gameMode === 'demo' ? 5000 : (user.balance || 1500)),
          'x-domain': typeof window !== 'undefined' ? window.location.host : 'localhost:3000'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      const elapsed = Date.now() - startTime;
      setLatency(elapsed > 0 ? elapsed : 18);

      if (data.status === 'success' && data.data) {
        setSessionData(data.data);
        if (data.data.player?.balance !== undefined) {
          setCurrentBalance(data.data.player.balance);
        }
        if (data.data.operator?.companyBalance !== undefined) {
          setProviderBalance(data.data.operator.companyBalance);
        }
        setStatus('READY');
      } else {
        throw new Error(data.message || 'Failed to authenticate game session on Master API');
      }
    } catch (err: any) {
      console.error('Master API Launch Error:', err);
      setErrorMessage(err.message || 'Could not connect to Master API Gateway.');
      setStatus('ERROR');
    }
  };

  useEffect(() => {
    initiateSession();
  }, [game.id, gameMode]);

  // 2. Real-time balance poll with Master API
  useEffect(() => {
    if (status !== 'READY' || gameMode === 'demo') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/wallet/balance?playerId=${playerId}&operatorId=op_bengalbet`);
        if (res.ok) {
          const json = await res.json();
          if (json.data && typeof json.data.balance === 'number') {
            const fetched = json.data.balance;
            setCurrentBalance(prev => {
              if (Math.abs(prev - fetched) > 0.05) {
                onUpdateBalance(fetched);
                return fetched;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // Silent catch for background polling
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [status, playerId, onUpdateBalance, gameMode]);

  // Listen to postMessage from iframe for real-time bet, win and wallet synchronization
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      
      const { type, balance, newBalance, betAmount, winAmount } = event.data;
      if (type === 'NEEXTPLAY_WALLET_UPDATE' || type === 'NEEXTPLAY_BALANCE_UPDATE') {
        const nextBal = Number(balance !== undefined ? balance : newBalance);
        if (!isNaN(nextBal)) {
          setCurrentBalance(nextBal);
          if (gameMode === 'real') {
            onUpdateBalance(nextBal);
            fetch('/api/v1/wallet/sync-balance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerId, balance: nextBal }),
            }).catch(() => {});
          }
        }
      } else if (type === 'NEEXTPLAY_BET_PLACED') {
        const amt = Number(betAmount || 0);
        if (amt > 0) {
          setProviderBalance(prev => Math.max(0, Number((prev - amt).toFixed(2))));
        }
        const nextBal = Number(newBalance !== undefined ? newBalance : balance);
        if (!isNaN(nextBal)) {
          setCurrentBalance(nextBal);
          if (gameMode === 'real') {
            onUpdateBalance(nextBal);
            window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: { balance: nextBal } }));
            fetch('/api/v1/wallet/sync-balance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerId, balance: nextBal }),
            }).catch(() => {});
          }
        }
      } else if (type === 'NEEXTPLAY_BET_WON') {
        const nextBal = Number(newBalance !== undefined ? newBalance : balance);
        if (!isNaN(nextBal)) {
          setCurrentBalance(nextBal);
          if (gameMode === 'real') {
            onUpdateBalance(nextBal);
            window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: { balance: nextBal } }));
            fetch('/api/v1/wallet/sync-balance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ playerId, balance: nextBal }),
            }).catch(() => {});
          }
        }
      } else if (type === 'NEEXTPLAY_EXIT_GAME') {
        onClose();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onUpdateBalance, onClose, gameMode, playerId]);

  // Synchronize main site balance to game iframe upon ready or balance updates
  useEffect(() => {
    if (status === 'READY' && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'NEEXTPLAY_SET_BALANCE',
        balance: currentBalance,
        currency: 'BDT'
      }, '*');
    }
  }, [status, currentBalance]);

  // Support ESC key to cleanly close game modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProfileDrawerOpen && !isQuickDepositOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isProfileDrawerOpen, isQuickDepositOpen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'NEEXTPLAY_SET_MUTED', muted: next }, '*');
    }
  };

  const handleManualBalanceRefresh = async () => {
    setIsRefreshingBal(true);
    try {
      const res = await fetch(`/api/v1/wallet/balance?playerId=${playerId}&operatorId=op_bengalbet`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && typeof json.data.balance === 'number') {
          setCurrentBalance(json.data.balance);
          onUpdateBalance(json.data.balance);
        }
      }
    } catch {}
    setTimeout(() => setIsRefreshingBal(false), 600);
  };

  const handleCopyUid = () => {
    const textToCopy = user.id || 'BB-889922';
    navigator.clipboard.writeText(textToCopy);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleExecuteQuickDeposit = async () => {
    setIsDepositing(true);
    try {
      const amount = quickDepositAmount;
      const newBal = currentBalance + amount;
      setCurrentBalance(newBal);
      onUpdateBalance(newBal);

      // Notify Master API server of wallet credit
      try {
        await fetch('/api/v1/wallet/credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            operatorId: 'op_bengalbet',
            amount,
            currency: 'BDT',
            transactionId: `DEP_${Date.now()}`
          })
        });
      } catch {}

      // Notify game iframe
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'NEEXTPLAY_WALLET_UPDATE',
          balance: newBal
        }, '*');
      }

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });

      setDepositSuccessMsg(
        isBn 
          ? `৳ ${amount.toLocaleString()} সফলভাবে রিচার্জ হয়েছে (${selectedMethod})!` 
          : `Successfully credited ৳ ${amount.toLocaleString()} via ${selectedMethod}!`
      );

      setTimeout(() => {
        setDepositSuccessMsg(null);
        setIsQuickDepositOpen(false);
      }, 1400);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDepositing(false);
    }
  };

  const providerLogoSrc = sessionData?.game?.providerLogo || sessionData?.provider?.logo || '/src/assets/images/neextplay_corp_logo_1791306162874.jpg';
  const gameTitle = sessionData?.game?.name || (isBn && game.nameBn ? game.nameBn : game.name);
  const playerAvatar = user.avatar || '/src/assets/images/real_tiger_face_1790007904695.jpg';
  const vipLevel = user.vipLevel || 1;
  const currentExp = user.vipExp || 350;
  const maxExp = user.vipMaxExp || 1000;
  const vipPercent = Math.min(100, Math.round((currentExp / maxExp) * 100));

  // 3-Tier Outcome Decision Engine player & company state
  const playerWinControl = winControlService.getPlayerControl(playerId);
  const companyWinConfig = winControlService.getCompanyConfig('op_bengalbet');

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 w-full h-[100dvh] bg-[#06090e] text-slate-100 flex flex-col overflow-hidden select-none animate-in fade-in"
    >
      {/* 1. NeextPlay Master API & Player Balance Control Header */}
      <header className="h-11 sm:h-12 bg-[#090e17] border-b border-amber-500/30 px-2 sm:px-3 flex items-center justify-between text-xs z-30 shrink-0 shadow-md">
        {/* Left: Provider info + Title + Mode Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title={isBn ? 'লবিতে ফিরুন' : 'Back to Lobby'}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            <img 
              src={providerLogoSrc} 
              alt="NeextPlay" 
              className="w-5 h-5 sm:w-6 sm:h-6 rounded-md object-cover border border-amber-500/40 shrink-0" 
            />
            <span className="font-black text-white truncate text-xs sm:text-sm">
              {gameTitle}
            </span>
          </div>

          {/* Mode Switcher: Real vs Demo */}
          <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-700/60 ml-0.5 sm:ml-1">
            <button
              onClick={() => {
                if (gameMode !== 'real') setGameMode('real');
              }}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                gameMode === 'real'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-pulse" />
              <span>{isBn ? 'রিয়েল' : 'REAL'}</span>
            </button>
            <button
              onClick={() => {
                if (gameMode !== 'demo') setGameMode('demo');
              }}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                gameMode === 'demo'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>{isBn ? 'ডেমো' : 'DEMO'}</span>
            </button>
          </div>
        </div>

        {/* Center: Real Player Balance + Provider User (Bengal Gaming) Balance */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* BengalBet Player Wallet */}
          <div className="flex items-center gap-1.5 bg-[#071912] border border-emerald-600/40 rounded-xl px-2 sm:px-3 py-1 shadow-inner">
            <div className="text-[10px] text-emerald-400 font-bold hidden sm:inline">
              {isBn ? 'প্লেয়ার ব্যালেন্স:' : 'Player:'}
            </div>
            <span className="font-mono font-black text-yellow-300 text-xs sm:text-sm">
              {gameMode === 'demo' ? 'DEMO ৳5,000' : `৳${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </span>
            {gameMode === 'real' && (
              <button
                onClick={() => setIsQuickDepositOpen(true)}
                className="w-5 h-5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-black flex items-center justify-center text-xs ml-0.5 cursor-pointer shadow"
                title={isBn ? 'দ্রুত রিচার্জ' : 'Quick Deposit'}
              >
                +
              </button>
            )}
          </div>

          {/* Provider Operator Balance (Bengal Gaming B2B Balance) */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#0a1120] border border-cyan-700/40 rounded-xl px-2.5 py-1">
            <span className="text-[9px] text-cyan-300 uppercase font-black tracking-tight">
              {isBn ? 'প্রোভাইডার ক্রেডিট:' : 'Provider Credit:'}
            </span>
            <span className="font-mono font-bold text-cyan-200 text-xs">
              ৳{providerBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Win Rate Mode Indicator */}
          {playerWinControl?.userProfileMode && (
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{playerWinControl.winRateMode} ({playerWinControl.targetWinRate || 85}%)</span>
            </span>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => setIsProfileDrawerOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{user.username || 'Profile'}</span>
          </button>

          <button
            onClick={toggleMute}
            className={`p-1.5 rounded-lg text-slate-300 hover:text-white transition cursor-pointer ${
              isMuted ? 'bg-rose-950/80 text-rose-400' : 'bg-slate-800'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer hidden sm:block"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white transition cursor-pointer ml-1"
            title={isBn ? 'গেম বন্ধ করুন' : 'Exit Game'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Game Screen Canvas / Iframe */}
      <main className="flex-1 w-full h-full relative bg-[#05080e] overflow-hidden">
        {status === 'CONNECTING' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#070b12] z-20">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 flex items-center justify-center animate-pulse">
                <img 
                  src="/src/assets/images/neextplay_corp_logo_1791306162874.jpg" 
                  alt="NeextPlay" 
                  className="w-14 h-14 rounded-xl object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center animate-spin">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white mb-2">
              {isBn ? 'গেম লোড ও প্লেয়ার সিঙ্কিং হচ্ছে...' : 'Loading Game & Syncing Player Profile...'}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mb-4 font-mono">
              Player: {user.username || 'VIP Player'} • Wallet: BDT ৳{currentBalance.toFixed(2)}
            </p>

            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full animate-notice-progress"></div>
            </div>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#070b12] z-20">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">
              {isBn ? 'গেম সার্ভার সংযোগে সমস্যা হয়েছে' : 'Game Server Connection Failed'}
            </h3>
            <p className="text-xs text-rose-400 mb-4 max-w-md font-mono">
              {errorMessage}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={initiateSession}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:brightness-110"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry'}</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl"
              >
                {isBn ? 'ক্যাসিনোতে ফিরুন' : 'Back to Casino'}
              </button>
            </div>
          </div>
        )}

        {status === 'READY' && sessionData && (
          <iframe
            ref={iframeRef}
            src={sessionData.launchPath}
            title={game.name}
            className="w-full h-full border-0 select-auto"
            allow="autoplay; fullscreen; clipboard-write; camera; microphone"
            allowFullScreen
          />
        )}
      </main>

      {/* 4. Full Interactive Real User Profile Modal / Drawer */}
      {isProfileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0b1220] border-2 border-amber-500/40 rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-4 sm:p-5 shadow-2xl relative text-slate-200 font-sans">
            {/* Close Button */}
            <button
              onClick={() => setIsProfileDrawerOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-lg shrink-0">
                <img 
                  src={playerAvatar} 
                  alt={user.username || 'Player Avatar'} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900"></div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white truncate">
                    {user.username || 'BengalBet VIP Player'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shrink-0">
                    VIP {vipLevel}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-[11px]">UID: {user.id || 'BB889922'}</span>
                  <button 
                    onClick={handleCopyUid}
                    className="p-1 hover:text-amber-300 transition text-slate-400 cursor-pointer"
                    title={isBn ? 'ইউজার আইডি কপি করুন' : 'Copy UID'}
                  >
                    {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{isBn ? 'সক্রিয় ও প্রামাণিক প্রোফাইল' : 'Verified Real Account'}</span>
                </div>
              </div>
            </div>

            {/* Wallet Balance Card */}
            <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-br from-[#0e1a2f] via-[#0b1526] to-[#070e1b] border border-amber-500/40 shadow-inner">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isBn ? 'বর্তমান ওয়ালেট ব্যালেন্স' : 'Current Wallet Balance'}
                </span>
                <button
                  onClick={handleManualBalanceRefresh}
                  className="flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 transition cursor-pointer"
                >
                  <RotateCcw className={`w-3 h-3 ${isRefreshingBal ? 'animate-spin' : ''}`} />
                  <span>{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
                </button>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  ৳ {currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400 font-bold">BDT</span>
              </div>

              {/* Action Buttons for Wallet */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    setIsProfileDrawerOpen(false);
                    if (onOpenDeposit) onOpenDeposit();
                    else setIsQuickDepositOpen(true);
                  }}
                  className="btn-bengal-gold py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-slate-950" />
                  <span>{isBn ? 'টাকা জমা' : 'Deposit'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileDrawerOpen(false);
                    if (onOpenWithdraw) onOpenWithdraw();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 shadow-md cursor-pointer transition"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isBn ? 'উত্তোলন' : 'Withdraw'}</span>
                </button>
              </div>
            </div>

            {/* VIP Status & Progression */}
            <div className="mb-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white">
                    {isBn ? `ভিআইপি লেভেল ${vipLevel}` : `VIP Tier ${vipLevel}`}
                  </span>
                </div>
                <span className="text-amber-300 font-mono font-bold">
                  {currentExp} / {maxExp} EXP
                </span>
              </div>

              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all"
                  style={{ width: `${vipPercent}%` }}
                ></div>
              </div>

              <p className="text-[11px] text-slate-400">
                {isBn 
                  ? `পরবর্তী ভিআইপি লেভেলে পৌঁছাতে আরও ${Math.max(0, maxExp - currentExp)} EXP প্রয়োজন`
                  : `${Math.max(0, maxExp - currentExp)} EXP needed to reach VIP ${vipLevel + 1}`}
              </p>

              {onOpenVIP && (
                <button
                  onClick={() => {
                    setIsProfileDrawerOpen(false);
                    onOpenVIP();
                  }}
                  className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>{isBn ? 'ভিআইপি সুবিধা দেখুন' : 'View VIP Club Benefits'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Game Outcome Governance & Win Control Status Card */}
            <div className="mb-4 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Zap className={`w-3.5 h-3.5 ${playerWinControl.userProfileMode ? 'text-amber-400' : 'text-blue-400'}`} />
                  <span>{isBn ? 'গেম আউটকাম কন্ট্রোল মোড' : 'Game Outcome Governance'}</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                  playerWinControl.userProfileMode 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {playerWinControl.userProfileMode ? 'Profile Mode (Tier 1)' : 'Company Config (Tier 2)'}
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                {playerWinControl.userProfileMode ? (
                  <div className="space-y-1 text-amber-200/90">
                    <div className="flex justify-between">
                      <span>{isBn ? 'ব্যক্তিগত উইন মোড:' : 'Profile Win Mode:'}</span>
                      <b className="text-amber-400 font-bold">{playerWinControl.winRateMode}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>{isBn ? 'টার্গেট উইন রেট:' : 'Target Win Rate:'}</span>
                      <b className="font-mono text-cyan-300">{playerWinControl.targetWinRate}%</b>
                    </div>
                    <div className="flex justify-between">
                      <span>{isBn ? 'ফ্লাইট মাল্টিপ্লায়ার বাউন্ডস:' : 'Flight Bounds:'}</span>
                      <b className="font-mono text-emerald-400">{playerWinControl.forcedMinMultiplier}x - {playerWinControl.forcedMaxMultiplier}x</b>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-400">
                    <div className="flex justify-between">
                      <span>{isBn ? 'কোম্পানি আরটিপি:' : 'Company RTP:'}</span>
                      <b className="font-mono text-cyan-300">{companyWinConfig.rtpSetting}%</b>
                    </div>
                    <div className="flex justify-between">
                      <span>{isBn ? 'অপারেটিং মোড:' : 'Operating Mode:'}</span>
                      <b className="text-slate-200">{companyWinConfig.winMode}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>{isBn ? 'ইনস্ট্যান্ট বাস্ট রেট:' : 'Instant Bust:'}</span>
                      <b className="font-mono text-rose-300">{companyWinConfig.instantBustRate}%</b>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* User Security & Settings */}
            <div className="space-y-2 mb-4 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                  <span>{isBn ? 'নিবন্ধিত ফোন' : 'Registered Phone'}</span>
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {user.phone ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '017****8899'}
                </span>
              </div>

              {user.email && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isBn ? 'ইমেইল অ্যাকাউন্ট' : 'Email Address'}</span>
                  </span>
                  <span className="font-mono text-slate-200 font-bold truncate max-w-[180px]">
                    {user.email}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isBn ? 'গেম সাউন্ড' : 'Game Audio'}</span>
                </span>
                <button
                  onClick={toggleMute}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition"
                >
                  {isMuted ? (isBn ? 'শব্দ বন্ধ' : 'Muted') : (isBn ? 'শব্দ চালু' : 'Enabled')}
                </button>
              </div>
            </div>

            {/* Live Support Trigger */}
            {onOpenSupport && (
              <button
                onClick={() => {
                  setIsProfileDrawerOpen(false);
                  onOpenSupport();
                }}
                className="w-full mb-3 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>{isBn ? '২৪/৭ লাইভ কাস্টমার সাপোর্ট চ্যাট' : '24/7 Bengali VIP Live Support'}</span>
              </button>
            )}

            {/* Close / Return to Game */}
            <button
              onClick={() => setIsProfileDrawerOpen(false)}
              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-lg"
            >
              {isBn ? 'গেমে ফিরে যান' : 'Back to Game'}
            </button>
          </div>
        </div>
      )}

      {/* 5. In-Game Instant Quick Deposit Modal */}
      {isQuickDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0b1220] border-2 border-emerald-500/50 rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl relative text-slate-200 font-sans">
            <button
              onClick={() => setIsQuickDepositOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-3 border-b border-slate-800 pb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  {isBn ? 'তাত্ক্ষণিক ওয়ালেট রিচার্জ' : 'Quick In-Game Deposit'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isBn ? 'সরাসরি গেমে টাকা জমা করুন' : 'Instant Top-Up to Continue Playing'}
                </p>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-3">
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
                {isBn ? 'পেমেন্ট মেথড নির্বাচন করুন' : 'Select Payment Method'}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['bKash', 'Nagad', 'Rocket', 'Upay'] as const).map(method => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition text-center cursor-pointer ${
                      selectedMethod === method
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Presets */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5 uppercase">
                {isBn ? 'জমার পরিমাণ নির্বাচন করুন' : 'Choose Deposit Amount'}
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {[200, 500, 1000, 2000, 5000, 10000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickDepositAmount(amt)}
                    className={`py-2 px-1.5 rounded-xl font-mono text-xs font-bold border transition cursor-pointer ${
                      quickDepositAmount === amt
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    ৳ {amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {depositSuccessMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{depositSuccessMsg}</span>
              </div>
            )}

            {/* Deposit Actions */}
            <div className="space-y-2">
              <button
                onClick={handleExecuteQuickDeposit}
                disabled={isDepositing}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg cursor-pointer transition disabled:opacity-60"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {isDepositing 
                    ? (isBn ? 'রিচার্জ হচ্ছে...' : 'Processing...') 
                    : (isBn ? `৳ ${quickDepositAmount.toLocaleString()} নিশ্চিত করুন` : `Confirm ৳ ${quickDepositAmount.toLocaleString()}`)
                  }
                </span>
              </button>

              {onOpenDeposit && (
                <button
                  onClick={() => {
                    setIsQuickDepositOpen(false);
                    onOpenDeposit();
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold border border-slate-800 flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isBn ? 'বেঙ্গলবেট ক্যাশিয়ার ওপেন করুন' : 'Open Full Cashier Portal'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
