import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { memberApi } from '@/lib/memberApi';
import { proposalStatusUi } from '@/lib/proposalStatusUi';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

type ProposalRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  created_by: string;
};

export default function MyProposals() {
  const user = useAuthStore((s) => s.user);
  const [list, setList] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await memberApi.get<{ proposals: ProposalRow[] }>('/proposals');
        const mine = user?.id
          ? data.proposals.filter((p) => p.created_by === user.id)
          : [];
        if (!cancelled) setList(mine);
      } catch {
        if (!cancelled) toast.error('Could not load proposals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">{list.length} proposals you created</p>
        </div>
        <Button asChild className="bg-[#1C208F] hover:bg-[#1C208F]/90 text-white font-semibold">
          <Link to="/member/proposals">
            <Plus className="h-4 w-4 mr-2" />
            New proposal
          </Link>
        </Button>
      </div>

      <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            You haven&apos;t created any proposals yet.{' '}
            <Link to="/member/proposals" className="text-primary font-medium hover:underline">
              Create one
            </Link>
            .
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {list.map((p, i) => {
              const ui = proposalStatusUi(p.status);
              return (
                <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1">P-{list.length - i}</p>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border shrink-0 ${ui.className}`}
                  >
                    {ui.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
