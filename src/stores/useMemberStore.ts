import { create } from 'zustand';
import type { MemberDto } from '@/services/memberService';
import { memberMe } from '@/services/memberService';
import { getFirebaseToken } from '@/lib/getFirebaseToken';

const STORAGE_KEY = 'member_token';

interface MemberState {
  token: string | null;
  member: MemberDto | null;
  isHydrated: boolean;

  login: (token: string, member: MemberDto) => void;
  setMember: (member: MemberDto | null) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

function clearFirebaseAuthSession() {
  import('@/lib/firebase').then(({ auth }) => auth.signOut()).catch(() => {});
}

export const useMemberStore = create<MemberState>((set, get) => ({
  token: typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
  member: null,
  isHydrated: false,

  login: (token, member) => {
    localStorage.setItem(STORAGE_KEY, token);
    set({ token, member });
  },

  setMember: (member) => set({ member }),

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, member: null, isHydrated: true });
  },

  hydrate: async () => {
    // Try getting a fresh Firebase token first
    let token = await getFirebaseToken();
    if (!token) {
      token = localStorage.getItem(STORAGE_KEY);
    }
    if (!token) {
      set({ token: null, member: null, isHydrated: true });
      return;
    }
    try {
      const { member } = await memberMe(token);
      localStorage.setItem(STORAGE_KEY, token);
      set({ token, member, isHydrated: true });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      set({ token: null, member: null, isHydrated: true });
    }
  },
}));

/** End Firebase-only session so member session is the only active identity. */
export function clearFirebaseSessionForMember() {
  localStorage.removeItem('auth_token');
  import('@/stores/useAuthStore').then(({ useAuthStore }) => {
    useAuthStore.getState().logout();
  });
  clearFirebaseAuthSession();
}
