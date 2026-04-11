import { create } from 'zustand';
import type {
  GovRule, VotingConfigItem, VotingRuleItem,
  ElectionItem, ProposalItem, GiveawayItem, LotteryItem,
} from '@/services/councilService';

interface CouncilGovState {
  // Metrics
  metrics: { activeRules: number; pendingProposals: number; eligibleMembers: number; timelock: string } | null;
  setMetrics: (m: CouncilGovState['metrics']) => void;

  // Governance rules
  rules: GovRule[];
  setRules: (r: GovRule[]) => void;
  updateRuleLocal: (key: string, value: string) => void;

  // Voting
  votingConfigs: VotingConfigItem[];
  votingRules: VotingRuleItem[];
  setVotingConfigs: (c: VotingConfigItem[]) => void;
  setVotingRules: (r: VotingRuleItem[]) => void;

  // Elections
  elections: ElectionItem[];
  setElections: (e: ElectionItem[]) => void;
  addElection: (e: ElectionItem) => void;

  // Proposals
  proposals: ProposalItem[];
  setProposals: (p: ProposalItem[]) => void;
  updateProposalLocal: (id: string, status: string) => void;

  // Giveaways
  giveaways: GiveawayItem[];
  setGiveaways: (g: GiveawayItem[]) => void;
  addGiveaway: (g: GiveawayItem) => void;

  // Lotteries
  lotteries: LotteryItem[];
  setLotteries: (l: LotteryItem[]) => void;
  addLottery: (l: LotteryItem) => void;

  // Selection
  selectedHQ: string | null;
  setHQ: (hq: string) => void;
  clear: () => void;
}

export const useCouncilGovStore = create<CouncilGovState>((set) => ({
  metrics: null,
  setMetrics: (m) => set({ metrics: m }),

  rules: [],
  setRules: (r) => set({ rules: r }),
  updateRuleLocal: (key, value) => set((s) => ({
    rules: s.rules.map((r) => r.key === key ? { ...r, value } : r),
  })),

  votingConfigs: [],
  votingRules: [],
  setVotingConfigs: (c) => set({ votingConfigs: c }),
  setVotingRules: (r) => set({ votingRules: r }),

  elections: [],
  setElections: (e) => set({ elections: e }),
  addElection: (e) => set((s) => ({ elections: [e, ...s.elections] })),

  proposals: [],
  setProposals: (p) => set({ proposals: p }),
  updateProposalLocal: (id, status) => set((s) => ({
    proposals: s.proposals.map((p) => p.id === id ? { ...p, status } : p),
  })),

  giveaways: [],
  setGiveaways: (g) => set({ giveaways: g }),
  addGiveaway: (g) => set((s) => ({ giveaways: [g, ...s.giveaways] })),

  lotteries: [],
  setLotteries: (l) => set({ lotteries: l }),
  addLottery: (l) => set((s) => ({ lotteries: [l, ...s.lotteries] })),

  selectedHQ: null,
  setHQ: (hq) => set({ selectedHQ: hq }),
  clear: () => set({
    metrics: null, rules: [], votingConfigs: [], votingRules: [],
    elections: [], proposals: [], giveaways: [], lotteries: [],
    selectedHQ: null,
  }),
}));
