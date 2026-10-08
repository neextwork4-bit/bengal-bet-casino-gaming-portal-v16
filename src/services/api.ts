/**
 * BengalBet Client-side API Service
 * Connects frontend UI to real Express backend & JSON Database
 */

import { UserAccount } from '../types';

const getAuthToken = (): string => {
  try {
    const cached = localStorage.getItem('bengalbet_user_session') || localStorage.getItem('bdt222_user_session');
    if (cached) {
      const parsed = JSON.parse(cached);
      const token = parsed?.token || parsed?.id || parsed?.user?.id || parsed?.userId;
      if (token) return `Bearer ${token}`;
    }
  } catch {}
  return 'Bearer usr-889922';
};

const request = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': getAuthToken(),
    ...(options.headers || {})
  };

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'সার্ভার রেসপন্স ত্রুটি' }));
    throw new Error(errorData.message || errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
};

export const api = {
  auth: {
    async login(phone: string, password: string) {
      const res = await request<{ success: boolean; message: string; token: string; user: UserAccount }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password })
      });
      if (res.success && res.user) {
        const sessionUser = {
          ...res.user,
          isLoggedIn: true,
          token: res.token || res.user.id
        };
        try {
          localStorage.setItem('bengalbet_user_session', JSON.stringify(sessionUser));
          localStorage.setItem('bdt222_user_session', JSON.stringify(sessionUser));
          window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: sessionUser }));
        } catch {}
      }
      return res;
    },

    async register(phone: string, password: string, referralCode?: string) {
      const res = await request<{ success: boolean; message: string; token: string; user: UserAccount }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ phone, password, referralCode })
      });
      if (res.success && res.user) {
        const sessionUser = {
          ...res.user,
          isLoggedIn: true,
          token: res.token || res.user.id
        };
        try {
          localStorage.setItem('bengalbet_user_session', JSON.stringify(sessionUser));
          localStorage.setItem('bdt222_user_session', JSON.stringify(sessionUser));
          window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: sessionUser }));
        } catch {}
      }
      return res;
    },

    async getMe() {
      const res = await request<{ success: boolean; user: UserAccount }>('/api/auth/me');
      if (res.success && res.user) {
        try {
          const cached = localStorage.getItem('bengalbet_user_session');
          const prev = cached ? JSON.parse(cached) : {};
          const sessionUser = { ...prev, ...res.user, isLoggedIn: true };
          localStorage.setItem('bengalbet_user_session', JSON.stringify(sessionUser));
          window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: sessionUser }));
        } catch {}
      }
      return res;
    },

    async updateProfile(data: { username?: string; avatar?: string; realName?: string; birthday?: string; email?: string }) {
      const res = await request('/api/auth/update-profile', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.success && res.user) {
        try {
          const cached = localStorage.getItem('bengalbet_user_session');
          const prev = cached ? JSON.parse(cached) : {};
          const sessionUser = { ...prev, ...res.user, isLoggedIn: true };
          localStorage.setItem('bengalbet_user_session', JSON.stringify(sessionUser));
          window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: sessionUser }));
        } catch {}
      }
      return res;
    },

    async changePassword(oldPassword: string, newPassword: string) {
      return request<{ success: boolean; message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword })
      });
    },

    async changeTransactionPassword(newTransactionPassword: string, oldTransactionPassword?: string) {
      return request<{ success: boolean; message: string }>('/api/auth/change-transaction-password', {
        method: 'POST',
        body: JSON.stringify({ newTransactionPassword, oldTransactionPassword })
      });
    },

    async getGoogleAuthUrl(origin?: string) {
      const q = origin ? `?origin=${encodeURIComponent(origin)}` : '';
      return request<{ configured: boolean; url?: string; redirectUri?: string; message?: string }>(`/api/auth/google/url${q}`);
    },

    async googleDemoLogin(email?: string, name?: string, avatar?: string) {
      const res = await request<{ success: boolean; message: string; token: string; user: UserAccount }>('/api/auth/google/demo', {
        method: 'POST',
        body: JSON.stringify({ email, name, avatar })
      });
      if (res.success && res.user) {
        const sessionUser = {
          ...res.user,
          isLoggedIn: true,
          token: res.token || res.user.id
        };
        try {
          localStorage.setItem('bengalbet_user_session', JSON.stringify(sessionUser));
          localStorage.setItem('bdt222_user_session', JSON.stringify(sessionUser));
          window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: sessionUser }));
        } catch {}
      }
      return res;
    }
  },

  wallet: {
    async getBalance() {
      const res = await request<{ success: boolean; balance: number; vipLevel: number; vipExp: number }>('/api/wallet/balance');
      if (res.success && res.balance !== undefined) {
        try {
          const cached = localStorage.getItem('bengalbet_user_session');
          if (cached) {
            const prev = JSON.parse(cached);
            const updated = {
              ...prev,
              balance: res.balance,
              vipLevel: res.vipLevel ?? prev.vipLevel,
              vipExp: res.vipExp ?? prev.vipExp
            };
            localStorage.setItem('bengalbet_user_session', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: updated }));
          }
        } catch {}
      }
      return res;
    },

    async deposit(amount: number, method: string, gateway?: string, senderAccount?: string, trxId?: string) {
      const res = await request<{ success: boolean; message: string; newBalance: number; bonusAdded: number; transaction: any }>('/api/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount, method, gateway, senderAccount, trxId })
      });
      if (res.success && res.newBalance !== undefined) {
        try {
          const cached = localStorage.getItem('bengalbet_user_session');
          if (cached) {
            const prev = JSON.parse(cached);
            const updated = { ...prev, balance: res.newBalance };
            localStorage.setItem('bengalbet_user_session', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: updated }));
          }
        } catch {}
      }
      return res;
    },

    async withdraw(amount: number, walletType: string, accountNumber: string) {
      const res = await request<{ success: boolean; message: string; newBalance: number; transaction: any }>('/api/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, walletType, accountNumber })
      });
      if (res.success && res.newBalance !== undefined) {
        try {
          const cached = localStorage.getItem('bengalbet_user_session');
          if (cached) {
            const prev = JSON.parse(cached);
            const updated = { ...prev, balance: res.newBalance };
            localStorage.setItem('bengalbet_user_session', JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('bengalbet_user_updated', { detail: updated }));
          }
        } catch {}
      }
      return res;
    },

    async getTransactions(type?: string) {
      const query = type && type !== 'all' ? `?type=${type}` : '';
      return request<{ success: boolean; count: number; transactions: any[] }>(`/api/wallet/transactions${query}`);
    },

    async getCards() {
      return request<{ success: boolean; wallets: any[] }>('/api/wallet/cards');
    },

    async addCard(type: string, accountName: string, accountNumber: string) {
      return request<{ success: boolean; message: string; wallet: any }>('/api/wallet/cards', {
        method: 'POST',
        body: JSON.stringify({ type, accountName, accountNumber })
      });
    },

    async deleteCard(id: string) {
      return request<{ success: boolean; message: string }>(`/api/wallet/cards/${id}`, {
        method: 'DELETE'
      });
    }
  },

  games: {
    async recordBet(data: {
      category: string;
      vendor: string;
      gameName: string;
      betAmount: number;
      reward: number;
      gameRound?: string;
    }) {
      return request<{ success: boolean; bet: any; newBalance: number; profit: number }>('/api/games/bet', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async getRecords(category?: string, date?: string) {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (date) params.append('date', date);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{
        success: boolean;
        bets: any[];
        summary: { totalBet: number; validBet: number; totalReward: number; totalProfit: number };
      }>(`/api/games/records${query}`);
    },

    async getLobbyFeed() {
      return request<{
        success: boolean;
        jackpotAmount: number;
        winners: any[];
      }>('/api/games/lobby-feed');
    },

    async getGames(category?: string) {
      const query = category && category !== 'all' ? `?category=${category}` : '';
      return request<{
        success: boolean;
        total: number;
        games: any[];
      }>(`/api/games${query}`);
    },

    async getProfitLoss() {
      return request<{
        success: boolean;
        totalBet: number;
        validBet: number;
        payout: number;
        netProfit: number;
        byCategory: Record<string, { totalBet: number; payout: number; netProfit: number }>;
      }>('/api/games/profit-loss');
    }
  },

  promotions: {
    async getPromotions(category?: string) {
      const query = category && category !== 'all' ? `?category=${category}` : '';
      return request<{
        success: boolean;
        total: number;
        promotions: any[];
      }>(`/api/promotions${query}`);
    }
  },

  banners: {
    async getBanners(category?: string) {
      const query = category && category !== 'all' ? `?category=${category}` : '';
      return request<{
        success: boolean;
        total: number;
        banners: any[];
      }>(`/api/banners${query}`);
    }
  },

  rewards: {
    async claim(type: 'spin' | 'golden_egg' | 'red_envelope' | 'mission' | 'promo' | 'signin', amount: number, title?: string) {
      return request<{ success: boolean; message: string; newBalance: number; user: any }>('/api/rewards/claim', {
        method: 'POST',
        body: JSON.stringify({ type, amount, title })
      });
    }
  },

  messages: {
    async getMessages() {
      return request<{ success: boolean; messages: any[]; unreadCount: number }>('/api/messages');
    },

    async markRead(id: string) {
      return request<{ success: boolean }>(`/api/messages/${id}/read`, {
        method: 'POST'
      });
    },

    async delete(id: string) {
      return request<{ success: boolean }>(`/api/messages/${id}`, {
        method: 'DELETE'
      });
    },

    async claimBonus(id: string) {
      return request<{ success: boolean; amount?: number; message: string }>(`/api/messages/${id}/claim`, {
        method: 'POST'
      });
    }
  },

  feedback: {
    async submit(
      type: string,
      content: string,
      contact?: string,
      subject?: string,
      priority?: 'normal' | 'high' | 'urgent'
    ) {
      return request<{ success: boolean; message: string; feedback: any }>('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ type, content, contact, subject, priority })
      });
    },

    async getFeedbacks() {
      return request<{
        success: boolean;
        feedbacks: any[];
        pendingCount?: number;
        repliedCount?: number;
      }>('/api/feedback');
    },

    async getTicket(id: string) {
      return request<{ success: boolean; feedback: any }>(`/api/feedback/${id}`);
    },

    async addMessage(id: string, text: string, senderName?: string) {
      return request<{ success: boolean; message: string; feedback: any }>(`/api/feedback/${id}/message`, {
        method: 'POST',
        body: JSON.stringify({ text, senderName })
      });
    },

    async resolveTicket(id: string) {
      return request<{ success: boolean; message: string; feedback: any }>(`/api/feedback/${id}/resolve`, {
        method: 'PATCH'
      });
    }
  },

  chat: {
    async getSession(department?: string) {
      const q = department ? `?department=${encodeURIComponent(department)}` : '';
      return request<{ success: boolean; session: any; messages: any[] }>(`/api/chat/session${q}`);
    },

    async getMessages(sessionId: string) {
      return request<{ success: boolean; session: any; messages: any[] }>(`/api/chat/messages/${sessionId}`);
    },

    async sendMessage(data: {
      sessionId: string;
      text: string;
      attachmentUrl?: string;
      attachmentType?: string;
      quickAction?: any;
    }) {
      return request<{ success: boolean; message: any; session: any }>('/api/chat/send', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async setDepartment(sessionId: string, department: string) {
      return request<{ success: boolean; session: any; messages: any[] }>('/api/chat/department', {
        method: 'POST',
        body: JSON.stringify({ sessionId, department })
      });
    },

    async rateSession(sessionId: string, rating: number, comment?: string) {
      return request<{ success: boolean; message: string; session: any }>('/api/chat/rate', {
        method: 'POST',
        body: JSON.stringify({ sessionId, rating, comment })
      });
    },

    async closeSession(sessionId: string) {
      return request<{ success: boolean; session: any }>('/api/chat/close', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      });
    }
  },

  settings: {
    async getPublicSettings() {
      return request<{
        success: boolean;
        settings: {
          bkashNumber: string;
          nagadNumber: string;
          rocketNumber: string;
          usdtAddress: string;
          siteNotice: any;
          maintenanceMode: boolean;
          minDeposit: number;
          maxDeposit: number;
          minWithdraw: number;
          maxWithdraw: number;
          gameEngine?: any;
        };
      }>('/api/settings');
    }
  },

  admin: {
    async getStats() {
      return request<{ success: boolean; stats: any }>('/api/admin/stats');
    },

    async getUsers() {
      return request<{ success: boolean; users: any[] }>('/api/admin/users');
    },

    async createUser(userData: { username: string; phone: string; email?: string; password?: string; balance?: number; vipLevel?: number; realName?: string }) {
      return request<{ success: boolean; user: any; message: string }>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },

    async syncUsers(users: any[]) {
      return request<{ success: boolean; syncedCount: number; total: number }>('/api/admin/users/sync', {
        method: 'POST',
        body: JSON.stringify({ users })
      });
    },

    async getUserDetails(userId: string) {
      return request<{ success: boolean; details: any }>(`/api/admin/users/${userId}/details`);
    },

    async updateUserFull(userId: string, updates: any) {
      return request<{ success: boolean; user: any; message: string }>(`/api/admin/users/${userId}/update`, {
        method: 'POST',
        body: JSON.stringify(updates)
      });
    },

    async updateUserStatus(userId: string, status: 'active' | 'frozen' | 'banned') {
      return request<{ success: boolean; user: any; message: string }>(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
    },

    async sendUserMessage(userId: string, title: string, description: string, sender?: string) {
      return request<{ success: boolean; message: string; record?: any }>(`/api/admin/users/${userId}/message`, {
        method: 'POST',
        body: JSON.stringify({ title, description, sender })
      });
    },

    async updateUserBalance(userId: string, amount: number, type: 'add' | 'deduct' | 'set', note?: string) {
      return request<{ success: boolean; user: any; message: string }>(`/api/admin/users/${userId}/balance`, {
        method: 'POST',
        body: JSON.stringify({ amount, type, note })
      });
    },

    async updateUserVip(userId: string, vipLevel: number, vipExp?: number) {
      return request<{ success: boolean; user: any; message: string }>(`/api/admin/users/${userId}/vip`, {
        method: 'POST',
        body: JSON.stringify({ vipLevel, vipExp })
      });
    },

    async resetUserCooldowns(userId: string) {
      return request<{ success: boolean; user: any; message: string }>(`/api/admin/users/${userId}/reset-cooldowns`, {
        method: 'POST'
      });
    },

    async deleteUser(userId: string) {
      return request<{ success: boolean; message: string }>(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
    },

    async getTransactions(type?: string, status?: string, channel?: string, search?: string) {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', type);
      if (status && status !== 'all') params.append('status', status);
      if (channel && channel !== 'all') params.append('channel', channel);
      if (search) params.append('search', search);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; count: number; transactions: any[] }>(`/api/admin/transactions${query}`);
    },

    async createTransaction(data: {
      userId: string;
      type: string;
      amount: number;
      bonus?: number;
      fee?: number;
      channel: string;
      gateway?: string;
      accountNumber?: string;
      trxId?: string;
      status?: string;
      description?: string;
      adminNote?: string;
      adjustBalance?: boolean;
      notifyUser?: boolean;
    }) {
      return request<{ success: boolean; transaction: any; message: string }>('/api/admin/transactions/create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateTransactionStatus(
      id: string,
      status: 'success' | 'rejected' | 'pending' | 'processing' | 'flagged',
      options?: {
        adminNote?: string;
        rejectionReason?: string;
        bonusAdjust?: number;
        feeAdjust?: number;
        notifyUser?: boolean;
      }
    ) {
      return request<{ success: boolean; transaction: any; message: string }>(`/api/admin/transactions/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, ...options })
      });
    },

    async batchProcessTransactions(data: {
      ids: string[];
      status: 'success' | 'rejected' | 'processing' | 'flagged' | 'pending';
      rejectionReason?: string;
      adminNote?: string;
      notifyUsers?: boolean;
    }) {
      return request<{ success: boolean; updatedCount: number; message: string }>('/api/admin/transactions/batch', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async editTransaction(id: string, updates: any) {
      return request<{ success: boolean; transaction: any; message: string }>(`/api/admin/transactions/${id}/edit`, {
        method: 'POST',
        body: JSON.stringify(updates)
      });
    },

    async deleteTransaction(id: string) {
      return request<{ success: boolean; message: string }>(`/api/admin/transactions/${id}`, {
        method: 'DELETE'
      });
    },

    async getSettings() {
      return request<{ success: boolean; settings: any }>('/api/admin/settings');
    },

    async updateSettings(settings: any) {
      return request<{ success: boolean; settings: any; message: string }>('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
    },

    async getFeedbacks() {
      return request<{
        success: boolean;
        feedbacks: any[];
        stats?: {
          total: number;
          pending: number;
          in_progress: number;
          replied: number;
          resolved: number;
          closed: number;
        };
      }>('/api/admin/feedbacks');
    },

    async replyFeedback(id: string, reply: string, status?: string, senderName?: string) {
      return request<{ success: boolean; feedback: any; message: string }>(`/api/admin/feedbacks/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply, status, senderName })
      });
    },

    async updateFeedbackStatus(id: string, status: string) {
      return request<{ success: boolean; feedback: any; message: string }>(`/api/admin/feedbacks/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    },

    async deleteFeedback(id: string) {
      return request<{ success: boolean; message: string }>(`/api/admin/feedbacks/${id}`, {
        method: 'DELETE'
      });
    },

    async getMessages() {
      return request<{ success: boolean; messages: any[] }>('/api/admin/messages');
    },

    async createBroadcastMessage(data: {
      userId?: string;
      title: string;
      headline?: string;
      sender?: string;
      category?: string;
      claimableBonus?: number;
      description?: string;
      steps?: string[];
      rules?: string[];
    }) {
      return request<{ success: boolean; message: string; messageRecord: any }>('/api/admin/messages/create', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async deleteMessage(id: string) {
      return request<{ success: boolean; message?: string }>(`/api/admin/messages/${id}`, {
        method: 'DELETE'
      });
    },

    chat: {
      async getSessions() {
        return request<{
          success: boolean;
          sessions: any[];
          stats: {
            totalSessions: number;
            activeSessions: number;
            waitingSessions: number;
            resolvedSessions: number;
            unreadAdminCount: number;
            avgRating: number;
          };
        }>('/api/admin/chat/sessions');
      },

      async getSession(sessionId: string) {
        return request<{
          success: boolean;
          session: any;
          messages: any[];
          userDetails: any;
        }>(`/api/admin/chat/sessions/${sessionId}`);
      },

      async replySession(sessionId: string, text: string, senderName?: string, attachmentUrl?: string, quickAction?: any) {
        return request<{
          success: boolean;
          message: string;
          chatMessage: any;
          session: any;
        }>(`/api/admin/chat/sessions/${sessionId}/reply`, {
          method: 'POST',
          body: JSON.stringify({ text, senderName, attachmentUrl, quickAction })
        });
      },

      async updateSessionStatus(sessionId: string, status: 'active' | 'waiting' | 'resolved' | 'closed') {
        return request<{
          success: boolean;
          session: any;
          message: string;
        }>(`/api/admin/chat/sessions/${sessionId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
      },

      async assignAgent(sessionId: string, name: string, role?: string, avatar?: string) {
        return request<{ success: boolean; session: any }>(`/api/admin/chat/sessions/${sessionId}/assign`, {
          method: 'POST',
          body: JSON.stringify({ name, role, avatar })
        });
      },

      async saveNote(sessionId: string, note: string) {
        return request<{ success: boolean; session: any; message: string }>(`/api/admin/chat/sessions/${sessionId}/note`, {
          method: 'POST',
          body: JSON.stringify({ note })
        });
      },

      async quickCredit(sessionId: string, amount: number, note?: string, type: 'bonus' | 'credit' = 'credit') {
        return request<{ success: boolean; message: string; newBalance: number }>(`/api/admin/chat/sessions/${sessionId}/credit`, {
          method: 'POST',
          body: JSON.stringify({ amount, note, type })
        });
      },

      async deleteSession(sessionId: string) {
        return request<{ success: boolean; message: string }>(`/api/admin/chat/sessions/${sessionId}`, {
          method: 'DELETE'
        });
      }
    },

    referrals: {
      async getStats() {
        return request<{
          success: boolean;
          stats: {
            totalReferrals: number;
            totalBonusPaid: number;
            activeReferrers: number;
            totalDepositsGenerated: number;
            totalTurnoverGenerated: number;
            instantBonusPerFriend: number;
            depositCommissionRate: number;
            betRebateRate: number;
          };
          topReferrers: Array<{
            userId: string;
            username: string;
            phone: string;
            code: string;
            friendsCount: number;
            totalEarnings: number;
          }>;
        }>('/api/admin/referrals/stats');
      },

      async getList(search = '', status = 'all') {
        const query = new URLSearchParams({ search, status }).toString();
        return request<{
          success: boolean;
          referrals: any[];
          total: number;
        }>(`/api/admin/referrals/list?${query}`);
      },

      async getSettings() {
        return request<{
          success: boolean;
          settings: {
            enabled: boolean;
            instantBonusPerFriend: number;
            minDepositToQualify: number;
            minBetTurnoverToQualify?: number;
            depositRebateRate?: number;
            betTurnoverRebateRate: number;
            maxBonusCap?: number;
            autoCreditInstantBonus: boolean;
            customTiers?: Array<{ id: number; count: number; bonus: number; desc?: string }>;
            tier1DepositCommissionRate?: number;
            tier2DepositCommissionRate?: number;
            tier3DepositCommissionRate?: number;
          };
        }>('/api/admin/referrals/settings');
      },

      async updateSettings(settings: any) {
        return request<{
          success: boolean;
          message: string;
          settings: any;
        }>('/api/admin/referrals/settings', {
          method: 'POST',
          body: JSON.stringify(settings)
        });
      },

      async manualBonusPayout(userId: string, amount: number, note?: string) {
        return request<{
          success: boolean;
          message: string;
          newBalance: number;
          transaction: any;
        }>('/api/admin/referrals/bonus-payout', {
          method: 'POST',
          body: JSON.stringify({ userId, amount, note })
        });
      },

      async updateStatus(id: string, status: 'active' | 'pending_first_deposit' | 'frozen') {
        return request<{
          success: boolean;
          message: string;
          referral: any;
        }>('/api/admin/referrals/status', {
          method: 'POST',
          body: JSON.stringify({ id, status })
        });
      },

      async getClaims() {
        return request<{
          success: boolean;
          claims: Array<{
            id: string;
            userId: string;
            username: string;
            phone: string;
            referralCode: string;
            tierId: number;
            requiredCount: number;
            bonusAmount: number;
            trxId: string;
            claimedAt: string;
          }>;
          total: number;
        }>('/api/admin/referrals/claims');
      }
    }
  },

  referral: {
    async getStats() {
      return request<{
        success: boolean;
        referralCode: string;
        referralLink: string;
        totalFriends: number;
        qualifiedFriends: number;
        depositedFriends: number;
        todayFriendsCount: number;
        yesterdayFriendsCount: number;
        thisMonthFriendsCount: number;
        totalEarnings: number;
        todayCommission: number;
        yesterdayCommission: number;
        breakdown: {
          instantRewardTotal: number;
          milestoneRewardTotal: number;
          depositCommissionTotal: number;
          betRebateTotal: number;
          todayInstantReward: number;
          todayMilestoneReward: number;
          todayDepositCommission: number;
          todayBetRebate: number;
        };
        claimedTierIds: number[];
        currentInstantRate?: number;
        instantBonusRanges?: Array<{
          id: number;
          minCount: number;
          maxCount: number;
          instantBonus: number;
          label?: string;
          desc?: string;
          isCurrent?: boolean;
          isPassed?: boolean;
          isUpcoming?: boolean;
          friendsNeeded?: number;
          formattedBonus?: string;
        }>;
        poroskarLevels?: Array<{
          id: number;
          level: number;
          requiredCount: number;
          rewardAmount: number;
          name: string;
          desc?: string;
          badge?: string;
          isClaimed: boolean;
          isEligible: boolean;
          isLocked: boolean;
          isCurrentActive: boolean;
          progress: number;
          progressPercent: number;
          friendsNeeded: number;
          formattedReward: string;
        }>;
        nextPoroskarLevel?: {
          id: number;
          level: number;
          requiredCount: number;
          rewardAmount: number;
          name: string;
          desc?: string;
          progress: number;
          progressPercent: number;
          friendsNeeded: number;
          isEligible: boolean;
          isClaimed: boolean;
        } | null;
        tiers: Array<{
          id: number;
          count: number;
          bonus: number;
          desc?: string;
          bonusDisplay: string;
          currentProgress: number;
          isClaimed: boolean;
          isEligible: boolean;
        }>;
        commissionRates: {
          instantBonus: number;
          minDeposit: number;
          minTurnover: number;
          depositRate: number;
          betRate: number;
          maxBonusCap: number;
        };
        rules?: {
          title: string;
          rules: string[];
        };
      }>('/api/referral/stats');
    },

    async getSettings() {
      return request<{
        success: boolean;
        settings: any;
      }>('/api/referral/settings');
    },

    async getFriends() {
      return request<{
        success: boolean;
        friends: Array<{
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
        }>;
        total: number;
      }>('/api/referral/friends');
    },

    async getRecords() {
      return request<{
        success: boolean;
        records: Array<{
          id: string;
          regDate: string;
          username: string;
          category: string;
          amount: string;
          status: string;
        }>;
        total: number;
      }>('/api/referral/records');
    },

    async claimTier(tierId: number) {
      return request<{
        success: boolean;
        message: string;
        bonusAmount?: number;
        newBalance?: number;
        claim?: any;
      }>('/api/referral/claim-tier', {
        method: 'POST',
        body: JSON.stringify({ tierId })
      });
    },

    async claimPoroskarLevel(level: number) {
      return request<{
        success: boolean;
        message: string;
        bonusAmount?: number;
        newBalance?: number;
        claim?: any;
        nextLevel?: any;
      }>('/api/referral/claim-poroskar-level', {
        method: 'POST',
        body: JSON.stringify({ level })
      });
    },

    async bindCode(code: string) {
      return request<{
        success: boolean;
        message: string;
      }>('/api/referral/bind-code', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
    }
  },

  vip: {
    async getTiers() {
      try {
        const res = await request<{ success: boolean; count: number; tiers: any[] }>('/api/vip/tiers');
        if (res.success && res.tiers) {
          localStorage.setItem('bengalbet_vip_tiers_cache', JSON.stringify(res.tiers));
          return res;
        }
      } catch (err) {
        console.warn('VIP tiers fetch fallback to local cache:', err);
      }
      const cached = localStorage.getItem('bengalbet_vip_tiers_cache');
      if (cached) {
        try {
          return { success: true, count: JSON.parse(cached).length, tiers: JSON.parse(cached) };
        } catch {}
      }
      return { success: true, count: 0, tiers: [] };
    },

    async saveTier(tier: any) {
      return request<{ success: boolean; message: string; tier: any }>('/api/vip/tiers', {
        method: 'POST',
        body: JSON.stringify(tier)
      });
    },

    async deleteTier(level: number) {
      return request<{ success: boolean; message: string }>(`/api/vip/tiers/${level}`, {
        method: 'DELETE'
      });
    },

    async resetTiers() {
      return request<{ success: boolean; message: string; tiers: any[] }>('/api/vip/tiers/reset', {
        method: 'POST'
      });
    },

    async getHistory() {
      try {
        return await request<{ success: boolean; count: number; history: any[] }>('/api/vip/history');
      } catch (err) {
        console.warn('VIP history fetch fallback to empty:', err);
        return { success: true, count: 0, history: [] };
      }
    },

    async claim(type: 'upgrade' | 'weekly' | 'monthly' | 'birthday', level?: number) {
      return request<{
        success: boolean;
        message: string;
        newBalance: number;
        claim?: any;
      }>('/api/vip/claim', {
        method: 'POST',
        body: JSON.stringify({ type, level })
      });
    },

    async getAdminStats() {
      return request<{
        success: boolean;
        stats: {
          totalTiers: number;
          totalClaimsCount: number;
          totalBonusDistributed: number;
          levelCounts: Record<number, number>;
          tiers: any[];
          recentClaims: any[];
        };
      }>('/api/admin/vip/stats');
    },

    async getAdminClaims() {
      return request<{
        success: boolean;
        count: number;
        claims: any[];
      }>('/api/admin/vip/claims');
    },

    async overrideUser(userId: string, vipLevel: number, vipExp?: number, bonusAmount?: number, note?: string) {
      return request<{
        success: boolean;
        message: string;
        user?: any;
      }>('/api/admin/vip/override-user', {
        method: 'POST',
        body: JSON.stringify({ userId, vipLevel, vipExp, bonusAmount, note })
      });
    }
  },

  // -------------------------------------------------------------------------
  // DAILY SIGN-IN (দৈনিক সাইন-ইন কাজ)
  // -------------------------------------------------------------------------
  dailySignIn: {
    async getStatus() {
      return request<{
        success: boolean;
        currentStreak: number;
        totalClaimedBonus: number;
        hasSignedToday: boolean;
        todayDayNumber: number;
        todayBonus: number;
        lastSignDate?: string;
        history: any[];
        config: any;
      }>('/api/daily-signin/status');
    },

    async claim() {
      return request<{
        success: boolean;
        message: string;
        bonus: number;
        streak: number;
        dayNumber: number;
        record: any;
        newBalance: number;
      }>('/api/daily-signin/claim', {
        method: 'POST'
      });
    },

    async getAdminConfig() {
      return request<{ success: boolean; config: any }>('/api/admin/daily-signin/config');
    },

    async updateAdminConfig(config: any) {
      return request<{ success: boolean; message: string; config: any }>('/api/admin/daily-signin/config', {
        method: 'POST',
        body: JSON.stringify(config)
      });
    },

    async getAdminRecords(search?: string, date?: string) {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (date) params.append('date', date);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; records: any[]; total: number }>(`/api/admin/daily-signin/records${query}`);
    },

    async adminManualCredit(userId: string, day: number, bonus: number, note?: string) {
      return request<{ success: boolean; record: any; newBalance: number }>('/api/admin/daily-signin/manual-credit', {
        method: 'POST',
        body: JSON.stringify({ userId, day, bonus, note })
      });
    },

    async adminResetStreak(userId: string) {
      return request<{ success: boolean; message: string }>('/api/admin/daily-signin/reset-streak', {
        method: 'POST',
        body: JSON.stringify({ userId })
      });
    }
  },

  // -------------------------------------------------------------------------
  // RESCUE FUND (লস রেসকিউ ফান্ড / উদ্ধার তহবিল)
  // -------------------------------------------------------------------------
  rescue: {
    async getStatus(date?: string) {
      const query = date ? `?date=${encodeURIComponent(date)}` : '';
      return request<{
        success: boolean;
        date: string;
        totalBet: number;
        totalWin: number;
        netLoss: number;
        percentage: number;
        eligibleBonus: number;
        matchedTier?: any;
        hasClaimedToday: boolean;
        claimRecord?: any;
        tiers: any[];
        history: any[];
      }>(`/api/rescue/status${query}`);
    },

    async claim(date?: string) {
      return request<{
        success: boolean;
        message: string;
        bonusAmount: number;
        claim: any;
        newBalance: number;
      }>('/api/rescue/claim', {
        method: 'POST',
        body: JSON.stringify({ date })
      });
    },

    async getTiers() {
      return request<{ success: boolean; tiers: any[] }>('/api/admin/rescue/tiers');
    },

    async saveTier(tier: any) {
      return request<{ success: boolean; message: string; tier: any }>('/api/admin/rescue/tiers', {
        method: 'POST',
        body: JSON.stringify(tier)
      });
    },

    async deleteTier(id: number) {
      return request<{ success: boolean; message: string }>(`/api/admin/rescue/tiers/${id}`, {
        method: 'DELETE'
      });
    },

    async getClaims(status?: string, search?: string, date?: string) {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('search', search);
      if (date) params.append('date', date);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; claims: any[]; total: number }>(`/api/admin/rescue/claims${query}`);
    },

    async reviewClaim(claimId: string, status: 'approved' | 'rejected', adminNote?: string) {
      return request<{ success: boolean; claim: any }>('/api/admin/rescue/review', {
        method: 'POST',
        body: JSON.stringify({ claimId, status, adminNote })
      });
    },

    async manualGrant(userId: string, amount: number, note?: string) {
      return request<{ success: boolean; claim: any; newBalance: number }>('/api/admin/rescue/manual-grant', {
        method: 'POST',
        body: JSON.stringify({ userId, amount, note })
      });
    }
  },

  // -------------------------------------------------------------------------
  // PROCHAR CODE / PROMO CODE (প্রচার কোড)
  // -------------------------------------------------------------------------
  promos: {
    async getActivePromos() {
      return request<{ success: boolean; promos: any[] }>('/api/promos');
    },

    async redeem(code: string) {
      return request<{
        success: boolean;
        message: string;
        bonusAmount: number;
        code: string;
        newBalance: number;
        redemption?: any;
      }>('/api/promos/redeem', {
        method: 'POST',
        body: JSON.stringify({ code })
      });
    },

    async getMyRedemptions() {
      return request<{ success: boolean; redemptions: any[] }>('/api/promos/my-redemptions');
    },

    async getAdminPromos(status?: string, search?: string) {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('search', search);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; promos: any[]; total: number }>(`/api/admin/promos${query}`);
    },

    async createPromo(data: any) {
      return request<{ success: boolean; message: string; promo: any }>('/api/admin/promos', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updatePromo(id: string, updates: any) {
      return request<{ success: boolean; message: string; promo: any }>(`/api/admin/promos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },

    async deletePromo(id: string) {
      return request<{ success: boolean; message: string }>(`/api/admin/promos/${id}`, {
        method: 'DELETE'
      });
    },

    async getAdminRedemptions(search?: string, code?: string) {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (code) params.append('code', code);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; redemptions: any[]; total: number }>(`/api/admin/promos/redemptions${query}`);
    }
  },

  // -------------------------------------------------------------------------
  // TICKET RECORD (টিকেট রেকর্ড)
  // -------------------------------------------------------------------------
  tickets: {
    async getMyTickets(category?: string, status?: string) {
      const params = new URLSearchParams();
      if (category && category !== 'all') params.append('category', category);
      if (status && status !== 'all') params.append('status', status);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; tickets: any[]; total: number }>(`/api/tickets${query}`);
    },

    async useTicket(ticketId: string) {
      return request<{ success: boolean; message: string; ticket: any }>('/api/tickets/use', {
        method: 'POST',
        body: JSON.stringify({ ticketId })
      });
    },

    async getAdminTickets(search?: string, status?: string, type?: string) {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (type && type !== 'all') params.append('type', type);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; tickets: any[]; total: number }>(`/api/admin/tickets${query}`);
    },

    async createTicket(data: any) {
      return request<{ success: boolean; message: string; ticket: any }>('/api/admin/tickets', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async updateTicketStatus(id: string, status: string) {
      return request<{ success: boolean; message: string; ticket: any }>(`/api/admin/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
    },

    async deleteTicket(id: string) {
      return request<{ success: boolean; message: string }>(`/api/admin/tickets/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // -------------------------------------------------------------------------
  // 5. MYSTERY REWARD (প্রতি মাসের ২৩ তারিখ রহস্যময় পুরস্কার)
  // -------------------------------------------------------------------------
  mysteryReward: {
    async getStatus() {
      return request<{
        success: boolean;
        config: any;
        currentDate: string;
        is23rdToday: boolean;
        isPast6PM: boolean;
        isUnlocked: boolean;
        hasClaimed: boolean;
        claimedCard?: any;
        unlockedCard?: any;
        userBetTotal: number;
        minBetRequired: number;
        isBetSatisfied: boolean;
        isPhoneVerified: boolean;
        isEmailVerified: boolean;
        isEligible: boolean;
        countdownToDrop: {
          days: number;
          hours: number;
          minutes: number;
          seconds: number;
          isReady: boolean;
        };
      }>('/api/mystery-reward/status');
    },

    async claim(promoCode?: string) {
      return request<{
        success: boolean;
        message: string;
        bonusAmount: number;
        turnoverRequired: number;
        newBalance: number;
        card: any;
        ticket: any;
      }>('/api/mystery-reward/claim', {
        method: 'POST',
        body: JSON.stringify({ promoCode })
      });
    },

    async getAdminConfig() {
      return request<{ success: boolean; config: any }>('/api/admin/mystery-reward/config');
    },

    async updateAdminConfig(data: any) {
      return request<{ success: boolean; message: string; config: any }>('/api/admin/mystery-reward/config', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async getAdminCards(search?: string, status?: string, monthYear?: string) {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      if (monthYear && monthYear !== 'all') params.append('monthYear', monthYear);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request<{ success: boolean; cards: any[]; total: number }>(`/api/admin/mystery-reward/cards${query}`);
    },

    async triggerAdminDrop(monthYear?: string) {
      return request<{ success: boolean; message: string; createdCount: number; totalAwarded: number; monthYear: string }>(
        '/api/admin/mystery-reward/trigger-drop',
        {
          method: 'POST',
          body: JSON.stringify({ monthYear })
        }
      );
    },

    async manualIssueCard(data: { userId: string; bonusAmount: number; note?: string }) {
      return request<{ success: boolean; message: string; card: any }>('/api/admin/mystery-reward/manual-issue', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },

  phpDb: {
    async getStatus() {
      return request<{
        success: boolean;
        connected: boolean;
        baseUrl: string;
        processUrl: string;
        message: string;
        bengalbet?: any;
        neextplay?: any;
        instructions?: any;
        lastError?: string;
      }>('/api/php-db/status');
    },

    async getConfig() {
      return request<{
        success: boolean;
        baseUrl: string;
        processUrl: string;
        bengalbetApiUrl: string;
        neextplayApiUrl: string;
        databases: { bengalbet: string; neextplay: string };
      }>('/api/php-db/config');
    },

    async updateConfig(baseUrl: string) {
      return request<{ success: boolean; message: string; baseUrl: string }>('/api/php-db/config', {
        method: 'POST',
        body: JSON.stringify({ baseUrl })
      });
    },

    async runProcess() {
      return request<{
        success: boolean;
        message: string;
        execution_time_ms?: number;
        timestamp?: string;
        databases?: {
          bengalbet: any;
          neextplay: any;
        };
        error?: string;
        guide?: string;
      }>('/api/php-db/process', {
        method: 'POST'
      });
    },

    async callBengalbet(action: string, data: any = {}) {
      return request<any>('/api/php-db/bengalbet', {
        method: 'POST',
        body: JSON.stringify({ action, ...data })
      });
    },

    async callNeextplay(action: string, data: any = {}) {
      return request<any>('/api/php-db/neextplay', {
        method: 'POST',
        body: JSON.stringify({ action, ...data })
      });
    }
  },

  dbMaster: {
    async listFiles() {
      return request<{
        success: boolean;
        total: number;
        baseDir: string;
        files: Array<{
          path: string;
          name: string;
          category: 'bengalbet' | 'neextplay' | 'common' | 'root';
          size: number;
          lineCount: number;
          modifiedAt: string;
          extension: string;
        }>;
      }>('/api/db-master/files');
    },

    async getFile(path: string) {
      return request<{
        success: boolean;
        path: string;
        name: string;
        size: number;
        lines: number;
        modifiedAt: string;
        content: string;
      }>(`/api/db-master/file?path=${encodeURIComponent(path)}`);
    },

    async saveFile(path: string, content: string) {
      return request<{
        success: boolean;
        message: string;
        path: string;
        size: number;
        modifiedAt: string;
        remoteSynced: boolean;
        remoteMsg: string;
      }>('/api/db-master/file', {
        method: 'POST',
        body: JSON.stringify({ path, content })
      });
    },

    async deleteFile(path: string) {
      return request<{
        success: boolean;
        message: string;
      }>('/api/db-master/file', {
        method: 'DELETE',
        body: JSON.stringify({ path })
      });
    }
  },

  mysqlDb: {
    async getTables(database: 'bengalbet' | 'neextplay') {
      return request<{
        success: boolean;
        database: string;
        engine: string;
        collation: string;
        tables: Array<{
          name: string;
          label: string;
          pk: string;
          count: number;
        }>;
      }>(`/api/mysql-db/${database}/tables`);
    },

    async getTableRows(database: 'bengalbet' | 'neextplay', table: string, params: { page?: number; limit?: number; search?: string } = {}) {
      const q = new URLSearchParams();
      if (params.page) q.set('page', String(params.page));
      if (params.limit) q.set('limit', String(params.limit));
      if (params.search) q.set('search', params.search);
      const queryStr = q.toString() ? `?${q.toString()}` : '';

      return request<{
        success: boolean;
        database: string;
        table: string;
        pk: string;
        columns: Array<{ name: string; type: string; isPrimary: boolean }>;
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        rows: any[];
      }>(`/api/mysql-db/${database}/tables/${table}${queryStr}`);
    },

    async insertRow(database: 'bengalbet' | 'neextplay', table: string, record: any) {
      return request<{
        success: boolean;
        message: string;
        record: any;
      }>(`/api/mysql-db/${database}/tables/${table}/rows`, {
        method: 'POST',
        body: JSON.stringify(record)
      });
    },

    async updateRow(database: 'bengalbet' | 'neextplay', table: string, id: string | number, updates: any) {
      return request<{
        success: boolean;
        message: string;
        record: any;
      }>(`/api/mysql-db/${database}/tables/${table}/rows/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },

    async deleteRow(database: 'bengalbet' | 'neextplay', table: string, id: string | number) {
      return request<{
        success: boolean;
        message: string;
      }>(`/api/mysql-db/${database}/tables/${table}/rows/${id}`, {
        method: 'DELETE'
      });
    },

    async runQuery(database: 'bengalbet' | 'neextplay', sql: string) {
      return request<{
        success: boolean;
        database: string;
        query: string;
        executionTimeMs: number;
        totalRows?: number;
        columns?: string[];
        rows?: any[];
        affectedRows?: number;
        message?: string;
        error?: string;
      }>(`/api/mysql-db/${database}/query`, {
        method: 'POST',
        body: JSON.stringify({ sql })
      });
    }
  }
};
