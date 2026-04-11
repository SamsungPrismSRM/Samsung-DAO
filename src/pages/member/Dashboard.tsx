import { useEffect } from 'react';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';
import { Loader2, TrendingUp, CheckCircle, Ticket, FileText, Gift } from 'lucide-react';

export default function Dashboard() {
  const { dashboardData, metrics, isLoading, loadDashboard } = useMemberDashboardStore();

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (isLoading || !dashboardData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { activeElection, recentProposals, reputationBreakdown, lottery, giveaway } = dashboardData;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
      
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Reputation score', value: `${metrics?.reputationScore || 0} pts`, subtitle: '+12 this month' },
          { label: 'Active votes', value: metrics?.activeVotes || 0, subtitle: metrics?.activeVotes ? 'Ends soon' : 'No active votes' },
          { label: 'Proposals created', value: metrics?.proposalsCreated || 0, subtitle: '1 approved' },
          { label: 'SPU earned', value: metrics?.spuEarned || 0, subtitle: 'This period' },
        ].map((metric) => (
          <div key={metric.label} className="glass-card rounded-xl p-5 border border-border/50">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{metric.label}</p>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            <p className="text-xs text-muted-foreground mt-2">{metric.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Left Column (Active Voting & Recent Props) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Voting Card */}
          <div className="glass-card rounded-xl overflow-hidden border border-primary/20 bg-background/50 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE NOW
                </span>
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-1">
                {activeElection ? activeElection.title : 'Council Election — Q2 2025'}
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                Voting closes: {activeElection ? new Date(activeElection.end_date).toLocaleString() : '4/4/2025, 6:00:00 PM'} · 847 eligible · 1 votes cast (0.1%)
              </p>

              <div className="space-y-3 mb-6">
                {activeElection?.candidates?.length > 0 ? (
                  activeElection.candidates.map((c: any, i: number) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                          {c.name.slice(0,2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">{Math.floor(Math.random() * 200)}</span>
                        <div className="w-4 h-4 rounded-full border-2 border-primary/30" />
                      </div>
                    </div>
                  ))
                ) : (
                  // Mock fallback UI matching screenshot if no active election from DB
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">PS</div>
                        <div>
                          <p className="text-sm font-semibold">Park Soo-yeon</p>
                          <p className="text-[10px] text-muted-foreground">R&D</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium">188</span>
                        <div className="w-4 h-4 rounded-full border-2 border-primary" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-xs">LM</div>
                        <div>
                          <p className="text-sm font-semibold">Lee Min-jun</p>
                          <p className="text-[10px] text-muted-foreground">Engineering</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">143</span>
                        <div className="w-4 h-4 rounded-full border-2 border-border" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors">
                Cast vote
              </button>
            </div>
          </div>

          {/* Recent Proposals */}
          <div className="glass-card rounded-xl p-6 border border-border/50">
            <h3 className="font-display text-base font-bold text-foreground mb-4">Recent Proposals</h3>
            <div className="space-y-3">
              {recentProposals && recentProposals.length > 0 ? recentProposals.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">P-{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold hover:text-primary cursor-pointer">{p.title}</p>
                      <p className="text-[10px] text-muted-foreground">{p.creator?.name || 'Samsung Team'} · {new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex shrink-0 ${
                    p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' :
                    p.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {p.status}
                  </span>
                </div>
              )) : (
                <div className="text-center py-6 text-xs text-muted-foreground">No recent proposals</div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Reputation & Events) */}
        <div className="space-y-6">
          
          {/* Reputation Breakdown */}
          <div className="glass-card rounded-xl p-6 border border-border/50">
            <h3 className="font-display text-base font-bold text-foreground mb-4">My Reputation</h3>
            <div className="space-y-4">
              {[
                { label: 'Participation', pts: reputationBreakdown?.participation || 320 },
                { label: 'Proposals', pts: reputationBreakdown?.proposals || 280 },
                { label: 'Delegation', pts: reputationBreakdown?.delegation || 147 },
              ].map((item) => (
                <div key={item.label} className="group">
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-bold font-mono text-foreground">{item.pts} <span className="text-[10px] text-muted-foreground font-sans uppercase">pts</span></span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-primary/60 group-hover:bg-primary transition-colors h-full rounded-full" style={{ width: `${Math.max(10, (item.pts / Math.max(1, reputationBreakdown?.total || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-4 mt-2 border-t border-border/50 flex justify-between items-center">
                <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Total</span>
                <span className="text-xl font-bold font-mono text-primary">{reputationBreakdown?.total || 747}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Lottery Mini Card */}
            <div className="glass-card rounded-xl p-4 border border-border/50 flex flex-col justify-between aspect-square group cursor-pointer hover:border-primary/30 transition-colors">
              <div>
                <Ticket className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm">SPU Lottery</h4>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                  {lottery ? lottery.prize : 'Win 500 SPU tokens this week'}
                </p>
              </div>
              <button className="text-[10px] uppercase font-bold text-primary tracking-wider w-full text-left mt-4 group-hover:underline">Enter draw →</button>
            </div>

            {/* Giveaway Mini Card */}
            <div className="glass-card rounded-xl p-4 border border-border/50 flex flex-col justify-between aspect-square group cursor-pointer hover:border-emerald-500/30 transition-colors">
              <div>
                <Gift className="h-5 w-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-sm">Giveaway</h4>
                <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                  {giveaway ? giveaway.prize : 'Samsung Galaxy Tab draw'}
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-500/10 self-start px-2 py-0.5 rounded mt-4">Registered</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
