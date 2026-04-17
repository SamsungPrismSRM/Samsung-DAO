import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/council/MetricCard';
import { StatusBadge } from '@/components/council/StatusBadge';
import { useCouncilGovStore } from '@/stores/useCouncilGovStore';
import { useNavigate } from 'react-router-dom';
import { DecisionActions } from '@/components/DecisionActions';

export default function CouncilDashboard() {
  const metrics = useCouncilGovStore((s) => s.metrics);
  const rules = useCouncilGovStore((s) => s.rules);
  const proposals = useCouncilGovStore((s) => s.proposals);
  const navigate = useNavigate();

  const pendingProposals = proposals.filter((p) =>
    ['DRAFT', 'SIGNALING', 'REVIEW'].includes(p.status)
  );
  const queuedProposal = proposals.find((p) => p.status === 'QUEUED');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Council dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Governance period #7 · Active since 12 Mar 2025
          </p>
        </div>
        <Button onClick={() => navigate('/council/rules')} className="gap-2">
          <Plus className="h-4 w-4" /> New rule
        </Button>
      </div>
      <DecisionActions queuedOnchainProposalId={queuedProposal?.onchain_id ?? null} />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Active rules" value={metrics?.activeRules ?? '—'} subtitle="+2 this period" delay={0} />
        <MetricCard label="Pending proposals" value={metrics?.pendingProposals ?? '—'} subtitle="Needs review" delay={0.05} />
        <MetricCard label="Eligible members" value={metrics?.eligibleMembers ?? '—'} subtitle="Snapshot taken" delay={0.1} />
        <MetricCard label="Timelock" value={metrics?.timelock ?? '—'} subtitle="Mandatory" delay={0.15} />
      </div>

      {/* Two-column: Rules + Proposal Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Governance Rules */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Active Governance Rules</h2>
          <div className="divide-y divide-border/60">
            {rules.map((r) => (
              <div key={r.key} className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">{r.label}</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {r.value}{r.unit ? ` ${r.unit}` : ''}
                </span>
              </div>
            ))}
            {rules.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground text-center">No rules configured</p>
            )}
          </div>
        </motion.div>

        {/* Proposal Review Queue */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold text-destructive mb-4">Proposal Review Queue</h2>
          <div className="divide-y divide-border/60">
            {pendingProposals.slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                onClick={() => navigate('/council/proposals')}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">P-{pendingProposals.length - i}</span>
                    <span className="text-sm font-medium text-foreground">{p.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.creator?.name ?? 'Unknown'}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
            {pendingProposals.length === 0 && (
              <p className="py-4 text-sm text-muted-foreground text-center">No pending proposals</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
