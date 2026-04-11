import { useEffect } from 'react';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';
import { Ticket, Gift, FileText, Vote as VoteIcon, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type TimelineItem = { type: string; date: string; title: string; detail: string };

export default function History() {
  const { history, isLoading, loadHistory } = useMemberDashboardStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'VOTE':
        return <VoteIcon className="h-5 w-5 text-blue-500" />;
      case 'PROPOSAL':
        return <FileText className="h-5 w-5 text-amber-500" />;
      case 'LOTTERY':
        return <Ticket className="h-5 w-5 text-purple-500" />;
      case 'GIVEAWAY':
        return <Gift className="h-5 w-5 text-emerald-500" />;
      case 'DELEGATION':
        return <Users className="h-5 w-5 text-indigo-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'VOTE':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'PROPOSAL':
        return 'bg-amber-500/10 border-amber-500/20';
      case 'LOTTERY':
        return 'bg-purple-500/10 border-purple-500/20';
      case 'GIVEAWAY':
        return 'bg-emerald-500/10 border-emerald-500/20';
      case 'DELEGATION':
        return 'bg-indigo-500/10 border-indigo-500/20';
      default:
        return 'bg-muted/30 border-border/50';
    }
  };

  const items: TimelineItem[] = (history || []).map((h: { type: string; date: string; title: string; detail: string }) => ({
    ...h,
    date: typeof h.date === 'string' ? h.date : (h.date as unknown as Date).toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground mt-1">Your complete activity timeline</p>
      </div>

      <div className="glass-card rounded-xl p-0 border border-border/50 bg-card overflow-hidden">
        {isLoading && !history ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="divide-y divide-border/50">
            {items.map((item, i) => (
              <div
                key={`${item.type}-${i}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${getColorClass(item.type)}`}
                  >
                    {getIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-14 text-sm text-muted-foreground">No activity recorded yet.</div>
        )}
      </div>
    </div>
  );
}
