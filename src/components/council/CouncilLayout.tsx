import { Outlet, useNavigate } from 'react-router-dom';
import { CouncilSidebar } from './CouncilSidebar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect } from 'react';
import { useCouncilGovStore } from '@/stores/useCouncilGovStore';
import {
  fetchCouncilMetrics, fetchGovernanceRules, fetchProposals,
  fetchElections, fetchGiveaways, fetchLotteries,
  fetchVotingConfig,
} from '@/services/councilService';

export function CouncilLayout() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const store = useCouncilGovStore();

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      navigate('/auth/council', { replace: true });
      return;
    }
    if (user && user.role !== 'COUNCIL') {
      navigate('/', { replace: true });
    }
  }, [isHydrated, token, user, navigate]);

  // Hydrate council data
  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const [metrics, rules, proposals, elections, giveaways, lotteries, votingData] = await Promise.all([
        fetchCouncilMetrics(token).catch(() => null),
        fetchGovernanceRules(token).catch(() => []),
        fetchProposals(token).catch(() => []),
        fetchElections(token).catch(() => []),
        fetchGiveaways(token).catch(() => []),
        fetchLotteries(token).catch(() => []),
        fetchVotingConfig(token).catch(() => ({ configs: [], rules: [] })),
      ]);
      if (metrics) store.setMetrics(metrics);
      store.setRules(rules);
      store.setProposals(proposals);
      store.setElections(elections);
      store.setGiveaways(giveaways);
      store.setLotteries(lotteries);
      store.setVotingConfigs(votingData.configs);
      store.setVotingRules(votingData.rules);
    };
    load();

    // Poll every 5s
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex">
      <CouncilSidebar />
      <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
