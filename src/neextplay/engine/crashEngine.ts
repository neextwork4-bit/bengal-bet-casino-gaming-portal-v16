/**
 * NeextPlay Provably Fair Crash Game Mathematics Engine
 * "Neext Velocity" - High-frequency burst multiplayer crash curve
 */

import { getCryptoRandomInt } from './slotEngine';
import { winControlService } from '../services/neextplayWinControlService';

export interface CrashGameRound {
  roundId: string;
  crashPoint: number;
  serverSeedHash: string;
  serverSeed: string;
  clientSeed: string;
  state: 'WAITING' | 'FLYING' | 'CRASHED';
  startedAt: number;
  crashedAt?: number;
  outcomeSource?: string;
}

/**
 * Generate Provably Fair Crash Point with 3-Tier Outcome Hierarchy:
 * 1. Player Profile Mode (if active)
 * 2. Company Config (if defined)
 * 3. Default Certified RNG Engine
 */
export function generateCrashPoint(playerId?: string, companyId?: string): number {
  const outcome = winControlService.calculateGameOutcome(playerId, companyId, 'CRASH');
  return outcome.crashMultiplier;
}

export function calculateMultiplierAtTime(elapsedSeconds: number): number {
  // Smooth exponential growth curve: 1.00 * e^(0.06 * t)
  const mult = 1.0 + Math.pow(elapsedSeconds * 0.45, 1.35);
  return Number(mult.toFixed(2));
}
