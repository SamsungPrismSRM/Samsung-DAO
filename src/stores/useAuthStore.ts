import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getFirebaseToken } from '@/lib/getFirebaseToken';

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
  /** Get a fresh token – always use this instead of reading `token` directly */
  freshToken: () => Promise<string | null>;
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
   * Always returns a fresh Firebase token (auto-refreshed if expired).
   * Falls back to the cached localStorage token if Firebase has no user.
   */
  freshToken: async () => {
    const fresh = await getFirebaseToken();
    if (fresh) {
      // Persist the refreshed token so other parts of the app stay in sync
      localStorage.setItem('auth_token', fresh);
      set({ token: fresh });
      return fresh;
    }
    return get().token;
  },

  /**
   * Hydrate user + wallets from backend on app load if token exists.
   * Uses a FRESH token to avoid expired-token errors.
   */
  hydrate: async () => {
    // First try getting a fresh token from Firebase
    let token = await getFirebaseToken();

    // Fallback to localStorage if Firebase user isn't ready yet
    if (!token) {
      token = localStorage.getItem('auth_token');
    }

    if (!token) {
      set({ isHydrated: true });
      return;
    }

    try {
      const [userRes, walletRes] = await Promise.all([
        fetch(`${API_BASE}/user/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/wallet/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (!userRes.ok) {
        // Token invalid — clear everything
        localStorage.removeItem('auth_token');
        set({ token: null, user: null, wallets: [], isAuthenticated: false, isHydrated: true });
        return;
      }

      // Persist the fresh token
      localStorage.setItem('auth_token', token);

      const userData = await userRes.json();
      const walletData = walletRes.ok ? await walletRes.json() : { wallets: [] };

      set({
        token,
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

/* ── Firebase Auth State Listener ──────────────────────────────────
 * Automatically refreshes the token in the store whenever Firebase
 * detects a sign-in / token-refresh, and clears state on sign-out.
 */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const freshToken = await user.getIdToken();
    localStorage.setItem('auth_token', freshToken);
    useAuthStore.setState({ token: freshToken });
  }
  // Don't auto-clear on sign-out: let the store's logout() handle that
  // to avoid interfering with the member login flow.
});
