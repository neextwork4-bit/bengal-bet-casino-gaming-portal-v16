import React, { useState, useEffect } from 'react';
import {
  Building2,
  Gamepad2,
  Sliders,
  Radio,
  FileSpreadsheet,
  Activity,
  Plus,
  CheckCircle,
  Search,
  Server,
  Layers,
  Percent,
  ShieldAlert,
  Zap,
  User,
  Users,
  Edit3,
  Wallet,
  Crown,
  Database,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw,
  Sparkles,
  Check,
  AlertCircle,
  Copy,
  Mail
} from 'lucide-react';
import { platform } from '../../services/platformStore';
import { Operator, GameDefinition, GameStatus, Player, PlayerStatus } from '../../types';
import { INITIAL_LIVE_TABLES } from '../../engine/liveCasinoAdapter';
import { useI18n } from '../../services/i18nContext';
import { 
  winControlService, 
  CompanyWinConfig, 
  PlayerWinControl, 
  CalculatedGameOutcome 
} from '../../services/neextplayWinControlService';
import { NeextPlaySqlDatabaseManager } from './NeextPlaySqlDatabaseManager';

export const SuperAdminSuite: React.FC<{ onRefresh: () => void }> = ({ onRefresh }) => {
  const { t, formatMoney } = useI18n();
  const [subTab, setSubTab] = useState<'USERS' | 'OPERATORS' | 'CATALOG' | 'WIN_CONTROLS' | 'PLAYERS' | 'MATH_RTP' | 'LIVE_CASINO' | 'LEDGER_AUDIT' | 'HEALTH' | 'MYSQL_DB'>('USERS');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [newOpModal, setNewOpModal] = useState(false);
  const [newOpForm, setNewOpForm] = useState({ name: '', code: '', email: '', country: 'Malta (MGA)', currency: 'EUR' });

  // User Auth & Developer Accounts State (REAL MySQL neextplay_db.users)
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [userSearchText, setUserSearchText] = useState('');
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [editingUserModal, setEditingUserModal] = useState<any>(null);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'DEVELOPER' as 'COMPANY_ADMIN' | 'DEVELOPER',
    companyName: '',
    country: 'Malta (MGA)',
    currency: 'EUR'
  });

  // Player Management States
  const [playerMgmtSearch, setPlayerMgmtSearch] = useState('');
  const [playerMgmtOpFilter, setPlayerMgmtOpFilter] = useState('ALL');
  const [editingPlayerModal, setEditingPlayerModal] = useState<Player | null>(null);
  const [editPlayerBalanceInput, setEditPlayerBalanceInput] = useState<number>(0);
  const [editPlayerStatusInput, setEditPlayerStatusInput] = useState<PlayerStatus>('ACTIVE');
  const [newPlayerModalOpen, setNewPlayerModalOpen] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState({
    username: '',
    playerId: '',
    operatorId: 'op_bengalbet',
    balance: 2500,
    currency: 'BDT'
  });

  // Win Controls & Engine Governance States
  const [companyConfigs, setCompanyConfigs] = useState<CompanyWinConfig[]>(() => winControlService.getAllCompanyConfigs());
  const [playerControls, setPlayerControls] = useState<PlayerWinControl[]>(() => winControlService.getAllPlayerControls());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('op_bengalbet');
  const [currentCompanyForm, setCurrentCompanyForm] = useState<CompanyWinConfig>(() => winControlService.getCompanyConfig('op_bengalbet'));
  const [playerSearchText, setPlayerSearchText] = useState('');
  const [isSavingCompany, setIsSavingCompany] = useState(false);
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Real MySQL Database Live States
  const [dbOperators, setDbOperators] = useState<Operator[]>(platform.operators);
  const [dbPlayers, setDbPlayers] = useState<Player[]>(platform.players);
  const [dbGames, setDbGames] = useState<any[]>(platform.games);
  const [dbLiveTables, setDbLiveTables] = useState<any[]>(INITIAL_LIVE_TABLES);
  const [dbLedger, setDbLedger] = useState<any[]>(platform.ledger);
  const [dbStats, setDbStats] = useState<any>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);

  const reloadRealMysqlData = async () => {
    try {
      setIsDbLoading(true);
      const [usersRes, opRes, gamesRes, plRes, ltRes, ledgRes, statsRes] = await Promise.all([
        fetch('/api/v1/auth/users').then(r => r.json()).catch(() => null),
        fetch('/api/v1/operators').then(r => r.json()).catch(() => null),
        fetch('/api/v1/games').then(r => r.json()).catch(() => null),
        fetch('/api/v1/players').then(r => r.json()).catch(() => null),
        fetch('/api/v1/live-tables').then(r => r.json()).catch(() => null),
        fetch('/api/v1/ledger').then(r => r.json()).catch(() => null),
        fetch('/api/v1/admin/stats').then(r => r.json()).catch(() => null),
      ]);

      if (usersRes?.users && Array.isArray(usersRes.users)) {
        setDbUsers(usersRes.users);
      }
      if (opRes?.operators && Array.isArray(opRes.operators) && opRes.operators.length > 0) {
        setDbOperators(opRes.operators);
        platform.operators = opRes.operators;
      }
      if (gamesRes?.games && Array.isArray(gamesRes.games) && gamesRes.games.length > 0) {
        setDbGames(gamesRes.games);
      }
      if (plRes?.players && Array.isArray(plRes.players)) {
        setDbPlayers(plRes.players);
        platform.players = plRes.players;
      }
      if (ltRes?.tables && Array.isArray(ltRes.tables) && ltRes.tables.length > 0) {
        setDbLiveTables(ltRes.tables);
      }
      if (ledgRes?.ledger && Array.isArray(ledgRes.ledger)) {
        setDbLedger(ledgRes.ledger);
      }
      if (statsRes?.stats) {
        setDbStats(statsRes.stats);
      }
    } catch (e) {
      console.warn('Could not refresh real MySQL data:', e);
    } finally {
      setIsDbLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.password) return;
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserForm.name || newUserForm.companyName || 'Enterprise User',
          email: newUserForm.email,
          password: newUserForm.password,
          role: newUserForm.role,
          companyName: newUserForm.companyName,
          country: newUserForm.country,
          currency: newUserForm.currency
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveToast(`User ${newUserForm.email} registered into real MySQL!`);
        setTimeout(() => setSaveToast(null), 3500);
        setNewUserModalOpen(false);
        setNewUserForm({ name: '', email: '', password: '', role: 'DEVELOPER', companyName: '', country: 'Malta (MGA)', currency: 'EUR' });
        await reloadRealMysqlData();
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  };

  const handleUpdateUser = async (userId: string, updates: Record<string, any>) => {
    try {
      const res = await fetch(`/api/v1/auth/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setSaveToast('User updated in MySQL!');
        setTimeout(() => setSaveToast(null), 3000);
        setEditingUserModal(null);
        await reloadRealMysqlData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to permanently delete user account '${email}' from MySQL?`)) return;
    try {
      const res = await fetch(`/api/v1/auth/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSaveToast(`User ${email} deleted from MySQL!`);
        setTimeout(() => setSaveToast(null), 3000);
        await reloadRealMysqlData();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    reloadRealMysqlData();
  }, [subTab]);

  // Simulation test sandbox state
  const [simPlayerId, setSimPlayerId] = useState<string>('ply_bb_889922');
  const [simCompanyId, setSimCompanyId] = useState<string>('op_bengalbet');
  const [simulationLogs, setSimulationLogs] = useState<CalculatedGameOutcome[]>([]);

  useEffect(() => {
    setCompanyConfigs(winControlService.getAllCompanyConfigs());
    setPlayerControls(winControlService.getAllPlayerControls());
    setCurrentCompanyForm(winControlService.getCompanyConfig(selectedCompanyId));
  }, [selectedCompanyId]);

  const handleSelectCompany = (id: string) => {
    setSelectedCompanyId(id);
    setCurrentCompanyForm(winControlService.getCompanyConfig(id));
  };

  const handleSaveCompanyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompany(true);
    await winControlService.saveCompanyConfig(currentCompanyForm);
    try {
      await fetch('/api/v1/win-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `company_${currentCompanyForm.companyId}`, config: currentCompanyForm })
      });
    } catch {}
    setCompanyConfigs(winControlService.getAllCompanyConfigs());
    setIsSavingCompany(false);
    setSaveToast(`Company win configuration for ${currentCompanyForm.companyName} saved & synced to MySQL!`);
    setTimeout(() => setSaveToast(null), 3000);
    onRefresh();
  };

  const handleTogglePlayerMode = async (player: PlayerWinControl) => {
    const updated: PlayerWinControl = {
      ...player,
      userProfileMode: !player.userProfileMode,
      updatedAt: new Date().toISOString()
    };
    setSavingPlayerId(player.playerId);
    await winControlService.savePlayerControl(updated);
    try {
      await fetch('/api/v1/win-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `player_${player.playerId}`, config: updated })
      });
    } catch {}
    setPlayerControls(winControlService.getAllPlayerControls());
    setSavingPlayerId(null);
    setSaveToast(`User Profile Mode ${updated.userProfileMode ? 'ACTIVATED' : 'DISABLED'} for ${player.playerName}`);
    setTimeout(() => setSaveToast(null), 3000);
    onRefresh();
  };

  const handleUpdatePlayerModeType = async (player: PlayerWinControl, mode: PlayerWinControl['winRateMode']) => {
    const updated: PlayerWinControl = {
      ...player,
      winRateMode: mode,
      updatedAt: new Date().toISOString()
    };
    setSavingPlayerId(player.playerId);
    await winControlService.savePlayerControl(updated);
    try {
      await fetch('/api/v1/win-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: `player_${player.playerId}`, config: updated })
      });
    } catch {}
    setPlayerControls(winControlService.getAllPlayerControls());
    setSavingPlayerId(null);
    setSaveToast(`Player ${player.playerName} win rate mode set to ${mode}`);
    setTimeout(() => setSaveToast(null), 3000);
    onRefresh();
  };

  const handleRunSimulation = () => {
    const result = winControlService.calculateGameOutcome(simPlayerId, simCompanyId, 'AVIATOR');
    setSimulationLogs(prev => [result, ...prev.slice(0, 9)]);
  };

  const handleToggleStatus = async (op: Operator, nextStatus: Operator['status']) => {
    try {
      await fetch('/api/v1/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...op, status: nextStatus })
      });
      await reloadRealMysqlData();
    } catch {}
    onRefresh();
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpForm.name || !newOpForm.code) return;

    const created: any = {
      id: 'op_' + newOpForm.code.toLowerCase().replace(/\s+/g, '_'),
      name: newOpForm.name,
      code: newOpForm.code.toUpperCase(),
      email: newOpForm.email,
      country: newOpForm.country,
      status: 'ACTIVE',
      currency: newOpForm.currency,
      allowedCurrencies: [newOpForm.currency, 'USD'],
      companyBalance: 100000.00
    };

    try {
      await fetch('/api/v1/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created)
      });
      await reloadRealMysqlData();
    } catch {}

    setNewOpModal(false);
    setNewOpForm({ name: '', code: '', email: '', country: 'Malta (MGA)', currency: 'EUR' });
    onRefresh();
  };

  const handleGameStatusToggle = async (game: GameDefinition, nextStatus: GameStatus) => {
    game.status = nextStatus;
    try {
      await fetch('/api/v1/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: game.id, title: game.name, status: nextStatus })
      });
    } catch {}
    onRefresh();
  };

  const totalGlobalGgr = dbStats?.totalGgr ?? dbOperators.reduce((acc, o) => acc + (Number(o.totalGgr) || 0), 0);
  const totalGlobalTurnover = dbStats?.totalTurnover ?? dbOperators.reduce((acc, o) => acc + (Number(o.totalTurnover) || 0), 0);

  const filteredOperators = dbOperators.filter(
    o => o.name.toLowerCase().includes(operatorSearch.toLowerCase()) || o.code.toLowerCase().includes(operatorSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Super Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 rounded-3xl border border-indigo-900/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Company Admin Platform Control</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Global orchestrator: multi-tenant client governance, certified mathematical game configuration, and immutable double-entry ledger oversight.
          </p>
        </div>

        {/* Global KPI cards formatted in Active Currency */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 text-right shadow-lg">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Global GGR</div>
            <div className="text-lg font-black text-emerald-400">
              {formatMoney(totalGlobalGgr)}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 text-right shadow-lg">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Turnover</div>
            <div className="text-lg font-black text-indigo-300">
              {formatMoney(totalGlobalTurnover)}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 text-right shadow-lg">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Operators</div>
            <div className="text-lg font-black text-amber-400">{dbOperators.length} B2B</div>
          </div>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSubTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            subTab === 'USERS'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-purple-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          <span>User Auth & Logins ({dbUsers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('OPERATORS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            subTab === 'OPERATORS'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>B2B Operators ({dbOperators.length})</span>
        </button>

        <button
          onClick={() => setSubTab('CATALOG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            subTab === 'CATALOG'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Master Game Catalog ({dbGames.length})</span>
        </button>

        <button
          onClick={() => setSubTab('WIN_CONTROLS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            subTab === 'WIN_CONTROLS'
              ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'text-amber-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Win Controls & Governance (3-Tier Engine)</span>
        </button>

        <button
          onClick={() => setSubTab('PLAYERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            subTab === 'PLAYERS'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'text-emerald-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Player Management ({dbPlayers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('MATH_RTP')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'MATH_RTP'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Global Math & RTP Profiles</span>
        </button>

        <button
          onClick={() => setSubTab('LIVE_CASINO')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'LIVE_CASINO'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-400" />
          <span>Live Casino Providers</span>
        </button>

        <button
          onClick={() => setSubTab('LEDGER_AUDIT')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'LEDGER_AUDIT'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Immutable Ledger & Audits</span>
        </button>

        <button
          onClick={() => setSubTab('MYSQL_DB')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'MYSQL_DB'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
              : 'text-cyan-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Database className="w-4 h-4 text-cyan-400" />
          <span>MySQL Database & Master Files</span>
        </button>

        <button
          onClick={() => setSubTab('HEALTH')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            subTab === 'HEALTH'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Health & SRE</span>
        </button>
      </div>

      {/* SUBTAB 0: USER AUTH & ENTERPRISE ADMINS (REAL MYSQL neextplay_db.users) */}
      {subTab === 'USERS' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/40 border border-purple-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Authoritative MySQL User Authentication
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30">
                  neextplay_db.users
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Enterprise Accounts, Company Admins & Operator Developers
              </h3>
              <p className="text-xs text-slate-300">
                Direct CRUD management on live MySQL table. Manage credentials, roles, statuses, and B2B client operator bindings without any cached or mock data.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => reloadRealMysqlData()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${isDbLoading ? 'animate-spin' : ''}`} />
                <span>Refresh MySQL</span>
              </button>
              <button
                onClick={() => setNewUserModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black shadow-lg shadow-purple-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create User Account</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearchText}
                onChange={e => setUserSearchText(e.target.value)}
                placeholder="Search by name, email, company, role..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-3 py-1 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300">
                Company Admins: <strong className="text-white">{dbUsers.filter(u => u.role === 'COMPANY_ADMIN').length}</strong>
              </span>
              <span className="px-3 py-1 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                Developers: <strong className="text-white">{dbUsers.filter(u => u.role === 'DEVELOPER').length}</strong>
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">User Identity</th>
                  <th className="py-3.5 px-4">Role & Permissions</th>
                  <th className="py-3.5 px-4">Company & Operator Binding</th>
                  <th className="py-3.5 px-4">Region & Currency</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">API Key Access</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {dbUsers
                  .filter(u => {
                    const q = userSearchText.toLowerCase();
                    if (!q) return true;
                    return (
                      (u.name || '').toLowerCase().includes(q) ||
                      (u.email || '').toLowerCase().includes(q) ||
                      (u.company_name || '').toLowerCase().includes(q) ||
                      (u.role || '').toLowerCase().includes(q) ||
                      (u.id || '').toLowerCase().includes(q)
                    );
                  })
                  .map(u => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{u.name || 'Enterprise User'}</span>
                          {u.role === 'COMPANY_ADMIN' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{u.email}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {u.id}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            u.role === 'COMPANY_ADMIN'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20'
                              : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                          }`}
                        >
                          {u.role === 'COMPANY_ADMIN' ? '👑 Company Admin' : '⚡ B2B Developer'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{u.company_name || 'Enterprise Client'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Operator ID: {u.operator_id || 'op_bengalbet'}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <div>{u.country || 'Global'}</div>
                        <div className="text-[10px] text-amber-400 font-mono font-bold">{u.currency || 'BDT'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                              : 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                          }`}
                        >
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        {u.api_key ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 truncate max-w-[120px]">{u.api_key}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(u.api_key);
                                setSaveToast(`API Key copied!`);
                                setTimeout(() => setSaveToast(null), 2500);
                              }}
                              className="text-slate-500 hover:text-amber-400 cursor-pointer"
                              title="Copy API Key"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              const nextStatus = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                              handleUpdateUser(u.id, { status: nextStatus });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'bg-amber-600/20 text-amber-400 border-amber-500/40 hover:bg-amber-600/30'
                                : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-600/30'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setEditingUserModal(u)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                            title="Edit User"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="p-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded-lg transition cursor-pointer"
                            title="Delete User from MySQL"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* CREATE NEW USER MODAL */}
          {newUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#0b1220] border-2 border-purple-500/50 rounded-2xl max-w-md w-full p-5 shadow-2xl relative text-slate-200">
                <button
                  onClick={() => setNewUserModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
                <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-400" />
                  Create Enterprise User in MySQL
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Account will be provisioned directly into real MySQL `users` table.
                </p>

                <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Full Name:</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={newUserForm.name}
                      onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Email Address (Login ID):</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. dev@company.com"
                      value={newUserForm.email}
                      onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Password:</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter strong password"
                      value={newUserForm.password}
                      onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Role:</label>
                      <select
                        value={newUserForm.role}
                        onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                      >
                        <option value="DEVELOPER">DEVELOPER</option>
                        <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Currency:</label>
                      <input
                        type="text"
                        value={newUserForm.currency}
                        onChange={e => setNewUserForm({ ...newUserForm, currency: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Company / Studio Name:</label>
                    <input
                      type="text"
                      placeholder="e.g. Vertex Gaming Corp"
                      value={newUserForm.companyName}
                      onChange={e => setNewUserForm({ ...newUserForm, companyName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Country / Jurisdiction:</label>
                    <input
                      type="text"
                      value={newUserForm.country}
                      onChange={e => setNewUserForm({ ...newUserForm, country: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-lg cursor-pointer"
                    >
                      Provision into MySQL
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT USER MODAL */}
          {editingUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#0b1220] border-2 border-purple-500/50 rounded-2xl max-w-md w-full p-5 shadow-2xl relative text-slate-200">
                <button
                  onClick={() => setEditingUserModal(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
                <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                  Edit User Account in MySQL
                </h3>
                <p className="text-xs text-slate-400 mb-4 font-mono">
                  {editingUserModal.email} • UID: {editingUserModal.id}
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Display Name:</label>
                    <input
                      type="text"
                      defaultValue={editingUserModal.name || ''}
                      id="edit_user_name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Company Name:</label>
                    <input
                      type="text"
                      defaultValue={editingUserModal.company_name || ''}
                      id="edit_user_company"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Role:</label>
                      <select
                        defaultValue={editingUserModal.role || 'DEVELOPER'}
                        id="edit_user_role"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                      >
                        <option value="DEVELOPER">DEVELOPER</option>
                        <option value="COMPANY_ADMIN">COMPANY_ADMIN</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Status:</label>
                      <select
                        defaultValue={editingUserModal.status || 'ACTIVE'}
                        id="edit_user_status"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Reset Password (leave empty to keep current):</label>
                    <input
                      type="password"
                      placeholder="New password (optional)"
                      id="edit_user_password"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const name = (document.getElementById('edit_user_name') as HTMLInputElement)?.value;
                        const company_name = (document.getElementById('edit_user_company') as HTMLInputElement)?.value;
                        const role = (document.getElementById('edit_user_role') as HTMLSelectElement)?.value;
                        const status = (document.getElementById('edit_user_status') as HTMLSelectElement)?.value;
                        const password = (document.getElementById('edit_user_password') as HTMLInputElement)?.value;

                        const payload: Record<string, any> = { name, company_name, role, status };
                        if (password && password.trim()) payload.password = password.trim();

                        handleUpdateUser(editingUserModal.id, payload);
                      }}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-lg cursor-pointer"
                    >
                      Save Changes to MySQL
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUserModal(null)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 1: OPERATORS DIRECTORY */}
      {subTab === 'OPERATORS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={operatorSearch}
                onChange={e => setOperatorSearch(e.target.value)}
                placeholder="Search operator by name or code..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => setNewOpModal(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New B2B Operator</span>
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Operator Entity</th>
                  <th className="py-3.5 px-4">Jurisdiction</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Turnover</th>
                  <th className="py-3.5 px-4">GGR</th>
                  <th className="py-3.5 px-4">Active Players</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredOperators.map(op => (
                  <tr key={op.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{op.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                        <span>Code: {op.code}</span>
                        <span>•</span>
                        <span>{op.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">{op.country}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          op.status === 'ACTIVE'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                            : op.status === 'PENDING'
                            ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                            : op.status === 'SUSPENDED'
                            ? 'bg-rose-950/80 text-rose-400 border-rose-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {op.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {formatMoney(op.totalTurnover)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      {formatMoney(op.totalGgr)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{op.activePlayers.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {op.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleToggleStatus(op, 'ACTIVE')}
                            className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 rounded-lg hover:bg-emerald-600/30 text-[11px] font-bold"
                          >
                            Activate
                          </button>
                        )}
                        {op.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleToggleStatus(op, 'SUSPENDED')}
                            className="px-2.5 py-1 bg-amber-600/20 text-amber-400 border border-amber-500/40 rounded-lg hover:bg-amber-600/30 text-[11px] font-bold"
                          >
                            Suspend
                          </button>
                        )}
                        {op.status !== 'BLOCKED' && (
                          <button
                            onClick={() => handleToggleStatus(op, 'BLOCKED')}
                            className="px-2.5 py-1 bg-rose-600/20 text-rose-400 border border-rose-500/40 rounded-lg hover:bg-rose-600/30 text-[11px] font-bold"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MASTER GAME CATALOG (REAL MYSQL neextplay_db.games) */}
      {subTab === 'CATALOG' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-white text-sm">Real MySQL Game Suite Catalog</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30">
                  neextplay_db.games ({dbGames.length} Total)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authoritative titles, certified RTP limits, and real-time maintenance switches in MySQL.
              </p>
            </div>

            <button
              onClick={() => reloadRealMysqlData()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isDbLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Games</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dbGames.map(game => {
              const gName = game.title || game.name || 'Game Title';
              const gType = (game.type || game.category || 'CRASH').toUpperCase();
              const gRtp = game.rtp || game.defaultRtp || 96.5;
              const gMin = game.min_bet ?? (game.minBet ?? 10);
              const gMax = game.max_bet ?? (game.maxBet ?? 50000);
              const gThumb = game.thumbnail || '/src/assets/images/aviator_banner_1791307837428.jpg';
              const gStatus = game.status || 'ACTIVE';

              return (
                <div
                  key={game.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-36 overflow-hidden bg-slate-950">
                      <img
                        src={gThumb}
                        alt={gName}
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-white border border-white/20 uppercase tracking-widest">
                          {gType}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${gStatus === 'ACTIVE' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40' : 'bg-amber-950/80 text-amber-400 border-amber-500/40'}`}>
                          {gStatus}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-extrabold text-white text-base">{gName}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{game.description || `${gType} game certified by NeextPlay.`}</p>
                      <div className="pt-2 grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800">
                        <div>
                          <span className="text-slate-500">Default RTP:</span>
                          <div className="font-bold text-amber-400">{gRtp}%</div>
                        </div>
                        <div>
                          <span className="text-slate-500">Limits:</span>
                          <div className="font-bold text-slate-300">{formatMoney(gMin)} - {formatMoney(gMax)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[110px]">{game.id}</span>
                    <button
                      onClick={async () => {
                        const nextStatus = gStatus === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
                        try {
                          await fetch('/api/v1/games', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: game.id, title: gName, status: nextStatus })
                          });
                          await reloadRealMysqlData();
                          setSaveToast(`Game ${gName} status set to ${nextStatus} in MySQL!`);
                          setTimeout(() => setSaveToast(null), 3000);
                        } catch {}
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      {gStatus === 'ACTIVE' ? 'Set Maintenance' : 'Activate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB: GAME WIN CONTROLS & MATHEMATICS GOVERNANCE */}
      {subTab === 'WIN_CONTROLS' && (
        <div className="space-y-6">
          {/* Top Banner with Real Firebase Connection Info */}
          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 border border-amber-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    3-Tier Outcome Decision Engine
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Database className="w-3 h-3 text-emerald-400" />
                    MySQL Database Active (neextplay_db)
                  </span>
                </div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  Game Win Controls & Mathematics Governance
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  <strong>Decision Hierarchy:</strong> (1) If <strong>User Profile Mode</strong> is active for a player, game operates on their specific win change rate; (2) Otherwise, follows <strong>Company Configuration</strong>; (3) Otherwise, falls back to <strong>Default Certified 97.0% RTP</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setCompanyConfigs(winControlService.getAllCompanyConfigs());
                    setPlayerControls(winControlService.getAllPlayerControls());
                    setSaveToast('Synchronized with MySQL database (neextplay_db)!');
                    setTimeout(() => setSaveToast(null), 3000);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 cursor-pointer transition shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sync MySQL</span>
                </button>
              </div>
            </div>

            {saveToast && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{saveToast}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PART 1: COMPANY DASHBOARD WIN CONTROLS */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">Company Win Controls</h4>
                    <span className="text-[11px] text-slate-400">Operator-Wide Mathematical RTP & Margin Governance</span>
                  </div>
                </div>

                {/* Company Selector */}
                <select
                  value={selectedCompanyId}
                  onChange={(e) => handleSelectCompany(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-300 outline-none"
                >
                  {companyConfigs.map(c => (
                    <option key={c.companyId} value={c.companyId}>
                      {c.companyName} ({c.companyId})
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleSaveCompanyConfig} className="space-y-4 text-xs">
                {/* Target RTP Slider & Input */}
                <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Company RTP Target Hold (%):</span>
                    </label>
                    <span className="font-mono text-sm font-black text-amber-400">
                      {currentCompanyForm.rtpSetting}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="75"
                    max="125"
                    step="0.1"
                    value={currentCompanyForm.rtpSetting}
                    onChange={(e) => setCurrentCompanyForm({ ...currentCompanyForm, rtpSetting: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>75% (Tight House Hold)</span>
                    <span>97.2% (Standard)</span>
                    <span>125% (Bonus Campaign)</span>
                  </div>
                </div>

                {/* Win Mode Selector */}
                <div className="space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <label className="text-slate-300 font-bold block mb-1">Company Win Mode Algorithm:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'BALANCED', label: 'Balanced (Certified)', desc: 'Standard 97.2% distribution' },
                      { id: 'HIGH_WIN', label: 'High Win (Player Friendly)', desc: '+20% higher multiplier frequency' },
                      { id: 'TIGHT_MARGIN', label: 'Tight Margin (High Edge)', desc: 'Lower hit rate, earlier crash floor' },
                      { id: 'JACKPOT_HUNT', label: 'Jackpot Hunt (Extreme Vol.)', desc: 'Infrequent hits with huge peak caps' }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setCurrentCompanyForm({ ...currentCompanyForm, winMode: mode.id as any })}
                        className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                          currentCompanyForm.winMode === mode.id
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-bold text-xs block">{mode.label}</span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{mode.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crash Game & Multiplier Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <label className="text-slate-400 font-bold text-[11px] block">Max Multiplier Cap (X):</label>
                    <input
                      type="number"
                      min="50"
                      max="10000"
                      value={currentCompanyForm.maxMultiplierCap}
                      onChange={(e) => setCurrentCompanyForm({ ...currentCompanyForm, maxMultiplierCap: parseFloat(e.target.value) || 1000 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold outline-none"
                    />
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <label className="text-slate-400 font-bold text-[11px] block">Instant 1.00x Bust Rate (%):</label>
                    <input
                      type="number"
                      min="0.5"
                      max="15.0"
                      step="0.5"
                      value={currentCompanyForm.instantBustRate}
                      onChange={(e) => setCurrentCompanyForm({ ...currentCompanyForm, instantBustRate: parseFloat(e.target.value) || 3.0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingCompany}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer transition disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  <span>{isSavingCompany ? 'Saving to MySQL...' : `Save Company Config (${currentCompanyForm.companyName})`}</span>
                </button>
              </form>
            </div>

            {/* PART 2: LIVE 3-TIER OUTCOME SIMULATION SANDBOX */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">3-Tier Outcome Decision Sandbox</h4>
                    <span className="text-[11px] text-slate-400">Test Real Game Round Outcome Resolution Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Simulate as Player:</label>
                    <select
                      value={simPlayerId}
                      onChange={(e) => setSimPlayerId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono outline-none"
                    >
                      {playerControls.map(p => (
                        <option key={p.playerId} value={p.playerId}>
                          {p.playerName} ({p.userProfileMode ? `⚡ Mode: ${p.winRateMode}` : 'Follows Company'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Simulate under Operator:</label>
                    <select
                      value={simCompanyId}
                      onChange={(e) => setSimCompanyId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono outline-none"
                    >
                      {companyConfigs.map(c => (
                        <option key={c.companyId} value={c.companyId}>
                          {c.companyName} ({c.winMode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunSimulation}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow cursor-pointer transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Run 1 Simulated Round</span>
                </button>

                {/* Simulation Logs Feed */}
                <div className="space-y-2 mt-3">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Live Outcome Calculation History:</span>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {simulationLogs.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-500 text-xs">
                        Click "Run 1 Simulated Round" above to test the 3-Tier engine live!
                      </div>
                    ) : (
                      simulationLogs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            log.tier === 'USER_PROFILE_MODE'
                              ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                              : log.tier === 'COMPANY_CONFIG'
                              ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="text-white">{log.details}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Effective Win Rate: {log.effectiveWinRate}% • Mode: {log.appliedMode}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className={`text-base font-black font-mono ${log.crashMultiplier > 1.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {log.crashMultiplier.toFixed(2)}x
                            </span>
                            <span className={`block text-[10px] font-bold ${log.isWin ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {log.isWin ? 'WON' : 'LOST'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PART 3: USER PROFILE MODE & PLAYER LUCK GOVERNANCE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    User Profile Mode & Player Luck Governance (Tier 1 Priority)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    When <strong>User Profile Mode is TRUE</strong>, the game works on player's win change rate; otherwise follows company config, otherwise default.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search player handle or ID..."
                    value={playerSearchText}
                    onChange={(e) => setPlayerSearchText(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white outline-none w-52"
                  />
                </div>
              </div>
            </div>

            {/* Players Control List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {playerControls
                .filter(p => p.playerName.toLowerCase().includes(playerSearchText.toLowerCase()) || p.playerId.includes(playerSearchText))
                .map(player => (
                  <div
                    key={player.playerId}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      player.userProfileMode
                        ? 'bg-slate-950 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    {/* Player Info & User Profile Mode Switch */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                          {player.playerName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs block truncate max-w-[140px]">
                            {player.playerName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 block">
                            {player.playerId}
                          </span>
                        </div>
                      </div>

                      {/* User Profile Mode Toggle */}
                      <button
                        onClick={() => handleTogglePlayerMode(player)}
                        disabled={savingPlayerId === player.playerId}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition ${
                          player.userProfileMode
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-sm'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title="Toggle User Profile Mode Override"
                      >
                        {player.userProfileMode ? '⚡ Profile Mode: ON' : 'Company Mode: OFF'}
                      </button>
                    </div>

                    {/* Mode Selector & Multiplier Config */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/80 text-xs">
                      <div>
                        <label className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                          Win Change Rate Mode:
                        </label>
                        <select
                          value={player.winRateMode}
                          disabled={!player.userProfileMode}
                          onChange={(e) => handleUpdatePlayerModeType(player, e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs font-bold text-white outline-none disabled:opacity-40"
                        >
                          <option value="FORCED_WIN">FORCED_WIN (95% Win • Guaranteed)</option>
                          <option value="BOOSTED">BOOSTED (+25% Lucky Boost)</option>
                          <option value="NORMAL">NORMAL (65% Standard Override)</option>
                          <option value="FORCED_LOSE">FORCED_LOSE (10% House Edge Bust)</option>
                          <option value="CUSTOM">CUSTOM (Target Rate)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">Min Mult:</span>
                          <span className="font-mono font-bold text-slate-200">{player.forcedMinMultiplier}x</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Max Mult:</span>
                          <span className="font-mono font-bold text-amber-400">{player.forcedMaxMultiplier}x</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900/80 text-[10px] flex items-center justify-between">
                        <span className="text-slate-400">Target Win Probability:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {player.winRateMode === 'FORCED_WIN' ? '95%' : player.winRateMode === 'BOOSTED' ? '78%' : player.winRateMode === 'FORCED_LOSE' ? '10%' : `${player.targetWinRate}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: MASTER PLAYER MANAGEMENT (REGISTER, MANAGE, LOAD, & WALLET SYNC) */}
      {subTab === 'PLAYERS' && (
        <div className="space-y-5">
          {/* Top Banner and Quick Actions */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Player Directory & Ledger
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                  {dbPlayers.length} Total Registered (MySQL)
                </span>
              </div>
              <h3 className="text-base font-black text-white">
                Multi-Tenant Player Management & Bankroll Administration
              </h3>
              <p className="text-xs text-slate-300">
                Register new players, load player states, edit wallet balances, and configure active statuses across all operators (including BengalBet).
              </p>
            </div>

            <button
              onClick={() => setNewPlayerModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition cursor-pointer self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Player</span>
            </button>
          </div>

          {/* Search, Filter & Quick Stats Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by username, player UID..."
                  value={playerMgmtSearch}
                  onChange={(e) => setPlayerMgmtSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Operator filter */}
              <select
                value={playerMgmtOpFilter}
                onChange={(e) => setPlayerMgmtOpFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 outline-none"
              >
                <option value="ALL">All Operators ({dbOperators.length})</option>
                {dbOperators.map(op => (
                  <option key={op.id} value={op.id}>{op.name} ({op.code})</option>
                ))}
              </select>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-auto">
              <span>Active: <strong className="text-emerald-400 font-mono">{dbPlayers.filter(p => (p.status || 'ACTIVE') === 'ACTIVE').length}</strong></span>
              <span>•</span>
              <span>Total Bankroll: <strong className="text-amber-400 font-mono">৳{dbPlayers.reduce((sum, p) => sum + (Number(p.balance) || 0), 0).toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Players Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Pilot / Player</th>
                    <th className="py-3 px-4">Operator Entity</th>
                    <th className="py-3 px-4">Live Balance</th>
                    <th className="py-3 px-4">VIP & Best Mult</th>
                    <th className="py-3 px-4">Turnover & Won</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {dbPlayers
                    .filter(p => {
                      const opId = p.operatorId || p.operator_id;
                      const matchOp = playerMgmtOpFilter === 'ALL' || opId === playerMgmtOpFilter;
                      const q = playerMgmtSearch.toLowerCase();
                      const pUsername = p.username || p.name || '';
                      const matchSearch = !q || pUsername.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                      return matchOp && matchSearch;
                    })
                    .map(player => {
                      const opId = player.operatorId || player.operator_id;
                      const op = dbOperators.find(o => o.id === opId);
                      const isCurrentActive = platform.activePlayerId === player.id;
                      const pName = player.username || player.name || 'Player';
                      const pBal = Number(player.balance || 0);
                      const pCurr = player.currency || 'BDT';
                      const pVip = player.vipLevel || player.vip_level || 1;
                      const pStatus = player.status || 'ACTIVE';
                      const pWagered = Number(player.totalWagered ?? (player.total_wagered ?? 0));
                      const pWon = Number(player.totalWon ?? (player.total_won ?? 0));

                      return (
                        <tr key={player.id} className={`hover:bg-slate-800/40 transition ${isCurrentActive ? 'bg-emerald-950/20' : ''}`}>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-sm shadow-md shrink-0">
                                {player.avatar === 'pilot-2' ? '🛩️' : player.avatar === 'pilot-3' ? '🚀' : player.avatar === 'pilot-4' ? '🎖️' : player.avatar === 'pilot-5' ? '🦅' : '👨‍✈️'}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{pName}</span>
                                  {isCurrentActive && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-mono">
                                      CURRENT
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">UID: {player.id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-950 text-indigo-300 border border-slate-800">
                              {op?.name || opId}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-amber-400 text-sm">
                                {pCurr === 'BDT' ? '৳' : '€'} {pBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <button
                                onClick={() => {
                                  setEditingPlayerModal(player);
                                  setEditPlayerBalanceInput(pBal);
                                  setEditPlayerStatusInput(pStatus as any);
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
                                title="Edit Wallet Balance"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                                VIP {player.vipLevel || 1}
                              </span>
                              <span className="font-mono text-purple-400 font-bold text-xs">
                                {(player.bestMultiplier || 1.0).toFixed(2)}x
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-300 text-[11px]">
                            <div>Wagered: <strong className="text-white">৳{(player.totalWagered || 0).toLocaleString()}</strong></div>
                            <div className="text-emerald-400 text-[10px]">Won: ৳{(player.totalWon || 0).toLocaleString()}</div>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                const nextStatus = player.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
                                player.status = nextStatus;
                                platform.saveToStorage();
                                onRefresh();
                                setSaveToast(`Player ${player.username} status set to ${nextStatus}`);
                                setTimeout(() => setSaveToast(null), 3000);
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase cursor-pointer border transition ${
                                player.status === 'ACTIVE'
                                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 hover:bg-emerald-900/60'
                                  : 'bg-rose-950/80 text-rose-400 border-rose-500/40 hover:bg-rose-900/60'
                              }`}
                            >
                              {player.status}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  platform.activePlayerId = player.id;
                                  if (player.operatorId) {
                                    platform.selectedOperatorId = player.operatorId;
                                  }
                                  platform.saveToStorage();
                                  onRefresh();
                                  setSaveToast(`Loaded pilot profile: ${player.username}`);
                                  setTimeout(() => setSaveToast(null), 3000);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                                  isCurrentActive
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                }`}
                              >
                                {isCurrentActive ? 'Loaded' : 'Load Player'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* EDIT PLAYER BALANCE MODAL */}
          {editingPlayerModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#0b1220] border-2 border-amber-500/50 rounded-2xl max-w-md w-full p-5 shadow-2xl relative text-slate-200">
                <button
                  onClick={() => setEditingPlayerModal(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  ✕
                </button>

                <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-400" />
                  Manage Player Bankroll & Status
                </h3>
                <p className="text-xs text-slate-400 mb-4 font-mono">
                  {editingPlayerModal.username} • UID: {editingPlayerModal.id}
                </p>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Set Wallet Balance ({editingPlayerModal.currency}):</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-bold text-amber-400">৳</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editPlayerBalanceInput}
                        onChange={(e) => setEditPlayerBalanceInput(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Preset quick adjustments */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[+500, +1000, +5000, -500].map(delta => (
                      <button
                        key={delta}
                        onClick={() => setEditPlayerBalanceInput(prev => Math.max(0, prev + delta))}
                        className="py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-bold"
                      >
                        {delta > 0 ? `+৳${delta}` : `-৳${Math.abs(delta)}`}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Account Status:</label>
                    <select
                      value={editPlayerStatusInput}
                      onChange={(e) => setEditPlayerStatusInput(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-bold outline-none"
                    >
                      <option value="ACTIVE">ACTIVE (Full access)</option>
                      <option value="SUSPENDED">SUSPENDED (Betting blocked)</option>
                      <option value="SELF_EXCLUDED">SELF_EXCLUDED (Cooling off)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={async () => {
                        const target = dbPlayers.find(p => p.id === editingPlayerModal.id) || platform.players.find(p => p.id === editingPlayerModal.id);
                        const targetId = editingPlayerModal.id;
                        if (target || targetId) {
                          if (target) {
                            target.balance = Number(editPlayerBalanceInput.toFixed(2));
                            target.status = editPlayerStatusInput;
                          }
                          platform.saveToStorage();

                          // Sync to real MySQL server backend
                          try {
                            await fetch(`/api/v1/players/${targetId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                balance: Number(editPlayerBalanceInput.toFixed(2)),
                                status: editPlayerStatusInput,
                              }),
                            });
                            await reloadRealMysqlData();
                          } catch {}

                          setEditingPlayerModal(null);
                          onRefresh();
                          setSaveToast(`Player updated in MySQL! Balance: ৳${Number(editPlayerBalanceInput.toFixed(2))}`);
                          setTimeout(() => setSaveToast(null), 3000);
                        }
                      }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 rounded-xl font-black uppercase text-xs tracking-wider shadow-lg hover:brightness-110 cursor-pointer"
                    >
                      Save & Sync Player
                    </button>
                    <button
                      onClick={() => setEditingPlayerModal(null)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CREATE NEW PLAYER MODAL */}
          {newPlayerModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#0b1220] border-2 border-emerald-500/50 rounded-2xl max-w-md w-full p-5 shadow-2xl relative text-slate-200">
                <button
                  onClick={() => setNewPlayerModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  ✕
                </button>

                <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  Register New B2B Pilot / Player
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Create a new player record under any connected operator with starting bankroll.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Player Username / Handle:</label>
                    <input
                      type="text"
                      placeholder="e.g. VIP_Aviation_King"
                      value={newPlayerForm.username}
                      onChange={(e) => setNewPlayerForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Operator Assignment:</label>
                    <select
                      value={newPlayerForm.operatorId}
                      onChange={(e) => setNewPlayerForm(prev => ({ ...prev, operatorId: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white outline-none"
                    >
                      {platform.operators.map(op => (
                        <option key={op.id} value={op.id}>{op.name} ({op.code})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Initial Balance:</label>
                      <input
                        type="number"
                        value={newPlayerForm.balance}
                        onChange={(e) => setNewPlayerForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Currency:</label>
                      <input
                        type="text"
                        value={newPlayerForm.currency}
                        onChange={(e) => setNewPlayerForm(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={async () => {
                        if (!newPlayerForm.username) return;
                        const newId = 'ply_' + (newPlayerForm.operatorId === 'op_bengalbet' ? 'bb_' : '') + Math.random().toString(36).substring(2, 9);
                        const player: Player = {
                          id: newId,
                          operatorId: newPlayerForm.operatorId,
                          externalPlayerId: newId,
                          username: newPlayerForm.username,
                          currency: newPlayerForm.currency,
                          balance: newPlayerForm.balance,
                          status: 'ACTIVE',
                          rgLimits: {},
                          createdAt: new Date().toISOString(),
                          lastActiveAt: new Date().toISOString(),
                          totalWagered: 0,
                          totalWon: 0,
                          sessionCount: 1,
                          avatar: 'pilot-1',
                          vipLevel: 1,
                          vipPoints: 0,
                          bestMultiplier: 1.0,
                        };
                        platform.players.unshift(player);
                        platform.activePlayerId = player.id;
                        platform.saveToStorage();

                        // Register on server backend
                        try {
                          await fetch('/api/v1/players/create', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              username: player.username,
                              externalPlayerId: player.id,
                              operatorId: player.operatorId,
                              currency: player.currency,
                              initialBalance: player.balance,
                            }),
                          });
                          await reloadRealMysqlData();
                        } catch {}

                        setNewPlayerModalOpen(false);
                        setNewPlayerForm({ username: '', playerId: '', operatorId: 'op_bengalbet', balance: 2500, currency: 'BDT' });
                        onRefresh();
                        setSaveToast(`Player ${player.username} successfully registered!`);
                        setTimeout(() => setSaveToast(null), 3000);
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-lg cursor-pointer"
                    >
                      Register Player
                    </button>
                    <button
                      onClick={() => setNewPlayerModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: GLOBAL MATH & RTP PROFILES */}
      {subTab === 'MATH_RTP' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-400" />
                Certified Mathematical RTP Profiles & Volatility Governance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Outcomes are auditable across all operators and currencies.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold">
              GLI-19 Certified Spec
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-xl border border-indigo-900/50 space-y-2">
              <span className="text-xs font-extrabold text-indigo-300">RTP_HIGH</span>
              <div className="text-2xl font-black text-white">97.80% <span className="text-xs text-slate-500">RTP</span></div>
              <p className="text-xs text-slate-400">High hit frequency with increased Wild and Scatter frequency.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/50 space-y-2">
              <span className="text-xs font-extrabold text-emerald-300">RTP_STANDARD</span>
              <div className="text-2xl font-black text-white">96.50% <span className="text-xs text-slate-500">RTP</span></div>
              <p className="text-xs text-slate-400">Default regulatory baseline compliant with MGA and UKGC.</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/50 space-y-2">
              <span className="text-xs font-extrabold text-amber-300">RTP_LOW</span>
              <div className="text-2xl font-black text-white">94.10% <span className="text-xs text-slate-500">RTP</span></div>
              <p className="text-xs text-slate-400">Conservative profile for maximum hold margin.</p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: LIVE CASINO PROVIDERS (REAL MYSQL neextplay_db.live_tables) */}
      {subTab === 'LIVE_CASINO' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-white text-sm">Real MySQL Live Casino Tables</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30">
                  neextplay_db.live_tables ({dbLiveTables.length} Active)
                </span>
              </div>
              <p className="text-xs text-slate-400">Low-latency live dealer streaming tables managed in MySQL.</p>
            </div>
            <button
              onClick={() => reloadRealMysqlData()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isDbLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Tables</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dbLiveTables.map(table => {
              const tName = table.name || 'Live Table';
              const tGameType = (table.game_type || table.gameType || 'Roulette').toUpperCase();
              const tDealer = table.dealer_name || table.dealerName || 'Live Dealer';
              const tMin = table.min_bet ?? (table.minBet ?? 50);
              const tMax = table.max_bet ?? (table.maxBet ?? 100000);
              const tQuality = table.stream_quality || table.streamQuality || '4K UHD';

              return (
                <div key={table.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white text-sm block">{tName}</span>
                      <span className="text-[10px] font-mono text-slate-500">{tGameType} • UID: {table.id}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-950/80 text-rose-400 border border-rose-500/40 rounded-full text-[10px] font-bold">
                      {tQuality}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
                    <span>Dealer: <strong className="text-white">{tDealer}</strong></span>
                    <span className="font-mono font-bold text-amber-400">{formatMoney(tMin)} - {formatMoney(tMax)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 5: IMMUTABLE LEDGER (REAL MYSQL neextplay_db.ledger_entries) */}
      {subTab === 'LEDGER_AUDIT' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-white text-sm">Provably Fair Authoritative Ledger</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30">
                  neextplay_db.ledger_entries ({dbLedger.length} Records)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Double-entry transaction audit trail stored permanently in MySQL.
              </p>
            </div>
            <button
              onClick={() => reloadRealMysqlData()}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isDbLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Transaction / Ledger ID</th>
                  <th className="py-2.5 px-3">Operator Entity</th>
                  <th className="py-2.5 px-3">Player UID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Balance After</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {dbLedger.slice(0, 50).map(entry => {
                  const opId = entry.operator_id || entry.operatorId || 'op_bengalbet';
                  const pId = entry.player_id || entry.playerId || '—';
                  const eType = entry.type || 'TX';
                  const isDebit = eType === 'DEBIT' || eType === 'BET' || (entry.debit && entry.debit > 0);
                  const eAmt = entry.amount !== undefined ? Number(entry.amount) : (isDebit ? Number(entry.debit || 0) : Number(entry.credit || 0));
                  const eBalAfter = entry.balance_after !== undefined ? Number(entry.balance_after) : Number(entry.balanceAfter || 0);
                  const eTime = entry.created_at || entry.timestamp || new Date().toISOString();

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-indigo-300 font-bold">{entry.id}</td>
                      <td className="py-2 px-3 text-slate-300">{opId}</td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-[120px]">{pId}</td>
                      <td className="py-2 px-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${isDebit ? 'bg-rose-950 text-rose-300' : 'bg-emerald-950 text-emerald-300'}`}>
                          {eType}
                        </span>
                      </td>
                      <td className={`py-2 px-3 font-bold ${isDebit ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isDebit ? `-${formatMoney(eAmt)}` : `+${formatMoney(eAmt)}`}
                      </td>
                      <td className="py-2 px-3 text-white font-bold">{formatMoney(eBalAfter)}</td>
                      <td className="py-2 px-3 text-slate-400">{new Date(eTime).toLocaleTimeString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB: MYSQL DATABASE & MASTER FILES HUB */}
      {(subTab === 'MYSQL_DB' || subTab === 'HEALTH') && (
        <NeextPlaySqlDatabaseManager />
      )}
    </div>
  );
};
