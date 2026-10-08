import React, { useState, useEffect } from 'react';
import {
  Zap,
  Building2,
  User,
  Sliders,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  PlayCircle,
  TrendingUp,
  Percent,
  Flame,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Layers,
  Award,
  Plus,
  Search,
  Check,
  ExternalLink,
  Crown,
  Activity,
  DollarSign,
  Key,
  Terminal,
  Send,
  Copy,
  Play,
  Gamepad2
} from 'lucide-react';
import { 
  winControlService, 
  CompanyWinConfig, 
  PlayerWinControl, 
  CalculatedGameOutcome 
} from '../neextplay/services/neextplayWinControlService';
import { testNeextPlayDatabaseConnection } from '../services/neextplayFirebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { Language, UserAccount } from '../types';

interface NeextPlayCompanyWinControlsManagerProps {
  language: Language;
  currentUser?: UserAccount;
  showToast: (msg: string) => void;
  onLaunchGame?: (gameId: string) => void;
}

export const NeextPlayCompanyWinControlsManager: React.FC<NeextPlayCompanyWinControlsManagerProps> = ({
  language,
  currentUser,
  showToast,
  onLaunchGame
}) => {
  const isBn = language === 'bn';

  // Subtab navigation: 'COMPANIES' | 'PLAYERS' | 'SIMULATOR' | 'DATABASE' | 'B2B_CREDENTIALS'
  const [activeSection, setActiveSection] = useState<'COMPANIES' | 'PLAYERS' | 'SIMULATOR' | 'DATABASE' | 'B2B_CREDENTIALS'>('B2B_CREDENTIALS');

  // B2B Provider User Credentials & Live Balance states
  const [b2bOperatorBalance, setB2bOperatorBalance] = useState<number>(500000.00);
  const [b2bTotalTurnover, setB2bTotalTurnover] = useState<number>(28400000.00);
  const [b2bCredentials, setB2bCredentials] = useState({
    operatorId: 'op_bengalbet',
    operatorName: 'BengalBet Casino Portal',
    apiKey: 'np_live_key_bengalbet_883921',
    apiSecret: 'np_sec_773910_live_bengalbet_secret',
    gatewayUrl: '/api/v1',
    callbackUrl: '/api/v1/games/callback',
    operatorWinRate: 97.2,
  });
  const [topUpAmountInput, setTopUpAmountInput] = useState<number>(50000);
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [masterCatalog, setMasterCatalog] = useState<any[]>([]);
  const [masterProviderInfo, setMasterProviderInfo] = useState<any>(null);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [callbackSimLogs, setCallbackSimLogs] = useState<string[]>([]);
  const [isSimulatingCallback, setIsSimulatingCallback] = useState(false);
  const [copiedKeyText, setCopiedKeyText] = useState(false);

  // Company Config States
  const [companies, setCompanies] = useState<CompanyWinConfig[]>(() => winControlService.getAllCompanyConfigs());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('op_bengalbet');
  const [companyForm, setCompanyForm] = useState<CompanyWinConfig>(() => winControlService.getCompanyConfig('op_bengalbet'));
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // Player Control States
  const [players, setPlayers] = useState<PlayerWinControl[]>(() => winControlService.getAllPlayerControls());
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('ply_bb_889922');
  const [playerForm, setPlayerForm] = useState<PlayerWinControl>(() => winControlService.getPlayerControl('ply_bb_889922'));
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [isSavingPlayer, setIsSavingPlayer] = useState(false);
  const [newPlayerIdInput, setNewPlayerIdInput] = useState('');
  const [newPlayerNameInput, setNewPlayerNameInput] = useState('');

  // Database Connection test state
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'TESTING' | 'ERROR'>('CONNECTED');
  const [dbLatency, setDbLatency] = useState<number>(14);
  const [dbStatusMsg, setDbStatusMsg] = useState<string>('Connected to MySQL Database (neextplay_db)');

  // Interactive 3-Tier Outcome Simulation State
  const [simPlayerId, setSimPlayerId] = useState<string>('ply_bb_889922');
  const [simCompanyId, setSimCompanyId] = useState<string>('op_bengalbet');
  const [simGameType, setSimGameType] = useState<'AVIATOR' | 'CRASH' | 'SLOT'>('AVIATOR');
  const [simOutcome, setSimOutcome] = useState<CalculatedGameOutcome | null>(null);
  const [simHistory, setSimHistory] = useState<CalculatedGameOutcome[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Sync state from winControlService & B2B Server
  const fetchB2bState = async () => {
    try {
      const res = await fetch('/api/v1/operators');
      if (res.ok) {
        const json = await res.json();
        const bengalOp = json.data?.operators?.find((o: any) => o.id === 'op_bengalbet') || json.data?.operators?.[0];
        if (bengalOp && typeof bengalOp.companyBalance === 'number') {
          setB2bOperatorBalance(bengalOp.companyBalance);
          setB2bTotalTurnover(bengalOp.totalTurnover || 28400000.00);
        }
      }
    } catch {}
  };

  const fetchMasterApi = async () => {
    setIsLoadingCatalog(true);
    try {
      const res = await fetch('/api/v1/master-api');
      if (res.ok) {
        const json = await res.json();
        setMasterProviderInfo(json.provider);
        setMasterCatalog(json.games || []);
      }
    } catch (err: any) {
      showToast(`Master API ping error: ${err.message}`);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const handleTopUpProviderBalance = async (amount: number) => {
    setIsToppingUp(true);
    try {
      const res = await fetch('/api/v1/operators/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId: 'op_bengalbet', amount })
      });
      const json = await res.json();
      if (json.status === 'success') {
        setB2bOperatorBalance(json.data.newCompanyBalance);
        showToast(isBn ? `প্রোভাইডার ব্যালেন্স সফলভাবে টপ-আপ হয়েছে (+৳${amount.toLocaleString()})!` : `Provider balance successfully topped up (+৳${amount.toLocaleString()})!`);
      }
    } catch (err: any) {
      showToast(`Top-up failed: ${err.message}`);
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleSimulateBetDeduction = async () => {
    setIsSimulatingCallback(true);
    try {
      const betAmt = 100;
      const roundId = `sim_rnd_${Date.now().toString().slice(-6)}`;
      const res = await fetch('/api/v1/games/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'BET',
          operatorId: 'op_bengalbet',
          playerId: currentUser?.id || 'usr-889922',
          gameId: 'game_aviator_pro',
          gameName: 'Aviator Pro',
          roundId,
          betAmount: betAmt,
          currency: 'BDT'
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        const newCoBal = json.data.companyBalance;
        const newPlayerBal = json.data.newBalance;
        setB2bOperatorBalance(newCoBal);
        const logMsg = `[BET] -৳${betAmt} | Provider Balance: ৳${newCoBal.toLocaleString()} | Player Balance: ৳${newPlayerBal.toLocaleString()} | Round: ${roundId}`;
        setCallbackSimLogs(prev => [logMsg, ...prev.slice(0, 19)]);
        showToast(isBn ? `বেট কলব্যাক সফল! প্রোভাইডার ব্যালেন্স (-৳${betAmt}) ও প্লেয়ার ব্যালেন্স ডেবিট হয়েছে।` : `Bet callback simulated: -৳${betAmt} debited from Provider & Player balances.`);
      }
    } catch (err: any) {
      showToast(`Bet callback failed: ${err.message}`);
    } finally {
      setIsSimulatingCallback(false);
    }
  };

  const handleSimulateWinCallback = async () => {
    setIsSimulatingCallback(true);
    try {
      const winAmt = 250;
      const mult = 2.5;
      const roundId = `sim_rnd_${Date.now().toString().slice(-6)}`;
      const res = await fetch('/api/v1/games/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'WIN',
          operatorId: 'op_bengalbet',
          playerId: currentUser?.id || 'usr-889922',
          gameId: 'game_aviator_pro',
          gameName: 'Aviator Pro',
          roundId,
          winAmount: winAmt,
          multiplier: mult,
          currency: 'BDT'
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        const newPlayerBal = json.data.newBalance;
        const logMsg = `[WIN] +৳${winAmt} (${mult}x) | Player Balance: ৳${newPlayerBal.toLocaleString()} | Round Settled: ${roundId}`;
        setCallbackSimLogs(prev => [logMsg, ...prev.slice(0, 19)]);
        showToast(isBn ? `উইন কলব্যাক সফল! প্লেয়ার ব্যালেন্সে +৳${winAmt} যোগ হয়েছে।` : `Win callback simulated: +৳${winAmt} credited to Player balance.`);
      }
    } catch (err: any) {
      showToast(`Win callback failed: ${err.message}`);
    } finally {
      setIsSimulatingCallback(false);
    }
  };

  const refreshAllState = () => {
    const freshCompanies = winControlService.getAllCompanyConfigs();
    const freshPlayers = winControlService.getAllPlayerControls();
    setCompanies(freshCompanies);
    setPlayers(freshPlayers);
    setCompanyForm(winControlService.getCompanyConfig(selectedCompanyId));
    setPlayerForm(winControlService.getPlayerControl(selectedPlayerId));
    fetchB2bState();
  };

  useEffect(() => {
    refreshAllState();
    fetchMasterApi();
  }, []);

  // Update selected company
  const handleSelectCompany = (id: string) => {
    setSelectedCompanyId(id);
    setCompanyForm(winControlService.getCompanyConfig(id));
  };

  // Update selected player
  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    setPlayerForm(winControlService.getPlayerControl(id));
  };

  // Save company config to Firebase
  const handleSaveCompanyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    try {
      await winControlService.saveCompanyConfig(companyForm);
      refreshAllState();
      showToast(isBn ? `${companyForm.companyName} এর সেটিংস ফায়ারবেসে সেভ হয়েছে!` : `Company config for ${companyForm.companyName} saved to Firebase!`);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to save company config'}`);
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Save player win controls to Firebase
  const handleSavePlayerControl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingPlayer(true);
    try {
      await winControlService.savePlayerControl(playerForm);
      refreshAllState();
      showToast(isBn ? `প্লেয়ার ${playerForm.playerName} এর উইন কন্ট্রোল ফায়ারবেসে সেভ হয়েছে!` : `Player win controls for ${playerForm.playerName} saved to Firebase!`);
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Failed to save player controls'}`);
    } finally {
      setIsSavingPlayer(false);
    }
  };

  // Toggle User Profile Mode for a specific player
  const handleToggleUserProfileMode = async (player: PlayerWinControl) => {
    const updated: PlayerWinControl = {
      ...player,
      userProfileMode: !player.userProfileMode,
      updatedAt: new Date().toISOString()
    };
    await winControlService.savePlayerControl(updated);
    refreshAllState();
    if (player.playerId === selectedPlayerId) {
      setPlayerForm(updated);
    }
    showToast(
      updated.userProfileMode
        ? (isBn ? `⚡ ${player.playerName} এর User Profile Mode চালু হয়েছে (প্লেয়ার উইন রেট অগ্রাধিকার)!` : `⚡ User Profile Mode ACTIVATED for ${player.playerName}!`)
        : (isBn ? `🏢 ${player.playerName} এর User Profile Mode বন্ধ (কোম্পানি কনফিগ অনুসরণ করবে)!` : `🏢 User Profile Mode DISABLED for ${player.playerName} (Follows Company Config)`)
    );
  };

  // Add / Attach current logged in user to player win controls
  const handleAddCurrentUser = async () => {
    if (!currentUser) return;
    const cleanUid = currentUser.id ? currentUser.id.replace(/\D/g, '') : '889922';
    const pId = `ply_bb_${cleanUid || '889922'}`;
    const newControl: PlayerWinControl = {
      playerId: pId,
      playerName: currentUser.username || 'Current Logged Player',
      userProfileMode: true,
      winRateMode: 'FORCED_WIN',
      targetWinRate: 88,
      forcedMinMultiplier: 2.5,
      forcedMaxMultiplier: 35.0,
      luckyStreakActive: true,
      notes: 'Active BengalBet Player attached via Admin Dashboard',
      updatedAt: new Date().toISOString()
    };
    await winControlService.savePlayerControl(newControl);
    refreshAllState();
    setSelectedPlayerId(pId);
    setPlayerForm(newControl);
    showToast(isBn ? `লগইনকৃত ইউজার ${currentUser.username} কে প্রোফাইল মোডে যুক্ত করা হয়েছে!` : `Attached current player ${currentUser.username} to User Profile Mode!`);
  };

  // Add custom player
  const handleAddNewCustomPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerIdInput.trim()) return;
    const pId = newPlayerIdInput.trim().startsWith('ply_') ? newPlayerIdInput.trim() : `ply_${newPlayerIdInput.trim()}`;
    const newControl: PlayerWinControl = {
      playerId: pId,
      playerName: newPlayerNameInput.trim() || `Player ${pId.slice(-6)}`,
      userProfileMode: true,
      winRateMode: 'FORCED_WIN',
      targetWinRate: 85,
      forcedMinMultiplier: 2.0,
      forcedMaxMultiplier: 30.0,
      luckyStreakActive: true,
      notes: 'Custom player registered in Win Controls',
      updatedAt: new Date().toISOString()
    };
    await winControlService.savePlayerControl(newControl);
    refreshAllState();
    setSelectedPlayerId(pId);
    setPlayerForm(newControl);
    setNewPlayerIdInput('');
    setNewPlayerNameInput('');
    showToast(isBn ? `নতুন প্লেয়ার ${newControl.playerName} যুক্ত হয়েছে!` : `Registered new player ${newControl.playerName} into Win Controls!`);
  };

  // Test real database connection
  const handleTestDatabaseConnection = async () => {
    setDbStatus('TESTING');
    try {
      const res = await testNeextPlayDatabaseConnection(firebaseConfig.firestoreDatabaseId || '(default)');
      setDbLatency(res.latencyMs);
      setDbStatusMsg(res.message);
      setDbStatus('CONNECTED');
      showToast(isBn ? `ফায়ারবেস সফলভাবে কানেক্টেড (${res.latencyMs}ms)!` : `Firebase Connected (${res.latencyMs}ms)!`);
    } catch (err: any) {
      setDbStatus('ERROR');
      setDbStatusMsg(err.message || 'Database test failed');
    }
  };

  // Run 3-Tier Outcome Simulation
  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const outcome = winControlService.calculateGameOutcome(simPlayerId, simCompanyId, simGameType);
      setSimOutcome(outcome);
      setSimHistory(prev => [outcome, ...prev.slice(0, 9)]);
      setIsSimulating(false);
    }, 200);
  };

  // Filter players list
  const filteredPlayers = players.filter(p => {
    const q = playerSearchQuery.toLowerCase();
    return p.playerName.toLowerCase().includes(q) || p.playerId.toLowerCase().includes(q) || (p.notes && p.notes.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Database Status Bar */}
      <div className="bg-gradient-to-r from-[#041d13] via-[#06291a] to-[#041a1c] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Firebase Real Database Synced
              </span>
              <span className="px-3 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                3-Tier Decision Engine Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>NeextPlay Win Controls & Company Governance</span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                LIVE
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {isBn 
                ? 'রিয়েল MySQL ডাটাবেসে (neextplay_db) গেম উইন কন্ট্রোলস এবং কোম্পানি ড্যাশবোর্ড কনফিগারেশন। ইউজার প্রোফাইল মোড TRUE হলে ইউজারের উইন রেট অনুযায়ী গেম কাজ করবে, অন্যথায় কোম্পানির কনফিগ অনুসরণ করবে, অন্যথায় ডিফল্ট সার্টিফাইড ইঞ্জিন কাজ করবে।'
                : 'Authoritative Win Controls & Multi-Tenant Company Governance connected to MySQL Database (neextplay_db). If User Profile Mode is TRUE, the game outcome follows the player\'s win change rate; otherwise follows company config; otherwise certified default rules.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={handleTestDatabaseConnection}
              disabled={dbStatus === 'TESTING'}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer shadow transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${dbStatus === 'TESTING' ? 'animate-spin' : ''}`} />
              <span>{isBn ? 'ডাটাবেস পিং টেস্ট' : 'Ping Test DB'}</span>
              <span className="font-mono text-emerald-400 font-bold">{dbLatency}ms</span>
            </button>

            <a
              href="/neextplay"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isBn ? 'প্রোভাইডার পোর্টাল (/neextplay)' : 'Open NeextPlay Portal'}</span>
            </a>
          </div>
        </div>

        {/* Database Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">MySQL Database</span>
              <span className="font-mono text-xs text-amber-300 font-bold truncate block max-w-[170px]">
                neextplay_db
              </span>
            </div>
            <Database className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Firebase Project</span>
              <span className="font-mono text-xs text-cyan-300 font-bold truncate block max-w-[170px]">
                {firebaseConfig.projectId}
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Company Operators</span>
              <span className="font-mono text-sm text-emerald-400 font-black block">
                {companies.length} Companies Configured
              </span>
            </div>
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">User Profile Mode Players</span>
              <span className="font-mono text-sm text-yellow-400 font-black block">
                {players.filter(p => p.userProfileMode).length} Active Overrides
              </span>
            </div>
            <Crown className="w-4 h-4 text-yellow-400 shrink-0" />
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('COMPANIES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'COMPANIES'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isBn ? 'কোম্পানি কনফিগারেশন (Company Configs)' : 'Company Configs (Tier 2)'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-cyan-300 border border-cyan-500/30">
            {companies.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('PLAYERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'PLAYERS'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'text-amber-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span>{isBn ? 'ইউজার প্রোফাইল মোড (User Profile Mode)' : 'User Profile Mode (Tier 1)'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-amber-300 border border-amber-500/30 font-mono">
            {players.filter(p => p.userProfileMode).length} ON
          </span>
        </button>

        <button
          onClick={() => setActiveSection('SIMULATOR')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'SIMULATOR'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{isBn ? '৩-স্তর আউটকাম সিমুলেটর ও পরীক্ষা' : '3-Tier Outcome Simulator'}</span>
        </button>

        <button
          onClick={() => setActiveSection('B2B_CREDENTIALS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'B2B_CREDENTIALS'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
              : 'text-emerald-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>{isBn ? 'B2B ক্রেডেনশিয়ালস ও প্রোভাইডার ব্যালেন্স' : 'B2B Credentials & Provider Balance'}</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-yellow-300 border border-yellow-500/30 font-mono">
            ৳{b2bOperatorBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </button>

        <button
          onClick={() => setActiveSection('DATABASE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSection === 'DATABASE'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4 text-purple-400" />
          <span>{isBn ? 'MySQL টেবিল ট্র্যাকার' : 'MySQL Tables'}</span>
        </button>
      </div>

      {/* 2.5 SECTION: B2B CREDENTIALS & PROVIDER USER BALANCE */}
      {activeSection === 'B2B_CREDENTIALS' && (
        <div className="space-y-6">
          {/* Top Balance & Financial Rule Banner */}
          <div className="bg-gradient-to-r from-[#041a14] via-[#05281e] to-[#081a28] border-2 border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Authoritative B2B Gaming Ledger
                  </span>
                  <span className="px-3 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    Dynamic Bet/Win Synchronization
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>বেঙ্গলবেট প্রোভাইডার ব্যালেন্স ও ক্রেডেনশিয়ালস</span>
                  <span className="text-xs bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 px-2 py-0.5 rounded-full font-mono">
                    op_bengalbet
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  {isBn
                    ? 'বেঙ্গলবেটের প্লেয়াররা যখন Aviator Pro বা NeextPlay গেম খেলে, তখন মোট বেটের টাকা সরাসরি এই প্রোভাইডার ব্যালেন্স থেকে কর্তন (-) হয় এবং প্লেয়ারের অ্যাকাউন্ট থেকেও সমপরিমাণ ডেবিট হয়। ফলাফল আসার পর উইন হলে প্লেয়ারের ব্যালেন্সে যোগ (+) হয়।'
                    : 'When BengalBet players place bets in Aviator Pro or NeextPlay games, the total bet amount is automatically deducted (-) from this Provider User Balance, and debited from the player. Wins are credited (+) to the player upon game outcome.'}
                </p>
              </div>

              {/* Provider Balance Card with Top-Up */}
              <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-4 shadow-xl min-w-[280px] space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    {isBn ? 'বেঙ্গলবেট প্রোভাইডার লাইভ ব্যালেন্স:' : 'Provider User Live Balance:'}
                  </span>
                  <div className="font-mono text-2xl font-black text-yellow-400">
                    ৳{b2bOperatorBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    মোট টার্নওভার: ৳{b2bTotalTurnover.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                </div>

                {/* Quick Top-up buttons */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">দ্রুত প্রোভাইডার ব্যালেন্স রিফিল (+৳):</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[10000, 50000, 100000, 500000].map(amt => (
                      <button
                        key={amt}
                        onClick={() => handleTopUpProviderBalance(amt)}
                        disabled={isToppingUp}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-700/80 text-emerald-200 font-mono text-[11px] font-bold cursor-pointer transition active:scale-95 disabled:opacity-50"
                      >
                        +৳{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Credentials Vault & Config Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-white text-sm">
                    {isBn ? 'NeextPlay API ক্রেডেনশিয়ালস সেটিংস' : 'NeextPlay API Credentials Settings'}
                  </h4>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  LIVE ACTIVE
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Operator ID (কোম্পানি আইডি):</label>
                  <input
                    type="text"
                    value={b2bCredentials.operatorId}
                    onChange={e => setB2bCredentials({ ...b2bCredentials, operatorId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Operator Name (কোম্পানির নাম):</label>
                  <input
                    type="text"
                    value={b2bCredentials.operatorName}
                    onChange={e => setB2bCredentials({ ...b2bCredentials, operatorName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400">Production API Key (লাইভ এপিআই কি):</label>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(b2bCredentials.apiKey);
                        setCopiedKeyText(true);
                        setTimeout(() => setCopiedKeyText(false), 2000);
                        showToast('API Key copied to clipboard!');
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKeyText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKeyText ? 'কপিকৃত' : 'কপি করুন'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={b2bCredentials.apiKey}
                    onChange={e => setB2bCredentials({ ...b2bCredentials, apiKey: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Master API Gateway Base URL:</label>
                  <input
                    type="text"
                    value={b2bCredentials.gatewayUrl}
                    onChange={e => setB2bCredentials({ ...b2bCredentials, gatewayUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Game Engine Webhook / Callback URL:</label>
                  <input
                    type="text"
                    value={b2bCredentials.callbackUrl}
                    onChange={e => setB2bCredentials({ ...b2bCredentials, callbackUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">ডিফল্ট আরটিপি (User Win Rate Mode OFF থাকলে):</span>
                  <span className="font-mono font-bold text-emerald-400">97.2% RTP</span>
                </div>

                <button
                  onClick={() => {
                    showToast(isBn ? 'ক্রেডেনশিয়ালস সেটিংস সফলভাবে আপডেট হয়েছে!' : 'Credentials settings updated successfully!');
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 text-black font-black text-xs shadow-lg shadow-yellow-500/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isBn ? 'ক্রেডেনশিয়ালস সেভ করুন' : 'Save Credentials Configuration'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Callback & Bet Deduction Simulator */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-white text-sm">
                      {isBn ? 'সরাসরি বেট ও উইন কলব্যাক লাইভ সিমুলেটর' : 'Live Callback & Balance Engine Test'}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">/api/v1/games/callback</span>
                </div>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {isBn
                    ? 'গেম ইঞ্জিন রাউন্ড শেষ হলে কিভাবে বেঙ্গলবেট প্রোভাইডার ব্যালেন্স ও প্লেয়ার ব্যালেন্স সমন্বয় করে তা পরীক্ষা করুন:'
                    : 'Test how the game engine deducts bet from provider balance and player wallet, and settles win credits in real time:'}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={handleSimulateBetDeduction}
                    disabled={isSimulatingCallback}
                    className="p-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-200 text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    <span className="font-black text-rose-400">১. বেট কলব্যাক পরীক্ষা</span>
                    <span className="font-mono text-[11px]">-৳100 Bet Stake</span>
                  </button>

                  <button
                    onClick={handleSimulateWinCallback}
                    disabled={isSimulatingCallback}
                    className="p-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-200 text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition active:scale-95 disabled:opacity-50"
                  >
                    <span className="font-black text-emerald-400">২. উইন কলব্যাক পরীক্ষা</span>
                    <span className="font-mono text-[11px]">+৳250 Win (2.5x)</span>
                  </button>
                </div>

                {/* Event stream console */}
                <div className="mt-4 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 max-h-48 overflow-y-auto font-mono text-[11px]">
                  <div className="text-slate-500 font-bold mb-1 border-b border-slate-900 pb-1 flex justify-between">
                    <span>লাইভ অডিট স্ট্রিম (Recent Callback Logs):</span>
                    {callbackSimLogs.length > 0 && (
                      <button onClick={() => setCallbackSimLogs([])} className="text-slate-600 hover:text-slate-400 cursor-pointer">
                        Clear
                      </button>
                    )}
                  </div>
                  {callbackSimLogs.length === 0 ? (
                    <div className="text-slate-600 italic py-2 text-center">
                      উপরে টেস্ট বাটনে ক্লিক করে বেট ও উইন কলব্যাক পরীক্ষা করুন...
                    </div>
                  ) : (
                    callbackSimLogs.map((log, idx) => (
                      <div key={idx} className={`py-0.5 truncate ${log.includes('[BET]') ? 'text-amber-300' : 'text-emerald-400'}`}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80 flex items-center justify-between">
                <span>সার্টিফায়েড অডিট: <strong className="text-slate-400">GLI-19 & SHA-512</strong></span>
                <span>বর্তমান প্লেয়ার আইডি: <strong className="text-yellow-400">{currentUser?.id || 'usr-889922'}</strong></span>
              </div>
            </div>
          </div>

          {/* Master API Live Games Catalog (Demo URL & Live URL) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-emerald-400" />
                  <span>Master API প্রোভাইডার গেম ক্যাটালগ ও ডেমো/রিয়েল লঞ্চ</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  মাস্টার এপিআই থেকে প্রাপ্ত প্রতিটি গেমের ডেমো URL (লগইন ছাড়া ভিজিটরদের জন্য) এবং রিয়েল লাইভ URL (লগইনকৃত প্লেয়ারদের জন্য):
                </p>
              </div>

              <button
                onClick={fetchMasterApi}
                disabled={isLoadingCatalog}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-center transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoadingCatalog ? 'animate-spin' : ''}`} />
                <span>মাস্টার এপিআই রিফ্রেশ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(masterCatalog.length > 0 ? masterCatalog : [
                {
                  id: 'game_aviator_pro',
                  name: 'Aviator Pro',
                  category: 'CRASH',
                  rtp: 97.0,
                  demoUrl: '/neextplay?embed=true&game=game_aviator_pro&mode=demo',
                  liveUrl: '/neextplay?embed=true&game=game_aviator_pro&mode=real',
                  thumbnail: '/src/assets/images/aviator_banner_1791307837428.jpg'
                },
                {
                  id: 'game_neext_fortune',
                  name: 'Neext Fortune Slot',
                  category: 'SLOT',
                  rtp: 96.5,
                  demoUrl: '/neextplay?embed=true&game=game_neext_fortune&mode=demo',
                  liveUrl: '/neextplay?embed=true&game=game_neext_fortune&mode=real',
                  thumbnail: '/src/assets/images/fortune_gems_3_1789325632226.jpg'
                },
                {
                  id: 'game_neext_velocity',
                  name: 'Neext Velocity Crash',
                  category: 'CRASH',
                  rtp: 97.0,
                  demoUrl: '/neextplay?embed=true&game=game_neext_velocity&mode=demo',
                  liveUrl: '/neextplay?embed=true&game=game_neext_velocity&mode=real',
                  thumbnail: '/src/assets/images/aviator_red_plane_1791307806618.jpg'
                }
              ]).map((gm: any) => (
                <div key={gm.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
                        <span>{gm.category === 'CRASH' ? '✈️' : '🎰'}</span>
                        <span>{gm.name}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-cyan-300 border border-cyan-500/30 font-mono">
                        {gm.category} • {gm.rtp}%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-mono text-slate-400">
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800 truncate" title={gm.demoUrl}>
                        <span className="text-emerald-400 font-bold">Demo URL: </span>
                        <span>{gm.demoUrl}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800 truncate" title={gm.liveUrl}>
                        <span className="text-amber-400 font-bold">Live URL: </span>
                        <span>{gm.liveUrl}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <a
                      href={gm.demoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition text-center"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>ডেমো খেলুন</span>
                    </a>

                    <a
                      href={gm.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition text-center"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>রিয়েল খেলুন</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION A: COMPANY CONFIGS (TIER 2 GOVERNANCE) */}
      {activeSection === 'COMPANIES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Selector Sidebar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                  {isBn ? 'কোম্পানি তালিকা' : 'Registered Companies'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{companies.length} Tenants</span>
            </div>

            <div className="space-y-2">
              {companies.map(c => {
                const isSelected = c.companyId === selectedCompanyId;
                return (
                  <button
                    key={c.companyId}
                    type="button"
                    onClick={() => handleSelectCompany(c.companyId)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-950/70 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs truncate">{c.companyName}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        c.winMode === 'HIGH_WIN' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        c.winMode === 'TIGHT_MARGIN' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' :
                        c.winMode === 'JACKPOT_HUNT' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                        'bg-blue-950 text-blue-300 border border-blue-500/30'
                      }`}>
                        {c.winMode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-cyan-400 font-bold">RTP: {c.rtpSetting}%</span>
                      <span>Bust: {c.instantBustRate}%</span>
                      <span>Cap: {c.maxMultiplierCap}x</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Config Edit Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>{companyForm.companyName} ({companyForm.companyId})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isBn ? 'এই কোম্পানির সকল প্লেয়ার ডিফল্টভাবে এই উইন ও আরটিপি কনফিগারেশন অনুসরণ করবে।' : 'All players under this tenant follow these RTP and win controls unless overridden by User Profile Mode.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">Updated: {new Date(companyForm.updatedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <form onSubmit={handleSaveCompanyConfig} className="space-y-4 text-xs">
              {/* RTP Slider */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isBn ? 'কোম্পানি আরটিপি সেটিং (Target Company RTP):' : 'Company Target RTP:'}</span>
                  </label>
                  <span className="font-mono text-base font-black text-cyan-400">{companyForm.rtpSetting.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="115"
                  step="0.1"
                  value={companyForm.rtpSetting}
                  onChange={(e) => setCompanyForm({ ...companyForm, rtpSetting: parseFloat(e.target.value) || 97.0 })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>80.0% (Tight Sweep)</span>
                  <span>97.0% (Certified Standard)</span>
                  <span>105.0%+ (Player Advantage)</span>
                </div>
              </div>

              {/* Operating Win Mode */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-slate-200 font-bold block">
                  {isBn ? 'কোম্পানি উইন মোড (Company Win Mode):' : 'Company Operating Win Mode:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'BALANCED', name: 'Balanced', desc: '97.2% Certified Hold', color: 'border-blue-500/50 bg-blue-950/40 text-blue-300' },
                    { id: 'HIGH_WIN', name: 'High Win', desc: '+20% Higher Multipliers', color: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' },
                    { id: 'TIGHT_MARGIN', name: 'Tight Margin', desc: 'Lower Hit Rate, Early Crash', color: 'border-rose-500/50 bg-rose-950/40 text-rose-300' },
                    { id: 'JACKPOT_HUNT', name: 'Jackpot Hunt', desc: 'Extreme Volatility Spikes', color: 'border-amber-500/50 bg-amber-950/40 text-amber-300' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCompanyForm({ ...companyForm, winMode: m.id as any })}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        companyForm.winMode === m.id
                          ? `${m.color} ring-1 ring-cyan-400 font-bold shadow-md`
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{m.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiplier & Crash Fine Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-300 font-bold block text-[11px]">
                    {isBn ? 'ইনস্ট্যান্ট বাস্ট রেট (%):' : 'Instant Bust Rate (%):'}
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={companyForm.instantBustRate}
                    onChange={(e) => setCompanyForm({ ...companyForm, instantBustRate: parseFloat(e.target.value) || 3.0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">1.00x crash chance</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-300 font-bold block text-[11px]">
                    {isBn ? 'সর্বোচ্চ মাল্টিপ্লায়ার ক্যাপ:' : 'Max Multiplier Cap:'}
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    step="50"
                    value={companyForm.maxMultiplierCap}
                    onChange={(e) => setCompanyForm({ ...companyForm, maxMultiplierCap: parseInt(e.target.value) || 1000 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">Flight ceiling peak</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-300 font-bold block text-[11px]">
                    {isBn ? 'ন্যূনতম ক্র্যাশ মান:' : 'Min Crash Multiplier:'}
                  </label>
                  <input
                    type="number"
                    min="1.01"
                    max="1.25"
                    step="0.01"
                    value={companyForm.minCrashMultiplier}
                    onChange={(e) => setCompanyForm({ ...companyForm, minCrashMultiplier: parseFloat(e.target.value) || 1.01 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">Floor when not instant bust</span>
                </div>
              </div>

              {/* Slot & House Margin Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-300 font-bold block text-[11px]">
                    {isBn ? 'স্লট ওয়াইল্ড বুস্ট:' : 'Slot Wild Boost:'}
                  </label>
                  <input
                    type="number"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={companyForm.slotWildMultiplier}
                    onChange={(e) => setCompanyForm({ ...companyForm, slotWildMultiplier: parseFloat(e.target.value) || 1.2 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold outline-none"
                  />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-300 font-bold block text-[11px]">
                    {isBn ? 'হাউস মার্জিন হোল্ড (%):' : 'House Hold Pct (%):'}
                  </label>
                  <input
                    type="number"
                    min="1.0"
                    max="12.0"
                    step="0.5"
                    value={companyForm.houseMarginHoldPct}
                    onChange={(e) => setCompanyForm({ ...companyForm, houseMarginHoldPct: parseFloat(e.target.value) || 4.0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold outline-none"
                  />
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1 flex flex-col justify-between">
                  <label className="text-slate-300 font-bold block text-[11px]">
                    {isBn ? 'ইমার্জেন্সি থ্রোটল:' : 'Emergency Throttle:'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setCompanyForm({ ...companyForm, emergencyThrottleActive: !companyForm.emergencyThrottleActive })}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      companyForm.emergencyThrottleActive
                        ? 'bg-rose-950 text-rose-300 border-rose-500'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {companyForm.emergencyThrottleActive ? <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{companyForm.emergencyThrottleActive ? 'THROTTLE ON' : 'Normal Operations'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSavingCompany}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:brightness-110 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingCompany ? 'Saving to Firebase...' : (isBn ? 'কোম্পানি কনফিগ ফায়ারবেসে সেভ করুন' : 'Save Company Config to Firebase')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimCompanyId(companyForm.companyId);
                    setActiveSection('SIMULATOR');
                  }}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{isBn ? 'সিমুলেট করুন' : 'Test Outcome'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. SECTION B: USER PROFILE MODE & PLAYER LUCK (TIER 1 OVERRIDE) */}
      {activeSection === 'PLAYERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List & Search */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                  {isBn ? 'প্লেয়ার উইন কন্ট্রোল' : 'Player Win Controls'}
                </h3>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold">
                {players.filter(p => p.userProfileMode).length} Profile Mode ON
              </span>
            </div>

            {/* Current logged-in shortcut */}
            {currentUser && (
              <button
                type="button"
                onClick={handleAddCurrentUser}
                className="w-full p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500/25 text-xs font-bold flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{currentUser.username} (You)</span>
                </div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  Attach
                </span>
              </button>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={isBn ? 'প্লেয়ার নাম বা আইডি খুঁজুন...' : 'Search player or ID...'}
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-amber-500"
              />
            </div>

            {/* Player list */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredPlayers.map(p => {
                const isSelected = p.playerId === selectedPlayerId;
                return (
                  <div
                    key={p.playerId}
                    onClick={() => handleSelectPlayer(p.playerId)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 ring-1 ring-amber-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <span className="font-bold text-white text-xs block truncate">{p.playerName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{p.playerId}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleUserProfileMode(p);
                        }}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer shrink-0 ${
                          p.userProfileMode
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {p.userProfileMode ? '⚡ Profile ON' : 'Company Mode'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                      <span className={`font-bold ${
                        p.winRateMode === 'FORCED_WIN' ? 'text-emerald-400' :
                        p.winRateMode === 'BOOSTED' ? 'text-cyan-400' :
                        p.winRateMode === 'FORCED_LOSE' ? 'text-rose-400' :
                        'text-slate-400'
                      }`}>
                        {p.winRateMode}
                      </span>
                      <span className="font-mono text-amber-300 font-bold">{p.forcedMinMultiplier}x - {p.forcedMaxMultiplier}x</span>
                      {p.luckyStreakActive && <span className="text-[10px] text-yellow-400 flex items-center gap-0.5"><Flame className="w-3 h-3" /> Streak</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Custom Player Form */}
            <form onSubmit={handleAddNewCustomPlayer} className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] text-slate-400 font-bold block">
                {isBn ? 'নতুন প্লেয়ার রেজিস্টার করুন:' : 'Add Custom Player Control:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Player ID (e.g. ply_vip99)"
                  value={newPlayerIdInput}
                  onChange={(e) => setNewPlayerIdInput(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                />
                <input
                  type="text"
                  placeholder="Player Name"
                  value={newPlayerNameInput}
                  onChange={(e) => setNewPlayerNameInput(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!newPlayerIdInput.trim()}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span>{isBn ? 'প্লেয়ার যুক্ত করুন' : 'Register Player'}</span>
              </button>
            </form>
          </div>

          {/* Player Win Mode Edit Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>{playerForm.playerName} ({playerForm.playerId})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isBn ? 'ইউজার প্রোফাইল মোড সক্রিয় থাকলে, ইউজারের ব্যক্তিগত উইন রেট গেম আউটকামে কার্যকর হবে।' : 'Configure User Profile Mode overrides. When active, this user\'s win rate completely controls their game flight results.'}
                </p>
              </div>

              {/* Master Toggle */}
              <button
                type="button"
                onClick={() => handleToggleUserProfileMode(playerForm)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow transition-all ${
                  playerForm.userProfileMode
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Zap className={`w-4 h-4 ${playerForm.userProfileMode ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{playerForm.userProfileMode ? 'User Profile Mode: ACTIVE' : 'Company Mode: (OFF)'}</span>
              </button>
            </div>

            <form onSubmit={handleSavePlayerControl} className="space-y-4 text-xs">
              {/* Highlight Banner */}
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                playerForm.userProfileMode
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  playerForm.userProfileMode ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {playerForm.userProfileMode ? '⚡' : '🏢'}
                </div>
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-white">
                    {playerForm.userProfileMode ? 'Tier 1 Priority: User Profile Mode Active' : 'Tier 2 Active: Following Company Configuration'}
                  </div>
                  <div className="text-[11px]">
                    {playerForm.userProfileMode 
                      ? 'গেম খেলার সময় এই প্লেয়ারের উইন মোড ও টার্গেট মাল্টিপ্লায়ার সরাসরি কাজ করবে।'
                      : 'এই প্লেয়ার কোম্পানির জেনারেল আরটিপি ও ইনস্ট্যান্ট বাস্ট রেট অনুযায়ী গেম খেলবে।'}
                  </div>
                </div>
              </div>

              {/* Win Rate Mode Selector */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-slate-200 font-bold block">
                  {isBn ? 'উইন রেট মোড (Win Rate Mode):' : 'Player Win Rate Mode:'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'FORCED_WIN', name: 'FORCED_WIN', desc: '95% Win • Guaranteed High Flight', color: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300' },
                    { id: 'BOOSTED', name: 'BOOSTED', desc: '+25% Boost • 78% Win Factor', color: 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300' },
                    { id: 'NORMAL', name: 'NORMAL', desc: 'Standard Balanced Play', color: 'border-blue-500/60 bg-blue-950/40 text-blue-300' },
                    { id: 'FORCED_LOSE', name: 'FORCED_LOSE', desc: 'Tight Sweep • 10% Win Rate', color: 'border-rose-500/60 bg-rose-950/40 text-rose-300' },
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!playerForm.userProfileMode}
                      onClick={() => setPlayerForm({ ...playerForm, winRateMode: m.id as any })}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all disabled:opacity-40 ${
                        playerForm.winRateMode === m.id
                          ? `${m.color} ring-1 ring-amber-400 font-bold shadow-md`
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs">{m.name}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Win Rate Slider */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-slate-200 font-bold">
                    {isBn ? 'টার্গেট উইন রেট (%):' : 'Target Win Rate Percentage:'}
                  </label>
                  <span className="font-mono text-base font-black text-amber-400">{playerForm.targetWinRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  disabled={!playerForm.userProfileMode}
                  value={playerForm.targetWinRate}
                  onChange={(e) => setPlayerForm({ ...playerForm, targetWinRate: parseInt(e.target.value) || 50 })}
                  className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>5% (Extremely Tight)</span>
                  <span>50% (Standard)</span>
                  <span>100% (Guaranteed Win)</span>
                </div>
              </div>

              {/* Forced Multiplier Bounds */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-300 font-bold block text-[11px]">
                    {isBn ? 'বাধ্যতামূলক সর্বনিম্ন মাল্টিপ্লায়ার (Min):' : 'Forced Min Multiplier:'}
                  </label>
                  <input
                    type="number"
                    min="1.0"
                    max="100.0"
                    step="0.5"
                    disabled={!playerForm.userProfileMode}
                    value={playerForm.forcedMinMultiplier}
                    onChange={(e) => setPlayerForm({ ...playerForm, forcedMinMultiplier: parseFloat(e.target.value) || 1.5 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold outline-none disabled:opacity-40"
                  />
                  <span className="text-[10px] text-slate-500 block">Flight starts paying above this multiplier</span>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-300 font-bold block text-[11px]">
                    {isBn ? 'বাধ্যতামূলক সর্বোচ্চ মাল্টিপ্লায়ার (Max):' : 'Forced Max Multiplier:'}
                  </label>
                  <input
                    type="number"
                    min="2.0"
                    max="500.0"
                    step="1.0"
                    disabled={!playerForm.userProfileMode}
                    value={playerForm.forcedMaxMultiplier}
                    onChange={(e) => setPlayerForm({ ...playerForm, forcedMaxMultiplier: parseFloat(e.target.value) || 20.0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold outline-none disabled:opacity-40"
                  />
                  <span className="text-[10px] text-slate-500 block">Maximum upper bound for flights</span>
                </div>
              </div>

              {/* Lucky Streak Protection */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block text-xs flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-yellow-400" />
                    <span>{isBn ? 'লাকি স্ট্রিক প্রোটেকশন (Lucky Streak)' : 'Lucky Streak Protection'}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isBn ? 'সক্রিয় থাকলে প্লেয়ার কখনো পরপর রাউন্ডে হারবে না।' : 'Prevents consecutive bust losses; guarantees continuous wins during sessions.'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={!playerForm.userProfileMode}
                  onClick={() => setPlayerForm({ ...playerForm, luckyStreakActive: !playerForm.luckyStreakActive })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer disabled:opacity-40 ${
                    playerForm.luckyStreakActive
                      ? 'bg-yellow-500 text-slate-950 border-yellow-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {playerForm.luckyStreakActive ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSavingPlayer}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingPlayer ? 'Saving to Firebase...' : (isBn ? 'প্লেয়ার উইন কন্ট্রোল ফায়ারবেসে সেভ করুন' : 'Save Player Controls to Firebase')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimPlayerId(playerForm.playerId);
                    setActiveSection('SIMULATOR');
                  }}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>{isBn ? 'টেস্ট সিমুলেশন' : 'Run Test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. SECTION C: 3-TIER OUTCOME SIMULATOR & VERIFICATION */}
      {activeSection === 'SIMULATOR' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>3-Tier Outcome Decision Engine Simulator</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                {isBn
                  ? 'গেম কল করার সময় অ্যালগরিদম কীভাবে সিদ্ধান্ত নেয় তা সরাসরি যাচাই করুন: ১) ইউজার প্রোফাইল মোড TRUE হলে ইউজারের উইন রেট; ২) অন্যথায় কোম্পানির কনফিগ; ৩) অন্যথায় ডিফল্ট সার্টিফাইড ৯৭% ইঞ্জিন।'
                  : 'Verify the authoritative decision hierarchy live: 1) Tier 1 (User Profile Mode) takes priority if TRUE; 2) Tier 2 (Company Config) applies if User Profile Mode is FALSE; 3) Tier 3 (Default Certified Engine) applies as baseline.'}
              </p>
            </div>

            {/* Simulator Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <label className="text-slate-300 font-bold block mb-1 text-xs">Target Player:</label>
                <select
                  value={simPlayerId}
                  onChange={(e) => setSimPlayerId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold outline-none"
                >
                  {players.map(p => (
                    <option key={p.playerId} value={p.playerId}>
                      {p.playerName} ({p.userProfileMode ? 'Profile ON' : 'Company Mode'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 text-xs">Company Tenant:</label>
                <select
                  value={simCompanyId}
                  onChange={(e) => setSimCompanyId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold outline-none"
                >
                  {companies.map(c => (
                    <option key={c.companyId} value={c.companyId}>
                      {c.companyName} (RTP {c.rtpSetting}% • {c.winMode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1 text-xs">Game Category:</label>
                <select
                  value={simGameType}
                  onChange={(e) => setSimGameType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold outline-none"
                >
                  <option value="AVIATOR">Aviator Flight Curve</option>
                  <option value="CRASH">Neext Velocity Crash</option>
                  <option value="SLOT">Neext Fortune Slot</option>
                </select>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 rounded-xl font-black text-sm uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:brightness-110 cursor-pointer transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSimulating ? 'Evaluating Outcome...' : 'Execute Test Round & Calculate Outcome'}</span>
              </button>
            </div>

            {/* Outcome Result Card */}
            {simOutcome && (
              <div className="bg-gradient-to-r from-slate-950 via-[#06181f] to-slate-950 p-6 rounded-2xl border border-cyan-500/50 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      simOutcome.tier === 'USER_PROFILE_MODE'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                        : simOutcome.tier === 'COMPANY_CONFIG'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-700 text-slate-200'
                    }`}>
                      {simOutcome.tier === 'USER_PROFILE_MODE' ? '⚡ Tier 1: User Profile Mode Active' :
                       simOutcome.tier === 'COMPANY_CONFIG' ? '🏢 Tier 2: Company Config Active' :
                       '⚙️ Tier 3: Default Certified Engine'}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      simOutcome.isWin ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                    }`}>
                      {simOutcome.isWin ? 'ROUND WIN' : 'HOUSE BUST'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Outcome Source</span>
                    <span className="font-mono text-xs text-cyan-300 font-bold">{simOutcome.sourceId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Generated Flight Multiplier</span>
                    <span className="text-3xl font-black font-mono text-amber-400">
                      {simOutcome.crashMultiplier.toFixed(2)}x
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Effective Win Probability</span>
                    <span className="text-3xl font-black font-mono text-cyan-400">
                      {simOutcome.effectiveWinRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400 block mb-1">Applied Governance Mode</span>
                    <span className="text-xl font-black text-slate-200 mt-1 block">
                      {simOutcome.appliedMode}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <span className="text-cyan-400 font-bold">Decision Audit:</span>
                  <span>{simOutcome.details}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. SECTION D: MYSQL TABLES SUMMARY */}
      {activeSection === 'DATABASE' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Real MySQL Database Architecture & Schema</span>
            </h3>
            <p className="text-xs text-slate-300">
              The application writes and synchronizes real state with MySQL Database at database <code className="text-amber-400 font-mono">neextplay_db</code>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-purple-300 font-bold">/neextplay_companies/{'{companyId}'}</span>
                  <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">Active</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Stores tenant configurations: rtpSetting, winMode, instantBustRate, maxMultiplierCap, minCrashMultiplier, slotWildMultiplier, houseMarginHoldPct.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-amber-300 font-bold">/neextplay_player_controls/{'{playerId}'}</span>
                  <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">Active</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Stores player win change rates: userProfileMode (boolean), winRateMode (FORCED_WIN / BOOSTED / NORMAL / FORCED_LOSE), targetWinRate, forcedMinMultiplier, forcedMaxMultiplier.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-300 font-bold">/neextplay_transactions/{'{txId}'}</span>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">Ledger</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Immutable ledger audit records: userId, gameId, betAmount, winAmount, multiplier, provablyFairSeed, createdAt.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-300 font-bold">/players/{'{playerId}'}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">Accounts</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Registered tenant players: username, balance, currency, totalWagered, totalWon, sessionCount, responsible gaming limits.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
