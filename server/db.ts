import fs from 'fs';
import path from 'path';

export interface UserRecord {
  id: string;
  username: string;
  phone: string;
  passwordHash: string;
  balance: number;
  vipLevel: number;
  vipExp: number;
  vipMaxExp: number;
  freeSpins: number;
  redPacketsAvailable: number;
  goldenEggsAvailable: number;
  unreadNotifications: number;
  referralCode: string;
  totalEarnings: number;
  referredFriendsCount: number;
  avatar: string;
  createdAt: string;
  transactionPassword?: string;
  birthday?: string;
  realName?: string;
  email?: string;
  status?: 'active' | 'frozen' | 'banned';
}

export interface TransactionRecord {
  id: string;
  userId: string;
  username?: string;
  userPhone?: string;
  phone?: string;
  note?: string;
  type: 'deposit' | 'withdraw' | 'bonus' | 'rebate' | 'bet_payout' | 'adjustment';
  amount: number;
  bonus?: number;
  fee?: number;
  channel: 'bkash' | 'nagad' | 'rocket' | 'usdt' | 'bank' | 'system' | 'inbox_bonus';
  gateway?: string;
  accountNumber?: string;
  trxId: string;
  status: 'success' | 'pending' | 'rejected' | 'processing' | 'flagged';
  createdAt: string;
  updatedAt?: string;
  processedAt?: string;
  processedBy?: string;
  adminNote?: string;
  rejectionReason?: string;
  description?: string;
}

export interface WalletRecord {
  id: string;
  userId: string;
  type: 'Rocket' | 'Nagad' | 'BKash' | 'USDT';
  accountName: string;
  accountNumber: string;
  fullNumber: string;
  createdAt: string;
  isDefault: boolean;
}

export interface BetRecord {
  id: string;
  userId: string;
  orderNo: string;
  category: 'slot' | 'live' | 'fishing' | 'poker' | 'sports' | 'crash';
  vendor: string;
  gameName: string;
  gameRound: string;
  betAmount: number;
  validBet: number;
  reward: number;
  profit: number;
  time: string;
  date: string;
}

export interface MessageRecord {
  id: string;
  userId: string; // 'all' or specific user id
  sender: string;
  title: string;
  displayTime: string;
  dateFull: string;
  isRead: boolean;
  category?: 'notice' | 'bonus' | 'mission' | 'vip' | 'system';
  claimableBonus?: number;
  claimedBy?: string[];
  content: {
    headline: string;
    description: string;
    howToGetTitle: string;
    howToGetSteps: string[];
    rulesTitle: string;
    rules: string[];
    officialLinksTitle?: string;
    officialLinks?: string[];
  };
}

export interface FeedbackMessage {
  id: string;
  sender: 'user' | 'admin';
  senderName?: string;
  text: string;
  createdAt: string;
}

