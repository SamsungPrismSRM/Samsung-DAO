import { useEffect } from 'react';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';
import { Loader2, UserPlus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Delegations() {
  const { delegations, isLoading, loadDelegations } = useMemberDashboardStore();

  useEffect(() => {
    loadDelegations();
  }, [loadDelegations]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Delegations</h1>
          <p className="text-sm text-muted-foreground mt-1">Delegate your voting power to trusted members · Limit: 5 per delegate</p>
        </div>
        <Button className="bg-[#1C208F] hover:bg-[#1C208F]/90 text-white font-semibold">
          <UserPlus className="h-4 w-4 mr-2" /> Delegate
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Delegated to ({delegations?.length || 0})</h3>
        
        {isLoading ? (
          <div className="flex h-32 items-center justify-center glass-card rounded-xl border border-border/50">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : delegations && delegations.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {delegations.map((d: any, i: number) => (
              <div key={i} className="glass-card rounded-xl p-4 border border-border/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    {d.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.department}</p>
                  </div>
                </div>
                <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">Revoke</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-10 border border-border/50 bg-muted/10 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">You haven't delegated your vote to anyone.</p>
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-4 border border-blue-500/20 bg-blue-500/5 flex gap-3 items-start mt-8">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200">How delegation works</h4>
          <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1">
            When you delegate your voting power entirely to someone else, their vote will automatically cast on your behalf.
            You can revoke this at any time or manually override it on individual proposals.
          </p>
        </div>
      </div>
    </div>
  );
}
