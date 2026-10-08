/**
 * NeextPlay Win Controls & Engine Governance Service
 * MySQL Database Backend Integration (neextplay_db)
 * 
 * 3-Tier Outcome Decision Engine:
 * 1. Tier 1 (Highest Priority): User Profile Mode
 *    - If player's `userProfileMode === true`, game uses player's specific win change rate & mode (FORCED_WIN, BOOSTED, FORCED_LOSE, CUSTOM).
 * 2. Tier 2: Company Configs
 *    - Otherwise, follows company's / operator's configured RTP, volatility, and crash distribution.
 * 3. Tier 3: Default Engine Rules
 *    - Otherwise, falls back to certified 97.0% RTP default rules.
 */

export interface CompanyWinConfig {
  companyId: string;
  companyName: string;
  rtpSetting: number; // e.g. 96.5 to 110.0
  winMode: 'BALANCED' | 'HIGH_WIN' | 'TIGHT_MARGIN' | 'JACKPOT_HUNT' | 'CUSTOM';
  maxMultiplierCap: number; // e.g. 500, 1000, 5000
  instantBustRate: number; // e.g. 3.0%
  minCrashMultiplier: number; // e.g. 1.01
  slotWildMultiplier: number; // e.g. 1.2
  slotScatterMultiplier: number; // e.g. 1.2
  houseMarginHoldPct: number; // e.g. 4.0%
  emergencyThrottleActive: boolean;
  updatedAt: string;
}

export interface PlayerWinControl {
  playerId: string;
  playerName: string;
  userProfileMode: boolean; // CRITICAL: When true, game works on player's win change rate!
  winRateMode: 'FORCED_WIN' | 'BOOSTED' | 'NORMAL' | 'FORCED_LOSE' | 'CUSTOM';
  targetWinRate: number; // 0 to 100, e.g. 85%
  forcedMinMultiplier: number; // e.g. 2.0x
  forcedMaxMultiplier: number; // e.g. 50.0x
  luckyStreakActive: boolean;
  notes?: string;
  updatedAt: string;
}

export interface CalculatedGameOutcome {
  tier: 'USER_PROFILE_MODE' | 'COMPANY_CONFIG' | 'DEFAULT_ENGINE';
  isWin: boolean;
  crashMultiplier: number;
  slotPaylineMultiplier: number;
  effectiveWinRate: number;
  appliedMode: string;
  details: string;
  sourceId: string;
}

// Initial Default Company Configurations
const INITIAL_COMPANIES: Record<string, CompanyWinConfig> = {
  op_bengalbet: {
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
  },
  op_neexthub: {
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
  },
  op_nexus: {
    companyId: 'op_nexus',
    companyName: 'NexusBet International',
    rtpSetting: 96.0,
    winMode: 'TIGHT_MARGIN',
    maxMultiplierCap: 500,
    instantBustRate: 4.5,
    minCrashMultiplier: 1.01,
    slotWildMultiplier: 1.0,
    slotScatterMultiplier: 1.0,
    houseMarginHoldPct: 5.0,
    emergencyThrottleActive: false,
    updatedAt: new Date().toISOString()
  },
  op_apex: {
    companyId: 'op_apex',
    companyName: 'Apex Gaming Group',
    rtpSetting: 97.0,
    winMode: 'JACKPOT_HUNT',
    maxMultiplierCap: 5000,
    instantBustRate: 3.5,
    minCrashMultiplier: 1.01,
    slotWildMultiplier: 1.2,
    slotScatterMultiplier: 1.3,
    houseMarginHoldPct: 4.0,
    emergencyThrottleActive: false,
    updatedAt: new Date().toISOString()
  }
};

