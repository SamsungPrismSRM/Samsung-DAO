interface VoteBarProps {
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  showLabels?: boolean;
}

export function VoteBar({ votesFor, votesAgainst, votesAbstain, showLabels = true }: VoteBarProps) {
  const total = votesFor + votesAgainst + votesAbstain;
  if (total === 0) return null;

  const forPct = (votesFor / total) * 100;
  const againstPct = (votesAgainst / total) * 100;
  const abstainPct = (votesAbstain / total) * 100;

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="bg-samsung-green transition-all" style={{ width: `${forPct}%` }} />
        <div className="bg-destructive transition-all" style={{ width: `${againstPct}%` }} />
        <div className="bg-samsung-orange/50 transition-all" style={{ width: `${abstainPct}%` }} />
      </div>
      {showLabels && (
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
          <span className="text-samsung-green font-medium">{forPct.toFixed(1)}% For</span>
          <span className="text-destructive font-medium">{againstPct.toFixed(1)}% Against</span>
          <span className="font-medium">{abstainPct.toFixed(1)}% Abstain</span>
        </div>
      )}
    </div>
  );
}
