import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';
import { Ticket, FileText, Gift } from 'lucide-react';
import { proposalStatusUi } from '@/lib/proposalStatusUi';
import { Skeleton } from '@/components/ui/skeleton';
import { DecisionActions } from '@/components/DecisionActions';

type CandidateRow = {
  id: string;
  name: string;
  department: string | null;
  voteCount: number;
  percentage: number;
};

type ActiveElection = {
  id: string;
  title: string;
  end_date: string;
  eligible_count: number;
  totalVotes: number;
  userVotedCandidateId: string | null;
  candidates: CandidateRow[];
};

export default function Dashboard() {
  const { dashboardData, metrics, isLoading, loadDashboard } = useMemberDashboardStore();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const {
    activeElection,
    recentProposals,
    reputationBreakdown,
    lotteryPreview,
    giveawayPreview,
  } = dashboardData ?? {};

  const election = activeElection as ActiveElection | null | undefined;
  const eligible = election?.eligible_count ?? 0;
  const totalVotes = election?.totalVotes ?? 0;
  const pctTurnout =
    eligible > 0 ? Math.round((totalVotes / eligible) * 1000) / 10 : 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
      <DecisionActions onRefresh={loadDashboard} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Reputation score',
            value: `${metrics?.reputationScore ?? 0} pts`,
            subtitle:
              (metrics?.reputationDeltaThisMonth ?? 0) > 0
                ? `+${metrics?.reputationDeltaThisMonth} SPU this month`
                : 'No SPU rewards this month yet',
          },
          {
            label: 'Active votes',
            value: metrics?.activeVotes ?? 0,
            subtitle:
              (metrics?.activeVotes ?? 0) > 0 ? 'Live elections' : 'No active votes',
          },
          {
            label: 'Proposals created',
            value: metrics?.proposalsCreated ?? 0,
            subtitle: `${metrics?.approvedProposals ?? 0} approved`,
          },
          {
            label: 'SPU earned',
            value: metrics?.spuEarned ?? 0,
            subtitle: 'From token rewards',
          },
        ].map((metric) => (
          <div key={metric.label} className="glass-card rounded-xl p-5 border border-border/50">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {metric.label}
            </p>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            <p className="text-xs text-muted-foreground mt-2">{metric.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl overflow-hidden border border-primary/20 bg-background/50 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="p-6">
              {election && election.candidates?.length > 0 ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
                      NOW
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-foreground mb-1">
                    {election.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mb-6">
                    Voting closes: {new Date(election.end_date).toLocaleString()} · {eligible}{' '}
                    eligible · {totalVotes} votes cast ({pctTurnout}% turnout)
                  </p>

                  <div className="space-y-3 mb-6">
                    {election.candidates.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {c.name.slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{c.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {c.department || '—'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-medium text-muted-foreground">
                            {c.voteCount} · {c.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {election.userVotedCandidateId ? (
                    <p className="text-sm text-emerald-600 font-medium">Your vote is recorded.</p>
                  ) : (
                    <Link to="/member/vote">
                      <button
                        type="button"
                        className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Cast vote
                      </button>
                    </Link>
                  )}
                </>
              ) : (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No live election right now. Check back when council opens a vote.
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 border border-border/50">
            <h3 className="font-display text-base font-bold text-foreground mb-4">Recent Proposals</h3>
            <div className="space-y-3">
              {recentProposals && recentProposals.length > 0 ? (
                recentProposals.map((p: { id: string; title: string; status: string; created_at: string; creator?: { name: string } }) => {
                  const ui = proposalStatusUi(p.status);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{p.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {p.creator?.name ?? 'Member'} · {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${ui.className}`}
                      >
                        {ui.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">No recent proposals</div>
              )}
            </div>
            <Link
              to="/member/proposals"
              className="mt-4 inline-block text-xs font-semibold text-primary hover:underline"
            >
              View all proposals →
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 border border-border/50">
            <h3 className="font-display text-base font-bold text-foreground mb-4">My Reputation</h3>
            <div className="space-y-4">
              {[
                { label: 'Participation', pts: reputationBreakdown?.participation ?? 0 },
                { label: 'Proposals', pts: reputationBreakdown?.proposals ?? 0 },
                { label: 'Delegation', pts: reputationBreakdown?.delegation ?? 0 },
                ...(reputationBreakdown && reputationBreakdown.tenure > 0
                  ? [{ label: 'Tenure', pts: reputationBreakdown.tenure }]
                  : []),
              ].map((item) => (
                <div key={item.label} className="group">
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-bold font-mono text-foreground">
                      {item.pts}{' '}
                      <span className="text-[10px] text-muted-foreground font-sans uppercase">pts</span>
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary/60 group-hover:bg-primary transition-colors h-full rounded-full"
                      style={{
                        width: `${Math.max(
                          8,
                          (item.pts / Math.max(1, reputationBreakdown?.total ?? 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 mt-2 border-t border-border/50 flex justify-between items-center">
                <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  Total
                </span>
                <span className="text-xl font-bold font-mono text-primary">
                  {reputationBreakdown?.total ?? 0}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/member/lottery"
              className="glass-card rounded-xl p-4 border border-border/50 flex flex-col justify-between min-h-[140px] group cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div>
                <Ticket className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm">SPU Lottery</h4>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-3">
                  {lotteryPreview?.lottery
                    ? (lotteryPreview.lottery as { title: string }).title
                    : 'No open lottery'}
                </p>
              </div>
              {lotteryPreview?.entered ? (
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded mt-2 w-fit">
                  Entered
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider mt-2 group-hover:underline">
                  Enter draw →
                </span>
              )}
            </Link>

            <Link
              to="/member/giveaway"
              className="glass-card rounded-xl p-4 border border-border/50 flex flex-col justify-between min-h-[140px] group cursor-pointer hover:border-emerald-500/30 transition-colors"
            >
              <div>
                <Gift className="h-5 w-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm">Giveaway</h4>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-3">
                  {giveawayPreview?.giveaway
                    ? (giveawayPreview.giveaway as { title: string }).title
                    : 'No open giveaway'}
                </p>
              </div>
              {giveawayPreview?.registered ? (
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10 self-start px-2 py-0.5 rounded mt-2">
                  Registered
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold text-muted-foreground mt-2">
                  View details →
                </span>
              )}
            </Link>
          </div>

          <Link
            to="/member/proposals"
            className="glass-card rounded-xl p-4 border border-border/50 flex items-center gap-3 hover:border-primary/30 transition-colors"
          >
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-semibold">Create or browse proposals</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
