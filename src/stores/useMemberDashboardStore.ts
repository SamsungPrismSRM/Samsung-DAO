import { create } from 'zustand';
import {
  fetchMemberMetrics,
  fetchMemberDashboard,
  fetchMemberHistory,
  fetchMemberDelegations
} from '@/services/memberDashboardService';

interface MemberMetrics {
  reputationScore: number;
  activeVotes: number;
  proposalsCreated: number;
  spuEarned: number;
}

interface MemberDashboardState {
  metrics: MemberMetrics | null;
  dashboardData: any | null;
  history: any[] | null;
  delegations: any[] | null;
  isLoading: boolean;
  error: string | null;

  loadMetrics: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  loadHistory: () => Promise<void>;
  loadDelegations: () => Promise<void>;
}

export const useMemberDashboardStore = create<MemberDashboardState>((set) => ({
  metrics: null,
  dashboardData: null,
  history: null,
  delegations: null,
  isLoading: false,
  error: null,

  loadMetrics: async () => {
    try {
      const data = await fetchMemberMetrics();
      set({ metrics: data });
    } catch (e: any) {
      console.error(e);
    }
  },

  loadDashboard: async () => {
    try {
      set({ isLoading: true, error: null });
      const data = await fetchMemberDashboard();
      set({ dashboardData: data, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  loadHistory: async () => {
    try {
      set({ isLoading: true });
      const data = await fetchMemberHistory();
      set({ history: data.history, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  },

  loadDelegations: async () => {
    try {
      set({ isLoading: true });
      const data = await fetchMemberDelegations();
      set({ delegations: data.delegations, isLoading: false });
    } catch (e: any) {
      set({ isLoading: false, error: e.message });
    }
  }
}));
