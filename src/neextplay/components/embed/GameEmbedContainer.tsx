/**
 * NeextPlay Game Embed Container
 * Dedicated edge-to-edge container designed strictly for HTML <iframe> integration.
 * - Handles URL query parameters: ?embed=true&game=aviator&token=...&currency=USD&lang=en&operatorId=...
 * - Emits and listens to Bi-Directional window.postMessage API events
 * - Seamless zero-login embedded operation with persistent double-entry ledger wallet
 * - Supports fullscreen toggle, exit callback, audio sync, and live ledger balance updates
 */

import React, { useState, useEffect } from 'react';
import { AviatorGameClient } from '../game/AviatorGameClient';
import { SlotGameClient } from '../game/SlotGameClient';
import { CrashGameClient } from '../game/CrashGameClient';
import { LiveCasinoClient } from '../game/LiveCasinoClient';
import { platform } from '../../services/platformStore';
import { useI18n } from '../../services/i18nContext';
import { soundFx } from '../../utils/audio';
import { winControlService } from '../../services/neextplayWinControlService';
import { Sparkles, PlayCircle, ShieldCheck } from 'lucide-react';

export const GameEmbedContainer: React.FC = () => {
  const { setCurrency, setLanguage } = useI18n();
  const [activePlayer, setActivePlayer] = useState(() => platform.getActivePlayer());
  const [, setTick] = useState(0);

  // Parse URL query parameters
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const gameKey = (urlParams.get('game') || 'aviator').toLowerCase();
  const currencyParam = urlParams.get('currency') || urlParams.get('curr');
  const langParam = urlParams.get('lang') || urlParams.get('language');
  const operatorIdParam = urlParams.get('operatorId') || urlParams.get('op');
  const playerIdParam = urlParams.get('playerId') || urlParams.get('player');
  const usernameParam = urlParams.get('username') || urlParams.get('playerName') || urlParams.get('name') || '';
  const balanceParam = parseFloat(urlParams.get('balance') || '');
  const callbackUrlParam = urlParams.get('callbackUrl') || '';
  const returnUrlParam = urlParams.get('returnUrl') || '';
  const tokenParam = urlParams.get('token') || urlParams.get('session');

  // Mode & Win Rate Controls
  const modeParam = (urlParams.get('mode') || (tokenParam ? 'real' : 'demo')).toLowerCase();
  const isDemoMode = modeParam === 'demo';
  const userWinRateModeParam = urlParams.get('userWinRateMode') === 'true';
  const winRateModeParam = (urlParams.get('winRateMode') || 'NORMAL') as any;
  const targetWinRateParam = parseFloat(urlParams.get('targetWinRate') || '');
  const forcedMinMultParam = parseFloat(urlParams.get('forcedMinMultiplier') || '');
  const forcedMaxMultParam = parseFloat(urlParams.get('forcedMaxMultiplier') || '');
  const operatorWinRateParam = parseFloat(urlParams.get('operatorWinRate') || '');

  // Initialize session & postMessage bridge
  useEffect(() => {
    // 1. Sync currency & language if passed in query params
    if (currencyParam) {
      setCurrency(currencyParam);
      if (activePlayer) {
        activePlayer.currency = currencyParam;
      }
    }
    if (langParam) {
      setLanguage(langParam);
    }

    // 2. Select operator if specified
    if (operatorIdParam) {
      const op = platform.operators.find(o => o.id === operatorIdParam || o.code.toLowerCase() === operatorIdParam.toLowerCase());
      if (op) {
        platform.selectedOperatorId = op.id;
      }
    }

    // 3. Register or apply Win Rate Mode in Engine
    const targetPId = playerIdParam || (isDemoMode ? 'ply_demo_guest' : 'ply_bb_889922');
    if (userWinRateModeParam) {
      winControlService.savePlayerControl({
        playerId: targetPId,
        playerName: usernameParam || (isDemoMode ? 'Demo Guest' : 'BengalBet Player'),
        userProfileMode: true,
        winRateMode: winRateModeParam || 'FORCED_WIN',
        targetWinRate: !isNaN(targetWinRateParam) ? targetWinRateParam : 85,
        forcedMinMultiplier: !isNaN(forcedMinMultParam) ? forcedMinMultParam : 2.0,
        forcedMaxMultiplier: !isNaN(forcedMaxMultParam) ? forcedMaxMultParam : 35.0,
        luckyStreakActive: true,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }

    if (!isNaN(operatorWinRateParam) && operatorWinRateParam > 0) {
      winControlService.saveCompanyConfig({
        companyId: operatorIdParam || 'op_bengalbet',
        companyName: 'BengalBet Casino Portal',
        rtpSetting: operatorWinRateParam,
        winMode: 'BALANCED',
        maxMultiplierCap: 1000,
        instantBustRate: 3.0,
        minCrashMultiplier: 1.01,
        slotWildMultiplier: 1.2,
        slotScatterMultiplier: 1.2,
        houseMarginHoldPct: 3.8,
        emergencyThrottleActive: false,
        updatedAt: new Date().toISOString()
      }).catch(() => {});
    }

    // 4. Connect, register or load player with full user data
    const finalInitialBal = isDemoMode 
      ? 5000.00 
      : (!isNaN(balanceParam) && balanceParam >= 0 ? balanceParam : 1500.00);

    let player = platform.players.find(p => p.id === targetPId || p.externalPlayerId === targetPId);
    const targetOp = operatorIdParam || 'op_bengalbet';

    if (!player) {
      player = {
        id: targetPId,
        operatorId: targetOp,
        externalPlayerId: targetPId,
        username: usernameParam || (isDemoMode ? 'Demo Guest Player' : 'BengalBet Player'),
        currency: currencyParam || 'BDT',
        balance: finalInitialBal,
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
        isAutoRegistered: true,
      };
      platform.players.push(player);
    } else {
      if (isDemoMode) {
        player.balance = 5000.00;
      } else if (!isNaN(balanceParam) && balanceParam >= 0) {
        player.balance = balanceParam;
      }
      if (usernameParam) player.username = usernameParam;
      if (currencyParam) player.currency = currencyParam;
      player.lastActiveAt = new Date().toISOString();
      player.sessionCount = (player.sessionCount || 0) + 1;
    }

    platform.activePlayerId = player.id;
    setActivePlayer({ ...player });
    try {
      localStorage.setItem('neextplay_active_player_id', player.id);
      localStorage.setItem('neextplay_current_player_profile_id', player.id);
      if (callbackUrlParam) {
        localStorage.setItem('neextplay_callback_url', callbackUrlParam);
      }
    } catch {}

    // 5. Send INITIAL READY postMessage to parent window
    const notifyReady = () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'NEEXTPLAY_GAME_LOADED',
            game: gameKey,
            mode: modeParam,
            sessionToken: tokenParam || 'demo_iframe_token',
            currency: currencyParam || activePlayer.currency,
            version: '3.1.0',
            timestamp: Date.now(),
          },
          '*'
        );
      }
    };
    notifyReady();

    // 5. Setup postMessage event listener from parent window
    const handleParentMessage = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        switch (data.type) {
          case 'NEEXTPLAY_SET_BALANCE':
            if (typeof data.balance === 'number') {
              const curPlayer = platform.getActivePlayer();
              curPlayer.balance = data.balance;
              setActivePlayer({ ...curPlayer });
              setTick(t => t + 1);
              if (window.parent) {
                window.parent.postMessage(
                  { type: 'NEEXTPLAY_BALANCE_CONFIRMED', balance: curPlayer.balance },
                  '*'
                );
              }
            }
            break;

          case 'NEEXTPLAY_SET_MUTED':
            if (typeof data.muted === 'boolean') {
              if (soundFx.getMuted() !== data.muted) {
                soundFx.toggleMute();
              }
            }
            break;

          case 'NEEXTPLAY_PING':
            if (window.parent) {
              window.parent.postMessage({ type: 'NEEXTPLAY_PONG', timestamp: Date.now() }, '*');
            }
            break;

          case 'NEEXTPLAY_TRIGGER_EXIT':
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'NEEXTPLAY_EXIT_GAME', returnUrl: returnUrlParam }, '*');
            }
            if (returnUrlParam) {
              window.location.href = returnUrlParam;
            }
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => {
      window.removeEventListener('message', handleParentMessage);
    };
  }, []);

  const handleRefresh = () => {
    const p = platform.getActivePlayer();
    setActivePlayer({ ...p });
    setTick(t => t + 1);

    // Notify parent window of balance update
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'NEEXTPLAY_BALANCE_UPDATE',
          balance: p.balance,
          currency: p.currency,
          timestamp: Date.now(),
        },
        '*'
      );
    }
  };

  const isVelocity = gameKey === 'velocity' || gameKey.includes('velocity') || gameKey === 'game_neext_velocity';
  const isAviator = !isVelocity && (gameKey === 'aviator' || gameKey === 'crash' || gameKey.includes('aviator') || gameKey === 'game_aviator_pro');
  const isSlot = gameKey === 'slot' || gameKey.includes('fortune') || gameKey === 'game_neext_fortune';
  const isLive = gameKey === 'live' || gameKey.includes('roulette') || gameKey === 'game_monaco_roulette';

  return (
    <div className="w-full h-screen max-h-screen bg-[#070a10] text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Demo Mode Badge Bar */}
      {isDemoMode && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-b border-emerald-500/40 px-3 py-1 flex items-center justify-between text-xs shrink-0 z-30 shadow-md">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-black font-black text-[10px] tracking-wider uppercase animate-pulse">
              🎮 FREE DEMO MODE
            </span>
            <span className="text-emerald-200 text-[11px] font-semibold hidden sm:inline">
              Practice play with free virtual credits • Certified GLI-19 RNG
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-300 font-bold text-xs bg-black/40 px-2 py-0.5 rounded border border-emerald-500/30">
              DEMO CREDITS: ৳{activePlayer.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}

      {/* Direct Pure Game Client Edge-to-Edge */}
      <main className="flex-1 min-h-0 w-full h-full flex flex-col overflow-hidden">
        {isVelocity && <CrashGameClient onRefresh={handleRefresh} />}
        {isAviator && <AviatorGameClient onRefresh={handleRefresh} />}
        {isSlot && <SlotGameClient onRefresh={handleRefresh} />}
        {isLive && <LiveCasinoClient onRefresh={handleRefresh} />}
      </main>
    </div>
  );
};
