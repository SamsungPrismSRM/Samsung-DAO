import { memberApi } from '@/lib/memberApi';

export type DecisionScope = 'LOCAL' | 'GLOBAL';
export type DecisionRegion = 'INDIA' | 'KOREA' | 'US' | null;

export async function createDecisionProposal(payload: {
  title: string;
  description: string;
  type: 'FEATURE' | 'LOTTERY' | 'TOKEN';
  scope: DecisionScope;
  region: DecisionRegion;
}) {
  const { data } = await memberApi.post('/proposals', payload);
  return data;
}

export async function fetchDecisionProposals(scope: DecisionScope, region?: DecisionRegion) {
  const params = new URLSearchParams({ scope });
  if (scope === 'LOCAL' && region) params.set('region', region);
  const { data } = await memberApi.get(`/proposals?${params.toString()}`);
  return data as { proposals: any[] };
}

export async function voteDecisionProposal(proposalId: string, voteType: 'YES' | 'NO' | 'ABSTAIN') {
  const { data } = await memberApi.post(`/proposals/${proposalId}/vote`, { voteType });
  return data;
}

export async function executeDecision(onchainProposalId: number) {
  const { data } = await memberApi.post('/dao/execute', { proposalId: onchainProposalId });
  return data;
}
