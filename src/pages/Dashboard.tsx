import { motion } from 'framer-motion';
import { Vote, FileText, TrendingUp, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProposalStore } from '@/stores/useProposalStore';
import { useRequireWallet } from '@/hooks/useRequireWallet';
import { VoteBar } from '@/components/VoteBar';
import { toast } from 'sonner';

export default function Dashboard() {
  const proposals = useProposalStore(state => state.proposals);
  const { requireWallet } = useRequireWallet();
  const myVotes = proposals.slice(0, 3);
  const myProposals = proposals.slice(0, 2);

  const handleClaimRewards = () => {
    requireWallet(() => {
      toast.success('Rewards claimed successfully!', {
        description: '1,250 Samsung Governance Tokens have been transferred to your wallet.'
      });
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">My Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Track your governance activity and rewards</p>
      </motion.div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Votes Cast', value: '24', icon: Vote, color: 'text-samsung-blue' },
          { label: 'Proposals Created', value: '3', icon: FileText, color: 'text-samsung-purple' },
          { label: 'Participation Rate', value: '92%', icon: TrendingUp, color: 'text-samsung-green' },
          { label: 'Token Rewards', value: '1,250', icon: Coins, color: 'text-samsung-orange' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Votes */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">My Recent Votes</h2>
        <div className="space-y-3">
          {myVotes.map((p) => (
            <div key={p.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground truncate max-w-md">{p.title}</h4>
                <span className="text-xs text-samsung-green font-medium">Voted: YES</span>
              </div>
              <VoteBar votesFor={p.votesFor} votesAgainst={p.votesAgainst} votesAbstain={p.votesAbstain} />
            </div>
          ))}
        </div>
      </div>

      {/* My Proposals */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">My Proposals</h2>
        <div className="space-y-3">
          {myProposals.map((p) => (
            <div key={p.id} className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground truncate max-w-md">{p.title}</h4>
                <span className={`text-xs font-medium capitalize ${p.status === 'active' ? 'text-samsung-green' : p.status === 'passed' ? 'text-primary' : 'text-destructive'}`}>
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{p.participation}% participation</p>
            </div>
          ))}
        </div>
      </div>

      {/* Token Rewards */}
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-4">Token Rewards</h2>
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
            <Coins className="h-8 w-8 text-primary-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">1,250</p>
          <p className="text-sm text-muted-foreground">Samsung Governance Tokens</p>
          <p className="mt-2 text-xs text-muted-foreground">Earned through active governance participation</p>
          <Button onClick={handleClaimRewards} className="mt-4 w-full gradient-primary border-0 text-primary-foreground">
            Claim Rewards
          </Button>
        </div>
      </div>
    </div>
  );
}
