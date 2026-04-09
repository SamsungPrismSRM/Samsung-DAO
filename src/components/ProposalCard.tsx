import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Proposal } from '@/stores/useProposalStore';
import { VoteBar } from '@/components/VoteBar';
import { TagBadge } from '@/components/TagBadge';

const typeColors: Record<string, string> = {
  feature: 'bg-samsung-blue/10 text-samsung-blue',
  lottery: 'bg-samsung-purple/10 text-samsung-purple',
  token: 'bg-samsung-green/10 text-samsung-green',
};

const statusColors: Record<string, string> = {
  active: 'bg-samsung-green/10 text-samsung-green border-samsung-green/20',
  passed: 'bg-primary/10 text-primary border-primary/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  pending: 'bg-samsung-orange/10 text-samsung-orange border-samsung-orange/20',
};

interface ProposalCardProps {
  proposal: Proposal;
  index?: number;
}

export function ProposalCard({ proposal, index = 0 }: ProposalCardProps) {
  const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const timeRemaining = getTimeRemaining(proposal.endsAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/governance/vote/${proposal.id}`}>
        <div className="group glass-card rounded-xl p-5 transition-all hover:shadow-md hover:border-primary/20">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${typeColors[proposal.type]}`}>
                {proposal.type}
              </span>
              <Badge variant="outline" className={`text-xs ${statusColors[proposal.status]}`}>
                {proposal.status}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {timeRemaining}
            </div>
          </div>

          <h3 className="mb-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {proposal.title}
          </h3>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {proposal.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>

          <VoteBar votesFor={proposal.votesFor} votesAgainst={proposal.votesAgainst} votesAbstain={proposal.votesAbstain} />

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{proposal.creator}</span>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {proposal.participation}% participation
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function getTimeRemaining(endsAt: string): string {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}
