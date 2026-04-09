import { create } from 'zustand';

export type ProposalType = 'feature' | 'lottery' | 'token';
export type ProposalStatus = 'active' | 'passed' | 'failed' | 'pending';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  creator: string;
  creatorAvatar: string;
  createdAt: string;
  endsAt: string;
  tags: string[];
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  totalVoters: number;
  participation: number;
  attachments?: string[];
}

interface ProposalState {
  proposals: Proposal[];
  setProposals: (proposals: Proposal[]) => void;
}

export const useProposalStore = create<ProposalState>((set) => ({
  proposals: [],
  setProposals: (proposals) => set({ proposals }),
}));