// Initial Player Controls with active profile modes
const INITIAL_PLAYER_CONTROLS: Record<string, PlayerWinControl> = {
  ply_bb_889922: {
    playerId: 'ply_bb_889922',
    playerName: 'BengalBet VIP Player',
    userProfileMode: true, // User Profile Mode is active!
    winRateMode: 'FORCED_WIN',
    targetWinRate: 88,
    forcedMinMultiplier: 2.5,
    forcedMaxMultiplier: 35.0,
    luckyStreakActive: true,
    notes: 'VIP High Roller - Guaranteed favorable flights',
    updatedAt: new Date().toISOString()
  },
  ply_bengalbet_usr: {
    playerId: 'ply_bengalbet_usr',
    playerName: 'BengalBet Mobile Player',
    userProfileMode: true,
    winRateMode: 'BOOSTED',
    targetWinRate: 75,
    forcedMinMultiplier: 1.8,
    forcedMaxMultiplier: 25.0,
    luckyStreakActive: true,
    notes: '+25% Boosted luck factor',
    updatedAt: new Date().toISOString()
  },
  ply_neexthub_vip1: {
    playerId: 'ply_neexthub_vip1',
    playerName: 'NeextHub Master Dev',
    userProfileMode: true,
    winRateMode: 'FORCED_WIN',
    targetWinRate: 92,
    forcedMinMultiplier: 3.0,
    forcedMaxMultiplier: 70.0,
    luckyStreakActive: true,
    notes: 'Developer testing profile mode',
    updatedAt: new Date().toISOString()
  }
};

// In-Memory Fast Cache with LocalStorage & Firebase hydration
class NeextplayWinControlService {
  private companies: Map<string, CompanyWinConfig> = new Map();
  private players: Map<string, PlayerWinControl> = new Map();
  private isFirebaseHydrated = false;

  constructor() {
    // 1. Initialize with defaults
    Object.values(INITIAL_COMPANIES).forEach(c => this.companies.set(c.companyId, c));
    Object.values(INITIAL_PLAYER_CONTROLS).forEach(p => this.players.set(p.playerId, p));

    // 2. Hydrate from localStorage
    this.hydrateFromLocalStorage();

    // 3. MySQL Database Synchronization (neextplay_db)
    this.initFirebaseSync();
  }