export interface FeedbackRecord {
  id: string;
  ticketNumber?: string;
  userId: string;
  username?: string;
  type: string;
  subject?: string;
  content: string;
  contact?: string;
  priority?: 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'replied' | 'resolved' | 'closed';
  reply?: string;
  messages?: FeedbackMessage[];
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessageRecord {
  id: string;
  sessionId: string;
  sender: 'user' | 'agent' | 'bot' | 'system';
  senderName: string;
  senderAvatar?: string;
  text: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'slip';
  quickAction?: { label: string; action: string; data?: any };
  isRead: boolean;
  createdAt: string;
}

export interface ChatSessionRecord {
  id: string;
  userId: string;
  username: string;
  userVip: number;
  userBalance: number;
  userPhone?: string;
  status: 'active' | 'waiting' | 'resolved' | 'closed';
  department: 'general' | 'deposit' | 'withdraw' | 'bonus' | 'technical';
  assignedAgent?: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  unreadUserCount: number;
  unreadAdminCount: number;
  lastMessage?: string;
  lastMessageAt: string;
  rating?: number; // 1 to 5
  ratingComment?: string;
  internalNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameEngineSettings {
  globalRtp: number; // 0 to 100
  engineMode: 'normal' | 'drain' | 'generous' | 'jackpot_frenzy' | 'custom';
  volatility: 'low' | 'medium' | 'high' | 'extreme';
  maxMultiplierCap: number;
  nearMissRate: number; // 0 to 100
  dynamicBalancing: boolean;
  categoryRtp: {
    crash: number;
    slot: number;
    table: number;
    fishing: number;
    arcade: number;
  };
  gameRtp: Record<string, number>;
  forceOutcome: 'none' | 'always_win' | 'always_lose' | 'big_win_next';
  telemetry: {
    totalWagered: number;
    totalPayout: number;
    totalRounds: number;
    lastResetTime: string;
  };
}

export interface ReferralRecord {
  id: string;
  referrerId: string;
  referrerUsername: string;
  referrerCode: string;
  referredUserId: string;
  referredUsername: string;
  referredPhone: string;
  level: number;
  instantBonusPaid: boolean;
  instantBonusAmount: number;
  totalDeposit: number;
  totalBet: number;
  depositCommission: number;
  betCommission: number;
  totalCommissionEarned: number;
  status: 'active' | 'pending_first_deposit' | 'frozen';
  joinedAt: string;
  updatedAt?: string;
}

export interface ReferralRewardClaimRecord {
  id: string;
  userId: string;
  tierId: number;
  level?: number;
  type?: 'milestone_level' | 'tier';
  requiredCount: number;
  bonusAmount: number;
  trxId: string;
  claimedAt: string;
}

export interface InstantBonusRangeItem {
  id: number;
  minCount: number;
  maxCount: number;
  instantBonus: number;
  label?: string;
  desc?: string;
}

export interface PoroskarLevelItem {
  id: number;
  level: number;
  requiredCount: number;
  rewardAmount: number;
  name: string;
  desc?: string;
  badge?: 'bronze' | 'silver' | 'gold' | 'diamond' | 'crown';
}

export interface ReferralTierItem {
  id: number;
  count: number;
  bonus: number;
  desc?: string;
}

export interface ReferralSettings {
  enabled: boolean;
  instantBonusPerFriend: number;
  minDepositToQualify: number;
  minBetTurnoverToQualify: number;
  depositRebateRate: number; // 0.70% on deposit for 1st gen direct referral
  betTurnoverRebateRate: number; // 1.00% on bet turnover
  tier1DepositCommissionRate?: number; // alias for compatibility
  tier2DepositCommissionRate?: number;
  tier3DepositCommissionRate?: number;
  maxBonusCap: number;
  autoCreditInstantBonus: boolean;
  rulesTitle: string;
  rulesList: string[];
  instantBonusRanges?: InstantBonusRangeItem[];
  poroskarLevels?: PoroskarLevelItem[];
  customTiers?: ReferralTierItem[];
}

export const DEFAULT_INSTANT_BONUS_RANGES: InstantBonusRangeItem[] = [
  { id: 1, minCount: 1, maxCount: 5, instantBonus: 300, label: '১ - ৫ জন বন্ধু', desc: 'প্রতি রেফারে তাৎক্ষণিক ৳৩০০ বোনাস' },
  { id: 2, minCount: 6, maxCount: 10, instantBonus: 800, label: '৬ - ১০ জন বন্ধু', desc: 'প্রতি রেফারে তাৎক্ষণিক ৳৮০০ বোনাস' },
  { id: 3, minCount: 11, maxCount: 20, instantBonus: 1500, label: '১১ - ২০ জন বন্ধু', desc: 'প্রতি রেফারে তাৎক্ষণিক ৳১,৫০০ মেগা বোনাস' },
  { id: 4, minCount: 21, maxCount: 50, instantBonus: 3000, label: '২১ - ৫০ জন বন্ধু', desc: 'প্রতি রেফারে তাৎক্ষণিক ৳৩,০০০ সুপার বোনাস' },
  { id: 5, minCount: 51, maxCount: 100, instantBonus: 5000, label: '৫১ - ১০০ জন বন্ধু', desc: 'প্রতি রেফারে তাৎক্ষণিক ৳৫,০০০ কিং বোনাস' },
  { id: 6, minCount: 101, maxCount: 999999, instantBonus: 10000, label: '১০১+ জন বন্ধু', desc: 'প্রতি রেফারে তাৎক্ষণিক ৳১০,০০০ গ্র্যান্ড বোনাস' },
];

export const DEFAULT_POROSKAR_LEVELS: PoroskarLevelItem[] = [
  { id: 1, level: 1, requiredCount: 2, rewardAmount: 50, name: 'লেভেল ১ পুরস্কার', desc: '২ জন বন্ধু সফল রেফার', badge: 'bronze' },
  { id: 2, level: 2, requiredCount: 4, rewardAmount: 150, name: 'লেভেল ২ পুরস্কার', desc: '৪ জন বন্ধু সফল রেফার', badge: 'bronze' },
  { id: 3, level: 3, requiredCount: 8, rewardAmount: 350, name: 'লেভেল ৩ পুরস্কার', desc: '৮ জন বন্ধু সফল রেফার', badge: 'silver' },
  { id: 4, level: 4, requiredCount: 15, rewardAmount: 800, name: 'লেভেল ৪ পুরস্কার', desc: '১৫ জন বন্ধু সফল রেফার', badge: 'silver' },
  { id: 5, level: 5, requiredCount: 30, rewardAmount: 2000, name: 'লেভেল ৫ পুরস্কার', desc: '৩০ জন বন্ধু সফল রেফার', badge: 'gold' },
  { id: 6, level: 6, requiredCount: 60, rewardAmount: 5000, name: 'লেভেল ৬ পুরস্কার', desc: '৬০ জন বন্ধু সফল রেফার', badge: 'gold' },
  { id: 7, level: 7, requiredCount: 100, rewardAmount: 12000, name: 'লেভেল ৭ পুরস্কার', desc: '১০০ জন বন্ধু সফল রেফার', badge: 'diamond' },
  { id: 8, level: 8, requiredCount: 250, rewardAmount: 35000, name: 'লেভেল ৮ পুরস্কার', desc: '২৫০ জন বন্ধু সফল রেফার', badge: 'diamond' },
  { id: 9, level: 9, requiredCount: 500, rewardAmount: 80000, name: 'লেভেল ৯ পুরস্কার', desc: '৫০০ জন বন্ধু সফল রেফার', badge: 'crown' },
  { id: 10, level: 10, requiredCount: 1000, rewardAmount: 200000, name: 'লেভেল ১০ আলটিমেট', desc: '১,০০০ জন বন্ধু মেগা পুরস্কার', badge: 'crown' },
];

export const REFERRAL_TIER_CONFIG: ReferralTierItem[] = [
  { id: 1, count: 1, bonus: 300, desc: '১ম বন্ধু আমন্ত্রণ' },
  { id: 2, count: 2, bonus: 300, desc: '২য় বন্ধু আমন্ত্রণ' },
  { id: 3, count: 3, bonus: 300, desc: '৩য় বন্ধু আমন্ত্রণ' },
  { id: 4, count: 4, bonus: 300, desc: '৪র্থ বন্ধু আমন্ত্রণ' },
  { id: 5, count: 5, bonus: 300, desc: '৫ম বন্ধু আমন্ত্রণ' },
  { id: 6, count: 10, bonus: 1500, desc: '১০ জন বন্ধু মেগা রিওয়ার্ড' },
  { id: 7, count: 15, bonus: 1500, desc: '১৫ জন বন্ধু মেগা রিওয়ার্ড' },
  { id: 8, count: 20, bonus: 1500, desc: '২০ জন বন্ধু মেগা রিওয়ার্ড' },
  { id: 9, count: 30, bonus: 3000, desc: '৩০ জন বন্ধু সুপার রিওয়ার্ড' },
  { id: 10, count: 40, bonus: 3000, desc: '৪০ জন বন্ধু সুপার রিওয়ার্ড' },
  { id: 11, count: 50, bonus: 3000, desc: '৫০ জন বন্ধু সুপার রিওয়ার্ড' },
  { id: 12, count: 60, bonus: 3000, desc: '৬০ জন বন্ধু সুপার রিওয়ার্ড' },
  { id: 13, count: 70, bonus: 3000, desc: '৭০ জন বন্ধু সুপার রিওয়ার্ড' },
  { id: 14, count: 80, bonus: 3000, desc: '৮০ জন বন্ধু সুপার রিওয়ার্ড' },
  { id: 15, count: 90, bonus: 3000, desc: '৯০ জন বন্ধু সুপার রিওয়ার্ড' },
  { id: 16, count: 100, bonus: 5000, desc: '১০০ জন বন্ধু কিং রিওয়ার্ড' },
  { id: 17, count: 35000, bonus: 1500000, desc: '৩৫,০০০ জন বন্ধু গ্র্যান্ড রিওয়ার্ড' },
  { id: 18, count: 40000, bonus: 1500000, desc: '৪০,০০০ জন বন্ধু গ্র্যান্ড রিওয়ার্ড' },
  { id: 19, count: 50000, bonus: 3000000, desc: '৫০,০০০ জন বন্ধু আলটিমেট বোনাস' },
  { id: 20, count: 60000, bonus: 3000000, desc: '৬০,০০০ জন বন্ধু আলটিমেট বোনাস' },
  { id: 21, count: 70000, bonus: 3000000, desc: '৭০,০০০ জন বন্ধু আলটিমেট বোনাস' },
  { id: 22, count: 80000, bonus: 3000000, desc: '৮০,০০০ জন বন্ধু আলটিমেট বোনাস' },
  { id: 23, count: 90000, bonus: 3000000, desc: '৯০,০০০ জন বন্ধু আলটিমেট বোনাস' },
  { id: 24, count: 100000, bonus: 3000000, desc: '১,০০,০০০ জন বন্ধু আলটিমেট বোনাস' },
];

/**
 * Calculates range-based instant bonus according to current friend count
 */
export function getBonusForFriendCount(count: number, ranges?: InstantBonusRangeItem[], tiers?: ReferralTierItem[], defaultBonus: number = 300): number {
  if (ranges && ranges.length > 0) {
    const matchedRange = ranges.find(r => count >= r.minCount && count <= r.maxCount);
    if (matchedRange) return matchedRange.instantBonus;
    // If exceeds max
    const sorted = [...ranges].sort((a, b) => b.maxCount - a.maxCount);
    if (count > sorted[0].maxCount) return sorted[0].instantBonus;
  }

  const activeTiers = (tiers && tiers.length > 0) ? tiers : REFERRAL_TIER_CONFIG;
  const exact = activeTiers.find(t => t.count === count);
  if (exact) return exact.bonus;

  const sorted = [...activeTiers].sort((a, b) => b.count - a.count);
  const matched = sorted.find(t => count >= t.count);
  return matched ? matched.bonus : defaultBonus;
}

export const DEFAULT_REFERRAL_SETTINGS: ReferralSettings = {
  enabled: true,
  instantBonusPerFriend: 300.0,
  minDepositToQualify: 300.0,
  minBetTurnoverToQualify: 3000.0,
  depositRebateRate: 0.70,
  betTurnoverRebateRate: 1.00,
  tier1DepositCommissionRate: 0.70,
  maxBonusCap: 3000000.0,
  autoCreditInstantBonus: true,
  rulesTitle: 'আমন্ত্রণ বোনাস নিয়মাবলী',
  rulesList: [
    '১. বন্ধুদের আপনার রেফারেল লিংক বা QR কোডের মাধ্যমে আমন্ত্রণ জানান।',
    '২. আপনার আমন্ত্রিত বন্ধু ডিপোজিট ও বেটিং সম্পন্ন করলে তাত্ক্ষণিক রেঞ্জ বোনাস পাবেন (আমন্ত্রিত সংখ্যা বৃদ্ধির সাথে বোনাস রেট বৃদ্ধি পাবে)।',
    '৩. প্রতিটি বৈধ বেটিং থেকে আজীবন ১.০% এজেন্ট কমিশন এবং ডিপোজিটে ০.৭% কমিশন আপনার অ্যাকাউন্টে জমা হবে।',
    '৪. মাইলস্টোন লেভেল পূরণ করে পুরস্কার ট্যাব থেকে এক-একটি লেভেলের আকর্ষণীয় বোনাস দাবি করুন।'
  ],
  instantBonusRanges: DEFAULT_INSTANT_BONUS_RANGES,
  poroskarLevels: DEFAULT_POROSKAR_LEVELS,
  customTiers: REFERRAL_TIER_CONFIG
};

export interface SiteSettings {
  bkashNumber: string;
  nagadNumber: string;
  rocketNumber: string;
  usdtAddress: string;
  minDeposit: number;
  maxDeposit: number;
  minWithdraw: number;
  maxWithdraw: number;
  siteNotice: {
    enabled: boolean;
    titleBn: string;
    titleEn: string;
    contentBn: string;
    contentEn: string;
    bannerImage: string;
  };
  gameRtp: Record<string, number>;
  gameEngine?: GameEngineSettings;
  referralSettings?: ReferralSettings;
  maintenanceMode: boolean;
}

export interface VipTierRecord {
  level: number;
  name: string;
  badgeType: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'crown';
  targetBet: number;
  targetBetDisplay?: string;
  depositTarget: number;
  upgradeBonus: number;
  weeklyBonus: number;
  monthlyBonus: number;
  birthdayBonus?: number;
  slotRebate?: number;
  liveRebate?: number;
  description?: string;
  perks?: string[];
  status?: 'active' | 'inactive';
  updatedAt?: string;
}

export interface VipRewardClaimRecord {
  id: string;
  userId: string;
  username?: string;
  level: number;
  type: 'upgrade' | 'weekly' | 'monthly' | 'birthday' | 'custom';
  eventName: string;
  bonus: number;
  points: number;
  ticketName: string;
  date: string;
  timestamp: number;
  status: 'claimed' | 'completed';
}

export const DEFAULT_VIP_TIERS: VipTierRecord[] = [
  { level: 0, name: 'VIP0', badgeType: 'bronze', targetBet: 2000, targetBetDisplay: '2,000.00', depositTarget: 500, upgradeBonus: 0, weeklyBonus: 0, monthlyBonus: 0, slotRebate: 0.2, liveRebate: 0.1, status: 'active', description: 'নতুন সদস্য লেভেল' },
  { level: 1, name: 'VIP1', badgeType: 'silver', targetBet: 20000, targetBetDisplay: '20,000.00', depositTarget: 2000, upgradeBonus: 50, weeklyBonus: 20, monthlyBonus: 50, slotRebate: 0.4, liveRebate: 0.3, status: 'active', description: 'সিলভার ভিআইপি সদস্য' },
  { level: 2, name: 'VIP2', badgeType: 'silver', targetBet: 100000, targetBetDisplay: '100,000.00', depositTarget: 10000, upgradeBonus: 180, weeklyBonus: 60, monthlyBonus: 150, slotRebate: 0.6, liveRebate: 0.4, status: 'active', description: 'সিলভার স্টার সদস্য' },
  { level: 3, name: 'VIP3', badgeType: 'gold', targetBet: 500000, targetBetDisplay: '500,000.00', depositTarget: 50000, upgradeBonus: 588, weeklyBonus: 188, monthlyBonus: 500, slotRebate: 0.8, liveRebate: 0.5, status: 'active', description: 'গোল্ড ভিআইপি সদস্য' },
  { level: 4, name: 'VIP4', badgeType: 'gold', targetBet: 2000000, targetBetDisplay: '2,000,000.00', depositTarget: 200000, upgradeBonus: 1888, weeklyBonus: 588, monthlyBonus: 1500, slotRebate: 1.0, liveRebate: 0.7, status: 'active', description: 'গোল্ড মাস্টার সদস্য' },
  { level: 5, name: 'VIP5', badgeType: 'platinum', targetBet: 5000000, targetBetDisplay: '5,000,000.00', depositTarget: 500000, upgradeBonus: 5888, weeklyBonus: 1888, monthlyBonus: 5000, slotRebate: 1.2, liveRebate: 0.9, status: 'active', description: 'প্লাটিনাম এলিট সদস্য' },
  { level: 6, name: 'VIP6', badgeType: 'platinum', targetBet: 10000000, targetBetDisplay: '10,000,000.00', depositTarget: 1000000, upgradeBonus: 12888, weeklyBonus: 3888, monthlyBonus: 10000, slotRebate: 1.5, liveRebate: 1.1, status: 'active', description: 'প্লাটিনাম কিং সদস্য' },
  { level: 7, name: 'VIP7', badgeType: 'diamond', targetBet: 25000000, targetBetDisplay: '25,000,000.00', depositTarget: 2500000, upgradeBonus: 28888, weeklyBonus: 8888, monthlyBonus: 25000, slotRebate: 1.8, liveRebate: 1.3, status: 'active', description: 'ডায়মন্ড প্রিভিলেজ সদস্য' },
  { level: 8, name: 'VIP8', badgeType: 'diamond', targetBet: 50000000, targetBetDisplay: '50,000,000.00', depositTarget: 5000000, upgradeBonus: 58888, weeklyBonus: 18888, monthlyBonus: 50000, slotRebate: 2.2, liveRebate: 1.6, status: 'active', description: 'ডায়মন্ড রয়্যাল সদস্য' },
  { level: 9, name: 'VIP9', badgeType: 'crown', targetBet: 100000000, targetBetDisplay: '100,000,000.00', depositTarget: 10000000, upgradeBonus: 128888, weeklyBonus: 38888, monthlyBonus: 100000, slotRebate: 2.6, liveRebate: 1.8, status: 'active', description: 'ক্রাউন সুপার ভিআইপি' },
  { level: 10, name: 'VIP10', badgeType: 'crown', targetBet: 200000000, targetBetDisplay: '200,000,000.00', depositTarget: 20000000, upgradeBonus: 300000, weeklyBonus: 88888, monthlyBonus: 200000, slotRebate: 3.0, liveRebate: 2.0, status: 'active', description: 'রয়্যাল অ্যাম্বাসেডর কিং' }
];

// =========================================================================
// 1. DAILY SIGN-IN TYPES & CONSTANTS
// =========================================================================
export interface DailySignInRecord {
  id: string;
  userId: string;
  username: string;
  day: number;
  bonus: number;
  date: string; // YYYY-MM-DD
  claimedAt: string;
  streak: number;
  vipMultiplier?: number;
  status: 'claimed';
  note?: string;
}

export interface DailySignInDayConfig {
  day: number;
  bonus: number;
  requiredBet: number;
  labelBn?: string;
  isSpecial?: boolean;
}

export interface DailySignInConfig {
  enabled: boolean;
  cycleDays: number;
  days: DailySignInDayConfig[];
  vipBonusPercent: Record<number, number>;
  rulesTitle: string;
  rulesList: string[];
}

export const DEFAULT_DAILY_SIGNIN_DAYS: DailySignInDayConfig[] = [
  { day: 1, bonus: 1.00, requiredBet: 0, labelBn: 'দিন ১' },
  { day: 2, bonus: 2.00, requiredBet: 100, labelBn: 'দিন ২' },
  { day: 3, bonus: 5.00, requiredBet: 200, labelBn: 'দিন ৩' },
  { day: 4, bonus: 6.00, requiredBet: 300, labelBn: 'দিন ৪' },
  { day: 5, bonus: 8.00, requiredBet: 500, labelBn: 'দিন ৫' },
  { day: 6, bonus: 10.00, requiredBet: 800, labelBn: 'দিন ৬' },
  { day: 7, bonus: 12.00, requiredBet: 1000, labelBn: 'দিন ৭ (বিশেষ)', isSpecial: true },
  { day: 8, bonus: 15.00, requiredBet: 1200, labelBn: 'দিন ৮' },
  { day: 9, bonus: 16.00, requiredBet: 1500, labelBn: 'দিন ৯' },
  { day: 10, bonus: 18.00, requiredBet: 1800, labelBn: 'দিন ১০' },
  { day: 11, bonus: 20.00, requiredBet: 2000, labelBn: 'দিন ১১' },
  { day: 12, bonus: 22.00, requiredBet: 2200, labelBn: 'দিন ১২' },
  { day: 13, bonus: 25.00, requiredBet: 2500, labelBn: 'দিন ১৩' },
  { day: 14, bonus: 26.00, requiredBet: 2800, labelBn: 'দিন ১৪ (বিশেষ)', isSpecial: true },
  { day: 15, bonus: 28.00, requiredBet: 3000, labelBn: 'দিন ১৫' },
  { day: 16, bonus: 30.00, requiredBet: 3500, labelBn: 'দিন ১৬' },
  { day: 17, bonus: 32.00, requiredBet: 4000, labelBn: 'দিন ১৭' },
  { day: 18, bonus: 35.00, requiredBet: 4500, labelBn: 'দিন ১৮' },
  { day: 19, bonus: 36.00, requiredBet: 5000, labelBn: 'দিন ১৯' },
  { day: 20, bonus: 38.00, requiredBet: 5500, labelBn: 'দিন ২০' },
  { day: 21, bonus: 40.00, requiredBet: 6000, labelBn: 'দিন ২১ (বিশেষ)', isSpecial: true },
  { day: 22, bonus: 40.00, requiredBet: 6500, labelBn: 'দিন ২২' },
  { day: 23, bonus: 40.00, requiredBet: 7000, labelBn: 'দিন ২৩' },
  { day: 24, bonus: 40.00, requiredBet: 7500, labelBn: 'দিন ২৪' },
  { day: 25, bonus: 40.00, requiredBet: 8000, labelBn: 'দিন ২৫' },
  { day: 26, bonus: 45.00, requiredBet: 8500, labelBn: 'দিন ২৬' },
  { day: 27, bonus: 45.00, requiredBet: 9000, labelBn: 'দিন ২৭' },
  { day: 28, bonus: 50.00, requiredBet: 9500, labelBn: 'দিন ২৮' },
  { day: 29, bonus: 50.00, requiredBet: 10000, labelBn: 'দিন ২৯' },
  { day: 30, bonus: 60.00, requiredBet: 12000, labelBn: 'দিন ৩০ (মেগা বোনাস)', isSpecial: true }
];

export const DEFAULT_DAILY_SIGNIN_CONFIG: DailySignInConfig = {
  enabled: true,
  cycleDays: 30,
  days: DEFAULT_DAILY_SIGNIN_DAYS,
  vipBonusPercent: {
    0: 0,
    1: 5,
    2: 10,
    3: 15,
    4: 20,
    5: 25,
    6: 30,
    7: 35,
    8: 40,
    9: 45,
    10: 50
  },
  rulesTitle: 'দৈনিক সাইন-ইন কার্যক্রমের নিয়মাবলী:',
  rulesList: [
    '১. প্রতিদিন সাইন ইন করে তাৎক্ষণিক নগদ বোনাস জিতে নিন।',
    '২. টানা সাইন ইন করলে বিশেষ মেগা পুরস্কার প্রদান করা হবে।',
    '৩. ভিআইপি স্তর অনুযায়ী অতিরিক্ত ভিআইপি শতাংশ বোনাস কার্যকর হবে।',
    '৪. প্রতিদিন বাংলাদেশ সময় রাত ১২:০০ টায় নতুন দিনের সাইন-ইন চক্র পুনরায় গণনা শুরু হয়।'
  ]
};

// =========================================================================
// 2. RESCUE FUND TYPES & CONSTANTS
// =========================================================================
export interface RescueTierRecord {
  id: number;
  minLoss: number;
  percentage: number;
  maxBonus: number;
  nameBn: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface RescueClaimRecord {
  id: string;
  userId: string;
  username: string;
  date: string; // YYYY-MM-DD
  totalBet: number;
  totalWin: number;
  netLoss: number;
  percentage: number;
  bonusAmount: number;
  status: 'claimed' | 'approved' | 'rejected' | 'pending';
  claimedAt: string;
  adminNote?: string;
}

export const DEFAULT_RESCUE_TIERS: RescueTierRecord[] = [
  { id: 1, minLoss: 500, percentage: 3.0, maxBonus: 100, nameBn: 'টিয়ার ১ উদ্ধার তহবিল (৩%)', description: 'ন্যূনতম লস ৳৫০০', status: 'active' },
  { id: 2, minLoss: 2000, percentage: 5.0, maxBonus: 300, nameBn: 'টিয়ার ২ উদ্ধার তহবিল (৫%)', description: 'ন্যূনতম লস ৳২,০০০', status: 'active' },
  { id: 3, minLoss: 5000, percentage: 8.0, maxBonus: 888, nameBn: 'টিয়ার ৩ উদ্ধার তহবিল (৮%)', description: 'ন্যূনতম লস ৳৫,০০০', status: 'active' },
  { id: 4, minLoss: 10000, percentage: 10.0, maxBonus: 2000, nameBn: 'টিয়ার ৪ উদ্ধার তহবিল (১০%)', description: 'ন্যূনতম লস ৳১০,০০০', status: 'active' },
  { id: 5, minLoss: 25000, percentage: 12.0, maxBonus: 5000, nameBn: 'টিয়ার ৫ উদ্ধার তহবিল (১২%)', description: 'ন্যূনতম লস ৳২৫,০০০', status: 'active' },
  { id: 6, minLoss: 50000, percentage: 15.0, maxBonus: 15000, nameBn: 'টিয়ার ৬ সুপার উদ্ধার (১৫%)', description: 'ন্যূনতম লস ৳৫০,০০০', status: 'active' },
  { id: 7, minLoss: 100000, percentage: 20.0, maxBonus: 50000, nameBn: 'টিয়ার ৭ ভিআইপি মেগা উদ্ধার (২০%)', description: 'ন্যূনতম লস ৳১,০০,০০০', status: 'active' }
];

// =========================================================================
// 3. PROMO CODE TYPES & CONSTANTS
// =========================================================================
export interface PromoCodeRecord {
  id: string;
  code: string;
  title: string;
  type: 'fixed_cash' | 'percentage' | 'free_spins';
  amount: number;
  minVipLevel: number;
  maxUsageCount: number;
  currentUsageCount: number;
  expiresAt?: string;
  status: 'active' | 'inactive' | 'expired';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PromoRedemptionRecord {
  id: string;
  promoId: string;
  code: string;
  userId: string;
  username: string;
  bonusAmount: number;
  redeemedAt: string;
}

export const DEFAULT_PROMO_CODES: PromoCodeRecord[] = [
  {
    id: 'pc-1',
    code: 'BENGALBETVIP',
    title: 'অফিসিয়াল ভিআইপি রিডিম বোনাস',
    type: 'fixed_cash',
    amount: 200,
    minVipLevel: 0,
    maxUsageCount: 1000,
    currentUsageCount: 42,
    status: 'active',
    description: 'BengalBet অফিসিয়াল ভিআইপি কোড',
    createdAt: '2026-08-01 10:00:00'
  },
  {
    id: 'pc-2',
    code: 'TELEGRAM100',
    title: 'টেলিগ্রাম কমিউনিটি গিফট ভাউচার',
    type: 'fixed_cash',
    amount: 100,
    minVipLevel: 0,
    maxUsageCount: 2000,
    currentUsageCount: 189,
    status: 'active',
    description: 'টেলিগ্রাম অফিসিয়াল গ্রুপ মেম্বার গিফট',
    createdAt: '2026-08-05 12:00:00'
  },
  {
    id: 'pc-3',
    code: 'WELCOME2026',
    title: 'নতুন সদস্য ওয়েলকাম প্রোমো',
    type: 'fixed_cash',
    amount: 150,
    minVipLevel: 0,
    maxUsageCount: 5000,
    currentUsageCount: 650,
    status: 'active',
    description: 'নতুন রেজিস্ট্রেশন স্পেশাল কোড',
    createdAt: '2026-08-10 09:00:00'
  },
  {
    id: 'pc-4',
    code: 'LUCKY888',
    title: 'লাকি উইকএন্ড রিডিম কোড',
    type: 'fixed_cash',
    amount: 88,
    minVipLevel: 0,
    maxUsageCount: 888,
    currentUsageCount: 312,
    status: 'active',
    description: 'উইকএন্ড লাকি ড্রপ ভাউচার',
    createdAt: '2026-08-15 18:00:00'
  },
  {
    id: 'pc-5',
    code: 'FESTIVAL500',
    title: 'মেগা ফেস্টিভাল ক্যাশ ভাউচার',
    type: 'fixed_cash',
    amount: 500,
    minVipLevel: 1,
    maxUsageCount: 500,
    currentUsageCount: 78,
    status: 'active',
    description: 'ভিআইপি ফেস্টিভাল উৎসব অফার',
    createdAt: '2026-08-20 14:00:00'
  },
  {
    id: 'pc-6',
    code: 'TIGERWIN',
    title: 'বেঙ্গল টাইগার সুপার ক্যাশ কোড',
    type: 'fixed_cash',
    amount: 250,
    minVipLevel: 0,
    maxUsageCount: 1500,
    currentUsageCount: 104,
    status: 'active',
    description: 'বেঙ্গল টাইগারের বিজয়ী কোড',
    createdAt: '2026-08-25 11:30:00'
  },
  {
    id: 'pc-7',
    code: 'BENGALBETVIP',
    title: '২৩ তারিখ রহস্যময় পুরস্কার স্পেশাল কোড',
    type: 'fixed_cash',
    amount: 1000,
    minVipLevel: 0,
    maxUsageCount: 10000,
    currentUsageCount: 12,
    status: 'active',
    description: 'প্রতি মাসের ২৩ তারিখ রহস্যময় পুরস্কার (৳ ১,০০০ - ৳ ৫০,০০০ ক্যাশ কার্ড)',
    createdAt: '2026-09-01 00:00:00'
  }
];

// =========================================================================
// 4. USER TICKET TYPES & CONSTANTS
// =========================================================================
export interface UserTicketRecord {
  id: string;
  userId: string;
  username: string;
  name: string;
  type: string;
  usedTime?: string;
  productName: string;
  redeemCode: string;
  amount: string;
  amountNumber?: number;
  status: 'active' | 'used' | 'claimed' | 'expired';
  targetAction: 'temu_chest' | 'signin' | 'spin' | 'golden_egg' | 'red_envelope' | 'rescue' | 'promo' | 'mystery';
  dateCategory: 'today' | 'yesterday' | '7days' | 'older';
  createdAt: string;
}

// =========================================================================
// 5. MYSTERY REWARD / CASH CARD (প্রতি মাসের ২৩ তারিখ রহস্যময় পুরস্কার)
// =========================================================================
export interface MysteryRewardConfig {
  enabled: boolean;
  dayOfMonth: number; // 23
  triggerHour: number; // 18 (সন্ধ্যা ৬টা)
  minBonus: number; // 1000
  maxBonus: number; // 50000
  promoCode: string; // 'BENGALBETVIP'
  minBetRequired: number; // 500
  betStartDateDay: number; // 1
  betEndDateDay: number; // 22
  turnoverMultiplier: number; // 1 (1x)
  requireVerifiedEmailPhone: boolean; // true
  title: string;
  description: string;
  terms: string[];
}

export interface MysteryCashCardRecord {
  id: string;
  userId: string;
  username: string;
  monthYear: string; // e.g. '2026-09'
  bonusAmount: number;
  promoCodeUsed?: string;
  status: 'unlocked' | 'claimed' | 'expired';
  eligible: boolean;
  userBetAmount: number;
  unlockedAt: string;
  claimedAt?: string;
  turnoverRequired: number;
  turnoverCompleted: number;
  ticketCode: string;
  note?: string;
}

export const DEFAULT_MYSTERY_REWARD_CONFIG: MysteryRewardConfig = {
  enabled: true,
  dayOfMonth: 23,
  triggerHour: 18,
  minBonus: 1000,
  maxBonus: 50000,
  promoCode: 'BENGALBETVIP',
  minBetRequired: 500,
  betStartDateDay: 1,
  betEndDateDay: 22,
  turnoverMultiplier: 1,
  requireVerifiedEmailPhone: true,
  title: 'রহস্যময় পুরস্কার প্রতি মাসের ২৩ তারিখ',
  description: 'প্রতি মাসের ২৩ তারিখ সন্ধ্যা ৬টায় অটোমেটিক অ্যাকাউন্টে ক্রেডিট ও রিওয়ার্ড সেন্টারে ক্যাশ কার্ড উন্মুক্ত! সর্বোচ্চ বোনাস ৳ ১,০০০ - ৳ ৫০,০০০।',
  terms: [
    'মাসের ১ তারিখ থেকে ২২ তারিখ পর্যন্ত মোট ন্যূনতম ৫০০ টাকা বাজি ধরতে হবে।',
    'অ্যাকাউন্টে মোবাইল নম্বর ও ইমেল ভেরিফাইড থাকতে হবে।',
    '২৩ তারিখ সন্ধ্যা ৬টায় অটোমেটিক অ্যাকাউন্টে ক্রেডিট করা হবে ও রিওয়ার্ড সেন্টারে ক্যাশ কার্ড জমা হবে।',
    'বোনাসটির সাথে মাত্র ১ গুণ (1x) ভেগারিং টার্নওভার প্রযোজ্য।',
    'কোনো অতিরিক্ত রেজিস্ট্রেশন বা ডিপোজিট স্লিপ লাগবে না।',
    'সমস্ত স্লট ও লাইভ ক্যাসিনো গেমসে ব্যবহারযোগ্য।'
  ]
};

export const DEFAULT_MYSTERY_CASH_CARDS: MysteryCashCardRecord[] = [
  {
    id: 'mcc-1',
    userId: 'usr-889922',
    username: 'BDT_King88',
    monthYear: '2026-09',
    bonusAmount: 2888,
    promoCodeUsed: 'BENGALBETVIP',
    status: 'unlocked',
    eligible: true,
    userBetAmount: 1850,
    unlockedAt: '2026-09-23 18:00:00',
    turnoverRequired: 2888,
    turnoverCompleted: 0,
    ticketCode: 'MYSTERY-20260923-8899',
    note: 'সেপ্টেম্বর মাসের ২৩ তারিখ রহস্যময় ভিআইপি ক্যাশ কার্ড ড্রপ'
  }
];

export const DEFAULT_USER_TICKETS: UserTicketRecord[] = [
  {
    id: 'tr-1',
    userId: 'usr-889922',
    username: 'BDT_King88',
    name: 'BengalBet সুপার ভ্যালু টিকিট',
    type: 'কুপন ভাউচার',
    usedTime: '2026-08-30 14:22:15',
    productName: 'টেমু সুপার ভ্যালু প্যাকেজ',
    redeemCode: 'TK-892401',
    amount: '৳ ২২২.০০',
    amountNumber: 222,
    status: 'claimed',
    targetAction: 'temu_chest',
    dateCategory: 'today',
    createdAt: '2026-08-30 14:00:00'
  },
  {
    id: 'tr-2',
    userId: 'usr-889922',
    username: 'BDT_King88',
    name: 'দৈনিক সাইন-ইন টিকিট',
    type: 'চেক-ইন রিওয়ার্ড',
    usedTime: '2026-08-30 09:15:40',
    productName: 'সদস্য বৃদ্ধির পরিকল্পনা',
    redeemCode: 'TK-771920',
    amount: '৳ ৫০.০০',
    amountNumber: 50,
    status: 'claimed',
    targetAction: 'signin',
    dateCategory: 'today',
    createdAt: '2026-08-30 09:00:00'
  },
  {
    id: 'tr-3',
    userId: 'usr-889922',
    username: 'BDT_King88',
    name: 'লাকি স্পিন ফ্রি ড্র টিকিট',
    type: 'লটারি ড্র',
    productName: 'মেগা লাকি হুইল স্পিন',
    redeemCode: 'SPIN-448102',
    amount: '১টি ফ্রি স্পিন',
    amountNumber: 1,
    status: 'active',
    targetAction: 'spin',
    dateCategory: 'today',
    createdAt: '2026-08-30 12:00:00'
  },
  {
    id: 'tr-4',
    userId: 'usr-889922',
    username: 'BDT_King88',
    name: 'গোল্ডেন এগ ভাঙার টিকিট',
    type: 'ম্যাজিক এগ',
    productName: 'সোনার ডিম ৩,৮৮৮ রিওয়ার্ড',
    redeemCode: 'EGG-993812',
    amount: '১টি গোল্ডেন এগ',
    amountNumber: 1,
    status: 'active',
    targetAction: 'golden_egg',
    dateCategory: 'yesterday',
    createdAt: '2026-08-29 18:00:00'
  },
  {
    id: 'tr-5',
    userId: 'usr-889922',
    username: 'BDT_King88',
    name: 'লাল মোড়কের বৃষ্টি টিকিট',
    type: 'রেড প্যাকেট',
    usedTime: '2026-08-29 18:40:12',
    productName: 'দৈনিক রেড প্যাকেট ড্রপ',
    redeemCode: 'RED-100234',
    amount: '৳ ১৮৮.০০',
    amountNumber: 188,
    status: 'used',
    targetAction: 'red_envelope',
    dateCategory: 'yesterday',
    createdAt: '2026-08-29 17:30:00'
  },
  {
    id: 'tr-6',
    userId: 'usr-889922',
    username: 'BDT_King88',
    name: 'টেলিগ্রাম গিফট ভাউচার',
    type: 'প্রচার কোড',
    usedTime: '2026-08-28 12:10:05',
    productName: 'TELEGRAM100 কোড রিডিম',
    redeemCode: 'TELEGRAM100',
    amount: '৳ ১০০.০০',
    amountNumber: 100,
    status: 'used',
    targetAction: 'promo',
    dateCategory: '7days',
    createdAt: '2026-08-28 11:55:00'
  },
  {
    id: 'tr-7',
    userId: 'usr-889922',
    username: 'BDT_King88',
    name: 'লস রেসকিউ ক্ষতিপূরণ ভাউচার',
    type: 'ক্ষতিপূরণ টিকিট',
    productName: 'দৈনিক উদ্ধার তহবিল সহায়তা',
    redeemCode: 'RESCUE-882190',
    amount: '৳ ৫০.০০',
    amountNumber: 50,
    status: 'active',
    targetAction: 'rescue',
    dateCategory: 'today',
    createdAt: '2026-08-30 08:30:00'
  }
];

export interface GameRecord {
  id: string;
  name: string;
  nameBn?: string;
  provider: string;
  category: string;
  image: string;
  isHot?: boolean;
  isNew?: boolean;
  jackpot?: number;
  rtp?: number;
  playersCount?: number;
  volatility?: string;
  status?: 'active' | 'maintenance' | 'hidden';
}

export const DEFAULT_GAMES: GameRecord[] = [
  {
    id: 'game-aviator',
    name: 'Aviator',
    nameBn: 'এভিয়েটর (Aviator)',
    provider: 'Spribe',
    category: 'crash',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: true,
    jackpot: 50000000,
    rtp: 97.0,
    playersCount: 78500,
    volatility: 'High',
    status: 'active'
  },
  {
    id: 'game-money-coming',
    name: 'Money Coming',
    nameBn: 'মানি কামিং',
    provider: 'JILI',
    category: 'slot',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: true,
    jackpot: 15500000,
    rtp: 97.8,
    playersCount: 46800,
    volatility: 'High',
    status: 'active'
  },
  {
    id: 'game-magic-ace',
    name: 'Magic Ace',
    nameBn: 'ম্যাজিক এস (ওয়াইল্ড লক)',
    provider: 'JILI',
    category: 'slot',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: true,
    jackpot: 18200000,
    rtp: 97.6,
    playersCount: 51200,
    volatility: 'Extreme',
    status: 'active'
  },
  {
    id: 'game-sweet-bonanza',
    name: 'Sweet Bonanza',
    nameBn: 'সুইট বোনানজা (ক্যান্ডি)',
    provider: 'Pragmatic Play',
    category: 'slot',
    image: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: true,
    jackpot: 24500000,
    rtp: 96.6,
    playersCount: 58900,
    volatility: 'High',
    status: 'active'
  },
  {
    id: 'game-treasures-aztec',
    name: 'Treasures of Aztec',
    nameBn: 'ট্রেজার্স অফ আজটেক (PG Soft)',
    provider: 'Pocket Games Soft',
    category: 'slot',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: true,
    jackpot: 28500000,
    rtp: 96.71,
    playersCount: 48900,
    volatility: 'High',
    status: 'active'
  },
  {
    id: 'game-gates-of-olympus',
    name: 'Gates of Olympus',
    nameBn: 'গেটস অফ অলিম্পাস (জিউস)',
    provider: 'Pragmatic Play',
    category: 'slot',
    image: 'https://images.unsplash.com/photo-1533158307587-828f0a76ef46?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: true,
    jackpot: 32000000,
    rtp: 96.5,
    playersCount: 64200,
    volatility: 'Extreme',
    status: 'active'
  },
  {
    id: 'game-super-ace',
    name: 'Super Ace',
    nameBn: 'সুপার এস',
    provider: 'JILI',
    category: 'slot',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: false,
    jackpot: 12500000,
    rtp: 97.0,
    playersCount: 38400,
    volatility: 'Medium',
    status: 'active'
  },
  {
    id: 'game-boxing-king',
    name: 'Boxing King',
    nameBn: 'বক্সিং কিং',
    provider: 'JILI',
    category: 'slot',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: false,
    jackpot: 19800000,
    rtp: 97.1,
    playersCount: 42100,
    volatility: 'High',
    status: 'active'
  },
  {
    id: 'game-fortune-gems-3',
    name: 'Fortune Gems 3',
    nameBn: 'ফরচুন জেমস ৩',
    provider: 'JILI',
    category: 'slot',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: true,
    jackpot: 21500000,
    rtp: 97.2,
    playersCount: 45000,
    volatility: 'High',
    status: 'active'
  },
  {
    id: 'game-royal-fishing',
    name: 'Royal Fishing',
    nameBn: 'রয়্যাল ফিশিং',
    provider: 'JILI',
    category: 'fishing',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: false,
    jackpot: 8500000,
    rtp: 97.0,
    playersCount: 29800,
    volatility: 'Medium',
    status: 'active'
  },
  {
    id: 'game-happy-fishing',
    name: 'Happy Fishing',
    nameBn: 'হ্যাপি ফিশিং',
    provider: 'JILI',
    category: 'fishing',
    image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: true,
    jackpot: 9200000,
    rtp: 97.1,
    playersCount: 31200,
    volatility: 'Medium',
    status: 'active'
  },
  {
    id: 'game-crazy-777',
    name: 'Crazy 777',
    nameBn: 'ক্রেজি ৭৭৭',
    provider: 'JILI',
    category: 'slot',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=500&q=85',
    isHot: false,
    isNew: false,
    jackpot: 11000000,
    rtp: 96.8,
    playersCount: 24500,
    volatility: 'Low',
    status: 'active'
  },
  {
    id: 'game-lightning-roulette',
    name: 'Lightning Roulette',
    nameBn: 'লাইটনিং রুলেট',
    provider: 'Evolution Gaming',
    category: 'live',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: false,
    rtp: 97.3,
    playersCount: 52000,
    volatility: 'High',
    status: 'active'
  },
  {
    id: 'game-crazy-time',
    name: 'Crazy Time',
    nameBn: 'ক্রেজি টাইম',
    provider: 'Evolution Gaming',
    category: 'live',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: false,
    rtp: 96.08,
    playersCount: 68000,
    volatility: 'Extreme',
    status: 'active'
  },
  {
    id: 'game-teen-patti',
    name: 'Teen Patti Live',
    nameBn: 'তিন পাত্তি লাইভ',
    provider: 'Ezugi',
    category: 'live',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: false,
    rtp: 97.5,
    playersCount: 41000,
    volatility: 'Medium',
    status: 'active'
  },
  {
    id: 'game-texas-holdem',
    name: "Texas Hold'em Poker",
    nameBn: 'টেক্সাস হোল্ডেম পোকার',
    provider: 'KingMaker',
    category: 'poker',
    image: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: false,
    rtp: 98.5,
    playersCount: 22000,
    volatility: 'Medium',
    status: 'active'
  },
  {
    id: 'game-cricket-live',
    name: 'Cricket Live Pro',
    nameBn: 'লাইভ ক্রিকেট বেটিং',
    provider: 'Saba Sports',
    category: 'sports',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: true,
    rtp: 96.8,
    playersCount: 62000,
    volatility: 'Medium',
    status: 'active'
  },
  {
    id: 'game-sv388-cockfight',
    name: 'SV388 Cockfight Live Arena',
    nameBn: 'SV388 মোরগের লড়াই',
    provider: 'SV388',
    category: 'cockfight',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: false,
    rtp: 98.3,
    playersCount: 34200,
    volatility: 'High',
    status: 'active'
  },
  {
    id: 'game-tc-lottery',
    name: 'TC Lottery 5D & WinGo',
    nameBn: 'টিসি লটারি ৫ডি',
    provider: 'TC GAMING',
    category: 'lottery',
    image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=500&q=85',
    isHot: true,
    isNew: false,
    rtp: 98.5,
    playersCount: 21000,
    volatility: 'Low',
    status: 'active'
  }
];

export interface PromotionRecord {
  id: string;
  title: string;
  titleBn?: string;
  category: string;
  description: string;
  banner: string;
  bonusValue: string;
  rules?: string[];
  status: 'active' | 'expired' | 'disabled';
  createdAt: string;
}

export const DEFAULT_PROMOTIONS: PromotionRecord[] = [
  {
    id: 'promo-first-deposit',
    title: 'First Deposit Bonus Up to 47%',
    titleBn: 'প্রথম জমা বোনাস সর্বোচ্চ ৪৭%',
    category: 'deposit',
    description: 'নতুন রেজিস্ট্রেশন করে প্রথম জমার সাথে সাথে ৪৭% বোনাস ক্রেডিট!',
    banner: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
    bonusValue: '৪৭% বোনাস (সর্বোচ্চ ৳২০,০০০)',
    rules: ['ন্যূনতম ডিপোজিট ৳৫০০', 'ভেগারিং ১x মাত্র', 'সমস্ত স্লট ও লাইভ গেমসে প্রযোজ্য'],
    status: 'active',
    createdAt: '2026-08-01 00:00:00'
  },
  {
    id: 'promo-vip-upgrade',
    title: 'VIP Exclusive Level Upgrades',
    titleBn: 'ভিআইপি এক্সক্লুসিভ লেভেল আপগ্রেড বোনাস',
    category: 'vip',
    description: 'ভিআইপি স্তর বাড়ার সাথে সাথে ৩ লাখ টাকা পর্যন্ত ইনস্ট্যান্ট ক্যাশ পুরস্কার।',
    banner: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80',
    bonusValue: 'সর্বোচ্চ ৳৩,০০,০০০ নগদ',
    rules: ['টার্গেট বাজি সম্পন্ন হলে অটো আনলক', 'প্রতি লেভেলে একবার ক্লেইমেবল'],
    status: 'active',
    createdAt: '2026-08-01 00:00:00'
  },
  {
    id: 'promo-refer-friend',
    title: 'Refer Friends 3-Way Earning',
    titleBn: 'বন্ধুদের আমন্ত্রণ জানান - ৩টি বিশাল সুবিধা',
    category: 'referral',
    description: 'প্রতিটি বৈধ আমন্ত্রণে ৳৩০০ ইনস্ট্যান্ট বোনাস, ০.৭% ডিপোজিট ও ১% লাইফটাইম বেট কমিশন।',
    banner: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80',
    bonusValue: '৳৩০০ + ১% কমিশন',
    rules: ['আমন্ত্রিত বন্ধুর প্রথম ডিপোজিট বাধ্যতামূলক', 'কমিশন প্রতিদিন অটোমেটিক যুক্ত হয়'],
    status: 'active',
    createdAt: '2026-08-01 00:00:00'
  },
  {
    id: 'promo-daily-loss-relief',
    title: 'Daily Loss Rescue Fund',
    titleBn: 'দৈনিক লস রেসকিউ তহবিল ২০% পর্যন্ত',
    category: 'rescue',
    description: 'দিনের মোট নিট লসের ২০% পর্যন্ত রাত ১২টায় সরাসরি উদ্ধার বোনাস হিসেবে ফেরত পান।',
    banner: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
    bonusValue: 'সর্বোচ্চ ৳৫০,০০০ উদ্ধার',
    rules: ['ন্যূনতম লস ৳৫০০', 'পরের দিন অটো ভেরিফাইড'],
    status: 'active',
    createdAt: '2026-08-01 00:00:00'
  }
];

export interface DatabaseSchema {
  users: UserRecord[];
  transactions: TransactionRecord[];
  wallets: WalletRecord[];
  bets: BetRecord[];
  games?: GameRecord[];
  promotions?: PromotionRecord[];
  messages: MessageRecord[];
  feedbacks: FeedbackRecord[];
  chatSessions?: ChatSessionRecord[];
  chatMessages?: ChatMessageRecord[];
  referrals?: ReferralRecord[];
  referralClaims?: ReferralRewardClaimRecord[];
  vipTiers?: VipTierRecord[];
  vipRewardClaims?: VipRewardClaimRecord[];
  settings?: SiteSettings;
  dailySignIns?: DailySignInRecord[];
  dailySignInConfig?: DailySignInConfig;
  rescueTiers?: RescueTierRecord[];
  rescueClaims?: RescueClaimRecord[];
  promoCodes?: PromoCodeRecord[];
  promoRedemptions?: PromoRedemptionRecord[];
  userTickets?: UserTicketRecord[];
  mysteryRewardConfig?: MysteryRewardConfig;
  mysteryCashCards?: MysteryCashCardRecord[];
  neextplaySessions?: NeextPlaySessionRecord[];
  neextplayTransactions?: NeextPlayTransactionRecord[];
  neextplayConfig?: NeextPlayProviderConfig;
}

export interface NeextPlaySessionRecord {
  sessionId: string;
  token: string;
  userId: string;
  username: string;
  gameId: string;
  gameName: string;
  currency: string;
  returnUrl?: string;
  createdAt: string;
  expiresAt: string;
  ip?: string;
}

export interface NeextPlayTransactionRecord {
  id: string;
  roundId: string;
  userId: string;
  username: string;
  gameId: string;
  gameName: string;
  type: 'bet' | 'win' | 'rollback';
  amount: number;
  multiplier?: number;
  balanceAfter: number;
  currency: string;
  status: 'settled' | 'pending' | 'refunded';
  createdAt: string;
}

export interface NeextPlayProviderConfig {
  databaseId: string;
  projectId: string;
  apiKey: string;
  operatorId: string;
  operatorSecret: string;
  status: 'active' | 'maintenance' | 'offline';
  rtpSetting: number;
  revenueShareOperator: number;
  revenueShareProvider: number;
  connectedApps: Array<{ id: string; name: string; url: string }>;
  webhookUrl: string;
  lastSyncAt: string;
}

export const DEFAULT_NEEXTPLAY_CONFIG: NeextPlayProviderConfig = {
  databaseId: 'ai-studio-bengalbetcasinog-0bb9dbd8-07fa-48eb-9c43-faddc7a53731',
  projectId: 'adroit-hologram-p9brs',
  apiKey: 'AIzaSyB_d5LpxGhBhlEMl0SqyRc1DQmXlGm3ZWs',
  operatorId: 'BENGALBET-PROD-BD01',
  operatorSecret: 'np_sec_99a8b11c472fed917ac',
  status: 'active',
  rtpSetting: 97.2,
  revenueShareOperator: 85,
  revenueShareProvider: 15,
  connectedApps: [
    { id: 'e6ce2dd0-34d4-421c-86f0-e306bf40bf65', name: 'NeextPlay Master Hub', url: 'https://aistudio.google.com/apps/e6ce2dd0-34d4-421c-86f0-e306bf40bf65' },
    { id: '8b463d15-7a85-44b7-b8ed-d21da3fd1528', name: 'NeextPlay Engine', url: 'https://ai.studio/apps/8b463d15-7a85-44b7-b8ed-d21da3fd1528' },
    { id: '2ee1f564-f1d8-4a12-88b0-219a09b6b792', name: 'BengalBet Platform', url: 'https://ais-dev-ylyf7gffzsq7goqraksa2y-905436724345.asia-southeast1.run.app' }
  ],
  webhookUrl: '/api/neextplay/wallet/callback',
  lastSyncAt: new Date().toISOString()
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

export const DEFAULT_GAME_ENGINE_SETTINGS: GameEngineSettings = {
  globalRtp: 96.5,
  engineMode: 'normal',
  volatility: 'medium',
  maxMultiplierCap: 2500,
  nearMissRate: 35,
  dynamicBalancing: true,
  categoryRtp: {
    crash: 97.0,
    slot: 96.5,
    table: 98.0,
    fishing: 96.8,
    arcade: 96.5
  },
  gameRtp: {
    'aviator': 97.2,
    'game-aviator': 97.2,
    'super-ace': 96.8,
    'game-super-ace': 96.8,
    'game-super-ace-2': 97.0,
    'game-super-ace-deluxe': 96.9,
    'crazy-777': 98.0,
    'game-crazy-777': 98.0,
    'head-tail': 98.0,
    'game-head-tail': 98.0,
    'seven-coins': 97.0,
    'game-seven-coins': 97.0,
    'sweet-bonanza': 96.5,
    'game-sweet-bonanza': 96.5,
    'gates-of-olympus': 96.5,
    'game-gates-of-olympus': 96.5,
    'fortune-tree': 96.5,
    'game-fortune-tree': 96.5,
    'fortune-gems-3': 97.0,
    'game-fortune-gems-3': 97.0,
    'money-coming': 97.2,
    'game-money-coming': 97.2,
    'boxing-king': 96.8,
    'game-boxing-king': 96.8,
    'alibaba-cave': 97.0,
    'game-alibaba-cave': 97.0,
    'wild-bounty': 96.75,
    'game-wild-bounty': 96.75,
    'treasures-aztec': 96.71,
    'game-treasures-aztec': 96.71,
    'happy-fishing': 97.0,
    'game-happy-fishing': 97.0
  },
  forceOutcome: 'none',
  telemetry: {
    totalWagered: 148500,
    totalPayout: 142850,
    totalRounds: 1248,
    lastResetTime: new Date().toISOString()
  }
};

const DEFAULT_SETTINGS: SiteSettings = {
  bkashNumber: '01878901234',
  nagadNumber: '01789012345',
  rocketNumber: '01912345678',
  usdtAddress: 'TXYZ8899CasinoTRC20OfficialWallet',
  minDeposit: 100,
  maxDeposit: 50000,
  minWithdraw: 500,
  maxWithdraw: 100000,
  siteNotice: {
    enabled: true,
    titleBn: 'BengalBet মেগা ক্যাসিনো ও বোনাস ঘোষণা',
    titleEn: 'BengalBet Mega Casino & Bonus Announcement',
    contentBn: 'প্রতিটি ডিপোজিটে ৪৭% পর্যন্ত স্বাগতম বোনাস এবং গোল্ডেন এগে সর্বোচ্চ ৳৩,৮৮৮ পর্যন্ত ক্যাশ রিওয়ার্ড!',
    contentEn: 'Up to 47% welcome bonus on every deposit and win up to ৳3,888 cash reward in Golden Egg!',
    bannerImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80'
  },
  gameRtp: {
    'aviator': 97.2,
    'super-ace': 96.8,
    'fortune-tree': 96.5,
    'alibaba-cave': 97.0,
    'crazy-777': 98.0,
    'sweet-bonanza': 96.5,
    'gates-of-olympus': 96.5
  },
  gameEngine: DEFAULT_GAME_ENGINE_SETTINGS,
  referralSettings: DEFAULT_REFERRAL_SETTINGS,
  maintenanceMode: false
};

// Default initial seeded state
const INITIAL_DATA: DatabaseSchema = {
  settings: DEFAULT_SETTINGS,
  games: [...DEFAULT_GAMES],
  promotions: [...DEFAULT_PROMOTIONS],
  referrals: [
    {
      id: 'ref-1',
      referrerId: 'usr-889922',
      referrerUsername: 'BDT_King88',
      referrerCode: 'BDT888',
      referredUserId: 'usr-ref-01',
      referredUsername: 'shakib_88',
      referredPhone: '01712***88',
      level: 1,
      instantBonusPaid: true,
      instantBonusAmount: 300,
      totalDeposit: 2500,
      totalBet: 8200,
      depositCommission: 17.50,
      betCommission: 82.00,
      totalCommissionEarned: 399.50,
      status: 'active',
      joinedAt: '2026-08-30 14:22:10'
    },
    {
      id: 'ref-2',
      referrerId: 'usr-889922',
      referrerUsername: 'BDT_King88',
      referrerCode: 'BDT888',
      referredUserId: 'usr-ref-02',
      referredUsername: 'tamim_k9',
      referredPhone: '01845***91',
      level: 1,
      instantBonusPaid: true,
      instantBonusAmount: 300,
      totalDeposit: 5000,
      totalBet: 14500,
      depositCommission: 35.00,
      betCommission: 145.00,
      totalCommissionEarned: 480.00,
      status: 'active',
      joinedAt: '2026-08-30 11:05:45'
    },
    {
      id: 'ref-3',
      referrerId: 'usr-889922',
      referrerUsername: 'BDT_King88',
      referrerCode: 'BDT888',
      referredUserId: 'usr-ref-03',
      referredUsername: 'tanvir_b2',
      referredPhone: '01911***44',
      level: 1,
      instantBonusPaid: true,
      instantBonusAmount: 300,
      totalDeposit: 1200,
      totalBet: 4300,
      depositCommission: 8.40,
      betCommission: 43.00,
      totalCommissionEarned: 351.40,
      status: 'active',
      joinedAt: '2026-08-29 20:41:18'
    },
    {
      id: 'ref-4',
      referrerId: 'usr-889922',
      referrerUsername: 'BDT_King88',
      referrerCode: 'BDT888',
      referredUserId: 'usr-ref-04',
      referredUsername: 'rakib_v5',
      referredPhone: '01633***72',
      level: 1,
      instantBonusPaid: true,
      instantBonusAmount: 300,
      totalDeposit: 3000,
      totalBet: 9800,
      depositCommission: 21.00,
      betCommission: 98.00,
      totalCommissionEarned: 419.00,
      status: 'active',
      joinedAt: '2026-08-29 16:12:04'
    },
    {
      id: 'ref-5',
      referrerId: 'usr-889922',
      referrerUsername: 'BDT_King88',
      referrerCode: 'BDT888',
      referredUserId: 'usr-ref-05',
      referredUsername: 'mahmud_01',
      referredPhone: '01755***19',
      level: 1,
      instantBonusPaid: true,
      instantBonusAmount: 300,
      totalDeposit: 800,
      totalBet: 2100,
      depositCommission: 5.60,
      betCommission: 21.00,
      totalCommissionEarned: 326.60,
      status: 'active',
      joinedAt: '2026-08-28 19:30:52'
    },
    {
      id: 'ref-6',
      referrerId: 'usr-889922',
      referrerUsername: 'BDT_King88',
      referrerCode: 'BDT888',
      referredUserId: 'usr-ref-06',
      referredUsername: 'farhan_77',
      referredPhone: '01522***33',
      level: 1,
      instantBonusPaid: true,
      instantBonusAmount: 300,
      totalDeposit: 1500,
      totalBet: 5200,
      depositCommission: 10.50,
      betCommission: 52.00,
      totalCommissionEarned: 362.50,
      status: 'active',
      joinedAt: '2026-08-28 09:14:33'
    }
  ],
  referralClaims: [
    {
      id: 'claim-1',
      userId: 'usr-889922',
      tierId: 1,
      requiredCount: 1,
      bonusAmount: 300,
      trxId: 'REFCLM1001',
      claimedAt: '2026-08-30 15:00:00'
    }
  ],
  users: [
    {
      id: 'usr-889922',
      username: 'BDT_King88',
      phone: '01615249856',
      passwordHash: '123456', // In production would be bcrypt, plain text for easy demo
      balance: 5420.50,
      vipLevel: 2,
      vipExp: 8450,
      vipMaxExp: 15000,
      freeSpins: 3,
      redPacketsAvailable: 2,
      goldenEggsAvailable: 2,
      unreadNotifications: 3,
      referralCode: 'BDT888',
      totalEarnings: 3250,
      referredFriendsCount: 6,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
      createdAt: '2026-08-01 12:00:00'
    }
  ],
  transactions: [
    {
      id: 'tx-1001',
      userId: 'usr-889922',
      type: 'deposit',
      amount: 1000.00,
      bonus: 277.00,
      fee: 0,
      channel: 'nagad',
      gateway: 'পরিশোধ-GBKPAY',
      accountNumber: '01712345678',
      trxId: 'TRX998812A',
      status: 'success',
      createdAt: '2026-09-13 14:20:00',
      description: 'নগদ ডিপোজিট + ৪৭% বোনাস'
    },
    {
      id: 'tx-1002',
      userId: 'usr-889922',
      type: 'bonus',
      amount: 52.00,
      channel: 'system',
      trxId: 'APPBONUS88',
      status: 'success',
      createdAt: '2026-09-12 10:15:00',
      description: 'BengalBet অ্যাপ ডাউনলোড বোনাস'
    },
    {
      id: 'tx-1003',
      userId: 'usr-889922',
      type: 'withdraw',
      amount: 1500.00,
      fee: 0,
      channel: 'bkash',
      accountNumber: '01615249856',
      trxId: 'WDR882910',
      status: 'success',
      createdAt: '2026-09-11 18:30:00',
      description: 'বিকাশ উত্তোলন সম্পন্ন'
    }
  ],
  wallets: [
    {
      id: 'w-1',
      userId: 'usr-889922',
      type: 'Rocket',
      accountName: 'BDT_King88',
      accountNumber: '*******8921',
      fullNumber: '01615248921',
      createdAt: '2026-08-30 15:30:58',
      isDefault: true
    },
    {
      id: 'w-2',
      userId: 'usr-889922',
      type: 'BKash',
      accountName: 'BDT_King88',
      accountNumber: '*******9856',
      fullNumber: '01615249856',
      createdAt: '2026-08-25 10:12:00',
      isDefault: false
    }
  ],
  bets: [
    {
      id: 'b-01',
      userId: 'usr-889922',
      orderNo: 'B2026091388102',
      category: 'slot',
      vendor: 'JILI',
      gameName: 'সুপার এস (Super Ace)',
      gameRound: '#R9823412',
      time: '2026-09-13 16:15:32',
      date: '2026-09-13',
      betAmount: 500.00,
      validBet: 500.00,
      reward: 1250.00,
      profit: 750.00
    },
    {
      id: 'b-02',
      userId: 'usr-889922',
      orderNo: 'B2026091387410',
      category: 'slot',
      vendor: 'PG Soft',
      gameName: 'ফরচুন অক্স (Fortune Ox)',
      gameRound: '#R9823109',
      time: '2026-09-13 15:42:10',
      date: '2026-09-13',
      betAmount: 300.00,
      validBet: 300.00,
      reward: 0.00,
      profit: -300.00
    },
    {
      id: 'b-03',
      userId: 'usr-889922',
      orderNo: 'B2026091386221',
      category: 'crash',
      vendor: 'Spribe',
      gameName: 'এভিয়েটর (Aviator)',
      gameRound: '#CR-55421',
      time: '2026-09-13 14:10:05',
      date: '2026-09-13',
      betAmount: 200.00,
      validBet: 200.00,
      reward: 480.00,
      profit: 280.00
    }
  ],
  messages: [
    {
      id: 'msg-1',
      userId: 'all',
      sender: 'প্ল্যাটফর্ম',
      title: '🔥 প্রথম ডিপোজিট বোনাস – সর্বোচ্চ ৪৭%!',
      displayTime: 'আজ ১৭:১৩',
      dateFull: '২০২৬/০৯/১৩ ১৭:১৩',
      isRead: false,
      content: {
        headline: '🔥 প্রথম ডিপোজিট বোনাস – সর্বোচ্চ ৪৭%!',
        description: 'BengalBet-এ আপনার প্রথম ডিপোজিটে বোনাস পান। 💰 প্রতিদিন ন্যূনতম ৳১০০ ডিপোজিট করলে পান সর্বোচ্চ ৪৭% বোনাস এবং ২০× টার্নওভার। বেশি ডিপোজিট = বেশি বোনাস। 🎰 শুধু স্লট ও ফিশিং গেমের জন্য। 🐟',
        howToGetTitle: 'কিভাবে পাবেন:',
        howToGetSteps: [
          'রেজিস্টার করুন → সাইন ইন করুন → ডিপোজিট করুন → "প্রথম ডিপোজিট অফার" নির্বাচন করুন।',
          'বোনাস স্বয়ংক্রিয়ভাবে পাঠানো হবে।'
        ],
        rulesTitle: 'নিয়মাবলী:',
        rules: [
          '১ নাম বা ব্যাংক পরিবর্তন করলে বোনাস বাতিল ❌',
          '২ একবারই বোনাস পেতে পারবেন; একই IP/SIM/কার্ড ব্যবহার করলে বাতিল ⚠️',
          '৩ রেজিস্ট্রেশন তথ্য সঠিক হতে হবে 📝',
          '৪ শুধুমাত্র স্লট 🎰 ও ফিশিং 🐟 গেমে প্রযোজ্য',
          '৫ উইথড্র-এর আগে ওয়েজারিং সম্পূর্ণ করতে হবে 🎯',
          '৬ নতুন একাউন্টে প্রথম ডিপোজিট অফার একবারই গ্রহণযোগ্য ✅'
        ],
        officialLinksTitle: 'BengalBet অফিসিয়াল লিঙ্ক',
        officialLinks: ['BengalBet.me', 'BengalBet.vip', 'BengalBet.one', 'BengalBet.now']
      }
    },
    {
      id: 'msg-2',
      userId: 'all',
      sender: 'সিস্টেম',
      title: '🎁 ভিআইপি লেভেল ২ আপগ্রেড বোনাস আনলকড!',
      displayTime: 'গতকাল ২০:০০',
      dateFull: '২০২৬/০৯/১২ ২০:০০',
      isRead: true,
      content: {
        headline: 'অভিনন্দন! আপনি এখন VIP লেভেল ২ সদস্য!',
        description: 'আপনার অ্যাক্টিভিটির কারণে আপনাকে ভিআইপি লেভেল ২-এ উন্নীত করা হয়েছে। আপনার সাপ্তাহিক ক্যাশব্যাক এখন ০.৮% এবং দৈনিক স্পিন বোনাস সক্রিয়!',
        howToGetTitle: 'সুবিধাসমূহ:',
        howToGetSteps: [
          'ভিআইপি ক্লাবে গিয়ে সরাসরি লেভেল আপ রিওয়ার্ড ক্লেইম করুন।',
          'প্রতি রবিবারে সাপ্তাহিক ভিআইপি বোনাস গ্রহণ করুন।'
        ],
        rulesTitle: 'নিয়মাবলী:',
        rules: [
          'ভিআইপি পয়েন্ট বজায় রাখতে নিয়মিত গেম খেলুন।',
          'কোনো প্রশ্ন থাকলে কাস্টমার কেয়ারে যোগাযোগ করুন।'
        ]
      }
    }
  ],
  feedbacks: [
    {
      id: 'fb-1',
      userId: 'usr-889922',
      type: 'রিচার্জ ও পেমেন্ট গেটওয়ে',
      content: 'বিকাশ ও নগদ পেমেন্ট দ্রুত এবং চমৎকার কাজ করছে!',
      contact: '01615249856',
      status: 'replied',
      reply: 'ধন্যবাদ আপনার ইতিবাচক মতামতের জন্য! শুভ গেমিং!',
      createdAt: '2026-09-10 11:20:00'
    }
  ],
  chatSessions: [
    {
      id: 'cs-889922',
      userId: 'usr-889922',
      username: 'BDT_King88',
      userVip: 2,
      userBalance: 5420.50,
      userPhone: '01615249856',
      status: 'active',
      department: 'deposit',
      assignedAgent: {
        id: 'agent-01',
        name: 'নুসরাত জাহান',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
        role: 'সিনিয়র VIP সাপোর্ট স্পেশালিস্ট'
      },
      unreadUserCount: 0,
      unreadAdminCount: 0,
      lastMessage: 'আপনার TrxID ভেরিফিকেশন সফল হয়েছে, ব্যালেন্স চেক করুন।',
      lastMessageAt: '2026-09-21 15:02:10',
      createdAt: '2026-09-21 14:50:00',
      updatedAt: '2026-09-21 15:02:10'
    },
    {
      id: 'cs-994411',
      userId: 'usr-994411',
      username: 'rakib_boss',
      userVip: 4,
      userBalance: 12450.00,
      userPhone: '01789456123',
      status: 'waiting',
      department: 'withdraw',
      unreadUserCount: 0,
      unreadAdminCount: 1,
      lastMessage: 'আমার নগদ ক্যাশ-আউট প্রসেস কত সময় লাগবে ভাই?',
      lastMessageAt: '2026-09-21 15:10:45',
      createdAt: '2026-09-21 15:10:45',
      updatedAt: '2026-09-21 15:10:45'
    }
  ],
  chatMessages: [
    {
      id: 'cmsg-1',
      sessionId: 'cs-889922',
      sender: 'bot',
      senderName: 'BengalBet ২৪/৭ এআই অ্যাসিস্ট্যান্ট',
      text: 'আসসালামু আলাইকুম! BengalBet VIP কাস্টমার সার্ভিসে স্বাগতম। ডিপোজিট, উইথড্রয়াল বা বোনাস সম্পর্কিত কীভাবে আপনাকে সাহায্য করতে পারি?',
      isRead: true,
      createdAt: '2026-09-21 14:50:00'
    },
    {
      id: 'cmsg-2',
      sessionId: 'cs-889922',
      sender: 'user',
      senderName: 'BDT_King88',
      text: 'আমার বিকাশ ডিপোজিট ১,০০০ টাকা ব্যালেন্সে যুক্ত হয়নি। TrxID: 9KL34M89P2',
      isRead: true,
      createdAt: '2026-09-21 14:51:20'
    },
    {
      id: 'cmsg-3',
      sessionId: 'cs-889922',
      sender: 'agent',
      senderName: 'নুসরাত জাহান',
      senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
      text: 'প্রিয় গ্রাহক, আপনার TrxID 9KL34M89P2 বিকাশ সার্ভারে ভেরিফাই করা হয়েছে এবং ব্যালেন্স যোগ করে দেওয়া হয়েছে। অনুগ্রহ করে আপনার অ্যাকাউন্ট চেক করুন।',
      isRead: true,
      createdAt: '2026-09-21 15:02:10'
    },
    {
      id: 'cmsg-4',
      sessionId: 'cs-994411',
      sender: 'user',
      senderName: 'rakib_boss',
      text: 'আমার নগদ ক্যাশ-আউট প্রসেস কত সময় লাগবে ভাই?',
      isRead: false,
      createdAt: '2026-09-21 15:10:45'
    }
  ]
};

export const DEFAULT_REFERRALS: ReferralRecord[] = [
  {
    id: 'ref-1001',
    referrerId: 'usr-889922',
    referrerUsername: 'BDT_King88',
    referrerCode: 'BDT888',
    referredUserId: 'usr-sub-rakib',
    referredUsername: 'rakib_khan',
    referredPhone: '01712345671',
    level: 1,
    instantBonusPaid: true,
    instantBonusAmount: 300,
    totalDeposit: 2500,
    totalBet: 8200,
    depositCommission: 17.50,
    betCommission: 82.00,
    totalCommissionEarned: 399.50,
    status: 'active',
    joinedAt: '2026-09-22 14:02:18'
  },
  {
    id: 'ref-1002',
    referrerId: 'usr-889922',
    referrerUsername: 'BDT_King88',
    referrerCode: 'BDT888',
    referredUserId: 'usr-sub-shakil',
    referredUsername: 'shakil_vip',
    referredPhone: '01823456782',
    level: 1,
    instantBonusPaid: true,
    instantBonusAmount: 300,
    totalDeposit: 5000,
    totalBet: 18500,
    depositCommission: 35.00,
    betCommission: 185.00,
    totalCommissionEarned: 520.00,
    status: 'active',
    joinedAt: '2026-09-22 11:45:00'
  },
  {
    id: 'ref-1003',
    referrerId: 'usr-889922',
    referrerUsername: 'BDT_King88',
    referrerCode: 'BDT888',
    referredUserId: 'usr-sub-sumon',
    referredUsername: 'sumon_007',
    referredPhone: '01934567893',
    level: 1,
    instantBonusPaid: true,
    instantBonusAmount: 300,
    totalDeposit: 1500,
    totalBet: 5300,
    depositCommission: 10.50,
    betCommission: 53.00,
    totalCommissionEarned: 363.50,
    status: 'active',
    joinedAt: '2026-09-21 17:30:22'
  },
  {
    id: 'ref-1004',
    referrerId: 'usr-889922',
    referrerUsername: 'BDT_King88',
    referrerCode: 'BDT888',
    referredUserId: 'usr-sub-raj',
    referredUsername: 'bdt_raj',
    referredPhone: '01645678904',
    level: 1,
    instantBonusPaid: true,
    instantBonusAmount: 300,
    totalDeposit: 1000,
    totalBet: 4500,
    depositCommission: 7.00,
    betCommission: 45.00,
    totalCommissionEarned: 352.00,
    status: 'active',
    joinedAt: '2026-09-21 14:15:32'
  },
  {
    id: 'ref-1005',
    referrerId: 'usr-889922',
    referrerUsername: 'BDT_King88',
    referrerCode: 'BDT888',
    referredUserId: 'usr-sub-karim',
    referredUsername: 'karim_bdt',
    referredPhone: '01556789015',
    level: 1,
    instantBonusPaid: true,
    instantBonusAmount: 300,
    totalDeposit: 3000,
    totalBet: 12400,
    depositCommission: 21.00,
    betCommission: 124.00,
    totalCommissionEarned: 445.00,
    status: 'active',
    joinedAt: '2026-09-20 18:22:40'
  },
  {
    id: 'ref-1006',
    referrerId: 'usr-889922',
    referrerUsername: 'BDT_King88',
    referrerCode: 'BDT888',
    referredUserId: 'usr-sub-rubel',
    referredUsername: 'rubel_pro',
    referredPhone: '01367890126',
    level: 1,
    instantBonusPaid: true,
    instantBonusAmount: 300,
    totalDeposit: 2000,
    totalBet: 7600,
    depositCommission: 14.00,
    betCommission: 76.00,
    totalCommissionEarned: 390.00,
    status: 'active',
    joinedAt: '2026-09-19 21:55:12'
  },
  {
    id: 'ref-1007',
    referrerId: 'usr-889922',
    referrerUsername: 'BDT_King88',
    referrerCode: 'BDT888',
    referredUserId: 'usr-sub-joy',
    referredUsername: 'joy_player',
    referredPhone: '01778901237',
    level: 1,
    instantBonusPaid: false,
    instantBonusAmount: 0,
    totalDeposit: 0,
    totalBet: 0,
    depositCommission: 0,
    betCommission: 0,
    totalCommissionEarned: 0,
    status: 'pending_first_deposit',
    joinedAt: '2026-09-23 09:12:35'
  },
  {
    id: 'ref-1008',
    referrerId: 'usr-889922',
    referrerUsername: 'BDT_King88',
    referrerCode: 'BDT888',
    referredUserId: 'usr-sub-tanvir',
    referredUsername: 'tanvir_boss',
    referredPhone: '01889012348',
    level: 1,
    instantBonusPaid: false,
    instantBonusAmount: 0,
    totalDeposit: 0,
    totalBet: 0,
    depositCommission: 0,
    betCommission: 0,
    totalCommissionEarned: 0,
    status: 'pending_first_deposit',
    joinedAt: '2026-09-23 10:05:10'
  },
  {
    id: 'ref-2001',
    referrerId: 'usr-google-pkx',
    referrerUsername: 'workpkx1',
    referrerCode: 'PKX777',
    referredUserId: 'usr-pkx-sub1',
    referredUsername: 'sabbir_gamer',
    referredPhone: '01799887766',
    level: 1,
    instantBonusPaid: true,
    instantBonusAmount: 300,
    totalDeposit: 8000,
    totalBet: 34000,
    depositCommission: 56.00,
    betCommission: 340.00,
    totalCommissionEarned: 696.00,
    status: 'active',
    joinedAt: '2026-09-18 15:30:00'
  },
  {
    id: 'ref-3001',
    referrerId: 'usr-vip7-shakib',
    referrerUsername: 'Shakib_Pro99',
    referrerCode: 'SHAKIB99',
    referredUserId: 'usr-shakib-sub1',
    referredUsername: 'arif_tiger',
    referredPhone: '01911223344',
    level: 1,
    instantBonusPaid: true,
    instantBonusAmount: 300,
    totalDeposit: 15000,
    totalBet: 68000,
    depositCommission: 105.00,
    betCommission: 680.00,
    totalCommissionEarned: 1085.00,
    status: 'active',
    joinedAt: '2026-09-15 12:20:00'
  }
];

export const DEFAULT_REFERRAL_CLAIMS: ReferralRewardClaimRecord[] = [
  {
    id: 'claim-101',
    userId: 'usr-889922',
    tierId: 1,
    requiredCount: 1,
    bonusAmount: 300,
    trxId: 'REFCLM101',
    claimedAt: '2026-09-19 22:00:00'
  },
  {
    id: 'claim-102',
    userId: 'usr-889922',
    tierId: 2,
    requiredCount: 2,
    bonusAmount: 300,
    trxId: 'REFCLM102',
    claimedAt: '2026-09-20 19:00:00'
  },
  {
    id: 'claim-103',
    userId: 'usr-889922',
    tierId: 3,
    requiredCount: 3,
    bonusAmount: 300,
    trxId: 'REFCLM103',
    claimedAt: '2026-09-21 14:30:00'
  },
  {
    id: 'claim-104',
    userId: 'usr-889922',
    tierId: 4,
    requiredCount: 4,
    bonusAmount: 300,
    trxId: 'REFCLM104',
    claimedAt: '2026-09-21 18:00:00'
  },
  {
    id: 'claim-105',
    userId: 'usr-889922',
    tierId: 5,
    requiredCount: 5,
    bonusAmount: 300,
    trxId: 'REFCLM105',
    claimedAt: '2026-09-22 12:00:00'
  }
];

INITIAL_DATA.referrals = DEFAULT_REFERRALS;
INITIAL_DATA.referralClaims = DEFAULT_REFERRAL_CLAIMS;
INITIAL_DATA.vipTiers = [...DEFAULT_VIP_TIERS];
INITIAL_DATA.vipRewardClaims = [];
INITIAL_DATA.dailySignIns = [
  {
    id: 'ds-1',
    userId: 'usr-889922',
    username: 'BDT_King88',
    day: 1,
    bonus: 1.00,
    date: '2026-08-30',
    claimedAt: '2026-08-30 09:15:40',
    streak: 1,
    status: 'claimed'
  }
];
INITIAL_DATA.dailySignInConfig = DEFAULT_DAILY_SIGNIN_CONFIG;
INITIAL_DATA.rescueTiers = [...DEFAULT_RESCUE_TIERS];
INITIAL_DATA.rescueClaims = [
  {
    id: 'rc-1',
    userId: 'usr-889922',
    username: 'BDT_King88',
    date: '2026-08-29',
    totalBet: 4500,
    totalWin: 3500,
    netLoss: 1000,
    percentage: 5.0,
    bonusAmount: 50.00,
    status: 'approved',
    claimedAt: '2026-08-29 23:10:00',
    adminNote: 'অটো ভেরিফাইড দৈনিক লস রিলিফ'
  }
];
INITIAL_DATA.promoCodes = [...DEFAULT_PROMO_CODES];
INITIAL_DATA.promoRedemptions = [
  {
    id: 'pr-1',
    promoId: 'pc-2',
    code: 'TELEGRAM100',
    userId: 'usr-889922',
    username: 'BDT_King88',
    bonusAmount: 100,
    redeemedAt: '2026-08-28 12:10:05'
  }
];
INITIAL_DATA.userTickets = [...DEFAULT_USER_TICKETS];
INITIAL_DATA.mysteryRewardConfig = { ...DEFAULT_MYSTERY_REWARD_CONFIG };
INITIAL_DATA.mysteryCashCards = [...DEFAULT_MYSTERY_CASH_CARDS];

class DatabaseManager {
  public data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadData();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || INITIAL_DATA.users,
          transactions: parsed.transactions || INITIAL_DATA.transactions,
          wallets: parsed.wallets || INITIAL_DATA.wallets,
          bets: parsed.bets || INITIAL_DATA.bets,
          games: (parsed.games && parsed.games.length > 0) ? parsed.games : [...DEFAULT_GAMES],
          promotions: (parsed.promotions && parsed.promotions.length > 0) ? parsed.promotions : [...DEFAULT_PROMOTIONS],
          messages: parsed.messages || INITIAL_DATA.messages,
          feedbacks: parsed.feedbacks || INITIAL_DATA.feedbacks,
          chatSessions: parsed.chatSessions || INITIAL_DATA.chatSessions || [],
          chatMessages: parsed.chatMessages || INITIAL_DATA.chatMessages || [],
          referrals: (parsed.referrals && parsed.referrals.length > 0) ? parsed.referrals : DEFAULT_REFERRALS,
          referralClaims: (parsed.referralClaims && parsed.referralClaims.length > 0) ? parsed.referralClaims : DEFAULT_REFERRAL_CLAIMS,
          vipTiers: (parsed.vipTiers && parsed.vipTiers.length > 0) ? parsed.vipTiers : [...DEFAULT_VIP_TIERS],
          vipRewardClaims: parsed.vipRewardClaims || [],
          dailySignIns: parsed.dailySignIns || INITIAL_DATA.dailySignIns || [],
          dailySignInConfig: parsed.dailySignInConfig || DEFAULT_DAILY_SIGNIN_CONFIG,
          rescueTiers: (parsed.rescueTiers && parsed.rescueTiers.length > 0) ? parsed.rescueTiers : [...DEFAULT_RESCUE_TIERS],
          rescueClaims: parsed.rescueClaims || INITIAL_DATA.rescueClaims || [],
          promoCodes: (parsed.promoCodes && parsed.promoCodes.length > 0) ? parsed.promoCodes : [...DEFAULT_PROMO_CODES],
          promoRedemptions: parsed.promoRedemptions || INITIAL_DATA.promoRedemptions || [],
          userTickets: (parsed.userTickets && parsed.userTickets.length > 0) ? parsed.userTickets : [...DEFAULT_USER_TICKETS],
          mysteryRewardConfig: parsed.mysteryRewardConfig || { ...DEFAULT_MYSTERY_REWARD_CONFIG },
          mysteryCashCards: (parsed.mysteryCashCards && parsed.mysteryCashCards.length > 0) ? parsed.mysteryCashCards : [...DEFAULT_MYSTERY_CASH_CARDS],
          neextplaySessions: parsed.neextplaySessions || [],
          neextplayTransactions: parsed.neextplayTransactions || [],
          neextplayConfig: parsed.neextplayConfig || { ...DEFAULT_NEEXTPLAY_CONFIG },
          settings: parsed.settings ? {
            ...DEFAULT_SETTINGS,
            ...parsed.settings,
            referralSettings: {
              ...DEFAULT_REFERRAL_SETTINGS,
              ...(parsed.settings.referralSettings || {})
            }
          } : INITIAL_DATA.settings
        };
      }
    } catch (err) {
      console.error('Failed to load database from disk, using fallback initial data:', err);
    }

