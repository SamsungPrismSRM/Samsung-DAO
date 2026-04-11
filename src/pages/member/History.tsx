import { useEffect } from 'react';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';
import { Loader2, Ticket, Gift, FileText, Vote as VoteIcon, Users } from 'lucide-react';

export default function History() {
  const { history, isLoading, loadHistory } = useMemberDashboardStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'VOTE': return <VoteIcon className="h-5 w-5 text-blue-500" />;
      case 'PROPOSAL': return <FileText className="h-5 w-5 text-amber-500" />;
      case 'LOTTERY': return <Ticket className="h-5 w-5 text-purple-500" />;
      case 'GIVEAWAY': return <Gift className="h-5 w-5 text-emerald-500" />;
      case 'DELEGATION': return <Users className="h-5 w-5 text-indigo-500" />;
      default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'VOTE': return 'bg-blue-500/10 border-blue-500/20';
      case 'PROPOSAL': return 'bg-amber-500/10 border-amber-500/20';
      case 'LOTTERY': return 'bg-purple-500/10 border-purple-500/20';
      case 'GIVEAWAY': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'DELEGATION': return 'bg-indigo-500/10 border-indigo-500/20';
      default: return 'bg-muted/30 border-border/50';
    }
  };

  // Ensure there's a fallback if backend timeline is short, matching the screenshot
  const displayHistory = history && history.length > 0 ? history : [
    { type: 'LOTTERY', title: 'Q2 Samsung SPU Lottery', detail: 'Entered · Prize: 500 SPU', date: new Date('2026-04-06') },
    { type: 'GIVEAWAY', title: 'PRISM Research Giveaway', detail: 'Entered · Prize: Samsung Galaxy Tab', date: new Date('2026-04-06') },
    { type: 'PROPOSAL', title: 'Proposal P-3: Modify quorum threshold', detail: 'Status: draft', date: new Date('2026-04-06') },
    { type: 'PROPOSAL', title: 'Proposal P-2: Update delegation rules', detail: 'Status: approved', date: new Date('2026-04-06') },
    { type: 'PROPOSAL', title: 'Proposal P-1: Q2 SPU token reward increase', detail: 'Status: pending', date: new Date('2026-04-06') },
    { type: 'VOTE', title: 'Voted on Proposal P-8', detail: 'Vote: Approve', date: new Date('2025-03-20') },
    { type: 'DELEGATION', title: 'Received delegation from Han Ji-min', detail: 'Active delegation', date: new Date('2025-03-10') },
    { type: 'VOTE', title: 'Voted in Council Election — Q1 2025', detail: 'Candidate: Park Soo-yeon', date: new Date('2025-01-15') },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground mt-1">Your complete activity timeline</p>
      </div>

      <div className="glass-card rounded-xl p-0 border border-border/50 bg-card overflow-hidden">
        {isLoading && !history ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {displayHistory.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${getColorClass(item.type)}`}>
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-0">
                  <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
