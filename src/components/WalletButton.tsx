import { Wallet, Key, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/stores/useWalletStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

function isHederaAccountId(address: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(address.trim());
}

function shortenAddress(address: string): string {
  const a = address.trim();
  if (isHederaAccountId(a)) {
    const p = a.split('.');
    const last = p[2] ?? '';
    const tail = last.length <= 4 ? last : `…${last.slice(-4)}`;
    return `0.0.${tail}`;
  }
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export function WalletButton() {
  const navigate = useNavigate();
  const { isConnected, address, walletType, isCustodial, disconnect } = useWalletStore();
  const { isAuthenticated, user, logout, wallets } = useAuthStore();

  const displayAddress =
    address ||
    (() => {
      const w = wallets.find((x) => x.is_primary) || wallets[0];
      return w?.wallet_address ?? null;
    })();

  const handleClick = () => {
    if (isConnected && displayAddress) {
      disconnect();
      logout();
      import('@/lib/firebase').then(({ auth }) => auth.signOut());
      toast.info('Disconnected');
      navigate('/');
    } else if (!isAuthenticated) {
      toast.info('Access restricted', {
        description: 'Please sign in to Samsung Members DAO to connect your wallet.',
        action: { label: 'Sign In', onClick: () => navigate('/login') },
      });
      navigate('/login');
    } else if (user?.role === 'MEMBER' && !user.is_wallet_created) {
      navigate('/auth/member', { state: { requireWallet: true } });
    } else if (user && !isConnected && !displayAddress) {
      toast.info('Wallet', {
        description: 'Connect MetaMask from your member sign-in flow.',
        action: { label: 'Connect', onClick: () => navigate('/auth/member', { state: { requireWallet: true } }) },
      });
      navigate('/auth/member', { state: { requireWallet: true } });
    }
  };

  if (displayAddress) {
    const short = shortenAddress(displayAddress);
    const wt = walletType ?? (wallets[0]?.wallet_type as typeof walletType);

    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="gap-2 font-mono text-xs"
        title="Disconnect wallet and sign out"
      >
        {wt === 'DFNS' ? (
          <Shield className="h-3.5 w-3.5 text-blue-500" />
        ) : wt === 'HASHPACK' ? (
          <Wallet className="h-3.5 w-3.5 text-violet-500" />
        ) : (
          <Wallet className="h-3.5 w-3.5 text-orange-500" />
        )}
        <span className="hidden sm:inline">
          {wt === 'DFNS' ? 'DFNS' : wt === 'HASHPACK' ? 'HP' : 'MM'}
        </span>
        {short}
        {isCustodial && <Key className="h-3 w-3 ml-1 text-blue-400" />}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      className="gap-2 gradient-primary border-0 text-primary-foreground"
    >
      <Wallet className="h-3.5 w-3.5" />
      Connect Wallet
    </Button>
  );
}
