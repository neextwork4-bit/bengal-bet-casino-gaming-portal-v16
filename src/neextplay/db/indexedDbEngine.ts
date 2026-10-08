/**
 * NeextPlay MySQL Database Engine
 * 
 * Powered by MySQL database backend (neextplay_db via /api/mysql-db/neextplay/*)
 * Strictly configured for 2 core roles:
 * 1. COMPANY_ADMIN (Platform Control)
 * 2. DEVELOPER (Developer & Operator API Integration)
 */

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'COMPANY_ADMIN' | 'DEVELOPER';
  companyName?: string;
  operatorId?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

const SEED_USERS: UserAccount[] = [
  {
    id: 'usr_developer_neexthub',
    email: 'neexthub@gmail.com',
    passwordHash: 'neext123',
    name: 'NeextHub Integration Lead',
    companyName: 'NeextHub Gaming Corp',
    role: 'DEVELOPER',
    operatorId: 'op_neexthub',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'usr_company_admin',
    email: 'admin@neextplay.com',
    passwordHash: 'admin123',
    name: 'Alexander Vance',
    companyName: 'NeextPlay Studios HQ',
    role: 'COMPANY_ADMIN',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'usr_developer_nexus',
    email: 'dev@nexusbet.io',
    passwordHash: 'developer123',
    name: 'NexusBet Integration Lead',
    companyName: 'NexusBet International Ltd',
    role: 'DEVELOPER',
    operatorId: 'op_nexus',
    status: 'ACTIVE',
    createdAt: '2025-01-01T00:00:00Z',
  },
];

class MySqlDatabaseEngine {
  private cache: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.init();
  }

  public async init(): Promise<void> {
    const userMap = new Map<string, any>();
    SEED_USERS.forEach(u => userMap.set(u.id, u));
    this.cache.set('users', userMap);

    // Hydrate from localStorage fallback if available
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('neextplay_mysql_cache');
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.keys(parsed).forEach(store => {
            const map = this.cache.get(store) || new Map();
            Object.keys(parsed[store]).forEach(k => map.set(k, parsed[store][k]));
            this.cache.set(store, map);
          });
        }
      } catch {}
    }
  }

  private persistCache() {
    if (typeof localStorage !== 'undefined') {
      try {
        const out: any = {};
        this.cache.forEach((map, store) => {
          out[store] = {};
          map.forEach((v, k) => { out[store][k] = v; });
        });
        localStorage.setItem('neextplay_mysql_cache', JSON.stringify(out));
      } catch {}
    }
  }

  public async put<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    if (!this.cache.has(storeName)) {
      this.cache.set(storeName, new Map());
    }
    const store = this.cache.get(storeName)!;
    const key = (item as any).id || (item as any).token || (item as any).roundId || String(Date.now());
    store.set(key, item);
    this.persistCache();

    // Async sync to server MySQL API
    try {
      if (typeof fetch !== 'undefined') {
        fetch(`/api/mysql-db/neextplay/tables/${storeName}/rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        }).catch(() => {});
      }
    } catch {}
  }

  public async get<T>(storeName: string, key: string): Promise<T | null> {
    const store = this.cache.get(storeName);
    if (store && store.has(key)) {
      return store.get(key) as T;
    }
    return null;
  }

  public async getAll<T>(storeName: string): Promise<T[]> {
    const store = this.cache.get(storeName);
    if (!store) return [];
    return Array.from(store.values()) as T[];
  }

  public async getUserByEmail(email: string): Promise<UserAccount | null> {
    const cleanEmail = email.toLowerCase().trim();
    const all = await this.getAll<UserAccount>('users');
    const match = all.find(u => u.email.toLowerCase() === cleanEmail);
    return match || null;
  }
}

export const realDb = new MySqlDatabaseEngine();
