import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Vote, Gift, Coins, TrendingUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProposalCard } from '@/components/ProposalCard';
import { useProposalStore } from '@/stores/useProposalStore';
import { useForumStore } from '@/stores/useForumStore';
import { useRequireWallet } from '@/hooks/useRequireWallet';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Index() {
  const proposals = useProposalStore((state) => state.proposals);
  const posts = useForumStore((state) => state.posts);
  const navigate = useNavigate();
  const { requireWallet } = useRequireWallet();

  const activeProposals = proposals.filter((p) => p.status === 'active').slice(0, 3);
  
  const handleJoin = () => {
    requireWallet(() => navigate('/community'));
  };

  const handleEnter = () => {
    requireWallet(() => navigate('/governance'));
  };

  const activeProposalsCount = proposals.filter((p) => p.status === 'active').length.toString();
  const lotteryCount = proposals.filter((p) => p.type === 'lottery').length.toString();
  const tokenRewardsCount = (proposals.reduce((acc, p) => acc + (p.votesFor + p.votesAgainst + p.votesAbstain), 0) / 1000).toFixed(1) + 'K';
  const participationRate = proposals.length > 0 ? Math.round((proposals.reduce((acc, p) => acc + p.totalVoters, 0) / (proposals.length * 100)) * 100) + '%' : '78%';

  const stats = [
    { label: 'Active Proposals', value: activeProposalsCount, icon: Vote, color: 'text-samsung-blue' },
    { label: 'Lottery Programs', value: lotteryCount, icon: Gift, color: 'text-samsung-purple' },
    { label: 'Token Rewards', value: tokenRewardsCount, icon: Coins, color: 'text-samsung-green' },
    { label: 'Participation Rate', value: participationRate, icon: TrendingUp, color: 'text-samsung-orange' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-[0.03]" />
        <div className="absolute top-20 -right-40 h-[500px] w-[500px] rounded-full bg-samsung-purple/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-40 h-[400px] w-[400px] rounded-full bg-samsung-blue/5 blur-3xl" />

        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 flex items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mt-1">Powered by</span>
              <img src="/hedera-logo-full.svg" alt="Hedera" className="h-7" />
            </div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
              Samsung Members{' '}
              <span className="gradient-text">DAO</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              Empowering employees to shape Samsung products through decentralized governance
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={handleJoin} className="gradient-primary border-0 text-primary-foreground gap-2 px-6">
                Join Community <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={handleEnter} className="gap-2 px-6">
                Enter Governance
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 -mt-4">
        <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={item} className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Active Proposals */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">Active Proposals</h2>
          <Link to="/governance/proposals" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeProposals.map((p, i) => (
            <ProposalCard key={p.id} proposal={p} index={i} />
          ))}
        </div>
      </section>

      {/* Recent Discussions */}
      <section className="container mx-auto px-4 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground">Recent Discussions</h2>
          <Link to="/forum" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="space-y-3">
          {posts.slice(0, 4).map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/20"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                <p className="text-xs text-muted-foreground">{post.author} · {post.lastActivity}</p>
              </div>
              <span className="text-xs text-muted-foreground">{post.repliesCount} replies</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Governance Entry */}
      <section className="container mx-auto px-4 pb-20">
        <div className="gradient-primary rounded-2xl p-8 md:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-2xl font-bold text-primary-foreground md:text-3xl">
              Shape the Future of Samsung
            </h2>
            <p className="mt-3 text-primary-foreground/80">
              Whether you're on the Council making HQ decisions or a Member casting your vote — your voice matters.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/governance/council">
                <Button size="lg" variant="secondary" className="gap-2">
                  Council Decisions
                </Button>
              </Link>
              <Link to="/governance/proposals">
                <Button size="lg" variant="secondary" className="gap-2">
                  Member Voting
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
