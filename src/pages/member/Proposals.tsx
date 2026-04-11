import { useEffect, useState } from 'react';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Proposals() {
  const { dashboardData, isLoading, loadDashboard } = useMemberDashboardStore();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const proposals = dashboardData?.recentProposals || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">{proposals.length} total proposals</p>
        </div>
        <Button className="bg-[#1C208F] hover:bg-[#1C208F]/90 text-white font-semibold shadow-sm h-10 px-5">
          <Plus className="h-4 w-4 mr-2" /> Create proposal
        </Button>
      </div>

      <div className="glass-card rounded-xl p-0 border border-border/50 bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : proposals.length > 0 ? (
          <div className="divide-y divide-border/50">
            {proposals.map((p: any, i: number) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/30 transition-colors cursor-pointer group">
                <div className="flex items-start gap-4 mb-2 sm:mb-0">
                  <span className="text-sm font-mono text-muted-foreground font-medium pt-0.5">P-{proposals.length - i}</span>
                  <div>
                    <p className="text-base font-semibold group-hover:text-[#1C208F] transition-colors">{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.creator?.name || 'Park Soo-yeon'} · {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-sm border shrink-0 ${
                  p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                  p.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                  p.status === 'DRAFT' ? 'bg-muted text-muted-foreground border-border' :
                  'bg-muted text-muted-foreground border-border'
                }`}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No proposals found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
