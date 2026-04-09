import { motion } from 'framer-motion';
import { UserAvatar } from '@/components/UserAvatar';
import { useUserStore } from '@/stores/useUserStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { mockUser } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, isAuthenticated, login, logout } = useUserStore();
  const { isConnected, address, network, balance } = useWalletStore();

  const displayUser = user || mockUser;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="glass-card rounded-xl p-8 text-center mb-6">
          <UserAvatar name={displayUser.name} size="lg" className="mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-foreground">{displayUser.name}</h1>
          <p className="text-sm text-muted-foreground">{displayUser.email}</p>
          <p className="mt-1 text-xs text-primary font-medium capitalize">{displayUser.role} · {displayUser.department}</p>
        </div>

        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Wallet</h2>
          {isConnected ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Address</span>
                <span className="font-mono text-foreground">{address?.slice(0, 10)}...{address?.slice(-6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network</span>
                <span className="text-foreground">{network}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-semibold text-foreground">{balance} HBAR</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No wallet connected</p>
          )}
        </div>

        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Governance Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-foreground">{displayUser.votingPower.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Voting Power</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{displayUser.proposalsCreated}</p>
              <p className="text-xs text-muted-foreground">Proposals</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{displayUser.votescast}</p>
              <p className="text-xs text-muted-foreground">Votes Cast</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {!isAuthenticated ? (
            <Button className="flex-1 gradient-primary border-0 text-primary-foreground" onClick={() => login(mockUser)}>
              Sign In
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
