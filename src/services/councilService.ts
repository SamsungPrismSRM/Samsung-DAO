const API = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api/v1';

function headers(token: string | null) {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error || `Request failed (${res.status})`);
  }
  return res.json();
}

// ── Metrics ──
export async function fetchCouncilMetrics(token: string | null) {
  return json<{ activeRules: number; pendingProposals: number; eligibleMembers: number; timelock: string }>(
    await fetch(`${API}/council/metrics`, { headers: headers(token) })
  );
}

// ── Governance Rules ──
export type GovRule = {
  id: string; key: string; label: string; value: string;
  unit: string | null; min: number | null; max: number | null;
};
export async function fetchGovernanceRules(token: string | null) {
  return json<GovRule[]>(await fetch(`${API}/council/rules`, { headers: headers(token) }));
}
export async function updateGovernanceRule(token: string | null, key: string, value: string) {
  return json<GovRule>(
    await fetch(`${API}/council/rules`, { method: 'PUT', headers: headers(token), body: JSON.stringify({ key, value }) })
  );
}

// ── Voting Config ──
export type VotingConfigItem = { id: string; key: string; label: string; description: string | null; value: string; type: string };
export type VotingRuleItem = { id: string; title: string; description: string | null; enforced: boolean };
export async function fetchVotingConfig(token: string | null) {
  return json<{ configs: VotingConfigItem[]; rules: VotingRuleItem[] }>(
    await fetch(`${API}/council/voting-config`, { headers: headers(token) })
  );
}
export async function updateVotingConfig(token: string | null, key: string, value: string) {
  return json<VotingConfigItem>(
    await fetch(`${API}/council/voting-config`, { method: 'PUT', headers: headers(token), body: JSON.stringify({ key, value }) })
  );
}

// ── Elections ──
export type ElectionItem = {
  id: string; title: string; type: string; status: string;
  start_date: string; end_date: string;
  require_reputation: boolean; allow_delegation: boolean; snapshot_eligibility: boolean;
  eligible_count: number; candidates: { id: string; name: string; department: string | null }[];
  created_at: string;
};
export async function fetchElections(token: string | null) {
  return json<ElectionItem[]>(await fetch(`${API}/council/elections`, { headers: headers(token) }));
}
export async function createElection(token: string | null, data: Record<string, unknown>) {
  return json<ElectionItem>(
    await fetch(`${API}/council/elections`, { method: 'POST', headers: headers(token), body: JSON.stringify(data) })
  );
}

// ── Proposals ──
export type ProposalItem = {
  id: string; title: string; description: string; type: string; status: string;
  created_by: string; created_at: string;
  creator?: { id: string; name: string };
};
export async function fetchProposals(token: string | null) {
  return json<ProposalItem[]>(await fetch(`${API}/data/proposals`, { headers: headers(token) }));
}
export async function approveProposal(token: string | null, id: string) {
  return json<ProposalItem>(
    await fetch(`${API}/council/proposals/${id}/approve`, { method: 'POST', headers: headers(token) })
  );
}
export async function rejectProposal(token: string | null, id: string) {
  return json<ProposalItem>(
    await fetch(`${API}/council/proposals/${id}/reject`, { method: 'POST', headers: headers(token) })
  );
}

// ── Giveaways ──
export type GiveawayItem = {
  id: string; title: string; prize: string; description: string | null;
  closes_at: string; require_kyc: boolean; allow_multiple: boolean; created_at: string;
};
export async function fetchGiveaways(token: string | null) {
  return json<GiveawayItem[]>(await fetch(`${API}/council/giveaways`, { headers: headers(token) }));
}
export async function createGiveaway(token: string | null, data: Record<string, unknown>) {
  return json<GiveawayItem>(
    await fetch(`${API}/council/giveaways`, { method: 'POST', headers: headers(token), body: JSON.stringify(data) })
  );
}

// ── Lotteries ──
export type LotteryItem = {
  id: string; title: string; prize: string;
  draw_date: string; min_reputation: number; is_onchain_random: boolean; created_at: string;
};
export async function fetchLotteries(token: string | null) {
  return json<LotteryItem[]>(await fetch(`${API}/council/lotteries`, { headers: headers(token) }));
}
export async function createLottery(token: string | null, data: Record<string, unknown>) {
  return json<LotteryItem>(
    await fetch(`${API}/council/lotteries`, { method: 'POST', headers: headers(token), body: JSON.stringify(data) })
  );
}
