import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'member' | 'council';
  department: string;
  joinedAt: string;
  votingPower: number;
  proposalsCreated: number;
  votescast: number;
}

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
