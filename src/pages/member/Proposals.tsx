import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { proposalStatusUi } from '@/lib/proposalStatusUi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { DecisionActions } from '@/components/DecisionActions';
import { fetchDecisionProposals, voteDecisionProposal } from '@/services/proposalService';
import { useAuthStore } from '@/stores/useAuthStore';

type ProposalRow = {
  id: string;
  description: string;
  type: string;
  title: string;
  status: string;
  scope: 'LOCAL' | 'GLOBAL';
  region: 'INDIA' | 'KOREA' | 'US' | null;
  created_at: string;
  signaling_votes?: { user_id: string; vote_type: 'YES' | 'NO' | 'ABSTAIN'; voting_power: number }[];
  creator?: { name: string; email?: string };
};

export default function Proposals() {
  const user = useAuthStore((s) => s.user);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'LOCAL' | 'GLOBAL'>('LOCAL');
  const userRegion = (user?.assigned_hq ?? 'INDIA') as 'INDIA' | 'KOREA' | 'US';

  const load = async (nextScope: 'LOCAL' | 'GLOBAL' = scope) => {
    setLoading(true);
    try {
      const data = await fetchDecisionProposals(nextScope, userRegion);
      setProposals(data.proposals);
    } catch {
      toast.error('Could not load proposals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(scope);
  }, [scope]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">Global and region governance decisions</p>
        </div>
      </div>
      <DecisionActions onRefresh={() => load(scope)} />
      <Tabs value={scope} onValueChange={(v) => setScope(v as 'LOCAL' | 'GLOBAL')}>
        <TabsList>
          <TabsTrigger value="LOCAL">My Region</TabsTrigger>
          <TabsTrigger value="GLOBAL">Global</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="glass-card rounded-xl p-0 border border-border/50 bg-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : proposals.length > 0 ? (
          <div className="divide-y divide-border/50">
            {proposals.map((p, i) => {
              const ui = proposalStatusUi(p.status);
              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4 mb-2 sm:mb-0 min-w-0">
                    <span className="text-sm font-mono text-muted-foreground font-medium pt-0.5 shrink-0">
                      P-{proposals.length - i}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-foreground truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.creator?.name ?? 'Member'} · {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm border ${p.scope === 'LOCAL' ? 'border-blue-300 text-blue-700' : 'border-purple-300 text-purple-700'}`}>
                      {p.scope}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border shrink-0 ${ui.className}`}
                    >
                      {ui.label}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={p.scope === 'LOCAL' && p.region !== userRegion}
                      onClick={async () => {
                        try {
                          await voteDecisionProposal(p.id, 'YES');
                          toast.success('Vote submitted');
                          await load(scope);
                        } catch (e: unknown) {
                          const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Vote failed';
                          toast.error(msg);
                        }
                      }}
                    >
                      Vote
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No proposals yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
