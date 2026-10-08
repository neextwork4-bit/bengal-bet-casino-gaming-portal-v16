/**
 * BengalBet Firebase Auth Service
 * Pure Firebase Authentication (Google Auth & Session Management)
 * Database operations handled by the PHP MySQL Backend System.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserAccount } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Convert Firebase User into standard UserAccount
 */
export const formatUserData = (firebaseUser: FirebaseUser, extraData?: any): UserAccount => {
  const defaultBalance = 5420.50;
  const username = extraData?.username || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Player');
  const avatar = extraData?.avatar || firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces';
  const phone = extraData?.phone || firebaseUser.phoneNumber || '01615249856';
  
  return {
    id: firebaseUser.uid,
    isLoggedIn: true,
    username,
    phone,
    email: firebaseUser.email || undefined,
    balance: extraData?.balance !== undefined ? extraData.balance : defaultBalance,
    vipLevel: extraData?.vipLevel ?? 2,
    vipExp: extraData?.vipExp ?? 8450,
    vipMaxExp: extraData?.vipMaxExp ?? 15000,
    freeSpins: extraData?.freeSpins ?? 3,
    redPacketsAvailable: extraData?.redPacketsAvailable ?? 2,
    goldenEggsAvailable: extraData?.goldenEggsAvailable ?? 2,
    unreadNotifications: extraData?.unreadNotifications ?? 3,
    avatar,
    referralCode: extraData?.referralCode || 'BDT' + firebaseUser.uid.substring(0, 6).toUpperCase(),
    totalEarnings: extraData?.totalEarnings ?? 3250,
    referredFriendsCount: extraData?.referredFriendsCount ?? 6,
  };
};

/**
 * Sign in using Firebase Google Auth popup.
 * Pure Authentication without Firestore database dependencies.
 */
export const signInWithGoogleFirebase = async (): Promise<UserAccount> => {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  const account = formatUserData(fbUser);
  
  try {
    localStorage.setItem('bengalbet_user_session', JSON.stringify(account));
  } catch {}

  return account;
};

/**
 * Log out from Firebase Auth
 */
export const signOutFirebase = async (): Promise<void> => {
  await signOut(auth);
};

export { onAuthStateChanged };