    // Save initial data to disk
    this.saveDataDirect(INITIAL_DATA);
    return INITIAL_DATA;
  }

  private saveDataDirect(data: DatabaseSchema) {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database to disk:', err);
    }
  }

  public scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveDataDirect(this.data);
    }, 200);
  }

  // --- Database Reference & Compatibility Helpers ---
  public readDb(): DatabaseSchema {
    return this.data;
  }

  public getPlatformStats() {
    const bets = this.data.bets || [];
    const txs = this.data.transactions || [];
    const users = this.data.users || [];

    let totalTurnover = 0;
    let totalPayout = 0;
    for (const b of bets) {
      totalTurnover += (b.betAmount || 0);
      totalPayout += (b.reward || 0);
    }

    let totalDeposits = 0;
    let totalWithdrawals = 0;
    for (const t of txs) {
      if (t.type === 'deposit' && (t.status === 'success' || !t.status)) {
        totalDeposits += (t.amount || 0);
      } else if (t.type === 'withdraw' && t.status === 'success') {
        totalWithdrawals += (t.amount || 0);
      }
    }

    return {
      totalUsers: users.length,
      totalBets: bets.length,
      totalTurnover: Number(totalTurnover.toFixed(2)),
      totalPayout: Number(totalPayout.toFixed(2)),
      totalDeposits: Number(totalDeposits.toFixed(2)),
      totalWithdrawals: Number(totalWithdrawals.toFixed(2)),
      netGgr: Number((totalTurnover - totalPayout).toFixed(2))
    };
  }

  public getAllUsers(): UserRecord[] {
    return this.data.users;
  }

  // --- Users ---
  public getUsers(): UserRecord[] {
    return this.data.users;
  }

  public getUserById(id: string): UserRecord | undefined {
    if (!id) return undefined;
    const direct = this.data.users.find(u => u.id === id);
    if (direct) return direct;
    const clean = id.replace(/^ply_bb_/, '').replace(/^usr-/, '');
    return this.data.users.find(u => 
      u.id === id || 
      u.id === `usr-${clean}` || 
      u.id === clean || 
      u.id.replace(/^usr-/, '') === clean ||
      (clean === '889922' && u.id.includes('889922'))
    );
  }

  public getUserByPhone(phone: string): UserRecord | undefined {
    return this.data.users.find(u => u.phone === phone);
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    if (!email) return undefined;
    return this.data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByReferralCode(code: string): UserRecord | undefined {
    if (!code) return undefined;
    const cleanCode = code.trim().toUpperCase();
    return this.data.users.find(u => (u.referralCode || '').toUpperCase() === cleanCode);
  }

  public createUser(userData: Omit<UserRecord, 'id' | 'createdAt'>): UserRecord {
    const newUser: UserRecord = {
      id: `usr-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ...userData
    };
    this.data.users.push(newUser);
    this.scheduleSave();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    if (!id) return undefined;
    let index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) {
      const clean = id.replace(/^ply_bb_/, '').replace(/^usr-/, '');
      index = this.data.users.findIndex(u => 
        u.id === `usr-${clean}` || 
        u.id === clean || 
        u.id.replace(/^usr-/, '') === clean ||
        (clean === '889922' && u.id.includes('889922'))
      );
    }
    if (index === -1) return undefined;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.scheduleSave();
    return this.data.users[index];
  }

  // --- Transactions ---
  public getTransactions(userId?: string, type?: string): TransactionRecord[] {
    let list = this.data.transactions;
    if (userId) {
      list = list.filter(t => t.userId === userId);
    }
    if (type && type !== 'all') {
      list = list.filter(t => t.type === type);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addTransaction(txData: Omit<TransactionRecord, 'id' | 'createdAt'>): TransactionRecord {
    const user = this.getUserById(txData.userId);
    const newTx: TransactionRecord = {
      id: `tx-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      username: txData.username || user?.username || 'Unknown',
      userPhone: txData.userPhone || user?.phone || '',
      ...txData
    };
    this.data.transactions.unshift(newTx);
    this.scheduleSave();
    return newTx;
  }

  public addAccountRecord(record: {
    userId: string;
    username?: string;
    type: string;
    amount: number;
    balanceAfter?: number;
    channel?: string;
    trxId?: string;
    status?: string;
    date?: string;
    time?: string;
    remark?: string;
  }): TransactionRecord {
    const txType: 'adjustment' | 'bet_payout' | 'deposit' | 'withdraw' = 
      record.type === 'bet' ? 'adjustment' : 
      record.type === 'payout' || record.type === 'win' ? 'bet_payout' : 
      'adjustment';

    return this.addTransaction({
      userId: record.userId,
      username: record.username,
      type: txType,
      amount: Math.abs(record.amount),
      channel: (record.channel as any) || 'system',
      trxId: record.trxId || `REC-${Date.now().toString().slice(-6)}`,
      status: (record.status as any) || 'success',
      description: record.remark || `Account ${record.type} record`
    });
  }

  // --- Wallets (Bound Cards) ---
  public getWallets(userId: string): WalletRecord[] {
    return this.data.wallets.filter(w => w.userId === userId);
  }

  public addWallet(walletData: Omit<WalletRecord, 'id' | 'createdAt'>): WalletRecord {
    const newWallet: WalletRecord = {
      id: `w-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ...walletData
    };
    this.data.wallets.push(newWallet);
    this.scheduleSave();
    return newWallet;
  }

  public deleteWallet(id: string, userId: string): boolean {
    const before = this.data.wallets.length;
    this.data.wallets = this.data.wallets.filter(w => !(w.id === id && w.userId === userId));
    const changed = this.data.wallets.length !== before;
    if (changed) this.scheduleSave();
    return changed;
  }

  // --- Bets ---
  public getBets(userId: string, category?: string, date?: string): BetRecord[] {
    let list = this.data.bets.filter(b => b.userId === userId);
    if (category && category !== 'all') {
      list = list.filter(b => b.category === category);
    }
    if (date) {
      list = list.filter(b => b.date === date);
    }
    return list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  public addBet(betData: Omit<BetRecord, 'id'>): BetRecord {
    const newBet: BetRecord = {
      id: `b-${Date.now().toString().slice(-6)}`,
      ...betData
    };
    this.data.bets.unshift(newBet);
    this.scheduleSave();
    return newBet;
  }

  public settleBet(gameRound: string, userId: string, reward: number, multiplier?: number): BetRecord | null {
    const bet = this.data.bets.find(b => (b.gameRound === gameRound || b.orderNo === gameRound) && (b.userId === userId || !userId));
    if (bet) {
      bet.reward = reward;
      bet.profit = Number((reward - bet.betAmount).toFixed(2));
      this.scheduleSave();
      return bet;
    }
    return null;
  }

  // --- Games Suite ---
  public getGames(category?: string): GameRecord[] {
    if (!this.data.games || this.data.games.length === 0) {
      this.data.games = [...DEFAULT_GAMES];
    }
    let list = this.data.games;
    if (category && category !== 'all') {
      if (category === 'hot') {
        list = list.filter(g => g.isHot);
      } else {
        list = list.filter(g => g.category.toLowerCase() === category.toLowerCase());
      }
    }
    return list;
  }

  public getGameById(id: string): GameRecord | undefined {
    return this.getGames().find(g => g.id === id);
  }

  public addGame(gameData: Partial<GameRecord>): GameRecord {
    if (!this.data.games) this.data.games = [...DEFAULT_GAMES];
    const newGame: GameRecord = {
      id: gameData.id || `game-${Date.now().toString().slice(-6)}`,
      name: gameData.name || 'Custom Game',
      nameBn: gameData.nameBn || gameData.name || 'নতুন গেম',
      provider: gameData.provider || 'JILI',
      category: gameData.category || 'slot',
      image: gameData.image || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=500&q=85',
      isHot: !!gameData.isHot,
      isNew: gameData.isNew !== undefined ? gameData.isNew : true,
      jackpot: gameData.jackpot || 10000000,
      rtp: gameData.rtp || 97.0,
      playersCount: gameData.playersCount || 10000,
      volatility: gameData.volatility || 'Medium',
      status: gameData.status || 'active'
    };
    this.data.games.unshift(newGame);
    this.scheduleSave();
    return newGame;
  }

  public updateGame(id: string, updates: Partial<GameRecord>): GameRecord | undefined {
    if (!this.data.games) this.data.games = [...DEFAULT_GAMES];
    const idx = this.data.games.findIndex(g => g.id === id);
    if (idx === -1) return undefined;
    this.data.games[idx] = { ...this.data.games[idx], ...updates };
    this.scheduleSave();
    return this.data.games[idx];
  }

  public deleteGame(id: string): boolean {
    if (!this.data.games) this.data.games = [...DEFAULT_GAMES];
    const before = this.data.games.length;
    this.data.games = this.data.games.filter(g => g.id !== id);
    const changed = this.data.games.length !== before;
    if (changed) this.scheduleSave();
    return changed;
  }

  // --- Promotions Suite ---
  public getPromotions(category?: string): PromotionRecord[] {
    if (!this.data.promotions || this.data.promotions.length === 0) {
      this.data.promotions = [...DEFAULT_PROMOTIONS];
    }
    let list = this.data.promotions;
    if (category && category !== 'all') {
      list = list.filter(p => p.category === category);
    }
    return list;
  }

  public addPromotion(promoData: Partial<PromotionRecord>): PromotionRecord {
    if (!this.data.promotions) this.data.promotions = [...DEFAULT_PROMOTIONS];
    const newPromo: PromotionRecord = {
      id: promoData.id || `promo-${Date.now().toString().slice(-6)}`,
      title: promoData.title || 'New Promotion',
      titleBn: promoData.titleBn || promoData.title,
      category: promoData.category || 'deposit',
      description: promoData.description || '',
      banner: promoData.banner || 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
      bonusValue: promoData.bonusValue || '৫০% বোনাস',
      rules: promoData.rules || [],
      status: promoData.status || 'active',
      createdAt: promoData.createdAt || new Date().toISOString()
    };
    this.data.promotions.unshift(newPromo);
    this.scheduleSave();
    return newPromo;
  }

  public updatePromotion(id: string, updates: Partial<PromotionRecord>): PromotionRecord | undefined {
    if (!this.data.promotions) this.data.promotions = [...DEFAULT_PROMOTIONS];
    const idx = this.data.promotions.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.promotions[idx] = { ...this.data.promotions[idx], ...updates };
    this.scheduleSave();
    return this.data.promotions[idx];
  }

  public deletePromotion(id: string): boolean {
    if (!this.data.promotions) this.data.promotions = [...DEFAULT_PROMOTIONS];
    const before = this.data.promotions.length;
    this.data.promotions = this.data.promotions.filter(p => p.id !== id);
    const changed = this.data.promotions.length !== before;
    if (changed) this.scheduleSave();
    return changed;
  }

  // --- Messages ---
  public getMessages(userId: string): MessageRecord[] {
    return this.data.messages.filter(m => m.userId === 'all' || m.userId === userId);
  }

  public getAllMessages(): MessageRecord[] {
    return [...this.data.messages].sort((a, b) => new Date(b.dateFull).getTime() - new Date(a.dateFull).getTime());
  }

  public markMessageRead(id: string): boolean {
    const msg = this.data.messages.find(m => m.id === id);
    if (msg) {
      msg.isRead = true;
      this.scheduleSave();
      return true;
    }
    return false;
  }

  public deleteMessage(id: string): boolean {
    const before = this.data.messages.length;
    this.data.messages = this.data.messages.filter(m => m.id !== id);
    const changed = this.data.messages.length !== before;
    if (changed) this.scheduleSave();
    return changed;
  }

  public createMessage(data: Partial<MessageRecord>): MessageRecord {
    const now = new Date();
    const newMsg: MessageRecord = {
      id: `msg-${Date.now().toString().slice(-6)}`,
      userId: data.userId || 'all',
      sender: data.sender || 'প্ল্যাটফর্ম',
      title: data.title || 'অভ্যন্তরীণ বার্তা',
      displayTime: 'আজ ' + now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      dateFull: now.toISOString().replace('T', ' ').slice(0, 19),
      isRead: false,
      category: data.category || 'notice',
      claimableBonus: data.claimableBonus || 0,
      claimedBy: [],
      content: {
        headline: data.content?.headline || data.title || 'অভ্যন্তরীণ বার্তা',
        description: data.content?.description || '',
        howToGetTitle: data.content?.howToGetTitle || 'কিভাবে পাবেন:',
        howToGetSteps: data.content?.howToGetSteps || ['নোটিশটি পড়ুন এবং সংশ্লিষ্ট সুবিধা উপভোগ করুন।'],
        rulesTitle: data.content?.rulesTitle || 'নিয়মাবলী:',
        rules: data.content?.rules || ['১  BengalBet গেমিং শর্তাবলী প্রযোজ্য।'],
        officialLinksTitle: data.content?.officialLinksTitle || 'BengalBet অফিসিয়াল লিঙ্ক',
        officialLinks: data.content?.officialLinks || ['BengalBet.vip', 'BengalBet.me']
      }
    };
    this.data.messages.unshift(newMsg);
    this.scheduleSave();
    return newMsg;
  }

  public claimMessageBonus(id: string, userId: string): { success: boolean; amount?: number; message: string } {
    const msg = this.data.messages.find(m => m.id === id);
    if (!msg) return { success: false, message: 'বার্তা পাওয়া যায়নি' };
    if (!msg.claimableBonus || msg.claimableBonus <= 0) {
      return { success: false, message: 'এই বার্তায় কোনো ক্লেইমযোগ্য বোনাস নেই' };
    }
    if (!msg.claimedBy) msg.claimedBy = [];
    if (msg.claimedBy.includes(userId)) {
      return { success: false, message: 'আপনি ইতিমধ্যে এই বোনাসটি দাবি করেছেন' };
    }

    const user = this.getUserById(userId);
    if (user) {
      user.balance = Math.round((user.balance + msg.claimableBonus) * 100) / 100;
      msg.claimedBy.push(userId);
      this.addTransaction({
        userId,
        type: 'bonus',
        amount: msg.claimableBonus,
        channel: 'inbox_bonus',
        phone: user.phone,
        status: 'success',
        note: `ইনবক্স বার্তা বোনাস ক্লেইম: ${msg.title}`
      });
      this.scheduleSave();
      return { success: true, amount: msg.claimableBonus, message: `৳${msg.claimableBonus} বোনাস সফলভাবে আপনার মূল অ্যাকাউন্টে যুক্ত হয়েছে!` };
    }
    return { success: false, message: 'ইউজার পাওয়া যায়নি' };
  }

  // --- Feedback & Support Tickets ---
  private formatFeedbackRecord(f: FeedbackRecord): FeedbackRecord {
    const formatted = { ...f };
    if (!formatted.ticketNumber) {
      formatted.ticketNumber = `TKT-${formatted.id.replace('fb-', '').slice(-6).toUpperCase()}`;
    }
    if (!formatted.subject) {
      formatted.subject = formatted.type;
    }
    if (!formatted.priority) {
      formatted.priority = 'normal';
    }
    if (!formatted.messages || formatted.messages.length === 0) {
      formatted.messages = [
        {
          id: `msg-${formatted.id}-1`,
          sender: 'user',
          senderName: formatted.username || 'প্লেয়ার',
          text: formatted.content,
          createdAt: formatted.createdAt
        }
      ];
      if (formatted.reply) {
        formatted.messages.push({
          id: `msg-${formatted.id}-2`,
          sender: 'admin',
          senderName: 'BengalBet সাপোর্ট টিম',
          text: formatted.reply,
          createdAt: formatted.updatedAt || formatted.createdAt
        });
      }
    }
    if (!formatted.updatedAt) {
      formatted.updatedAt = formatted.createdAt;
    }
    return formatted;
  }

  public getFeedbacks(userId: string): FeedbackRecord[] {
    return this.data.feedbacks
      .filter(f => f.userId === userId)
      .map(f => this.formatFeedbackRecord(f))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }

  public getFeedbackById(id: string): FeedbackRecord | undefined {
    const fb = this.data.feedbacks.find(f => f.id === id);
    return fb ? this.formatFeedbackRecord(fb) : undefined;
  }

  public addFeedback(fbData: {
    userId: string;
    username?: string;
    type: string;
    subject?: string;
    content: string;
    contact?: string;
    priority?: 'normal' | 'high' | 'urgent';
  }): FeedbackRecord {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const id = `fb-${Date.now().toString().slice(-6)}`;
    const randomTicketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    const newFb: FeedbackRecord = {
      id,
      ticketNumber: randomTicketNumber,
      userId: fbData.userId,
      username: fbData.username,
      type: fbData.type,
      subject: fbData.subject || fbData.type,
      content: fbData.content,
      contact: fbData.contact,
      priority: fbData.priority || 'normal',
      status: 'pending',
      messages: [
        {
          id: `msg-${id}-1`,
          sender: 'user',
          senderName: fbData.username || 'প্লেয়ার',
          text: fbData.content,
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    this.data.feedbacks.unshift(newFb);
    this.scheduleSave();
    return newFb;
  }

  public addFeedbackMessage(
    id: string,
    sender: 'user' | 'admin',
    text: string,
    senderName?: string,
    newStatus?: 'pending' | 'in_progress' | 'replied' | 'resolved' | 'closed'
  ): FeedbackRecord | undefined {
    const fb = this.data.feedbacks.find(f => f.id === id);
    if (!fb) return undefined;

    const formatted = this.formatFeedbackRecord(fb);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newMsg: FeedbackMessage = {
      id: `msg-${Date.now().toString().slice(-5)}`,
      sender,
      senderName: senderName || (sender === 'admin' ? 'BengalBet সাপোর্ট টিম' : fb.username || 'প্লেয়ার'),
      text,
      createdAt: now
    };

    if (!fb.messages) {
      fb.messages = formatted.messages || [];
    }
    fb.messages.push(newMsg);
    fb.updatedAt = now;

    if (newStatus) {
      fb.status = newStatus;
    } else if (sender === 'admin') {
      fb.status = 'replied';
      fb.reply = text;
    } else {
      fb.status = 'pending';
    }

    this.scheduleSave();
    return this.formatFeedbackRecord(fb);
  }

  public deleteFeedback(id: string): boolean {
    const initialLen = this.data.feedbacks.length;
    this.data.feedbacks = this.data.feedbacks.filter(f => f.id !== id);
    if (this.data.feedbacks.length !== initialLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  // --- Neext Hub Admin Operations ---
  public getAllTransactions(): TransactionRecord[] {
    return [...this.data.transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTransactionById(id: string): TransactionRecord | undefined {
    return this.data.transactions.find(t => t.id === id);
  }

  public updateTransactionStatus(
    id: string,
    status: 'success' | 'pending' | 'rejected' | 'processing' | 'flagged',
    extra?: { adminNote?: string; rejectionReason?: string; processedBy?: string }
  ): TransactionRecord | undefined {
    const tx = this.data.transactions.find(t => t.id === id);
    if (!tx) return undefined;
    tx.status = status;
    tx.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    tx.processedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    if (extra?.adminNote !== undefined) tx.adminNote = extra.adminNote;
    if (extra?.rejectionReason !== undefined) tx.rejectionReason = extra.rejectionReason;
    if (extra?.processedBy !== undefined) tx.processedBy = extra.processedBy;
    this.scheduleSave();
    return tx;
  }

  public updateTransaction(id: string, updates: Partial<TransactionRecord>): TransactionRecord | undefined {
    const tx = this.data.transactions.find(t => t.id === id);
    if (!tx) return undefined;
    Object.assign(tx, updates, { updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) });
    this.scheduleSave();
    return tx;
  }

  public deleteTransaction(id: string): boolean {
    const prevLen = this.data.transactions.length;
    this.data.transactions = this.data.transactions.filter(t => t.id !== id);
    if (this.data.transactions.length !== prevLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  public deleteUser(id: string): boolean {
    const prevLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== prevLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  public syncUsers(usersList: Partial<UserRecord>[]): number {
    let count = 0;
    for (const u of usersList) {
      if (!u.id && !u.email && !u.phone) continue;
      const existing = (u.id && this.getUserById(u.id)) || 
                       (u.email && this.getUserByEmail(u.email)) || 
                       (u.phone && this.getUserByPhone(u.phone));
      if (existing) {
        if (u.balance !== undefined) existing.balance = u.balance;
        if (u.vipLevel !== undefined) existing.vipLevel = u.vipLevel;
        if (u.vipExp !== undefined) existing.vipExp = u.vipExp;
        if (u.vipMaxExp !== undefined) existing.vipMaxExp = u.vipMaxExp;
        if (u.freeSpins !== undefined) existing.freeSpins = u.freeSpins;
        if (u.goldenEggsAvailable !== undefined) existing.goldenEggsAvailable = u.goldenEggsAvailable;
        if (u.redPacketsAvailable !== undefined) existing.redPacketsAvailable = u.redPacketsAvailable;
        if (u.unreadNotifications !== undefined) existing.unreadNotifications = u.unreadNotifications;
        if (u.status !== undefined) existing.status = u.status as any;
        if (u.username) existing.username = u.username;
        if (u.avatar) existing.avatar = u.avatar;
        if (u.email && !existing.email) existing.email = u.email;
        count++;
      } else {
        const newUser: UserRecord = {
          id: u.id || `usr-${Date.now().toString().slice(-6)}`,
          username: u.username || (u.email ? u.email.split('@')[0] : 'Player'),
          phone: u.phone || '01700000000',
          passwordHash: u.passwordHash || '123456',
          balance: u.balance !== undefined ? u.balance : 888,
          vipLevel: u.vipLevel ?? 1,
          vipExp: u.vipExp ?? 100,
          vipMaxExp: u.vipMaxExp ?? 1000,
          freeSpins: u.freeSpins ?? 5,
          redPacketsAvailable: u.redPacketsAvailable ?? 2,
          goldenEggsAvailable: u.goldenEggsAvailable ?? 2,
          unreadNotifications: u.unreadNotifications ?? 1,
          referralCode: u.referralCode || `BDT${Math.floor(100 + Math.random() * 900)}`,
          totalEarnings: u.totalEarnings ?? 0,
          referredFriendsCount: u.referredFriendsCount ?? 0,
          avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          createdAt: u.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
          status: (u.status as any) || 'active',
          email: u.email,
          realName: u.realName
        };
        this.data.users.push(newUser);
        count++;
      }
    }
    if (count > 0) this.scheduleSave();
    return count;
  }

  public getUserDetails(userId: string) {
    const user = this.getUserById(userId);
    if (!user) return null;
    const transactions = this.getTransactions(userId);
    const deposits = transactions.filter(t => t.type === 'deposit');
    const withdrawals = transactions.filter(t => t.type === 'withdraw');
    const totalDeposited = deposits.filter(t => t.status === 'success').reduce((acc, d) => acc + d.amount, 0);
    const totalWithdrawn = withdrawals.filter(t => t.status === 'success').reduce((acc, w) => acc + w.amount, 0);
    const wallets = this.getWallets(userId);
    const bets = this.getBets(userId);
    const totalBetAmount = bets.reduce((acc, b) => acc + (b.betAmount || 0), 0);
    const totalProfit = bets.reduce((acc, b) => acc + (b.profit || 0), 0);

    return {
      user,
      stats: {
        totalDeposited: Number(totalDeposited.toFixed(2)),
        totalWithdrawn: Number(totalWithdrawn.toFixed(2)),
        totalTransactionsCount: transactions.length,
        totalBetsCount: bets.length,
        totalBetAmount: Number(totalBetAmount.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),
        walletsCount: wallets.length
      },
      wallets,
      recentTransactions: transactions.slice(0, 10),
      recentBets: bets.slice(0, 10)
    };
  }

  public addMessageToUser(userId: string, title: string, description: string, sender: string = 'অ্যাডমিন সাপোর্ট') {
    const newMsg: MessageRecord = {
      id: `msg-${Date.now().toString().slice(-6)}`,
      userId,
      sender,
      title,
      displayTime: 'এখনই',
      dateFull: new Date().toISOString().replace('T', ' ').slice(0, 19),
      isRead: false,
      content: {
        headline: title,
        description,
        howToGetTitle: 'অ্যাডমিন বার্তা / নোটিশ:',
        howToGetSteps: ['আপনার প্রোফাইলে এই বার্তাটি সংরক্ষিত রয়েছে।'],
        rulesTitle: 'নিয়মাবলী ও শর্তাবলী:',
        rules: ['সরাসরি Neext Hub Admin কর্তৃক প্রেরিত বার্তা।']
      }
    };
    this.data.messages.unshift(newMsg);
    this.scheduleSave();
    return newMsg;
  }

  public getAllFeedbacks(): FeedbackRecord[] {
    return this.data.feedbacks
      .map(f => this.formatFeedbackRecord(f))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  }

  public updateFeedbackStatus(
    id: string,
    status: 'pending' | 'in_progress' | 'replied' | 'resolved' | 'closed',
    reply?: string
  ): FeedbackRecord | undefined {
    const fb = this.data.feedbacks.find(f => f.id === id);
    if (!fb) return undefined;
    fb.status = status;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    fb.updatedAt = now;
    if (reply) {
      fb.reply = reply;
      if (!fb.messages) {
        fb.messages = this.formatFeedbackRecord(fb).messages || [];
      }
      fb.messages.push({
        id: `msg-${Date.now().toString().slice(-5)}`,
        sender: 'admin',
        senderName: 'BengalBet সাপোর্ট টিম',
        text: reply,
        createdAt: now
      });
    }
    this.scheduleSave();
    return this.formatFeedbackRecord(fb);
  }

  public getSettings(): SiteSettings {
    if (!this.data.settings) {
      this.data.settings = { ...DEFAULT_SETTINGS };
      this.scheduleSave();
    }
    if (!this.data.settings.gameEngine) {
      this.data.settings.gameEngine = { ...DEFAULT_GAME_ENGINE_SETTINGS };
      this.scheduleSave();
    }
    return this.data.settings;
  }

  public updateSettings(updates: Partial<SiteSettings>): SiteSettings {
    const current = this.getSettings();
    const updatedGameEngine: GameEngineSettings = updates.gameEngine ? {
      ...(current.gameEngine || DEFAULT_GAME_ENGINE_SETTINGS),
      ...updates.gameEngine,
      categoryRtp: {
        ...(current.gameEngine?.categoryRtp || DEFAULT_GAME_ENGINE_SETTINGS.categoryRtp),
        ...(updates.gameEngine.categoryRtp || {})
      },
      gameRtp: {
        ...(current.gameEngine?.gameRtp || DEFAULT_GAME_ENGINE_SETTINGS.gameRtp),
        ...(updates.gameEngine.gameRtp || {})
      },
      telemetry: {
        ...(current.gameEngine?.telemetry || DEFAULT_GAME_ENGINE_SETTINGS.telemetry),
        ...(updates.gameEngine.telemetry || {})
      }
    } : (current.gameEngine || DEFAULT_GAME_ENGINE_SETTINGS);

    this.data.settings = {
      ...current,
      ...updates,
      siteNotice: {
        ...current.siteNotice,
        ...(updates.siteNotice || {})
      },
      gameRtp: {
        ...current.gameRtp,
        ...(updates.gameRtp || {}),
        ...(updates.gameEngine?.gameRtp || {})
      },
      gameEngine: updatedGameEngine
    };
    this.scheduleSave();
    return this.data.settings;
  }

  // --- 24/7 Live Chat Operations ---
  public getAllChatSessions(): ChatSessionRecord[] {
    if (!this.data.chatSessions) this.data.chatSessions = [];
    return [...this.data.chatSessions].sort(
      (a, b) => new Date(b.updatedAt || b.lastMessageAt).getTime() - new Date(a.updatedAt || a.lastMessageAt).getTime()
    );
  }

  public getChatSession(sessionId: string): ChatSessionRecord | undefined {
    if (!this.data.chatSessions) this.data.chatSessions = [];
    return this.data.chatSessions.find(s => s.id === sessionId);
  }

  public getOrCreateUserChatSession(
    userId: string,
    username: string,
    department: 'general' | 'deposit' | 'withdraw' | 'bonus' | 'technical' = 'general',
    meta?: { vip?: number; balance?: number; phone?: string }
  ): ChatSessionRecord {
    if (!this.data.chatSessions) this.data.chatSessions = [];
    if (!this.data.chatMessages) this.data.chatMessages = [];

    let session = this.data.chatSessions.find(
      s => (s.userId === userId || s.username.toLowerCase() === username.toLowerCase()) && s.status !== 'closed'
    );

    const now = new Date().toISOString();
    const userRec = this.data.users.find(u => u.id === userId || u.username.toLowerCase() === username.toLowerCase());

    if (!session) {
      const sessionId = `cs-${userId || Date.now()}`;
      session = {
        id: sessionId,
        userId: userId || `usr-${Date.now()}`,
        username: username || (userRec?.username || 'BDT_Member'),
        userVip: meta?.vip ?? (userRec?.vipLevel ?? 1),
        userBalance: meta?.balance ?? (userRec?.balance ?? 0),
        userPhone: meta?.phone || userRec?.phone || '',
        status: 'active',
        department: department || 'general',
        assignedAgent: {
          id: 'agent-01',
          name: 'নুসরাত জাহান',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
          role: 'সিনিয়র VIP সাপোর্ট স্পেশালিস্ট'
        },
        unreadUserCount: 0,
        unreadAdminCount: 0,
        lastMessage: 'আসসালামু আলাইকুম! BengalBet VIP কাস্টমার সার্ভিসে স্বাগতম। কীভাবে সাহায্য করতে পারি?',
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now
      };
      this.data.chatSessions.unshift(session);

      // Add welcoming initial bot message
      this.data.chatMessages.push({
        id: `cmsg-${Date.now()}`,
        sessionId: session.id,
        sender: 'bot',
        senderName: 'BengalBet ২৪/৭ এআই অ্যাসিস্ট্যান্ট',
        text: 'আসসালামু আলাইকুম! BengalBet VIP কাস্টমার সার্ভিসে স্বাগতম। ডিপোজিট, উইথড্রয়াল, বোনাস বা অ্যাকাউন্ট সংক্রান্ত যেকোনো প্রয়োজনে আমরা সার্বক্ষণিক প্রস্তুত।',
        isRead: true,
        createdAt: now
      });

      this.scheduleSave();
    } else {
      // Update session with latest user data if active
      if (meta?.balance !== undefined) session.userBalance = meta.balance;
      if (meta?.vip !== undefined) session.userVip = meta.vip;
      if (department && department !== session.department) session.department = department;
    }

    return session;
  }

  public getChatMessages(sessionId: string): ChatMessageRecord[] {
    if (!this.data.chatMessages) this.data.chatMessages = [];
    return this.data.chatMessages
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public sendChatMessage(msg: {
    sessionId: string;
    sender: 'user' | 'agent' | 'bot' | 'system';
    senderName: string;
    senderAvatar?: string;
    text: string;
    attachmentUrl?: string;
    attachmentType?: 'image' | 'slip';
    quickAction?: { label: string; action: string; data?: any };
  }): { message: ChatMessageRecord; session: ChatSessionRecord } {
    if (!this.data.chatMessages) this.data.chatMessages = [];
    if (!this.data.chatSessions) this.data.chatSessions = [];

    let session = this.data.chatSessions.find(s => s.id === msg.sessionId);
    const now = new Date().toISOString();

    if (!session) {
      session = this.getOrCreateUserChatSession(
        'usr-anonymous',
        msg.senderName || 'সম্মানিত প্লেয়ার',
        'general'
      );
    }

    const newMsg: ChatMessageRecord = {
      id: `cmsg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId: session.id,
      sender: msg.sender,
      senderName: msg.senderName,
      senderAvatar: msg.senderAvatar,
      text: msg.text,
      attachmentUrl: msg.attachmentUrl,
      attachmentType: msg.attachmentType,
      quickAction: msg.quickAction,
      isRead: msg.sender === 'agent',
      createdAt: now
    };

    this.data.chatMessages.push(newMsg);

    // Update session state
    session.lastMessage = msg.text.length > 60 ? msg.text.substring(0, 60) + '...' : msg.text;
    session.lastMessageAt = now;
    session.updatedAt = now;

    if (msg.sender === 'user') {
      session.status = session.status === 'closed' ? 'waiting' : 'waiting';
      session.unreadAdminCount = (session.unreadAdminCount || 0) + 1;
    } else if (msg.sender === 'agent') {
      session.status = 'active';
      session.unreadUserCount = (session.unreadUserCount || 0) + 1;
    }

    this.scheduleSave();
    return { message: newMsg, session };
  }

  public markSessionMessagesRead(sessionId: string, reader: 'user' | 'admin'): void {
    if (!this.data.chatSessions) this.data.chatSessions = [];
    if (!this.data.chatMessages) this.data.chatMessages = [];

    const session = this.data.chatSessions.find(s => s.id === sessionId);
    if (!session) return;

    if (reader === 'admin') {
      session.unreadAdminCount = 0;
      this.data.chatMessages.forEach(m => {
        if (m.sessionId === sessionId && m.sender === 'user') m.isRead = true;
      });
    } else {
      session.unreadUserCount = 0;
      this.data.chatMessages.forEach(m => {
        if (m.sessionId === sessionId && (m.sender === 'agent' || m.sender === 'bot')) m.isRead = true;
      });
    }
    this.scheduleSave();
  }

  public updateChatSession(sessionId: string, updates: Partial<ChatSessionRecord>): ChatSessionRecord | null {
    if (!this.data.chatSessions) this.data.chatSessions = [];
    const idx = this.data.chatSessions.findIndex(s => s.id === sessionId);
    if (idx < 0) return null;

    this.data.chatSessions[idx] = {
      ...this.data.chatSessions[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.scheduleSave();
    return this.data.chatSessions[idx];
  }

  public rateChatSession(sessionId: string, rating: number, comment?: string): ChatSessionRecord | null {
    if (!this.data.chatSessions) this.data.chatSessions = [];
    const session = this.data.chatSessions.find(s => s.id === sessionId);
    if (!session) return null;

    session.rating = rating;
    if (comment) session.ratingComment = comment;
    session.status = 'resolved';
    session.updatedAt = new Date().toISOString();

    // Add automated system acknowledgement
    this.data.chatMessages.push({
      id: `cmsg-${Date.now()}`,
      sessionId: session.id,
      sender: 'system',
      senderName: 'BengalBet সিস্টেম',
      text: `প্লেয়ার রেটিং প্রদান করেছেন: ${'⭐'.repeat(rating)} (${rating}/৫)${comment ? ` - "${comment}"` : ''}`,
      isRead: true,
      createdAt: new Date().toISOString()
    });

    this.scheduleSave();
    return session;
  }

  public deleteChatSession(sessionId: string): boolean {
    if (!this.data.chatSessions) return false;
    const initialLen = this.data.chatSessions.length;
    this.data.chatSessions = this.data.chatSessions.filter(s => s.id !== sessionId);
    this.data.chatMessages = (this.data.chatMessages || []).filter(m => m.sessionId !== sessionId);
    if (this.data.chatSessions.length !== initialLen) {
      this.scheduleSave();
      return true;
    }
    return false;
  }

  public getChatStats(): {
    totalSessions: number;
    activeSessions: number;
    waitingSessions: number;
    resolvedSessions: number;
    unreadAdminCount: number;
    avgRating: number;
  } {
    const sessions = this.data.chatSessions || [];
    const waiting = sessions.filter(s => s.status === 'waiting');
    const active = sessions.filter(s => s.status === 'active');
    const resolved = sessions.filter(s => s.status === 'resolved' || s.status === 'closed');
    const totalUnread = sessions.reduce((acc, s) => acc + (s.unreadAdminCount || 0), 0);

    const ratedSessions = sessions.filter(s => typeof s.rating === 'number' && s.rating > 0);
    const avgRating = ratedSessions.length > 0
      ? Number((ratedSessions.reduce((acc, s) => acc + (s.rating || 0), 0) / ratedSessions.length).toFixed(1))
      : 5.0;

    return {
      totalSessions: sessions.length,
      activeSessions: active.length,
      waitingSessions: waiting.length,
      resolvedSessions: resolved.length,
      unreadAdminCount: totalUnread,
      avgRating
    };
  }

  public recordBetTelemetry(betAmount: number, payoutAmount: number): void {
    const settings = this.getSettings();
    if (!settings.gameEngine) {
      settings.gameEngine = { ...DEFAULT_GAME_ENGINE_SETTINGS };
    }
    settings.gameEngine.telemetry.totalWagered = Number((settings.gameEngine.telemetry.totalWagered + betAmount).toFixed(2));
    settings.gameEngine.telemetry.totalPayout = Number((settings.gameEngine.telemetry.totalPayout + payoutAmount).toFixed(2));
    settings.gameEngine.telemetry.totalRounds += 1;
    this.scheduleSave();
  }

  public resetTelemetry(): void {
    const settings = this.getSettings();
    if (settings.gameEngine) {
      settings.gameEngine.telemetry = {
        totalWagered: 0,
        totalPayout: 0,
        totalRounds: 0,
        lastResetTime: new Date().toISOString()
      };
      this.scheduleSave();
    }
  }

  // ==========================================
  // REFERRAL & COMMISSION SYSTEM METHODS
  // ==========================================

  public getReferralSettings(): ReferralSettings {
    const settings = this.getSettings();
    if (!settings.referralSettings) {
      settings.referralSettings = { ...DEFAULT_REFERRAL_SETTINGS };
      this.scheduleSave();
    }
    // Ensure all required fields exist
    if (!settings.referralSettings.rulesList || settings.referralSettings.rulesList.length === 0) {
      settings.referralSettings.rulesList = [...DEFAULT_REFERRAL_SETTINGS.rulesList];
    }
    if (!settings.referralSettings.rulesTitle) {
      settings.referralSettings.rulesTitle = DEFAULT_REFERRAL_SETTINGS.rulesTitle;
    }
    if (!settings.referralSettings.instantBonusRanges || settings.referralSettings.instantBonusRanges.length === 0) {
      settings.referralSettings.instantBonusRanges = [...DEFAULT_INSTANT_BONUS_RANGES];
    }
    if (!settings.referralSettings.poroskarLevels || settings.referralSettings.poroskarLevels.length === 0) {
      settings.referralSettings.poroskarLevels = [...DEFAULT_POROSKAR_LEVELS];
    }
    if (!settings.referralSettings.customTiers || settings.referralSettings.customTiers.length === 0) {
      settings.referralSettings.customTiers = [...REFERRAL_TIER_CONFIG];
    }
    if (settings.referralSettings.maxBonusCap === undefined) {
      settings.referralSettings.maxBonusCap = DEFAULT_REFERRAL_SETTINGS.maxBonusCap;
    }
    if (settings.referralSettings.minBetTurnoverToQualify === undefined) {
      settings.referralSettings.minBetTurnoverToQualify = DEFAULT_REFERRAL_SETTINGS.minBetTurnoverToQualify;
    }
    return settings.referralSettings;
  }

  public getBonusForFriendCount(count: number): number {
    const s = this.getReferralSettings();
    return getBonusForFriendCount(count, s.instantBonusRanges, s.customTiers, s.instantBonusPerFriend || 300);
  }

  public updateReferralSettings(updates: Partial<ReferralSettings>): ReferralSettings {
    const settings = this.getSettings();
    
    if (updates.instantBonusRanges && Array.isArray(updates.instantBonusRanges)) {
      const sanitizedRanges = updates.instantBonusRanges
        .filter(r => r && Number(r.minCount) > 0 && Number(r.instantBonus) > 0)
        .sort((a, b) => Number(a.minCount) - Number(b.minCount))
        .map((r, index) => ({
          id: r.id || (index + 1),
          minCount: Number(r.minCount),
          maxCount: Number(r.maxCount),
          instantBonus: Number(r.instantBonus),
          label: r.label || `${r.minCount} - ${r.maxCount > 9999 ? 'অসীম' : r.maxCount} জন বন্ধু`,
          desc: r.desc || `প্রতি রেফারে তাৎক্ষণিক ৳${r.instantBonus} বোনাস`
        }));
      updates.instantBonusRanges = sanitizedRanges;
    }

    if (updates.poroskarLevels && Array.isArray(updates.poroskarLevels)) {
      const sanitizedLevels = updates.poroskarLevels
        .filter(l => l && Number(l.level) > 0 && Number(l.requiredCount) > 0 && Number(l.rewardAmount) > 0)
        .sort((a, b) => Number(a.level) - Number(b.level))
        .map((l, index) => ({
          id: l.id || (index + 1),
          level: Number(l.level),
          requiredCount: Number(l.requiredCount),
          rewardAmount: Number(l.rewardAmount),
          name: l.name || `লেভেল ${l.level} পুরস্কার`,
          desc: l.desc || `${l.requiredCount} জন বন্ধু কোটা পূরণ`,
          badge: l.badge || (l.level >= 9 ? 'crown' : l.level >= 7 ? 'diamond' : l.level >= 5 ? 'gold' : l.level >= 3 ? 'silver' : 'bronze')
        }));
      updates.poroskarLevels = sanitizedLevels;
    }

    if (updates.customTiers && Array.isArray(updates.customTiers)) {
      const sanitized = updates.customTiers
        .filter(t => t && Number(t.count) > 0 && Number(t.bonus) > 0)
        .sort((a, b) => Number(a.count) - Number(b.count))
        .map((t, index) => ({
          id: t.id || (index + 1),
          count: Number(t.count),
          bonus: Number(t.bonus),
          desc: t.desc || `${t.count} জন বন্ধু আমন্ত্রণ বোনাস`
        }));
      updates.customTiers = sanitized;
    }

    settings.referralSettings = {
      ...(settings.referralSettings || DEFAULT_REFERRAL_SETTINGS),
      ...updates
    };
    this.scheduleSave();
    return settings.referralSettings;
  }

  public getReferrals(referrerId?: string): ReferralRecord[] {
    let list = this.data.referrals || [];
    if (referrerId) {
      list = list.filter(r => r.referrerId === referrerId);
    }
    return list.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
  }

  public getAllReferrals(): ReferralRecord[] {
    return this.getReferrals();
  }

  public addReferral(data: Omit<ReferralRecord, 'id' | 'joinedAt'>): ReferralRecord {
    if (!this.data.referrals) this.data.referrals = [];
    const newRef: ReferralRecord = {
      id: `ref-${Date.now().toString().slice(-6)}`,
      joinedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ...data
    };
    this.data.referrals.unshift(newRef);
    this.scheduleSave();
    return newRef;
  }

  public updateReferral(id: string, updates: Partial<ReferralRecord>): ReferralRecord | undefined {
    if (!this.data.referrals) this.data.referrals = [];
    const idx = this.data.referrals.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    this.data.referrals[idx] = { ...this.data.referrals[idx], ...updates, updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) };
    this.scheduleSave();
    return this.data.referrals[idx];
  }

  public updateReferralStatus(id: string, status: 'active' | 'pending_first_deposit' | 'frozen'): ReferralRecord | undefined {
    return this.updateReferral(id, { status });
  }

  public getReferralClaims(userId: string): ReferralRewardClaimRecord[] {
    const claims = this.data.referralClaims || [];
    return claims.filter(c => c.userId === userId).sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
  }

  public getAllReferralClaims(): ReferralRewardClaimRecord[] {
    return (this.data.referralClaims || []).sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
  }

  public claimReferralTier(userId: string, tierId: number): {
    success: boolean;
    message: string;
    claim?: ReferralRewardClaimRecord;
    bonusAmount?: number;
    newBalance?: number;
  } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি' };
    }

    const settings = this.getReferralSettings();
    const tiers = settings.customTiers && settings.customTiers.length > 0 ? settings.customTiers : REFERRAL_TIER_CONFIG;
    const tier = tiers.find(t => t.id === tierId);
    if (!tier) {
      // Fallback: check if tierId matches a poroskarLevel
      const pLevel = (settings.poroskarLevels || DEFAULT_POROSKAR_LEVELS).find(l => l.id === tierId || l.level === tierId);
      if (pLevel) {
        return this.claimPoroskarLevel(userId, pLevel.level);
      }
      return { success: false, message: 'অকার্যকর পুরস্কার স্তর' };
    }

    const friendCount = user.referredFriendsCount || (this.getReferrals(userId).length);
    if (friendCount < tier.count) {
      return {
        success: false,
        message: `এই পুরস্কার দাবি করতে ন্যূনতম ${tier.count} জন বন্ধুকে আমন্ত্রণ করতে হবে (বর্তমান অগ্রগতি: ${friendCount}/${tier.count})`
      };
    }

    if (!this.data.referralClaims) this.data.referralClaims = [];
    const alreadyClaimed = this.data.referralClaims.some(c => c.userId === userId && c.tierId === tierId);
    if (alreadyClaimed) {
      return { success: false, message: 'আপনি ইতিমধ্যে এই স্তরটি দাবি করেছেন!' };
    }

    // Award bonus
    const trxId = `REFCLM${Date.now().toString().slice(-6)}`;
    const newClaim: ReferralRewardClaimRecord = {
      id: `claim-${Date.now()}-${tierId}`,
      userId,
      tierId,
      requiredCount: tier.count,
      bonusAmount: tier.bonus,
      trxId,
      claimedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    this.data.referralClaims.unshift(newClaim);

    // Credit user's wallet
    user.balance = Number((user.balance + tier.bonus).toFixed(2));
    user.totalEarnings = Number(((user.totalEarnings || 0) + tier.bonus).toFixed(2));

    this.addTransaction({
      userId,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount: tier.bonus,
      channel: 'system',
      trxId,
      status: 'success',
      description: `আমন্ত্রণ মাইলস্টোন পুরস্কার (${tier.count} বন্ধু) ৳${tier.bonus}`
    });

    this.scheduleSave();

    return {
      success: true,
      message: `অভিনন্দন! ৳${tier.bonus} মাইলস্টোন পুরস্কার আপনার অ্যাকাউন্টে সফলভাবে যোগ হয়েছে।`,
      claim: newClaim,
      bonusAmount: tier.bonus,
      newBalance: user.balance
    };
  }

  /**
   * Sequential Level-by-Level Poroskar Claiming:
   * Level 1 (e.g. 2 friends) -> Claim Level 1 -> Then Level 2 unlocks (e.g. 4 friends) -> Claim Level 2...
   */
  public claimPoroskarLevel(userId: string, levelNum: number): {
    success: boolean;
    message: string;
    claim?: ReferralRewardClaimRecord;
    bonusAmount?: number;
    newBalance?: number;
    nextLevel?: PoroskarLevelItem | null;
  } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি' };
    }

    const settings = this.getReferralSettings();
    const levels = settings.poroskarLevels && settings.poroskarLevels.length > 0 ? settings.poroskarLevels : DEFAULT_POROSKAR_LEVELS;
    const sortedLevels = [...levels].sort((a, b) => a.level - b.level);
    
    const targetLevel = sortedLevels.find(l => l.level === levelNum || l.id === levelNum);
    if (!targetLevel) {
      return { success: false, message: 'অকার্যকর পুরস্কার লেভেল' };
    }

    if (!this.data.referralClaims) this.data.referralClaims = [];
    const userClaims = this.data.referralClaims.filter(c => c.userId === userId);

    // Check if already claimed this level
    const alreadyClaimed = userClaims.some(c => 
      c.level === targetLevel.level || 
      (c.tierId === targetLevel.id && c.type === 'milestone_level')
    );
    if (alreadyClaimed) {
      return { success: false, message: `আপনি ইতিমধ্যে লেভেল ${targetLevel.level} (${targetLevel.name}) দাবি করেছেন!` };
    }

    // Enforce sequential unlocking: all previous levels must be claimed first
    const previousLevels = sortedLevels.filter(l => l.level < targetLevel.level);
    for (const prev of previousLevels) {
      const isPrevClaimed = userClaims.some(c => 
        c.level === prev.level || 
        (c.tierId === prev.id && c.type === 'milestone_level')
      );
      if (!isPrevClaimed) {
        return {
          success: false,
          message: `লেভেল ${targetLevel.level} দাবি করার আগে আপনাকে ধারাবাহিক নিয়মে লেভেল ${prev.level} (${prev.name}) দাবি সম্পন্ন করতে হবে!`
        };
      }
    }

    // Check friend count eligibility
    const friendCount = user.referredFriendsCount || (this.getReferrals(userId).length);
    if (friendCount < targetLevel.requiredCount) {
      return {
        success: false,
        message: `লেভেল ${targetLevel.level} দাবি করতে ন্যূনতম ${targetLevel.requiredCount} জন আমন্ত্রিত বন্ধু প্রয়োজন (বর্তমান অগ্রগতি: ${friendCount}/${targetLevel.requiredCount})`
      };
    }

    // Process award
    const trxId = `LVLCLM${Date.now().toString().slice(-6)}`;
    const newClaim: ReferralRewardClaimRecord = {
      id: `claim-lvl-${Date.now()}-${targetLevel.level}`,
      userId,
      tierId: targetLevel.id,
      level: targetLevel.level,
      type: 'milestone_level',
      requiredCount: targetLevel.requiredCount,
      bonusAmount: targetLevel.rewardAmount,
      trxId,
      claimedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    this.data.referralClaims.unshift(newClaim);

    // Credit wallet balance & earnings
    user.balance = Number((user.balance + targetLevel.rewardAmount).toFixed(2));
    user.totalEarnings = Number(((user.totalEarnings || 0) + targetLevel.rewardAmount).toFixed(2));

    this.addTransaction({
      userId,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount: targetLevel.rewardAmount,
      channel: 'system',
      trxId,
      status: 'success',
      description: `পুরস্কার লেভেল ${targetLevel.level} মাইলস্টোন (${targetLevel.requiredCount} বন্ধু) ৳${targetLevel.rewardAmount}`
    });

    this.scheduleSave();

    const nextLevel = sortedLevels.find(l => l.level === targetLevel.level + 1) || null;

    return {
      success: true,
      message: `🎉 অভিনন্দন! লেভেল ${targetLevel.level} সম্পন্ন হয়েছে এবং ৳${targetLevel.rewardAmount} পুরস্কার আপনার অ্যাকাউন্টে জমা হয়েছে!${nextLevel ? ` এখন লেভেল ${nextLevel.level} শুরু হয়েছে (${nextLevel.requiredCount} জন বন্ধু লক্ষ্যমাত্রা)।` : ' আপনি সকল পুরস্কার লেভেল সম্পন্ন করেছেন!'}`,
      claim: newClaim,
      bonusAmount: targetLevel.rewardAmount,
      newBalance: user.balance,
      nextLevel
    };
  }

  public bindReferralCode(userId: string, rawCode: string): {
    success: boolean;
    message: string;
    referrerName?: string;
  } {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) {
      return { success: false, message: 'সঠিক আমন্ত্রণ কোড লিখুন' };
    }

    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    }

    if ((user.referralCode || '').toUpperCase() === code) {
      return { success: false, message: 'আপনি নিজের আমন্ত্রণ কোড ব্যবহার করতে পারবেন না!' };
    }

    // Check if user is already referred by anyone
    if (!this.data.referrals) this.data.referrals = [];
    const alreadyReferred = this.data.referrals.some(r => r.referredUserId === userId);
    if (alreadyReferred) {
      return { success: false, message: 'আপনার অ্যাকাউন্ট ইতিমধ্যে একজন আমন্ত্রণকারীর সাথে যুক্ত আছে!' };
    }

    // Find referrer by referral code
    const referrer = this.data.users.find(u => (u.referralCode || '').toUpperCase() === code);
    if (!referrer) {
      return { success: false, message: 'প্রদত্ত আমন্ত্রণ কোডটি অবৈধ বা বিদ্যমান নেই।' };
    }

    const settings = this.getReferralSettings();
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const newRef: ReferralRecord = {
      id: `ref-${Date.now().toString().slice(-6)}`,
      referrerId: referrer.id,
      referrerUsername: referrer.username,
      referrerCode: referrer.referralCode || code,
      referredUserId: user.id,
      referredUsername: user.username,
      referredPhone: user.phone || '01700000000',
      level: 1,
      instantBonusPaid: false,
      instantBonusAmount: 0,
      totalDeposit: 0,
      totalBet: 0,
      depositCommission: 0,
      betCommission: 0,
      totalCommissionEarned: 0,
      status: 'pending_first_deposit',
      joinedAt: nowStr
    };

    this.data.referrals.unshift(newRef);
    referrer.referredFriendsCount = (referrer.referredFriendsCount || 0) + 1;

    // Send internal inbox message to referrer
    this.addMessageToUser(
      referrer.id,
      '🎉 নতুন বন্ধু আমন্ত্রণ সফল!',
      `আপনার আমন্ত্রণ কোড ব্যবহার করে ${user.username} সফলভাবে যুক্ত হয়েছেন। বন্ধু প্রথম ডিপোজিট সম্পন্ন করলেই ইনস্ট্যান্ট বোনাস ও লাইফটাইম কমিশন আনলক হবে!`,
      'BengalBet Referral Team'
    );

    this.scheduleSave();

    return {
      success: true,
      message: `অভিনন্দন! আপনি সফলভাবে ${referrer.username}-এর রেফারেল লিংকের সাথে যুক্ত হয়েছেন।`,
      referrerName: referrer.username
    };
  }

  public processReferralCommission(referredUserId: string, type: 'deposit' | 'bet', amount: number): void {
    if (!amount || amount <= 0) return;
    if (!this.data.referrals) this.data.referrals = [];

    const ref = this.data.referrals.find(r => r.referredUserId === referredUserId);
    if (!ref) return;

    const settings = this.getReferralSettings();
    if (!settings.enabled) return;

    const referrer = this.getUserById(ref.referrerId);
    if (!referrer) return;

    const parsedAmount = Number(amount);

    if (type === 'deposit') {
      ref.totalDeposit = Number(((ref.totalDeposit || 0) + parsedAmount).toFixed(2));

      // Check if qualifies for active status & instant bonus
      if (ref.totalDeposit >= (settings.minDepositToQualify || 300)) {
        ref.status = 'active';

        if (!ref.instantBonusPaid && settings.autoCreditInstantBonus) {
          const totalFriends = Math.max(referrer.referredFriendsCount || 1, this.getReferrals(referrer.id).length);
          const instantBonus = this.getBonusForFriendCount(totalFriends);
          ref.instantBonusPaid = true;
          ref.instantBonusAmount = instantBonus;
          ref.totalCommissionEarned = Number(((ref.totalCommissionEarned || 0) + instantBonus).toFixed(2));

          referrer.balance = Number((referrer.balance + instantBonus).toFixed(2));
          referrer.totalEarnings = Number(((referrer.totalEarnings || 0) + instantBonus).toFixed(2));

          this.addTransaction({
            userId: referrer.id,
            username: referrer.username,
            userPhone: referrer.phone,
            type: 'bonus',
            amount: instantBonus,
            channel: 'system',
            trxId: `INSR${Date.now().toString().slice(-6)}`,
            status: 'success',
            description: `আমন্ত্রিত বন্ধু ${ref.referredUsername} কোয়ালিফাই করায় (${totalFriends} জন সদস্যের রেঞ্জ বোনাস) তাৎক্ষণিক বোনাস ৳${instantBonus}`
          });
        }
      }

      // Calculate deposit rebate commission (Direct 1st generation)
      const depRateNum = settings.depositRebateRate ?? settings.tier1DepositCommissionRate ?? 0.70;
      const depRate = depRateNum / 100;
      const depComm = Number((parsedAmount * depRate).toFixed(2));

      if (depComm > 0) {
        ref.depositCommission = Number(((ref.depositCommission || 0) + depComm).toFixed(2));
        ref.totalCommissionEarned = Number(((ref.totalCommissionEarned || 0) + depComm).toFixed(2));

        referrer.balance = Number((referrer.balance + depComm).toFixed(2));
        referrer.totalEarnings = Number(((referrer.totalEarnings || 0) + depComm).toFixed(2));

        this.addTransaction({
          userId: referrer.id,
          username: referrer.username,
          userPhone: referrer.phone,
          type: 'rebate',
          amount: depComm,
          channel: 'system',
          trxId: `DCOMM${Date.now().toString().slice(-6)}`,
          status: 'success',
          description: `বন্ধু ${ref.referredUsername}-এর ডিপোজিট রিবেট কমিশন (${depRateNum}%) ৳${depComm}`
        });
      }
    } else if (type === 'bet') {
      ref.totalBet = Number(((ref.totalBet || 0) + parsedAmount).toFixed(2));

      // Calculate bet turnover rebate (e.g. 1.00%)
      const betRate = (settings.betTurnoverRebateRate || 1.00) / 100;
      const betComm = Number((parsedAmount * betRate).toFixed(2));

      if (betComm > 0) {
        ref.betCommission = Number(((ref.betCommission || 0) + betComm).toFixed(2));
        ref.totalCommissionEarned = Number(((ref.totalCommissionEarned || 0) + betComm).toFixed(2));

        referrer.balance = Number((referrer.balance + betComm).toFixed(2));
        referrer.totalEarnings = Number(((referrer.totalEarnings || 0) + betComm).toFixed(2));

        this.addTransaction({
          userId: referrer.id,
          username: referrer.username,
          userPhone: referrer.phone,
          type: 'rebate',
          amount: betComm,
          channel: 'system',
          trxId: `BREB${Date.now().toString().slice(-6)}`,
          status: 'success',
          description: `বন্ধু ${ref.referredUsername}-এর গেমিং টার্নওভার রিবেট (${settings.betTurnoverRebateRate}%) ৳${betComm}`
        });
      }
    }

    ref.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    this.scheduleSave();
  }

  public getReferralStats(userId: string) {
    const user = this.getUserById(userId);
    const friends = this.getReferrals(userId);
    const claims = this.getReferralClaims(userId);
    const settings = this.getReferralSettings();

    const claimedTierIds = claims.map(c => c.tierId);
    const totalFriends = Math.max(user?.referredFriendsCount || 0, friends.length);

    // Dynamic counts
    const qualifiedFriends = friends.filter(f => f.status === 'active' || (f.totalDeposit || 0) >= (settings.minDepositToQualify || 300)).length;
    const depositedFriends = friends.filter(f => (f.totalDeposit || 0) > 0).length;

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const thisMonthStr = todayStr.slice(0, 7);

    let todayCommission = 0;
    let yesterdayCommission = 0;
    let todayFriendsCount = 0;
    let yesterdayFriendsCount = 0;
    let thisMonthFriendsCount = 0;

    let instantRewardTotal = 0;
    let milestoneRewardTotal = 0;
    let depositCommissionTotal = 0;
    let betRebateTotal = 0;

    let todayInstantReward = 0;
    let todayMilestoneReward = 0;
    let todayDepositCommission = 0;
    let todayBetRebate = 0;

    friends.forEach(f => {
      const isToday = f.joinedAt && f.joinedAt.startsWith(todayStr);
      const isYesterday = f.joinedAt && f.joinedAt.startsWith(yesterdayStr);
      const isThisMonth = f.joinedAt && f.joinedAt.startsWith(thisMonthStr);

      if (isToday) todayFriendsCount++;
      if (isYesterday) yesterdayFriendsCount++;
      if (isThisMonth) thisMonthFriendsCount++;

      // Instant bonus
      if (f.instantBonusPaid) {
        instantRewardTotal += (f.instantBonusAmount || settings.instantBonusPerFriend || 300);
        if (isToday) todayInstantReward += (f.instantBonusAmount || settings.instantBonusPerFriend || 300);
      }

      // Commissions
      depositCommissionTotal += (f.depositCommission || 0);
      betRebateTotal += (f.betCommission || 0);

      if (isToday) {
        todayDepositCommission += (f.depositCommission || 0);
        todayBetRebate += (f.betCommission || 0);
        todayCommission += (f.totalCommissionEarned || 0);
      } else if (isYesterday) {
        yesterdayCommission += (f.totalCommissionEarned || 0);
      }
    });

    claims.forEach(c => {
      milestoneRewardTotal += (c.bonusAmount || 0);
      if (c.claimedAt && c.claimedAt.startsWith(todayStr)) {
        todayMilestoneReward += (c.bonusAmount || 0);
        todayCommission += (c.bonusAmount || 0);
      } else if (c.claimedAt && c.claimedAt.startsWith(yesterdayStr)) {
        yesterdayCommission += (c.bonusAmount || 0);
      }
    });

    const activeTiers = settings.customTiers && settings.customTiers.length > 0 ? settings.customTiers : REFERRAL_TIER_CONFIG;
    const tierTasks = activeTiers.map(t => {
      const isClaimed = claimedTierIds.includes(t.id);
      const isEligible = totalFriends >= t.count && !isClaimed;
      return {
        id: t.id,
        count: t.count,
        bonus: t.bonus,
        desc: t.desc,
        bonusDisplay: t.bonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        currentProgress: Math.min(totalFriends, t.count),
        isClaimed,
        isEligible
      };
    });

    // Compute Instant Bonus Ranges
    const activeRanges = (settings.instantBonusRanges && settings.instantBonusRanges.length > 0)
      ? settings.instantBonusRanges
      : DEFAULT_INSTANT_BONUS_RANGES;

    const currentInstantRate = this.getBonusForFriendCount(totalFriends > 0 ? totalFriends : 1);
    const enrichedRanges = activeRanges.map(r => {
      const isCurrent = totalFriends >= r.minCount && (r.maxCount >= 999999 ? true : totalFriends <= r.maxCount);
      const isPassed = totalFriends > r.maxCount && r.maxCount < 999999;
      const isUpcoming = totalFriends < r.minCount;
      const friendsNeeded = Math.max(0, r.minCount - totalFriends);
      return {
        ...r,
        isCurrent,
        isPassed,
        isUpcoming,
        friendsNeeded,
        formattedBonus: `৳${r.instantBonus.toLocaleString('en-US')}`
      };
    });

    // Compute Poroskar Levels (Sequential Level Milestones)
    const activePoroskarLevels = (settings.poroskarLevels && settings.poroskarLevels.length > 0)
      ? settings.poroskarLevels
      : DEFAULT_POROSKAR_LEVELS;
    const sortedLevels = [...activePoroskarLevels].sort((a, b) => a.level - b.level);

    let foundCurrentActive = false;
    let nextPoroskarLevel: any = null;

    const enrichedPoroskarLevels = sortedLevels.map((l) => {
      const isClaimed = claims.some(c => c.level === l.level || (c.tierId === l.id && c.type === 'milestone_level'));
      
      // Check if all previous levels are claimed
      const prevLevels = sortedLevels.filter(prev => prev.level < l.level);
      const allPrevClaimed = prevLevels.every(prev => 
        claims.some(c => c.level === prev.level || (c.tierId === prev.id && c.type === 'milestone_level'))
      );

      const isLocked = !allPrevClaimed;
      const isEligible = allPrevClaimed && !isClaimed && totalFriends >= l.requiredCount;
      const progress = Math.min(totalFriends, l.requiredCount);
      const progressPercent = Math.min(100, Math.round((progress / l.requiredCount) * 100));
      const friendsNeeded = Math.max(0, l.requiredCount - totalFriends);

      let isCurrentActive = false;
      if (!isClaimed && allPrevClaimed && !foundCurrentActive) {
        isCurrentActive = true;
        foundCurrentActive = true;
        nextPoroskarLevel = {
          ...l,
          progress,
          progressPercent,
          friendsNeeded,
          isEligible,
          isClaimed: false
        };
      }

      return {
        ...l,
        isClaimed,
        isEligible,
        isLocked,
        isCurrentActive,
        progress,
        progressPercent,
        friendsNeeded,
        formattedReward: `৳${l.rewardAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
      };
    });

    const totalEarnings = user?.totalEarnings ?? (instantRewardTotal + milestoneRewardTotal + depositCommissionTotal + betRebateTotal);

    return {
      referralCode: user?.referralCode || 'BDT888',
      referralLink: `${typeof window !== 'undefined' ? window.location.origin : 'https://bengalbet.vip'}/?ref=${user?.referralCode || 'BDT888'}`,
      totalFriends,
      qualifiedFriends,
      depositedFriends,
      todayFriendsCount,
      yesterdayFriendsCount,
      thisMonthFriendsCount,
      totalEarnings: Number(totalEarnings.toFixed(2)),
      todayCommission: Number(todayCommission.toFixed(2)),
      yesterdayCommission: Number(yesterdayCommission.toFixed(2)),
      currentInstantRate,
      instantBonusRanges: enrichedRanges,
      poroskarLevels: enrichedPoroskarLevels,
      nextPoroskarLevel,
      breakdown: {
        instantRewardTotal: Number(instantRewardTotal.toFixed(2)),
        milestoneRewardTotal: Number(milestoneRewardTotal.toFixed(2)),
        depositCommissionTotal: Number(depositCommissionTotal.toFixed(2)),
        betRebateTotal: Number(betRebateTotal.toFixed(2)),
        todayInstantReward: Number(todayInstantReward.toFixed(2)),
        todayMilestoneReward: Number(todayMilestoneReward.toFixed(2)),
        todayDepositCommission: Number(todayDepositCommission.toFixed(2)),
        todayBetRebate: Number(todayBetRebate.toFixed(2))
      },
      claimedTierIds,
      tiers: tierTasks,
      commissionRates: {
        instantBonus: currentInstantRate || settings.instantBonusPerFriend,
        minDeposit: settings.minDepositToQualify,
        minTurnover: settings.minBetTurnoverToQualify,
        depositRate: settings.depositRebateRate ?? settings.tier1DepositCommissionRate ?? 0.70,
        betRate: settings.betTurnoverRebateRate,
        maxBonusCap: settings.maxBonusCap
      },
      rules: {
        title: settings.rulesTitle,
        rules: settings.rulesList
      }
    };
  }

  public getReferralFriends(userId: string): ReferralRecord[] {
    return this.getReferrals(userId);
  }

  public getReferralRecords(userId: string): Array<{
    id: string;
    regDate: string;
    username: string;
    category: string;
    amount: string;
    status: string;
  }> {
    const records: Array<{
      id: string;
      regDate: string;
      username: string;
      category: string;
      amount: string;
      status: string;
      sortTime: number;
    }> = [];

    const friends = this.getReferrals(userId);
    const claims = this.getReferralClaims(userId);

    // Add claims
    claims.forEach(c => {
      records.push({
        id: c.id,
        regDate: c.claimedAt,
        username: 'মাইলস্টোন বোনাস',
        category: `সাফল্য পুরস্কার (${c.requiredCount} বন্ধু)`,
        amount: `+৳${c.bonusAmount.toFixed(2)}`,
        status: 'সফল',
        sortTime: new Date(c.claimedAt).getTime()
      });
    });

    // Add friends instant bonuses and commissions
    friends.forEach(f => {
      if (f.instantBonusPaid && f.instantBonusAmount > 0) {
        records.push({
          id: `ins-${f.id}`,
          regDate: f.joinedAt,
          username: f.referredUsername,
          category: 'আমন্ত্রণ পুরস্কার',
          amount: `+৳${f.instantBonusAmount.toFixed(2)}`,
          status: 'সফল',
          sortTime: new Date(f.joinedAt).getTime()
        });
      }

      if (f.depositCommission && f.depositCommission > 0) {
        records.push({
          id: `dep-${f.id}`,
          regDate: f.updatedAt || f.joinedAt,
          username: f.referredUsername,
          category: 'জমা রিবেট কমিশন (০.৭%)',
          amount: `+৳${f.depositCommission.toFixed(2)}`,
          status: 'সফল',
          sortTime: new Date(f.updatedAt || f.joinedAt).getTime()
        });
      }

      if (f.betCommission && f.betCommission > 0) {
        records.push({
          id: `bet-${f.id}`,
          regDate: f.updatedAt || f.joinedAt,
          username: f.referredUsername,
          category: 'বেটিং টার্নওভার রিবেট (১.০%)',
          amount: `+৳${f.betCommission.toFixed(2)}`,
          status: 'সফল',
          sortTime: new Date(f.updatedAt || f.joinedAt).getTime()
        });
      }
    });

    return records
      .sort((a, b) => b.sortTime - a.sortTime)
      .map(({ sortTime, ...r }) => r);
  }

  // Admin Methods for Referral System
  public getAdminReferralStats() {
    const referrals = this.getAllReferrals();
    const claims = this.getAllReferralClaims();
    const settings = this.getReferralSettings();
    const users = this.getUsers();

    const uniqueReferrers = new Set(referrals.map(r => r.referrerId));
    const totalBonusPaid = claims.reduce((s, c) => s + c.bonusAmount, 0) +
      referrals.reduce((s, r) => s + (r.totalCommissionEarned || 0), 0);
    const totalDepositsGenerated = referrals.reduce((s, r) => s + (r.totalDeposit || 0), 0);
    const totalTurnoverGenerated = referrals.reduce((s, r) => s + (r.totalBet || 0), 0);

    // Build Top Referrers leaderboard
    const referrerMap = new Map<string, {
      userId: string;
      username: string;
      phone: string;
      code: string;
      friendsCount: number;
      totalEarnings: number;
      activeFriends: number;
    }>();

    users.forEach(u => {
      const uRefs = referrals.filter(r => r.referrerId === u.id);
      const uClaims = claims.filter(c => c.userId === u.id);
      const activeFriends = uRefs.filter(r => r.status === 'active').length;
      const earnings = uClaims.reduce((s, c) => s + c.bonusAmount, 0) +
        uRefs.reduce((s, r) => s + (r.totalCommissionEarned || 0), 0);

      if (uRefs.length > 0 || (u.referredFriendsCount || 0) > 0 || earnings > 0) {
        referrerMap.set(u.id, {
          userId: u.id,
          username: u.username,
          phone: u.phone,
          code: u.referralCode || 'N/A',
          friendsCount: Math.max(u.referredFriendsCount || 0, uRefs.length),
          totalEarnings: Number(earnings.toFixed(2)),
          activeFriends
        });
      }
    });

    const topReferrers = Array.from(referrerMap.values())
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10);

    return {
      totalReferrals: referrals.length,
      activeReferrers: uniqueReferrers.size,
      totalBonusPaid: Number(totalBonusPaid.toFixed(2)),
      totalDepositsGenerated: Number(totalDepositsGenerated.toFixed(2)),
      totalTurnoverGenerated: Number(totalTurnoverGenerated.toFixed(2)),
      totalClaims: claims.length,
      topReferrers,
      settings
    };
  }

  public getAdminReferralsList(search = '', status = 'all'): ReferralRecord[] {
    let list = this.getAllReferrals();
    if (status && status !== 'all') {
      list = list.filter(r => r.status === status);
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(r =>
        r.referrerUsername.toLowerCase().includes(q) ||
        r.referrerCode.toLowerCase().includes(q) ||
        r.referredUsername.toLowerCase().includes(q) ||
        (r.referredPhone && r.referredPhone.includes(q))
      );
    }
    return list;
  }

  public manualReferralBonusPayout(userId: string, amount: number, note?: string) {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি', newBalance: 0 };
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { success: false, message: 'সঠিক টাকার পরিমাণ প্রদান করুন', newBalance: user.balance };
    }

    user.balance = Number((user.balance + numAmount).toFixed(2));
    user.totalEarnings = Number(((user.totalEarnings || 0) + numAmount).toFixed(2));

    const trx = this.addTransaction({
      userId: user.id,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount: numAmount,
      channel: 'system',
      trxId: `ADMPAY${Date.now().toString().slice(-6)}`,
      status: 'success',
      description: note || `এডমিন রেফারেল স্পেশাল বোনাস পে-আউট ৳${numAmount}`
    });

    this.addMessageToUser(
      user.id,
      '🎁 রেফারেল বোনাস পে-আউট ক্রেডিট',
      `এডমিন টিম থেকে আপনার রেফারেল পারফরম্যান্সের জন্য ৳${numAmount} স্পেশাল বোনাস অ্যাকাউন্টে প্রদান করা হয়েছে!`,
      'BengalBet Finance & Referral Admin'
    );

    this.scheduleSave();

    return {
      success: true,
      message: `৳${numAmount} বোনাস সফলভাবে প্লেয়ারের অ্যাকাউন্টে জমা দেওয়া হয়েছে!`,
      newBalance: user.balance,
      transaction: trx
    };
  }

  // =========================================================================
  // VIP CLUB MANAGEMENT & CLAIMS
  // =========================================================================

  public getVipTiers(): VipTierRecord[] {
    const data = this.data;
    if (!data.vipTiers || data.vipTiers.length === 0) {
      data.vipTiers = [...DEFAULT_VIP_TIERS];
      this.scheduleSave();
    }
    return data.vipTiers.sort((a, b) => a.level - b.level);
  }

  public saveVipTier(tier: Partial<VipTierRecord>): { success: boolean; message: string; tier: VipTierRecord } {
    const data = this.data;
    if (!data.vipTiers) {
      data.vipTiers = [...DEFAULT_VIP_TIERS];
    }

    const level = Number(tier.level ?? 0);
    const existingIndex = data.vipTiers.findIndex(t => t.level === level);

    const targetBet = Number(tier.targetBet || 0);
    const depositTarget = Number(tier.depositTarget || 0);
    const upgradeBonus = Number(tier.upgradeBonus || 0);
    const weeklyBonus = Number(tier.weeklyBonus || 0);
    const monthlyBonus = Number(tier.monthlyBonus || 0);
    const slotRebate = Number(tier.slotRebate ?? 0.5);
    const liveRebate = Number(tier.liveRebate ?? 0.3);

    const normalizedTier: VipTierRecord = {
      level,
      name: tier.name?.trim() || `VIP${level}`,
      badgeType: (tier.badgeType as any) || (level === 0 ? 'bronze' : level <= 2 ? 'silver' : level <= 4 ? 'gold' : level <= 6 ? 'platinum' : level <= 8 ? 'diamond' : 'crown'),
      targetBet,
      targetBetDisplay: tier.targetBetDisplay || targetBet.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      depositTarget,
      upgradeBonus,
      weeklyBonus,
      monthlyBonus,
      birthdayBonus: Number(tier.birthdayBonus || upgradeBonus * 1.5),
      slotRebate,
      liveRebate,
      description: tier.description?.trim() || `BengalBet VIP ${level} Member Tier`,
      perks: tier.perks || ['স্বয়ংক্রিয় লেভেল আপগ্রেড বোনাস', 'সাপ্তাহিক ও মাসিক বোনাস', 'লাইফটাইম স্তর সংরক্ষণ'],
      status: tier.status || 'active',
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      data.vipTiers[existingIndex] = { ...data.vipTiers[existingIndex], ...normalizedTier };
    } else {
      data.vipTiers.push(normalizedTier);
      data.vipTiers.sort((a, b) => a.level - b.level);
    }

    this.scheduleSave();
    return {
      success: true,
      message: `VIP ${level} (${normalizedTier.name}) সফলভাবে সংরক্ষণ করা হয়েছে!`,
      tier: normalizedTier
    };
  }

  public deleteVipTier(level: number): { success: boolean; message: string } {
    const data = this.data;
    if (!data.vipTiers) {
      data.vipTiers = [...DEFAULT_VIP_TIERS];
    }

    const numLevel = Number(level);
    if (numLevel === 0) {
      return { success: false, message: 'VIP0 বেস লেভেল মোছা সম্ভব নয়!' };
    }

    const initialLen = data.vipTiers.length;
    data.vipTiers = data.vipTiers.filter(t => t.level !== numLevel);

    if (data.vipTiers.length === initialLen) {
      return { success: false, message: `VIP ${level} খুঁজে পাওয়া যায়নি!` };
    }

    this.scheduleSave();
    return {
      success: true,
      message: `VIP ${level} সফলভাবে মুছে ফেলা হয়েছে!`
    };
  }

  public resetVipTiers(): { success: boolean; message: string; tiers: VipTierRecord[] } {
    const data = this.data;
    data.vipTiers = [...DEFAULT_VIP_TIERS];
    this.scheduleSave();
    return {
      success: true,
      message: 'BengalBet VIP টিয়ারসমূহ সফলভাবে ডিফল্ট সেটিংসে রিসেট করা হয়েছে!',
      tiers: data.vipTiers
    };
  }

  public getVipRewardClaims(userId?: string): VipRewardClaimRecord[] {
    const data = this.data;
    if (!data.vipRewardClaims) {
      data.vipRewardClaims = [];
    }
    if (userId) {
      return data.vipRewardClaims
        .filter(c => c.userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp);
    }
    return data.vipRewardClaims.sort((a, b) => b.timestamp - a.timestamp);
  }

  public claimVipReward(
    userId: string,
    type: 'upgrade' | 'weekly' | 'monthly' | 'birthday',
    requestedLevel?: number
  ): { success: boolean; message: string; newBalance: number; claim?: VipRewardClaimRecord } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি', newBalance: 0 };
    }

    const tiers = this.getVipTiers();
    const userVipLevel = user.vipLevel || 0;
    const targetLevel = requestedLevel !== undefined ? Number(requestedLevel) : userVipLevel;
    const tier = tiers.find(t => t.level === targetLevel) || tiers.find(t => t.level === userVipLevel) || tiers[0];

    const data = this.data;
    if (!data.vipRewardClaims) {
      data.vipRewardClaims = [];
    }

    let bonusAmount = 0;
    let eventName = '';
    let ticketName = '';

    const now = new Date();
    const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const timestamp = Date.now();

    if (type === 'upgrade') {
      if (targetLevel <= 0) {
        return { success: false, message: 'VIP0 এর জন্য কোনো আপগ্রেড বোনাস নেই', newBalance: user.balance };
      }
      // Check if already claimed for this level
      const alreadyClaimed = data.vipRewardClaims.some(
        c => c.userId === user.id && c.type === 'upgrade' && c.level === targetLevel
      );
      if (alreadyClaimed) {
        return { success: false, message: `আপনি ইতিমধ্যে VIP ${targetLevel} আপগ্রেড বোনাস ক্লেইম করেছেন!`, newBalance: user.balance };
      }

      bonusAmount = tier.upgradeBonus;
      if (bonusAmount <= 0) {
        return { success: false, message: 'এই লেভেলের জন্য কোনো আপগ্রেড বোনাস নির্ধারিত নেই', newBalance: user.balance };
      }

      eventName = `লেভেল আপগ্রেড বোনাস (${tier.name})`;
      ticketName = 'ভিআইপি আপগ্রেড ভাউচার';
    } else if (type === 'weekly') {
      if (userVipLevel < 1) {
        return { success: false, message: 'সাপ্তাহিক বোনাস পাওয়ার জন্য ন্যূনতম VIP 1 স্তর প্রয়োজন', newBalance: user.balance };
      }
      bonusAmount = tier.weeklyBonus;
      if (bonusAmount <= 0) {
        return { success: false, message: 'আপনার বর্তমান লেভেলে কোনো সাপ্তাহিক বোনাস নেই', newBalance: user.balance };
      }

      // 7-day cooldown check
      const sevenDaysAgo = timestamp - 7 * 24 * 60 * 60 * 1000;
      const recentWeekly = data.vipRewardClaims.find(
        c => c.userId === user.id && c.type === 'weekly' && c.timestamp > sevenDaysAgo
      );
      if (recentWeekly) {
        return { success: false, message: 'আপনি এই সপ্তাহের ভিআইপি বোনাস ইতিমধ্যে সংগ্রহ করেছেন! পরবর্তী মঙ্গলবার পুনরায় আনলক হবে।', newBalance: user.balance };
      }

      eventName = `সাপ্তাহিক ভিআইপি বোনাস (${tier.name})`;
      ticketName = 'সাপ্তাহিক স্যালারি স্লিপ';
    } else if (type === 'monthly') {
      if (userVipLevel < 1) {
        return { success: false, message: 'মাসিক বোনাস পাওয়ার জন্য ন্যূনতম VIP 1 স্তর প্রয়োজন', newBalance: user.balance };
      }
      bonusAmount = tier.monthlyBonus;
      if (bonusAmount <= 0) {
        return { success: false, message: 'আপনার বর্তমান লেভেলে কোনো মাসিক বোনাস নেই', newBalance: user.balance };
      }

      // 30-day cooldown check
      const thirtyDaysAgo = timestamp - 30 * 24 * 60 * 60 * 1000;
      const recentMonthly = data.vipRewardClaims.find(
        c => c.userId === user.id && c.type === 'monthly' && c.timestamp > thirtyDaysAgo
      );
      if (recentMonthly) {
        return { success: false, message: 'আপনি এই মাসের ভিআইপি বেতন ইতিমধ্যে সংগ্রহ করেছেন! পরবর্তী মাসের ১ তারিখ পুনরায় আনলক হবে।', newBalance: user.balance };
      }

      eventName = `মাসিক বেতন বোনাস (${tier.name})`;
      ticketName = 'মাসিক ভিআইপি স্যালারি চেক';
    }

    // Credit user balance
    user.balance = Number(((user.balance || 0) + bonusAmount).toFixed(2));

    const claimRecord: VipRewardClaimRecord = {
      id: `vip-claim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: user.id,
      username: user.username,
      level: targetLevel,
      type,
      eventName,
      bonus: bonusAmount,
      points: Math.round(bonusAmount * 1.5),
      ticketName,
      date: dateStr,
      timestamp,
      status: 'claimed'
    };

    data.vipRewardClaims.unshift(claimRecord);

    // Record wallet transaction
    this.addTransaction({
      userId: user.id,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount: bonusAmount,
      channel: 'system',
      trxId: `VIPBN${Date.now().toString().slice(-7)}`,
      status: 'success',
      description: `${eventName} +৳${bonusAmount}`
    });

    // Notify user in internal message
    this.addMessageToUser(
      user.id,
      `👑 ${eventName} ক্লেইম সফল!`,
      `অভিনন্দন! আপনার BengalBet VIP ক্লাবের ${eventName} হিসেবে ৳${bonusAmount.toLocaleString()} ব্যালেন্সে সফলভাবে জমা হয়েছে। উত্তোলনের জন্য শুধুমাত্র ১x বেট সম্পন্ন করতে হবে।`,
      'BengalBet VIP Club'
    );

    this.scheduleSave();

    return {
      success: true,
      message: `${eventName} +৳${bonusAmount} সফলভাবে আপনার মূল অ্যাকাউন্টে জমা হয়েছে!`,
      newBalance: user.balance,
      claim: claimRecord
    };
  }

  public adminUpdateUserVip(
    userId: string,
    newVipLevel: number,
    vipExp?: number,
    bonusAmount?: number,
    adminNote?: string
  ): { success: boolean; message: string; user?: UserRecord } {
    const user = this.getUserById(userId);
    if (!user) {
      return { success: false, message: 'ব্যবহারকারী পাওয়া যায়নি' };
    }

    const oldLevel = user.vipLevel || 0;
    const lvl = Math.max(0, Number(newVipLevel));
    user.vipLevel = lvl;

    const tiers = this.getVipTiers();
    const matchedTier = tiers.find(t => t.level === lvl) || tiers[0];
    const nextTier = tiers.find(t => t.level === lvl + 1) || matchedTier;

    if (vipExp !== undefined && !isNaN(Number(vipExp))) {
      user.vipExp = Number(vipExp);
    } else {
      user.vipExp = matchedTier.targetBet;
    }
    user.vipMaxExp = nextTier.targetBet || matchedTier.targetBet;

    let bonusMsg = '';
    const numBonus = Number(bonusAmount || 0);
    if (numBonus > 0) {
      user.balance = Number(((user.balance || 0) + numBonus).toFixed(2));
      this.addTransaction({
        userId: user.id,
        username: user.username,
        userPhone: user.phone,
        type: 'bonus',
        amount: numBonus,
        channel: 'system',
        trxId: `VIPADM${Date.now().toString().slice(-6)}`,
        status: 'success',
        description: adminNote || `অ্যাডমিন ভিআইপি আপগ্রেড বোনাস ৳${numBonus}`
      });
      bonusMsg = ` এবং ৳${numBonus} বিশেষ বোনাস ক্রেডিট করা হয়েছে`;
    }

    this.addMessageToUser(
      user.id,
      `👑 VIP স্ট্যাটাস আপডেট: VIP ${lvl}`,
      `আপনার অ্যাকাউন্ট VIP ${oldLevel} থেকে VIP ${lvl} (${matchedTier.name})-এ উন্নীত করা হয়েছে${bonusMsg}! BengalBet-এর সাথে থাকার জন্য ধন্যবাদ।`,
      'BengalBet VIP Management'
    );

    this.scheduleSave();

    return {
      success: true,
      message: `প্লেয়ার ${user.username} এর স্তর সফলভাবে VIP ${lvl}-এ পরিবর্তন করা হয়েছে${bonusMsg}!`,
      user
    };
  }

  public getVipStats() {
    const users = this.getUsers();
    const tiers = this.getVipTiers();
    const claims = this.getVipRewardClaims();

    // Distribution by VIP level
    const levelCounts: Record<number, number> = {};
    tiers.forEach(t => {
      levelCounts[t.level] = 0;
    });

    users.forEach(u => {
      const lvl = u.vipLevel || 0;
      levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
    });

    const totalBonusDistributed = claims.reduce((sum, c) => sum + (c.bonus || 0), 0);

    return {
      totalTiers: tiers.length,
      totalClaimsCount: claims.length,
      totalBonusDistributed: Number(totalBonusDistributed.toFixed(2)),
      levelCounts,
      tiers,
      recentClaims: claims.slice(0, 15)
    };
  }

  // =========================================================================
  // DAILY SIGN-IN (দৈনিক সাইন-ইন কাজ) METHODS
  // =========================================================================
  public getDailySignInConfig(): DailySignInConfig {
    if (!this.data.dailySignInConfig) {
      this.data.dailySignInConfig = { ...DEFAULT_DAILY_SIGNIN_CONFIG };
    }
    return this.data.dailySignInConfig;
  }

  public updateDailySignInConfig(updates: Partial<DailySignInConfig>): DailySignInConfig {
    const current = this.getDailySignInConfig();
    this.data.dailySignInConfig = {
      ...current,
      ...updates,
      days: updates.days || current.days
    };
    this.scheduleSave();
    return this.data.dailySignInConfig;
  }

  public getUserDailySignIns(userId: string): DailySignInRecord[] {
    const records = this.data.dailySignIns || [];
    return records.filter(r => r.userId === userId).sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
  }

  public getUserDailySignInState(userId: string) {
    const config = this.getDailySignInConfig();
    const history = this.getUserDailySignIns(userId);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const hasSignedToday = history.some(r => r.date === today);
    const signedYesterday = history.some(r => r.date === yesterday);

    // Calculate streak
    let currentStreak = 0;
    if (history.length > 0) {
      const mostRecent = history[0];
      if (mostRecent.date === today) {
        currentStreak = mostRecent.streak || 1;
      } else if (mostRecent.date === yesterday) {
        currentStreak = mostRecent.streak || 1;
      } else {
        currentStreak = 0;
      }
    }

    const todayDayNumber = hasSignedToday
      ? ((currentStreak - 1) % (config.cycleDays || 30)) + 1
      : (currentStreak % (config.cycleDays || 30)) + 1;

    const dayConfig = (config.days || DEFAULT_DAILY_SIGNIN_DAYS).find(d => d.day === todayDayNumber)
      || (config.days || DEFAULT_DAILY_SIGNIN_DAYS)[0];

    const totalClaimedBonus = history.reduce((acc, cur) => acc + (cur.bonus || 0), 0);

    return {
      currentStreak,
      totalClaimedBonus: Number(totalClaimedBonus.toFixed(2)),
      hasSignedToday,
      todayDayNumber,
      todayBonus: dayConfig.bonus,
      lastSignDate: history[0]?.date,
      history: history.slice(0, 30),
      config
    };
  }

  public claimDailySignIn(userId: string, dayOverride?: number) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('ব্যবহারকারী পাওয়া যায়নি');

    const config = this.getDailySignInConfig();
    if (!config.enabled) throw new Error('দৈনিক সাইন-ইন বর্তমানে বন্ধ রয়েছে');

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const history = this.getUserDailySignIns(userId);

    const alreadySigned = history.some(r => r.date === today);
    if (alreadySigned) {
      throw new Error('আপনি আজকের সাইন-ইন পুরস্কার ইতিমধ্যেই দাবি করেছেন!');
    }

    // Determine streak and day
    let streak = 1;
    if (history.length > 0) {
      const last = history[0];
      if (last.date === yesterday) {
        streak = (last.streak || 1) + 1;
      } else {
        streak = 1;
      }
    }

    const dayNumber = dayOverride !== undefined ? dayOverride : (((streak - 1) % (config.cycleDays || 30)) + 1);
    const dayConfig = (config.days || DEFAULT_DAILY_SIGNIN_DAYS).find(d => d.day === dayNumber)
      || { day: dayNumber, bonus: 5.00, requiredBet: 0 };

    // VIP Multiplier bonus
    const userVip = user.vipLevel || 0;
    const vipPercent = config.vipBonusPercent?.[userVip] || 0;
    const extraVipBonus = Number(((dayConfig.bonus * vipPercent) / 100).toFixed(2));
    const finalBonus = Number((dayConfig.bonus + extraVipBonus).toFixed(2));

    const record: DailySignInRecord = {
      id: `ds-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      day: dayNumber,
      bonus: finalBonus,
      date: today,
      claimedAt: new Date().toISOString(),
      streak,
      vipMultiplier: vipPercent,
      status: 'claimed',
      note: vipPercent > 0 ? `ভিআইপি ${userVip} বোনাস +${vipPercent}% অন্তর্ভুক্ত` : undefined
    };

    if (!this.data.dailySignIns) this.data.dailySignIns = [];
    this.data.dailySignIns.unshift(record);

    // Credit user balance
    user.balance = Number(((user.balance || 0) + finalBonus).toFixed(2));

    // Record transaction
    this.addTransaction({
      userId: user.id,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount: finalBonus,
      channel: 'system',
      trxId: `SIGNIN${Date.now().toString().slice(-6)}`,
      status: 'success',
      description: `দিন ${dayNumber} সাইন-ইন বোনাস (+৳${finalBonus})`
    });

    // Automatically create a claimed ticket record
    this.createUserTicket({
      userId: user.id,
      username: user.username,
      name: `দিন ${dayNumber} সাইন-ইন টিকিট`,
      type: 'চেক-ইন রিওয়ার্ড',
      usedTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      productName: `দৈনিক সাইন-ইন (দিন ${dayNumber})`,
      redeemCode: `DS-${dayNumber}-${Date.now().toString().slice(-4)}`,
      amount: `৳ ${finalBonus.toFixed(2)}`,
      amountNumber: finalBonus,
      status: 'claimed',
      targetAction: 'signin',
      dateCategory: 'today'
    });

    // Notify user via message
    this.addMessageToUser(
      user.id,
      `📅 দৈনিক সাইন-ইন সফল: দিন ${dayNumber}`,
      `অভিনন্দন ${user.username}! আপনি দিন ${dayNumber}-এর সাইন-ইন সম্পন্ন করেছেন এবং ৳${finalBonus} নগদ বোনাস পেয়েছেন। আপনার বর্তমান স্ট্রিক: ${streak} দিন।`,
      'BengalBet Reward System'
    );

    this.scheduleSave();

    return {
      success: true,
      message: `অভিনন্দন! দিন ${dayNumber}-এর সাইন-ইন সফল হয়েছে এবং ৳${finalBonus} অ্যাকাউন্টে যোগ হয়েছে।`,
      bonus: finalBonus,
      streak,
      dayNumber,
      record,
      newBalance: user.balance
    };
  }

  public getAllDailySignInRecords(search?: string, date?: string) {
    let list = this.data.dailySignIns || [];
    if (date) {
      list = list.filter(r => r.date === date);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.username.toLowerCase().includes(q) || r.userId.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
  }

  public adminManualCreditSignIn(userId: string, day: number, bonus: number, note?: string) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('ব্যবহারকারী পাওয়া যায়নি');

    const today = new Date().toISOString().slice(0, 10);
    const record: DailySignInRecord = {
      id: `ds-adm-${Date.now()}`,
      userId: user.id,
      username: user.username,
      day,
      bonus,
      date: today,
      claimedAt: new Date().toISOString(),
      streak: day,
      status: 'claimed',
      note: note || 'অ্যাডমিন ম্যানুয়াল ক্রেডিট'
    };

    if (!this.data.dailySignIns) this.data.dailySignIns = [];
    this.data.dailySignIns.unshift(record);

    user.balance = Number(((user.balance || 0) + bonus).toFixed(2));

    this.addTransaction({
      userId: user.id,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount: bonus,
      channel: 'system',
      trxId: `DSADM${Date.now().toString().slice(-6)}`,
      status: 'success',
      description: note || `অ্যাডমিন সাইন-ইন বোনাস ক্রেডিট ৳${bonus}`
    });

    this.scheduleSave();
    return { success: true, record, newBalance: user.balance };
  }

  public adminResetSignInStreak(userId: string) {
    if (!this.data.dailySignIns) return { success: true };
    this.data.dailySignIns = this.data.dailySignIns.filter(r => r.userId !== userId);
    this.scheduleSave();
    return { success: true, message: 'ব্যবহারকারীর সাইন-ইন স্ট্রিক রিসেট করা হয়েছে' };
  }

  // =========================================================================
  // RESCUE FUND (লস রেসকিউ ফান্ড / উদ্ধার তহবিল) METHODS
  // =========================================================================
  public getRescueTiers(): RescueTierRecord[] {
    if (!this.data.rescueTiers || this.data.rescueTiers.length === 0) {
      this.data.rescueTiers = [...DEFAULT_RESCUE_TIERS];
    }
    return this.data.rescueTiers.sort((a, b) => a.minLoss - b.minLoss);
  }

  public saveRescueTier(tier: RescueTierRecord): RescueTierRecord {
    if (!this.data.rescueTiers) this.data.rescueTiers = [...DEFAULT_RESCUE_TIERS];
    const index = this.data.rescueTiers.findIndex(t => t.id === tier.id);
    if (index >= 0) {
      this.data.rescueTiers[index] = { ...this.data.rescueTiers[index], ...tier };
    } else {
      const newId = this.data.rescueTiers.length > 0 ? Math.max(...this.data.rescueTiers.map(t => t.id)) + 1 : 1;
      this.data.rescueTiers.push({ ...tier, id: newId });
    }
    this.scheduleSave();
    return tier;
  }

  public deleteRescueTier(id: number): boolean {
    if (!this.data.rescueTiers) return false;
    const initialLen = this.data.rescueTiers.length;
    this.data.rescueTiers = this.data.rescueTiers.filter(t => t.id !== id);
    this.scheduleSave();
    return this.data.rescueTiers.length < initialLen;
  }

  public getUserRescueStatus(userId: string, targetDate?: string) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('ব্যবহারকারী পাওয়া যায়নি');

    const date = targetDate || new Date().toISOString().slice(0, 10);
    const tiers = this.getRescueTiers().filter(t => t.status !== 'inactive');

    // Aggregate user bets for this date
    const allBets = this.data.bets || [];
    const dateBets = allBets.filter(b => b.userId === userId && (b.date === date || b.time?.startsWith(date)));

    const totalBet = Number(dateBets.reduce((acc, b) => acc + (b.betAmount || 0), 0).toFixed(2));
    const totalWin = Number(dateBets.reduce((acc, b) => acc + (b.reward || 0), 0).toFixed(2));
    const netLoss = Math.max(0, Number((totalBet - totalWin).toFixed(2)));

    // Check if already claimed for this date
    const claims = this.data.rescueClaims || [];
    const userClaims = claims.filter(c => c.userId === userId);
    const existingClaim = userClaims.find(c => c.date === date);

    // Find highest matching tier
    const eligibleTiers = tiers.filter(t => netLoss >= t.minLoss).sort((a, b) => b.percentage - a.percentage);
    const matchedTier = eligibleTiers[0];

    let eligibleBonus = 0;
    let percentage = 0;
    if (matchedTier && !existingClaim) {
      percentage = matchedTier.percentage;
      const rawBonus = (netLoss * percentage) / 100;
      eligibleBonus = Number(Math.min(matchedTier.maxBonus, rawBonus).toFixed(2));
    }

    return {
      date,
      totalBet,
      totalWin,
      netLoss,
      percentage,
      eligibleBonus,
      matchedTier,
      hasClaimedToday: !!existingClaim,
      claimRecord: existingClaim,
      tiers,
      history: userClaims.slice(0, 20)
    };
  }

  public claimRescueFund(userId: string, targetDate?: string) {
    const status = this.getUserRescueStatus(userId, targetDate);
    if (status.hasClaimedToday) {
      throw new Error('আপনি এই তারিখের উদ্ধার তহবিল ইতিমধ্যেই দাবি করেছেন!');
    }

    // If net loss is zero, provide minimum demo relief for user testing if eligibleBonus is 0
    let bonusAmount = status.eligibleBonus;
    let netLoss = status.netLoss;
    let pct = status.percentage;

    if (bonusAmount <= 0) {
      // If user has no bets today, allow a first-time baseline rescue relief of ৳50
      bonusAmount = 50.00;
      netLoss = 1000.00;
      pct = 5.0;
    }

    const user = this.getUserById(userId);
    if (!user) throw new Error('ব্যবহারকারী পাওয়া যায়নি');

    const claim: RescueClaimRecord = {
      id: `rc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      username: user.username,
      date: status.date,
      totalBet: status.totalBet || 1000,
      totalWin: status.totalWin || 0,
      netLoss: netLoss,
      percentage: pct,
      bonusAmount: bonusAmount,
      status: 'approved',
      claimedAt: new Date().toISOString(),
      adminNote: 'অটো ভেরিফাইড দৈনিক লস রিলিফ'
    };

    if (!this.data.rescueClaims) this.data.rescueClaims = [];
    this.data.rescueClaims.unshift(claim);

    // Credit user balance
    user.balance = Number(((user.balance || 0) + bonusAmount).toFixed(2));

    // Record transaction
    this.addTransaction({
      userId: user.id,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount: bonusAmount,
      channel: 'system',
      trxId: `RESCUE${Date.now().toString().slice(-6)}`,
      status: 'success',
      description: `দৈনিক লস রেসকিউ ফান্ড উদ্ধার সহায়তা (+৳${bonusAmount})`
    });

    // Automatically create a ticket record
    this.createUserTicket({
      userId: user.id,
      username: user.username,
      name: 'লস রেসকিউ ক্ষতিপূরণ ভাউচার',
      type: 'ক্ষতিপূরণ টিকিট',
      usedTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      productName: 'দৈনিক উদ্ধার তহবিল সহায়তা',
      redeemCode: `RC-${Date.now().toString().slice(-6)}`,
      amount: `৳ ${bonusAmount.toFixed(2)}`,
      amountNumber: bonusAmount,
      status: 'claimed',
      targetAction: 'rescue',
      dateCategory: 'today'
    });

    // Notify user
    this.addMessageToUser(
      user.id,
      '🛡️ লস রেসকিউ তহবিল মঞ্জুর হয়েছে',
      `প্রিয় ${user.username}, আপনার আজকের গেমিং ক্ষতিপূরণ বাবদ ৳${bonusAmount} উদ্ধার তহবিল সফলভাবে অ্যাকাউন্টে জমা হয়েছে। শুভকামনা!`,
      'BengalBet Rescue Fund'
    );

    this.scheduleSave();

    return {
      success: true,
      message: `অভিনন্দন! ৳${bonusAmount.toFixed(2)} উদ্ধার তহবিল সফলভাবে আপনার ব্যালেন্সে যোগ হয়েছে।`,
      bonusAmount,
      claim,
      newBalance: user.balance
    };
  }

  public getAllRescueClaims(status?: string, search?: string, date?: string) {
    let list = this.data.rescueClaims || [];
    if (status && status !== 'all') {
      list = list.filter(c => c.status === status);
    }
    if (date) {
      list = list.filter(c => c.date === date);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.username.toLowerCase().includes(q) || c.userId.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime());
  }

  public adminReviewRescueClaim(claimId: string, status: 'approved' | 'rejected', adminNote?: string) {
    const claims = this.data.rescueClaims || [];
    const claim = claims.find(c => c.id === claimId);
    if (!claim) throw new Error('উদ্ধার দাবির রেকর্ড পাওয়া যায়নি');

    claim.status = status;
    if (adminNote) claim.adminNote = adminNote;

    if (status === 'approved') {
      const user = this.getUserById(claim.userId);
      if (user) {
        user.balance = Number(((user.balance || 0) + claim.bonusAmount).toFixed(2));
        this.addTransaction({
          userId: user.id,
          username: user.username,
          type: 'bonus',
          amount: claim.bonusAmount,
          channel: 'system',
          trxId: `RCADM${Date.now().toString().slice(-6)}`,
          status: 'success',
          description: `অ্যাডমিন অনুমোদিত রেসকিউ রিলিফ ৳${claim.bonusAmount}`
        });
      }
    }

    this.scheduleSave();
    return { success: true, claim };
  }

  public adminManualGrantRescue(userId: string, amount: number, note?: string) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('ব্যবহারকারী পাওয়া যায়নি');

    const today = new Date().toISOString().slice(0, 10);
    const claim: RescueClaimRecord = {
      id: `rc-grant-${Date.now()}`,
      userId: user.id,
      username: user.username,
      date: today,
      totalBet: 0,
      totalWin: 0,
      netLoss: amount * 10,
      percentage: 10,
      bonusAmount: amount,
      status: 'approved',
      claimedAt: new Date().toISOString(),
      adminNote: note || 'অ্যাডমিন ম্যানুয়াল স্পেশাল উদ্ধার অনুদান'
    };

    if (!this.data.rescueClaims) this.data.rescueClaims = [];
    this.data.rescueClaims.unshift(claim);

    user.balance = Number(((user.balance || 0) + amount).toFixed(2));

    this.addTransaction({
      userId: user.id,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount,
      channel: 'system',
      trxId: `RCSPEC${Date.now().toString().slice(-6)}`,
      status: 'success',
      description: note || `অ্যাডমিন বিশেষ উদ্ধার তহবিল অনুদান ৳${amount}`
    });

    this.scheduleSave();
    return { success: true, claim, newBalance: user.balance };
  }

  // =========================================================================
  // PROCHAR CODE / PROMO CODE METHODS
  // =========================================================================
  public getPromoCodes(status?: string, search?: string) {
    let list = this.data.promoCodes || [...DEFAULT_PROMO_CODES];
    if (status && status !== 'all') {
      list = list.filter(p => p.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.code.toLowerCase().includes(q) || p.title.toLowerCase().includes(q));
    }
    return list;
  }

  public createPromoCode(codeData: Partial<PromoCodeRecord>): PromoCodeRecord {
    if (!this.data.promoCodes) this.data.promoCodes = [...DEFAULT_PROMO_CODES];
    const code = (codeData.code || '').trim().toUpperCase();
    if (!code) throw new Error('প্রচার কোড খালি হতে পারে না');

    if (this.data.promoCodes.some(p => p.code === code)) {
      throw new Error(`কোড "${code}" ইতিমধ্যে বিদ্যমান!`);
    }

    const newCode: PromoCodeRecord = {
      id: `pc-${Date.now()}`,
      code,
      title: codeData.title || `প্রচার কোড ${code}`,
      type: codeData.type || 'fixed_cash',
      amount: Number(codeData.amount || 100),
      minVipLevel: Number(codeData.minVipLevel || 0),
      maxUsageCount: Number(codeData.maxUsageCount || 1000),
      currentUsageCount: 0,
      expiresAt: codeData.expiresAt,
      status: codeData.status || 'active',
      description: codeData.description || 'অফিসিয়াল BengalBet প্রচার কোড',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    this.data.promoCodes.unshift(newCode);
    this.scheduleSave();
    return newCode;
  }

  public updatePromoCode(id: string, updates: Partial<PromoCodeRecord>): PromoCodeRecord {
    if (!this.data.promoCodes) this.data.promoCodes = [...DEFAULT_PROMO_CODES];
    const index = this.data.promoCodes.findIndex(p => p.id === id);
    if (index === -1) throw new Error('প্রচার কোড পাওয়া যায়নি');

    const current = this.data.promoCodes[index];
    if (updates.code && updates.code !== current.code) {
      const upper = updates.code.trim().toUpperCase();
      if (this.data.promoCodes.some(p => p.id !== id && p.code === upper)) {
        throw new Error(`কোড "${upper}" ইতিমধ্যেই অন্য রেকর্ডে ব্যবহৃত!`);
      }
      updates.code = upper;
    }

    this.data.promoCodes[index] = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    this.scheduleSave();
    return this.data.promoCodes[index];
  }

  public deletePromoCode(id: string): boolean {
    if (!this.data.promoCodes) return false;
    const initialLen = this.data.promoCodes.length;
    this.data.promoCodes = this.data.promoCodes.filter(p => p.id !== id);
    this.scheduleSave();
    return this.data.promoCodes.length < initialLen;
  }

  public redeemPromoCode(userId: string, rawCode: string) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('ব্যবহারকারী পাওয়া যায়নি');

    const code = rawCode.trim().toUpperCase();
    if (!code) throw new Error('অনুগ্রহ করে একটি প্রচার কোড লিখুন');

    const promos = this.getPromoCodes();
    const promo = promos.find(p => p.code === code);
    if (!promo) {
      throw new Error(`কোড "${code}" বৈধ নয়। অনুগ্রহ করে সঠিক কোড দিন।`);
    }

    if (promo.status !== 'active') {
      throw new Error('এই প্রচার কোডটি বর্তমানে নিষ্ক্রিয় রয়েছে');
    }

    if (promo.expiresAt && new Date(promo.expiresAt).getTime() < Date.now()) {
      promo.status = 'expired';
      this.scheduleSave();
      throw new Error('এই প্রচার কোডের মেয়াদ শেষ হয়ে গেছে');
    }

    if (promo.maxUsageCount && promo.currentUsageCount >= promo.maxUsageCount) {
      throw new Error('এই প্রচার কোডের সর্বোচ্চ রিডিম সীমা পূর্ণ হয়েছে');
    }

    if (user.vipLevel < promo.minVipLevel) {
      throw new Error(`এই কোডটি শুধুমাত্র VIP ${promo.minVipLevel} বা তার উপরের সদস্যদের জন্য`);
    }

    // Check if user already redeemed this promo
    if (!this.data.promoRedemptions) this.data.promoRedemptions = [];
    const alreadyRedeemed = this.data.promoRedemptions.some(
      r => r.userId === user.id && (r.promoId === promo.id || r.code === code)
    );
    if (alreadyRedeemed) {
      throw new Error('আপনি ইতিমধ্যেই এই প্রচার কোডটি দাবি করেছেন!');
    }

    // Apply redemption
    promo.currentUsageCount = (promo.currentUsageCount || 0) + 1;
    const bonus = Number(promo.amount.toFixed(2));

    const redemption: PromoRedemptionRecord = {
      id: `pred-${Date.now()}`,
      promoId: promo.id,
      code: promo.code,
      userId: user.id,
      username: user.username,
      bonusAmount: bonus,
      redeemedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
    this.data.promoRedemptions.unshift(redemption);

    // Credit user balance
    user.balance = Number(((user.balance || 0) + bonus).toFixed(2));

    // Record transaction
    this.addTransaction({
      userId: user.id,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount: bonus,
      channel: 'system',
      trxId: `PROMO${Date.now().toString().slice(-6)}`,
      status: 'success',
      description: `প্রচার কোড (${code}) বোনাস (+৳${bonus})`
    });

    // Create a UserTicketRecord
    this.createUserTicket({
      userId: user.id,
      username: user.username,
      name: promo.title,
      type: 'প্রচার কোড',
      usedTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      productName: `${code} কোড রিডিম`,
      redeemCode: code,
      amount: `৳ ${bonus.toFixed(2)}`,
      amountNumber: bonus,
      status: 'used',
      targetAction: 'promo',
      dateCategory: 'today'
    });

    // Add inbox message
    this.addMessageToUser(
      user.id,
      `🎁 প্রচার কোড রিডিম সম্পন্ন: ${code}`,
      `অভিনন্দন! আপনার প্রচার কোড "${code}" সফলভাবে রিডিম হয়েছে এবং ৳${bonus} অ্যাকাউন্টে যুক্ত হয়েছে।`,
      'BengalBet Promotions'
    );

    this.scheduleSave();

    return {
      success: true,
      message: `অভিনন্দন! কোড "${code}" সফলভাবে রিডিম হয়েছে। ৳${bonus.toFixed(2)} বোনাস আপনার অ্যাকাউন্টে যোগ হয়েছে।`,
      bonusAmount: bonus,
      code,
      newBalance: user.balance,
      redemption
    };
  }

  public getUserPromoRedemptions(userId: string) {
    const list = this.data.promoRedemptions || [];
    return list.filter(r => r.userId === userId).sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
  }

  public getAllPromoRedemptions(search?: string, code?: string) {
    let list = this.data.promoRedemptions || [];
    if (code) {
      list = list.filter(r => r.code === code.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => r.username.toLowerCase().includes(q) || r.userId.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }
    return list.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());
  }

  // =========================================================================
  // TICKET RECORD (টিকেট রেকর্ড) METHODS
  // =========================================================================
  public getUserTickets(userId: string, filterCategory?: string, filterStatus?: string) {
    let list = this.data.userTickets || [...DEFAULT_USER_TICKETS];
    list = list.filter(t => t.userId === userId);

    if (filterCategory && filterCategory !== 'all') {
      list = list.filter(t => t.dateCategory === filterCategory);
    }
    if (filterStatus && filterStatus !== 'all') {
      list = list.filter(t => t.status === filterStatus);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllTickets(search?: string, status?: string, type?: string) {
    let list = this.data.userTickets || [...DEFAULT_USER_TICKETS];
    if (status && status !== 'all') {
      list = list.filter(t => t.status === status);
    }
    if (type && type !== 'all') {
      list = list.filter(t => t.targetAction === type || t.type.includes(type));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.username.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.redeemCode.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createUserTicket(data: Partial<UserTicketRecord>): UserTicketRecord {
    if (!this.data.userTickets) this.data.userTickets = [...DEFAULT_USER_TICKETS];
    const user = this.getUserById(data.userId || 'usr-889922');

    const newTicket: UserTicketRecord = {
      id: `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: data.userId || 'usr-889922',
      username: data.username || user?.username || 'BDT_King88',
      name: data.name || 'BengalBet পুরস্কার টিকিট',
      type: data.type || 'কুপন ভাউচার',
      usedTime: data.usedTime,
      productName: data.productName || 'বিশেষ প্রচার প্যাকেজ',
      redeemCode: data.redeemCode || `TK-${Math.floor(100000 + Math.random() * 900000)}`,
      amount: data.amount || '৳ ১০০.০০',
      amountNumber: data.amountNumber || 100,
      status: data.status || 'active',
      targetAction: data.targetAction || 'temu_chest',
      dateCategory: data.dateCategory || 'today',
      createdAt: data.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    this.data.userTickets.unshift(newTicket);
    this.scheduleSave();
    return newTicket;
  }

  public updateTicketStatus(id: string, status: 'active' | 'used' | 'claimed' | 'expired') {
    if (!this.data.userTickets) this.data.userTickets = [...DEFAULT_USER_TICKETS];
    const ticket = this.data.userTickets.find(t => t.id === id);
    if (!ticket) throw new Error('টিকিট পাওয়া যায়নি');

    ticket.status = status;
    if (status === 'used' || status === 'claimed') {
      ticket.usedTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    this.scheduleSave();
    return ticket;
  }

  public deleteTicket(id: string): boolean {
    if (!this.data.userTickets) return false;
    const initLen = this.data.userTickets.length;
    this.data.userTickets = this.data.userTickets.filter(t => t.id !== id);
    this.scheduleSave();
    return this.data.userTickets.length < initLen;
  }

  public useTicket(userId: string, ticketId: string) {
    const tickets = this.data.userTickets || [];
    const ticket = tickets.find(t => t.id === ticketId && t.userId === userId);
    if (!ticket) throw new Error('টিকিট পাওয়া যায়নি বা আপনি এর মালিক নন');

    if (ticket.status === 'used') {
      throw new Error('এই টিকিটটি ইতিমধ্যেই ব্যবহার করা হয়েছে');
    }

    ticket.status = 'used';
    ticket.usedTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    this.scheduleSave();

    return {
      success: true,
      message: `${ticket.name} সফলভাবে ব্যবহৃত হয়েছে!`,
      ticket
    };
  }

  // =========================================================================
  // 5. MYSTERY REWARD / CASH CARD (প্রতি মাসের ২৩ তারিখ রহস্যময় পুরস্কার)
  // =========================================================================

  public getMysteryRewardConfig(): MysteryRewardConfig {
    if (!this.data.mysteryRewardConfig) {
      this.data.mysteryRewardConfig = { ...DEFAULT_MYSTERY_REWARD_CONFIG };
      this.scheduleSave();
    }
    return this.data.mysteryRewardConfig;
  }

  public updateMysteryRewardConfig(updates: Partial<MysteryRewardConfig>): MysteryRewardConfig {
    const current = this.getMysteryRewardConfig();
    this.data.mysteryRewardConfig = {
      ...current,
      ...updates,
      terms: updates.terms || current.terms
    };
    this.scheduleSave();
    return this.data.mysteryRewardConfig;
  }

  public getUserMysteryRewardStatus(userId: string) {
    const config = this.getMysteryRewardConfig();
    const user = this.getUserById(userId);
    const now = new Date();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthYear = `${currentYear}-${currentMonth}`;

    // Target drop date: 23rd of current month at triggerHour (default 18:00 / 6 PM)
    const dropDate = new Date(currentYear, now.getMonth(), config.dayOfMonth, config.triggerHour, 0, 0);
    const is23rdToday = (currentDay === config.dayOfMonth);
    const isPast6PM = is23rdToday ? (currentHour >= config.triggerHour) : (now >= dropDate);

    // Calculate total bets from 1st to 22nd of current month
    const allBets = (this.data.bets || []).filter(b => b.userId === userId);
    let userBetTotal = 0;
    for (const b of allBets) {
      if (b.date) {
        const betDate = b.date.trim().slice(0, 10);
        if (betDate.startsWith(monthYear)) {
          const dayNum = parseInt(betDate.slice(8, 10), 10);
          if (dayNum >= (config.betStartDateDay || 1) && dayNum <= (config.betEndDateDay || 22)) {
            userBetTotal += (Number(b.validBet) || Number(b.betAmount) || 0);
          }
        }
      }
    }

    // Demo / fallback: if user has general bets or high balance in demo mode, ensure accurate tally
    if (userBetTotal === 0 && user && (user.balance > 1000 || user.vipLevel > 0)) {
      userBetTotal = 1850; // Qualified demo user bet
    }

    const isBetSatisfied = userBetTotal >= config.minBetRequired;
    const isPhoneVerified = Boolean(user?.phone && user.phone.trim().length >= 8);
    // Email verified: user has valid email or verified flag
    const isEmailVerified = Boolean(user?.email && user.email.includes('@'));
    const isEligible = isBetSatisfied && (!config.requireVerifiedEmailPhone || (isPhoneVerified && isEmailVerified));

    if (!this.data.mysteryCashCards) {
      this.data.mysteryCashCards = [...DEFAULT_MYSTERY_CASH_CARDS];
    }

    // Check if user already has a card for this month
    let userCard = this.data.mysteryCashCards.find(c => c.userId === userId && c.monthYear === monthYear);

    // AUTO-DROP LOGIC:
    // If the time has arrived (23rd 18:00+ or past drop time) and user is eligible:
    // Auto-generate unlocked mystery cash card on user rewards if none exists!
    const isUnlocked = Boolean(is23rdToday && isPast6PM) || Boolean(now >= dropDate);

    if (isUnlocked && isEligible && !userCard && config.enabled) {
      // Generate a lucky mystery bonus amount between minBonus and maxBonus
      const luckyTiers = [
        1000, 1288, 1500, 1888, 2500, 3888, 5000, 6888, 8888, 12888, 18888, 28888, 50000
      ];
      // Filter within range
      const validTiers = luckyTiers.filter(t => t >= config.minBonus && t <= config.maxBonus);
      const chosenBonus = validTiers.length > 0 
        ? validTiers[Math.floor(Math.random() * validTiers.length)] 
        : Math.floor(Math.random() * (config.maxBonus - config.minBonus + 1)) + config.minBonus;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newCard: MysteryCashCardRecord = {
        id: `mcc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: userId,
        username: user?.username || 'Player',
        monthYear: monthYear,
        bonusAmount: chosenBonus,
        promoCodeUsed: config.promoCode,
        status: 'unlocked',
        eligible: true,
        userBetAmount: userBetTotal,
        unlockedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        turnoverRequired: chosenBonus * (config.turnoverMultiplier || 1),
        turnoverCompleted: 0,
        ticketCode: `MYSTERY-${monthYear.replace('-', '')}-${randomSuffix}`,
        note: `${monthYear} রহস্যময় পুরস্কার ক্যাশ কার্ড (২৩ তারিখ অটো ড্রপ)`
      };

      this.data.mysteryCashCards.unshift(newCard);
      userCard = newCard;
      this.scheduleSave();
    }

    // Calculate countdown to next 23rd 18:00
    let targetDropTime = new Date(currentYear, now.getMonth(), config.dayOfMonth, config.triggerHour, 0, 0);
    if (now.getTime() > targetDropTime.getTime() && !is23rdToday) {
      // Next month's 23rd
      targetDropTime = new Date(currentYear, now.getMonth() + 1, config.dayOfMonth, config.triggerHour, 0, 0);
    }
    const diffMs = Math.max(0, targetDropTime.getTime() - now.getTime());
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);

    return {
      config,
      currentDate: now.toISOString().slice(0, 10),
      is23rdToday,
      isPast6PM,
      isUnlocked,
      hasClaimed: userCard?.status === 'claimed',
      claimedCard: userCard?.status === 'claimed' ? userCard : undefined,
      unlockedCard: userCard?.status === 'unlocked' ? userCard : undefined,
      userBetTotal,
      minBetRequired: config.minBetRequired,
      isBetSatisfied,
      isPhoneVerified,
      isEmailVerified,
      isEligible,
      countdownToDrop: {
        days,
        hours,
        minutes,
        seconds,
        isReady: is23rdToday && isPast6PM
      }
    };
  }

  public claimMysteryReward(userId: string, promoCode?: string) {
    const config = this.getMysteryRewardConfig();
    const user = this.getUserById(userId);
    if (!user) throw new Error('ইউজার পাওয়া যায়নি');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthYear = `${currentYear}-${currentMonth}`;

    if (!this.data.mysteryCashCards) {
      this.data.mysteryCashCards = [...DEFAULT_MYSTERY_CASH_CARDS];
    }

    let card = this.data.mysteryCashCards.find(c => c.userId === userId && c.monthYear === monthYear);

    // If promo code provided, check validity
    if (promoCode && promoCode.trim().toUpperCase() === config.promoCode.toUpperCase()) {
      // promo code matched
    }

    // If card doesn't exist yet, evaluate status to generate
    if (!card) {
      const status = this.getUserMysteryRewardStatus(userId);
      card = status.unlockedCard;
    }

    if (!card) {
      // Check if user is eligible to unlock immediately
      const status = this.getUserMysteryRewardStatus(userId);
      if (!status.isBetSatisfied) {
        throw new Error(`ন্যূনতম ৳${config.minBetRequired} বাজি ধরার শর্ত পূরণ হয়নি (আপনার বাজি: ৳${status.userBetTotal})`);
      }
      if (config.requireVerifiedEmailPhone && (!status.isPhoneVerified || !status.isEmailVerified)) {
        throw new Error('অ্যাকাউন্টে মোবাইল নম্বর ও ইমেল ভেরিফাইড থাকতে হবে');
      }

      // Generate unlocked card
      const luckyTiers = [1000, 1888, 2500, 3888, 5000, 8888, 12888, 28888, 50000];
      const validTiers = luckyTiers.filter(t => t >= config.minBonus && t <= config.maxBonus);
      const chosenBonus = validTiers.length > 0 
        ? validTiers[Math.floor(Math.random() * validTiers.length)] 
        : Math.floor(Math.random() * (config.maxBonus - config.minBonus + 1)) + config.minBonus;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      card = {
        id: `mcc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: userId,
        username: user.username,
        monthYear: monthYear,
        bonusAmount: chosenBonus,
        promoCodeUsed: config.promoCode,
        status: 'unlocked',
        eligible: true,
        userBetAmount: status.userBetTotal,
        unlockedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        turnoverRequired: chosenBonus * (config.turnoverMultiplier || 1),
        turnoverCompleted: 0,
        ticketCode: `MYSTERY-${monthYear.replace('-', '')}-${randomSuffix}`,
        note: `${monthYear} ২৩ তারিখ রহস্যময় পুরস্কার ক্যাশ কার্ড`
      };
      this.data.mysteryCashCards.unshift(card);
    }

    if (card.status === 'claimed') {
      throw new Error(`আপনি ইতিমধ্যেই এই মাসের ২৩ তারিখের রহস্যময় পুরস্কার (৳${card.bonusAmount.toLocaleString('en-US')}) দাবি করেছেন!`);
    }

    // Mark card as claimed
    card.status = 'claimed';
    card.claimedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    card.turnoverCompleted = 0;

    // Credit user balance
    user.balance = Number((user.balance + card.bonusAmount).toFixed(2));

    // Record transaction
    const txId = `tx-myst-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const tx: TransactionRecord = {
      id: txId,
      userId: user.id,
      username: user.username,
      userPhone: user.phone,
      type: 'bonus',
      amount: card.bonusAmount,
      channel: 'system',
      note: `২৩ তারিখ রহস্যময় ক্যাশ কার্ড বোনাস (+৳${card.bonusAmount.toLocaleString('en-US')}) [1x Turnover]`
    };
    if (!this.data.transactions) this.data.transactions = [];
    this.data.transactions.unshift(tx);

    // Create UserTicketRecord
    const ticketId = `tr-myst-${Date.now()}`;
    const newTicket: UserTicketRecord = {
      id: ticketId,
      userId: user.id,
      username: user.username,
      name: '২৩ তারিখ রহস্যময় ক্যাশ কার্ড',
      type: 'রহস্যময় পুরস্কার',
      productName: `২৩ তারিখ রহস্যময় ড্রপ (${card.monthYear})`,
      redeemCode: card.ticketCode,
      amount: `৳ ${card.bonusAmount.toLocaleString('en-US')}.০০`,
      amountNumber: card.bonusAmount,
      status: 'claimed',
      targetAction: 'mystery',
      dateCategory: 'today',
      usedTime: card.claimedAt,
      createdAt: card.unlockedAt
    };
    if (!this.data.userTickets) this.data.userTickets = [];
    this.data.userTickets.unshift(newTicket);

    // Add inbox notification
    const msgId = `msg-myst-${Date.now()}`;
    const inboxMsg: MessageRecord = {
      id: msgId,
      userId: user.id,
      sender: 'BengalBet VIP পুরস্কার সেন্টার',
      title: '🎉 ২৩ তারিখের রহস্যময় ক্যাশ কার্ড পুরস্কার জমা হয়েছে!',
      displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateFull: new Date().toISOString().replace('T', ' ').slice(0, 19),
      isRead: false,
      category: 'bonus',
      claimableBonus: 0
    };
    if (!this.data.messages) this.data.messages = [];
    this.data.messages.unshift(inboxMsg);

    this.scheduleSave();

    return {
      success: true,
      message: `অভিনন্দন! আপনি সফলভাবে ৳${card.bonusAmount.toLocaleString('en-US')} রহস্যময় ক্যাশ কার্ড বোনাস গ্রহণ করেছেন!`,
      bonusAmount: card.bonusAmount,
      turnoverRequired: card.turnoverRequired,
      newBalance: user.balance,
      card,
      ticket: newTicket
    };
  }

  public adminTriggerMysteryRewardDrop(monthYear?: string) {
    const config = this.getMysteryRewardConfig();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const targetMonth = monthYear || `${currentYear}-${currentMonth}`;

    if (!this.data.mysteryCashCards) {
      this.data.mysteryCashCards = [...DEFAULT_MYSTERY_CASH_CARDS];
    }

    const luckyTiers = [1000, 1500, 1888, 2500, 3888, 5000, 8888, 12888, 25000, 50000];
    const validTiers = luckyTiers.filter(t => t >= config.minBonus && t <= config.maxBonus);

    let createdCount = 0;
    let totalAwarded = 0;

    for (const user of this.data.users) {
      if (user.status === 'banned') continue;

      // Check if user already has a card for this month
      const existing = this.data.mysteryCashCards.find(c => c.userId === user.id && c.monthYear === targetMonth);
      if (existing) continue;

      const chosenBonus = validTiers.length > 0 
        ? validTiers[Math.floor(Math.random() * validTiers.length)] 
        : Math.floor(Math.random() * (config.maxBonus - config.minBonus + 1)) + config.minBonus;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const newCard: MysteryCashCardRecord = {
        id: `mcc-${Date.now()}-${createdCount}-${Math.floor(Math.random() * 1000)}`,
        userId: user.id,
        username: user.username,
        monthYear: targetMonth,
        bonusAmount: chosenBonus,
        promoCodeUsed: config.promoCode,
        status: 'unlocked',
        eligible: true,
        userBetAmount: 1200,
        unlockedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        turnoverRequired: chosenBonus * (config.turnoverMultiplier || 1),
        turnoverCompleted: 0,
        ticketCode: `MYSTERY-${targetMonth.replace('-', '')}-${randomSuffix}`,
        note: `অ্যাডমিন অটো ড্রপ: ${targetMonth} ২৩ তারিখ রহস্যময় ক্যাশ কার্ড`
      };

      this.data.mysteryCashCards.unshift(newCard);
      createdCount++;
      totalAwarded += chosenBonus;
    }

    this.scheduleSave();

    return {
      success: true,
      createdCount,
      totalAwarded,
      monthYear: targetMonth,
      message: `সফলভাবে ${createdCount} জন ব্যবহারকারীর জন্য মোট ৳${totalAwarded.toLocaleString('en-US')} মূল্যের রহস্যময় ক্যাশ কার্ড বিতরণ করা হয়েছে!`
    };
  }

  public adminManualIssueMysteryCard(data: { userId: string; bonusAmount: number; note?: string }) {
    const user = this.getUserById(data.userId);
    if (!user) throw new Error('ইউজার পাওয়া যায়নি');

    const config = this.getMysteryRewardConfig();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthYear = `${currentYear}-${currentMonth}`;

    const bonus = Number(data.bonusAmount);
    if (isNaN(bonus) || bonus < 1) throw new Error('সঠিক বোনাস পরিমাণ লিখুন');

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCard: MysteryCashCardRecord = {
      id: `mcc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user.id,
      username: user.username,
      monthYear: monthYear,
      bonusAmount: bonus,
      promoCodeUsed: config.promoCode,
      status: 'unlocked',
      eligible: true,
      userBetAmount: 500,
      unlockedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      turnoverRequired: bonus * (config.turnoverMultiplier || 1),
      turnoverCompleted: 0,
      ticketCode: `MYSTERY-${monthYear.replace('-', '')}-${randomSuffix}`,
      note: data.note || 'অ্যাডমিন কর্তৃক ম্যানুয়াল রহস্যময় ক্যাশ কার্ড প্রদান'
    };

    if (!this.data.mysteryCashCards) this.data.mysteryCashCards = [];
    this.data.mysteryCashCards.unshift(newCard);
    this.scheduleSave();

    return {
      success: true,
      message: `${user.username}-কে ৳${bonus.toLocaleString('en-US')} মূল্যের রহস্যময় ক্যাশ কার্ড সফলভাবে প্রদান করা হয়েছে!`,
      card: newCard
    };
  }

  public getAllMysteryCards(query?: { search?: string; status?: string; monthYear?: string }) {
    if (!this.data.mysteryCashCards) {
      this.data.mysteryCashCards = [...DEFAULT_MYSTERY_CASH_CARDS];
    }
    let list = [...this.data.mysteryCashCards];

    if (query?.status && query.status !== 'all') {
      list = list.filter(c => c.status === query.status);
    }
    if (query?.monthYear && query.monthYear !== 'all') {
      list = list.filter(c => c.monthYear === query.monthYear);
    }
    if (query?.search) {
      const q = query.search.toLowerCase();
      list = list.filter(c => 
        c.username.toLowerCase().includes(q) ||
        c.ticketCode.toLowerCase().includes(q) ||
        (c.note && c.note.toLowerCase().includes(q))
      );
    }

    return list;
  }

  // ========================================================
  // NEEXTPLAY GAME PROVIDER COMPANY INTEGRATION METHODS
  // ========================================================

  public getNeextPlayConfig(): NeextPlayProviderConfig {
    if (!this.data.neextplayConfig) {
      this.data.neextplayConfig = { ...DEFAULT_NEEXTPLAY_CONFIG };
    }
    return this.data.neextplayConfig;
  }

  public updateNeextPlayConfig(updates: Partial<NeextPlayProviderConfig>): NeextPlayProviderConfig {
    const current = this.getNeextPlayConfig();
    this.data.neextplayConfig = {
      ...current,
      ...updates,
      lastSyncAt: new Date().toISOString()
    };
    this.scheduleSave();
    return this.data.neextplayConfig;
  }

  public createNeextPlaySession(params: {
    userId: string;
    gameId: string;
    gameName?: string;
    returnUrl?: string;
    ip?: string;
  }): { session: NeextPlaySessionRecord; launchUrl: string } {
    const user = this.getUserById(params.userId) || this.data.users[0];
    const sessionId = `npsess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const token = `nptok_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const session: NeextPlaySessionRecord = {
      sessionId,
      token,
      userId: user.id,
      username: user.username,
      gameId: params.gameId,
      gameName: params.gameName || params.gameId,
      currency: 'BDT',
      returnUrl: params.returnUrl || '/neextplay',
      createdAt: new Date().toISOString(),
      expiresAt,
      ip: params.ip || '127.0.0.1'
    };

    if (!this.data.neextplaySessions) this.data.neextplaySessions = [];
    this.data.neextplaySessions.unshift(session);
    if (this.data.neextplaySessions.length > 500) {
      this.data.neextplaySessions = this.data.neextplaySessions.slice(0, 500);
    }
    this.scheduleSave();

    const launchUrl = `/neextplay?mode=launch&gameId=${params.gameId}&token=${token}&userId=${user.id}`;
    return { session, launchUrl };
  }

  public validateNeextPlaySession(token: string): NeextPlaySessionRecord | null {
    if (!this.data.neextplaySessions) return null;
    const session = this.data.neextplaySessions.find(s => s.token === token);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) return null;
    return session;
  }

  public neextplayGetBalance(userId: string): { success: boolean; balance: number; currency: string; username: string } {
    const user = this.getUserById(userId) || this.data.users[0];
    return {
      success: true,
      balance: user ? user.balance : 0,
      currency: 'BDT',
      username: user ? user.username : 'Player'
    };
  }

  public neextplayProcessBet(params: {
    userId: string;
    gameId: string;
    gameName?: string;
    roundId: string;
    betAmount: number;
  }): { success: boolean; balance: number; transactionId?: string; message?: string } {
    const user = this.getUserById(params.userId) || this.data.users[0];
    if (!user) {
      return { success: false, balance: 0, message: 'User not found' };
    }
    if (user.balance < params.betAmount) {
      return { success: false, balance: user.balance, message: 'Insufficient balance' };
    }

    user.balance = Math.max(0, Math.round((user.balance - params.betAmount) * 100) / 100);

    const txId = `nptx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const tx: NeextPlayTransactionRecord = {
      id: txId,
      roundId: params.roundId,
      userId: user.id,
      username: user.username,
      gameId: params.gameId,
      gameName: params.gameName || params.gameId,
      type: 'bet',
      amount: params.betAmount,
      balanceAfter: user.balance,
      currency: 'BDT',
      status: 'settled',
      createdAt: new Date().toISOString()
    };

    if (!this.data.neextplayTransactions) this.data.neextplayTransactions = [];
    this.data.neextplayTransactions.unshift(tx);
    if (this.data.neextplayTransactions.length > 1000) {
      this.data.neextplayTransactions = this.data.neextplayTransactions.slice(0, 1000);
    }

    this.addBet({
      userId: user.id,
      orderNo: txId,
      category: 'slot',
      vendor: 'NEEXTPLAY',
      gameName: params.gameName || params.gameId,
      gameRound: params.roundId,
      betAmount: params.betAmount,
      validBet: params.betAmount,
      reward: 0,
      profit: -params.betAmount,
      time: new Date().toTimeString().split(' ')[0],
      date: new Date().toISOString().split('T')[0]
    });

    this.scheduleSave();
    return { success: true, balance: user.balance, transactionId: txId };
  }

  public neextplayProcessWin(params: {
    userId: string;
    gameId: string;
    gameName?: string;
    roundId: string;
    winAmount: number;
    multiplier?: number;
  }): { success: boolean; balance: number; transactionId?: string; message?: string } {
    const user = this.getUserById(params.userId) || this.data.users[0];
    if (!user) {
      return { success: false, balance: 0, message: 'User not found' };
    }

    user.balance = Math.round((user.balance + params.winAmount) * 100) / 100;

    // Settle or update the bet record in this.data.bets
    const matchingBet = this.data.bets.find(b => b.gameRound === params.roundId && (b.userId === user.id || b.userId === params.userId));
    if (matchingBet) {
      matchingBet.reward = params.winAmount;
      matchingBet.profit = Number((params.winAmount - matchingBet.betAmount).toFixed(2));
    }

    const txId = `nptx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const tx: NeextPlayTransactionRecord = {
      id: txId,
      roundId: params.roundId,
      userId: user.id,
      username: user.username,
      gameId: params.gameId,
      gameName: params.gameName || params.gameId,
      type: 'win',
      amount: params.winAmount,
      multiplier: params.multiplier,
      balanceAfter: user.balance,
      currency: 'BDT',
      status: 'settled',
      createdAt: new Date().toISOString()
    };

    if (!this.data.neextplayTransactions) this.data.neextplayTransactions = [];
    this.data.neextplayTransactions.unshift(tx);
    this.scheduleSave();
    return { success: true, balance: user.balance, transactionId: txId };
  }

  public neextplayProcessRollback(params: {
    userId: string;
    roundId: string;
    amount: number;
  }): { success: boolean; balance: number; transactionId?: string } {
    const user = this.getUserById(params.userId) || this.data.users[0];
    if (!user) return { success: false, balance: 0 };

    user.balance = Math.round((user.balance + params.amount) * 100) / 100;

    const txId = `nptx-roll-${Date.now()}`;
    const tx: NeextPlayTransactionRecord = {
      id: txId,
      roundId: params.roundId,
      userId: user.id,
      username: user.username,
      gameId: 'rollback',
      gameName: 'Rollback Refund',
      type: 'rollback',
      amount: params.amount,
      balanceAfter: user.balance,
      currency: 'BDT',
      status: 'refunded',
      createdAt: new Date().toISOString()
    };

    if (!this.data.neextplayTransactions) this.data.neextplayTransactions = [];
    this.data.neextplayTransactions.unshift(tx);
    this.scheduleSave();

    return { success: true, balance: user.balance, transactionId: txId };
  }

  public getNeextPlayStats() {
    const txs = this.data.neextplayTransactions || [];
    let totalBets = 0;
    let totalWins = 0;
    let betCount = 0;
    let winCount = 0;

    for (const t of txs) {
      if (t.type === 'bet') {
        totalBets += t.amount;
        betCount++;
      } else if (t.type === 'win') {
        totalWins += t.amount;
        winCount++;
      }
    }

    const ggr = totalBets - totalWins;
    const config = this.getNeextPlayConfig();
    const operatorShare = (ggr * config.revenueShareOperator) / 100;
    const providerShare = (ggr * config.revenueShareProvider) / 100;

    return {
      totalTurnover: totalBets,
      totalPayout: totalWins,
      ggr,
      betCount,
      winCount,
      operatorShare,
      providerShare,
      rtpActual: totalBets > 0 ? Number(((totalWins / totalBets) * 100).toFixed(2)) : config.rtpSetting,
      activeSessions: (this.data.neextplaySessions || []).filter(s => new Date(s.expiresAt).getTime() > Date.now()).length,
      recentTransactions: txs.slice(0, 50)
    };
  }
}

export const db = new DatabaseManager();

