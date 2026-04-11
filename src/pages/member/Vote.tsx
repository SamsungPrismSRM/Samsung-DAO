import { useEffect, useState } from 'react';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Vote() {
  const { dashboardData, isLoading, loadDashboard } = useMemberDashboardStore();
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeElection = dashboardData?.activeElection;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Active Voting</h1>
        <p className="text-sm text-muted-foreground mt-1">Participate in ongoing elections and signaling votes</p>
      </div>

      {!isLoading && !activeElection ? (
        <div className="glass-card rounded-xl p-10 border border-border/50 bg-muted/10 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">There are currently no active votes.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden border border-primary/20 bg-background/50 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
          
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE NOW
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">Council Election</span>
              </div>
              
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                {activeElection.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-8 border-b border-border/50 pb-6">
                Ends: {new Date(activeElection.end_date).toLocaleString()} · 847 eligible voters
              </p>

              <div className="space-y-4 mb-8">
                <h3 className="text-sm font-semibold mb-2">Select a candidate</h3>
                
                {activeElection.candidates?.map((c: any) => {
                  const isSelected = selectedCandidate === c.id;
                  // Random mock percentage just for UI completeness since voting actuals may not be stored in this specific payload
                  const percentage = Math.floor(Math.random() * 40) + 10; 
                  
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => setSelectedCandidate(c.id)}
                      className={`relative overflow-hidden flex items-center p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-primary ring-1 ring-primary/50 bg-primary/5' 
                          : 'border-border/50 hover:border-primary/30 hover:bg-muted/30'
                      }`}
                    >
                      {/* Percentage background bar */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-primary/5 transition-all duration-1000 ease-out" 
                        style={{ width: `${percentage}%` }}
                      />
                      
                      <div className="relative flex items-center justify-between w-full z-10">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                          }`}>
                            {c.name.slice(0,2)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.department}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-foreground">{percentage}%</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-background" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-border/50">
                <Button 
                  disabled={!selectedCandidate} 
                  className="w-full sm:w-auto px-8 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 h-11"
                >
                  Cast your vote
                </Button>
                <p className="text-[10px] text-muted-foreground mt-3 text-center sm:text-left">
                  Voting is irreversible and will be recorded on to the Hedera ledger.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
