import { create } from 'zustand';

export interface UserProfile {
  id: string;
  firebase_uid: string;
  name: string;
  nickname: string | null;
  email: string;
  role: 'MEMBER' | 'COUNCIL';
  assigned_hq: string | null;
  is_wallet_created: boolean;
  is_onboarded?: boolean;
}

export interface WalletRecord {
  id: string;
  wallet_address: string;
  wallet_type: 'DFNS' | 'METAMASK' | 'HASHPACK';
  dfns_wallet_id: string | null;
  network: string;
  is_custodial: boolean;
  is_multisig: boolean;
  is_council_wallet: boolean;
  is_primary: boolean;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  wallets: WalletRecord[];
  isAuthenticated: boolean;
  isHydrated: boolean;

  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
  setWallets: (wallets: WalletRecord[]) => void;
  hydrate: () => Promise<void>;
}

const API_BASE = 'http://localhost:3001/api/v1';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('auth_token'),
  user: null,
  wallets: [],
  isAuthenticated: false,
  isHydrated: false,

  login: (token, user) => {
    localStorage.setItem('auth_token', token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ token: null, user: null, wallets: [], isAuthenticated: false });
  },

  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),

  setWallets: (wallets) => set({ wallets }),

  /**
   * Hydrate user + wallets from backend on app load if token exists.
   * This ensures identity + wallet persist across sessions.
   */
  hydrate: async () => {
    const token = get().token;
    if (!token) {
      set({ isHydrated: true });
      return;
    }

    try {
      // Parallel fetch user + wallets
      const [userRes, walletRes] = await Promise.all([
        fetch(`${API_BASE}/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/wallet/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!userRes.ok) {
        // Token expired or invalid
        localStorage.removeItem('auth_token');
        set({ token: null, user: null, wallets: [], isAuthenticated: false, isHydrated: true });
        return;
      }

      const userData = await userRes.json();
      const walletData = walletRes.ok ? await walletRes.json() : { wallets: [] };

      set({
        user: userData.user,
        wallets: walletData.wallets || [],
        isAuthenticated: true,
        isHydrated: true
      });
    } catch {
      set({ isHydrated: true });
    }
  }
}));