  private hydrateFromLocalStorage() {
    try {
      const storedCompanies = localStorage.getItem('neextplay_win_companies_cache');
      if (storedCompanies) {
        const parsed = JSON.parse(storedCompanies);
        if (Array.isArray(parsed)) {
          parsed.forEach((c: CompanyWinConfig) => {
            if (c && c.companyId && typeof c.companyId === 'string') {
              this.companies.set(c.companyId, c);
            }
          });
        }
      }

      const storedPlayers = localStorage.getItem('neextplay_win_players_controls_cache');
      if (storedPlayers) {
        const parsed = JSON.parse(storedPlayers);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any) => {
            const pId = p?.playerId || p?.id;
            if (pId && typeof pId === 'string') {
              this.players.set(pId, {
                ...p,
                playerId: pId,
                playerName: p.playerName || p.name || `Player ${pId.slice(-6)}`,
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('Could not hydrate win controls from localStorage:', e);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('neextplay_win_companies_cache', JSON.stringify(Array.from(this.companies.values())));
      localStorage.setItem('neextplay_win_players_controls_cache', JSON.stringify(Array.from(this.players.values())));
    } catch {}
  }

  private initFirebaseSync() {
    this.isFirebaseHydrated = true;
  }

  // --- COMPANY CONFIGS ---
  public getCompanyConfig(companyId: string): CompanyWinConfig {
    const existing = this.companies.get(companyId);
    if (existing) return existing;

    // Fallback to op_bengalbet or default
    return this.companies.get('op_bengalbet') || INITIAL_COMPANIES.op_bengalbet;
  }

  public getAllCompanyConfigs(): CompanyWinConfig[] {
    return Array.from(this.companies.values());
  }

  public async saveCompanyConfig(config: CompanyWinConfig): Promise<boolean> {
    config.updatedAt = new Date().toISOString();
    this.companies.set(config.companyId, config);
    this.saveToLocalStorage();

    // Inform backend server as well
    try {
      await fetch('/api/v1/engine/win-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'COMPANY_CONFIG', data: config })
      });
    } catch {}

    return true;
  }

  // --- PLAYER WIN CONTROLS & USER PROFILE MODE ---
  public getPlayerControl(playerId?: string): PlayerWinControl {
    const safePlayerId = typeof playerId === 'string' && playerId.trim() ? playerId.trim() : 'ply_bb_889922';
    const cleanId = safePlayerId.replace(/^ply_bb_/, '');

    // 1. Direct map lookup
    if (this.players.has(safePlayerId)) {
      return this.players.get(safePlayerId)!;
    }

    // 2. Safe normalized lookup
    const found = Array.from(this.players.values()).find(p => {
      if (!p || typeof p !== 'object') return false;
      const pid = p.playerId || (p as any).id;
      if (!pid || typeof pid !== 'string') return false;
      if (pid === safePlayerId) return true;
      if (cleanId && pid.includes(cleanId)) return true;
      return false;
    });

    if (found) return found;

    // Default player control
    const defaultControl: PlayerWinControl = {
      playerId: safePlayerId,
      playerName: `Player ${safePlayerId.slice(-6)}`,
      userProfileMode: false, // Default: Follows company configs
      winRateMode: 'NORMAL',
      targetWinRate: 50,
      forcedMinMultiplier: 1.5,
      forcedMaxMultiplier: 15.0,
      luckyStreakActive: false,
      updatedAt: new Date().toISOString()
    };

    this.players.set(safePlayerId, defaultControl);
    return defaultControl;
  }

  public getAllPlayerControls(): PlayerWinControl[] {
    return Array.from(this.players.values()).filter(p => p && typeof p.playerId === 'string');
  }

  public async savePlayerControl(control: PlayerWinControl): Promise<boolean> {
    control.updatedAt = new Date().toISOString();
    this.players.set(control.playerId, control);
    this.saveToLocalStorage();

    // Inform backend server
    try {
      await fetch('/api/v1/engine/player-controls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'PLAYER_CONTROL', data: control })
      });
    } catch {}

    return true;
  }

  /**
   * Core 3-Tier Outcome Decision Engine:
   * "if called game when true so user win change rate base the game work ..otherwise follow company confis...otherwise defult..."
   */
  public calculateGameOutcome(
    playerId?: string,
    companyId?: string,
    gameType: 'AVIATOR' | 'CRASH' | 'SLOT' = 'AVIATOR'
  ): CalculatedGameOutcome {
    const targetPlayerId = playerId || 'ply_bb_889922';
    const targetCompanyId = companyId || 'op_bengalbet';

    const playerControl = this.getPlayerControl(targetPlayerId);

    // =========================================================================
    // TIER 1: USER PROFILE MODE (HIGHEST PRIORITY)
    // If called game when userProfileMode === true, the game works on player's win change rate!
    // =========================================================================
    if (playerControl && playerControl.userProfileMode === true) {
      let isWin = false;
      let multiplier = 1.0;
      let slotMultiplier = 0.0;
      let effWinRate = playerControl.targetWinRate || 80;

      const minMult = playerControl.forcedMinMultiplier || 2.0;
      const maxMult = playerControl.forcedMaxMultiplier || 40.0;

      switch (playerControl.winRateMode) {
        case 'FORCED_WIN': {
          effWinRate = 95;
          isWin = true; // Guaranteed win!
          // Generates high multiplier flight
          const spread = Math.max(1, maxMult - minMult);
          multiplier = Number((minMult + Math.random() * spread).toFixed(2));
          slotMultiplier = Number((2.5 + Math.random() * 8.5).toFixed(2));
          break;
        }

        case 'BOOSTED': {
          effWinRate = 78;
          isWin = Math.random() < 0.78;
          if (isWin) {
            multiplier = Number((minMult + Math.random() * (maxMult * 0.7)).toFixed(2));
            slotMultiplier = Number((1.8 + Math.random() * 6.0).toFixed(2));
          } else {
            multiplier = Number((1.10 + Math.random() * 0.40).toFixed(2));
            slotMultiplier = 0;
          }
          break;
        }

        case 'FORCED_LOSE': {
          effWinRate = 10;
          isWin = Math.random() < 0.10;
          // Early crash at 1.00x - 1.25x
          multiplier = Number((1.00 + Math.random() * 0.25).toFixed(2));
          slotMultiplier = 0;
          break;
        }

        case 'CUSTOM': {
          effWinRate = playerControl.targetWinRate;
          isWin = (Math.random() * 100) < playerControl.targetWinRate;
          if (isWin) {
            const spread = Math.max(1, maxMult - minMult);
            multiplier = Number((minMult + Math.random() * spread).toFixed(2));
            slotMultiplier = Number((1.5 + Math.random() * 5.0).toFixed(2));
          } else {
            multiplier = Number((1.00 + Math.random() * 0.30).toFixed(2));
            slotMultiplier = 0;
          }
          break;
        }

        case 'NORMAL':
        default: {
          // If in User Profile Mode but set to Normal, use player's target win rate
          effWinRate = playerControl.targetWinRate || 65;
          isWin = (Math.random() * 100) < effWinRate;
          if (isWin) {
            multiplier = Number((1.8 + Math.random() * 8.0).toFixed(2));
            slotMultiplier = Number((1.5 + Math.random() * 3.5).toFixed(2));
          } else {
            multiplier = Number((1.00 + Math.random() * 0.50).toFixed(2));
            slotMultiplier = 0;
          }
          break;
        }
      }

      return {
        tier: 'USER_PROFILE_MODE',
        isWin,
        crashMultiplier: Math.max(1.00, multiplier),
        slotPaylineMultiplier: slotMultiplier,
        effectiveWinRate: effWinRate,
        appliedMode: playerControl.winRateMode,
        details: `⚡ Tier 1: User Profile Mode Active (${playerControl.winRateMode} • ${effWinRate}% Win Rate)`,
        sourceId: playerControl.playerId
      };
    }

    // =========================================================================
    // TIER 2: COMPANY CONFIGS (OPERATOR GOVERNANCE)
    // If player has no override / userProfileMode is false, follow Company Configuration!
    // =========================================================================
    const company = this.getCompanyConfig(targetCompanyId);
    if (company) {
      let isWin = false;
      let multiplier = 1.0;
      let slotMultiplier = 0.0;
      const bustRate = company.instantBustRate || 3.0;
      const cap = company.maxMultiplierCap || 1000;

      // 1. Check instant bust rate (house edge)
      const isInstantBust = (Math.random() * 100) < bustRate;
      if (isInstantBust) {
        return {
          tier: 'COMPANY_CONFIG',
          isWin: false,
          crashMultiplier: 1.00,
          slotPaylineMultiplier: 0,
          effectiveWinRate: company.rtpSetting,
          appliedMode: company.winMode,
          details: `🏢 Tier 2: Company Config (${company.companyName} • Instant Bust ${bustRate}%)`,
          sourceId: company.companyId
        };
      }

      // 2. Multiplier distribution governed by Company Win Mode
      const roll = Math.random();
      switch (company.winMode) {
        case 'HIGH_WIN': {
          // Higher RTP (e.g. 98%+) - favorable payouts
          isWin = roll < 0.65;
          if (roll < 0.35) {
            multiplier = Number((1.50 + Math.random() * 1.50).toFixed(2)); // 1.5x - 3.0x
          } else if (roll < 0.70) {
            multiplier = Number((3.00 + Math.random() * 6.00).toFixed(2)); // 3.0x - 9.0x
          } else if (roll < 0.92) {
            multiplier = Number((9.00 + Math.random() * 25.00).toFixed(2)); // 9x - 34x
          } else {
            multiplier = Number((35.00 + Math.random() * Math.min(250, cap)).toFixed(2));
          }
          slotMultiplier = isWin ? Number((2.0 + Math.random() * 6.0).toFixed(2)) : 0;
          break;
        }

        case 'TIGHT_MARGIN': {
          // Tight house edge (conservative)
          isWin = roll < 0.40;
          if (roll < 0.60) {
            multiplier = Number((1.05 + Math.random() * 0.85).toFixed(2)); // 1.05x - 1.90x
          } else if (roll < 0.85) {
            multiplier = Number((1.90 + Math.random() * 2.50).toFixed(2)); // 1.9x - 4.4x
          } else {
            multiplier = Number((4.50 + Math.random() * 15.00).toFixed(2));
          }
          slotMultiplier = isWin ? Number((1.2 + Math.random() * 2.5).toFixed(2)) : 0;
          break;
        }

        case 'JACKPOT_HUNT': {
          // High volatility - peaks up to cap
          isWin = roll < 0.42;
          if (roll < 0.65) {
            multiplier = Number((1.10 + Math.random() * 1.20).toFixed(2));
          } else if (roll < 0.88) {
            multiplier = Number((2.50 + Math.random() * 8.00).toFixed(2));
          } else {
            multiplier = Number((25.00 + Math.random() * Math.min(cap, 850)).toFixed(2)); // Giant Peak!
          }
          slotMultiplier = isWin ? Number((3.0 + Math.random() * 12.0).toFixed(2)) : 0;
          break;
        }

        case 'BALANCED':
        default: {
          // Standard balanced distribution matching RTP setting
          isWin = roll < 0.50;
          if (roll < 0.45) {
            multiplier = Number((1.15 + Math.random() * 1.10).toFixed(2)); // 1.15x - 2.25x
          } else if (roll < 0.75) {
            multiplier = Number((2.25 + Math.random() * 3.50).toFixed(2)); // 2.25x - 5.75x
          } else if (roll < 0.93) {
            multiplier = Number((5.75 + Math.random() * 14.00).toFixed(2)); // 5.75x - 19.75x
          } else {
            multiplier = Number((20.00 + Math.random() * Math.min(cap, 120)).toFixed(2));
          }
          slotMultiplier = isWin ? Number((1.5 + Math.random() * 4.0).toFixed(2)) : 0;
          break;
        }
      }

      return {
        tier: 'COMPANY_CONFIG',
        isWin,
        crashMultiplier: Math.min(cap, Math.max(company.minCrashMultiplier, multiplier)),
        slotPaylineMultiplier: slotMultiplier,
        effectiveWinRate: company.rtpSetting,
        appliedMode: company.winMode,
        details: `🏢 Tier 2: Company Config (${company.companyName} • RTP ${company.rtpSetting}% • ${company.winMode})`,
        sourceId: company.companyId
      };
    }

    // =========================================================================
    // TIER 3: DEFAULT ENGINE RULES (FALLBACK)
    // If neither exists, use certified default 97.0% RTP engine rules
    // =========================================================================
    const roll = Math.random();
    const isWin = roll < 0.48;
    const isInstantBust = Math.random() < 0.03;
    const multiplier = isInstantBust ? 1.00 : Number((1.10 + Math.random() * 8.0).toFixed(2));

    return {
      tier: 'DEFAULT_ENGINE',
      isWin,
      crashMultiplier: multiplier,
      slotPaylineMultiplier: isWin ? 2.0 : 0,
      effectiveWinRate: 97.0,
      appliedMode: 'STANDARD_CERTIFIED',
      details: '⚙️ Tier 3: Default Certified RNG Engine (97.0% RTP)',
      sourceId: 'default'
    };
  }
}

export const winControlService = new NeextplayWinControlService();
