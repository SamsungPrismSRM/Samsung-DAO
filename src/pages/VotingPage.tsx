import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, User, Tag, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VoteBar } from '@/components/VoteBar';
import { TagBadge } from '@/components/TagBadge';
import { useWalletStore } from '@/stores/useWalletStore';
import { useProposalStore } from '@/stores/useProposalStore';
import { useRequireWallet } from '@/hooks/useRequireWallet';

export default function VotingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected } = useWalletStore();
  const { requireWallet } = useRequireWallet();
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const proposals = useProposalStore(state => state.proposals);
  const proposal = proposals.find((p) => p.id === id);

  if (!proposal) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Proposal not found</p>
        <Link to="/governance/proposals" className="mt-4 inline-block text-sm text-primary hover:underline">
          ← Back to Proposals
        </Link>
      </div>
    );
  }

  const total = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const forPct = total > 0 ? ((proposal.votesFor / total) * 100).toFixed(1) : '0';
  const againstPct = total > 0 ? ((proposal.votesAgainst / total) * 100).toFixed(1) : '0';

  const handleVote = () => {
    requireWallet(() => {
      if (selectedVote) setHasVoted(true);
    });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <Link to="/governance/proposals" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Proposals
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="capitalize">{proposal.type}</Badge>
            <Badge variant={proposal.status === 'active' ? 'default' : 'secondary'} className="capitalize">
              {proposal.status}
            </Badge>
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{proposal.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {proposal.creator}</div>
            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(proposal.createdAt).toLocaleDateString()}</div>
            <div className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {proposal.type}</div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {proposal.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          </div>
        </div>

        {/* Content */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{proposal.description}</p>
        </div>

        {/* Attachments */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Paperclip className="h-4 w-4" /> Attachments
          </h2>
          <p className="text-xs text-muted-foreground">No attachments for this proposal</p>
        </div>

        {/* Vote Results */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Current Results</h2>
          <VoteBar votesFor={proposal.votesFor} votesAgainst={proposal.votesAgainst} votesAbstain={proposal.votesAbstain} />
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-samsung-green">{forPct}%</p>
              <p className="text-xs text-muted-foreground">For ({proposal.votesFor.toLocaleString()})</p>
            </div>
            <div>
              <p className="text-xl font-bold text-destructive">{againstPct}%</p>
              <p className="text-xs text-muted-foreground">Against ({proposal.votesAgainst.toLocaleString()})</p>
            </div>
            <div>
              <p className="text-xl font-bold text-muted-foreground">{proposal.votesAbstain.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Abstain</p>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            {proposal.totalVoters.toLocaleString()} total voters · {proposal.participation}% participation
          </div>
        </div>

        {/* Voting Section */}
        <div className="glass-card rounded-xl p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Cast Your Vote</h2>

          {!isConnected ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground mb-3">Connect your wallet to vote</p>
              <Button onClick={() => navigate('/login')} className="gradient-primary border-0 text-primary-foreground">Connect Wallet</Button>
            </div>
          ) : hasVoted ? (
            <div className="text-center py-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-samsung-green/10">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-sm font-medium text-foreground">Vote submitted!</p>
              <p className="text-xs text-muted-foreground">You voted: {selectedVote}</p>
            </div>
          ) : proposal.status !== 'active' ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              Voting has ended for this proposal
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {['YES', 'NO', 'ABSTAIN'].map((vote) => (
                  <button
                    key={vote}
                    onClick={() => setSelectedVote(vote)}
                    className={`rounded-xl border-2 p-4 text-sm font-semibold transition-all ${
                      selectedVote === vote
                        ? vote === 'YES'
                          ? 'border-samsung-green bg-samsung-green/10 text-samsung-green'
                          : vote === 'NO'
                          ? 'border-destructive bg-destructive/10 text-destructive'
                          : 'border-samsung-orange bg-samsung-orange/10 text-samsung-orange'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    {vote}
                  </button>
                ))}
              </div>
              <Button
                className="w-full gradient-primary border-0 text-primary-foreground"
                disabled={!selectedVote}
                onClick={handleVote}
              >
                Submit Vote
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
