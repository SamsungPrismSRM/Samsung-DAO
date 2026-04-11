export function proposalStatusUi(status: string): { label: string; className: string } {
  const s = status.toUpperCase();
  if (s === 'DRAFT') {
    return {
      label: 'DRAFT',
      className: 'bg-muted text-muted-foreground border-border',
    };
  }
  if (s === 'APPROVED' || s === 'PASSED' || s === 'EXECUTED') {
    return {
      label: 'APPROVED',
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    };
  }
  if (s === 'REVIEW' || s === 'SIGNALING' || s === 'ON_CHAIN_VOTE') {
    return {
      label: 'PENDING',
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    };
  }
  if (s === 'REJECTED' || s === 'FAILED') {
    return {
      label: s,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    };
  }
  return {
    label: s.replace(/_/g, ' '),
    className: 'bg-muted text-muted-foreground border-border',
  };
}
