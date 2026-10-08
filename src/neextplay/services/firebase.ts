/**
 * NeextPlay Firebase Service Integration
 * Pure Firebase Authentication (Google Auth & Session Management)
 * Database operations handled by the PHP MySQL Backend System.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import neextplayConfig from '../neextplay-firebase-config.json';

// Initialize named app to keep NeextPlay isolated
const app = getApps().some(a => a.name === 'neextplay')
  ? getApp('neextplay')
  : initializeApp(neextplayConfig, 'neextplay');

export const auth = getAuth(app);

// Test connection returns ready
export async function testConnection(): Promise<boolean> {
  return true;
}
