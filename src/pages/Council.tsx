import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { mockCouncilMembers } from '@/data/mockData';

export default function Council() {
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Council Members</h1>
        <p className="mt-2 text-muted-foreground">Samsung HQ leadership governing the DAO</p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockCouncilMembers.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <UserAvatar name={member.name} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role}</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Voting Power</span>
                    <span className="font-semibold text-foreground">{member.votingPower.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Wallet</span>
                    <span className="font-mono text-foreground">{member.wallet}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-samsung-green" />
                    <span className="text-xs font-medium text-samsung-green capitalize">{member.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
