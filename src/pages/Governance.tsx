import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart3, Vote, Users, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProposalCard } from '@/components/ProposalCard';
import { useProposalStore } from '@/stores/useProposalStore';
import { useRequireWallet } from '@/hooks/useRequireWallet';
import { toast } from 'sonner';

const tabs = [
  { id: 'proposals', label: 'Proposals', icon: FileText },
  { id: 'voting', label: 'Voting', icon: Vote },
  { id: 'council', label: 'Council', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Governance() {
  const [activeTab, setActiveTab] = useState('proposals');
  const proposals = useProposalStore(state => state.proposals);
  const { requireWallet } = useRequireWallet();

  const activeProposals = proposals.filter((p) => p.status === 'active');
  const totalVoters = proposals.reduce((acc, p) => acc + p.totalVoters, 0);

  const handleCreateProposal = () => {
    requireWallet(() => {
      toast.info('Proposal creation coming soon!', {
        description: 'The smart contract for proposal creation is being finalized on Hedera Testnet.'
      });
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Product Governance</h1>
          <p className="mt-1 text-muted-foreground">Participate in shaping Samsung's future products and programs</p>
        </motion.div>
        <Button onClick={handleCreateProposal} className="gradient-primary border-0 text-primary-foreground gap-2 px-6">
          <Plus className="h-4 w-4" /> Create Proposal
        </Button>
      </div>

      {/* Summary stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Active Proposals</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{activeProposals.length}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total Voters</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalVoters.toLocaleString()}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Avg Participation</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {Math.round(proposals.reduce((a, p) => a + p.participation, 0) / proposals.length)}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'proposals' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((p, i) => (
            <ProposalCard key={p.id} proposal={p} index={i} />
          ))}
        </div>
      )}

      {activeTab === 'voting' && (
        <div className="space-y-4">
          {activeProposals.map((p, i) => (
            <ProposalCard key={p.id} proposal={p} index={i} />
          ))}
          {activeProposals.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">No active votes</div>
          )}
        </div>
      )}

      {activeTab === 'council' && (
        <div className="text-center py-8">
          <Link to="/governance/council" className="text-primary hover:underline font-medium">
            View Council Members →
          </Link>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Proposals by Type</h3>
            <div className="space-y-3">
              {['feature', 'lottery', 'token'].map((type) => {
                const count = proposals.filter((p) => p.type === type).length;
                const pct = (count / proposals.length) * 100;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-muted-foreground">{type}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Proposals by Status</h3>
            <div className="space-y-3">
              {['active', 'passed', 'failed'].map((status) => {
                const count = proposals.filter((p) => p.status === status).length;
                const pct = (count / proposals.length) * 100;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-muted-foreground">{status}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-samsung-green transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
