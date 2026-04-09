import { Wallet, Key, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useWalletStore } from '@/stores/useWalletStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

export function WalletButton() {
  const navigate = useNavigate();
  const { isConnected, address, walletType, isCustodial, disconnect } = useWalletStore();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleClick = () => {
    if (isConnected) {
      disconnect();
      logout();
      import('@/lib/firebase').then(({ auth }) => auth.signOut());
      toast.info('Disconnected');
      navigate('/');
    } else if (!isAuthenticated) {
      toast.info('Access restricted', {
        description: 'Please sign in to Samsung Members DAO to connect your wallet.',
        action: { label: 'Sign In', onClick: () => navigate('/login') }
      });
      navigate('/login');
    } else if (user && !isConnected) {
      if (user.role === 'COUNCIL') {
        toast.info('Council Provisioning Required', {
          description: 'Redirecting to provision your DFNS multi-sig wallet...',
          duration: 4000
        });
      } else {
        toast.info('Wallet Activation Required', {
          description: 'Redirecting to connect your MetaMask wallet...',
          duration: 4000
        });
      }
      navigate('/login');
    }
  };

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className="gap-2 font-mono text-xs"
      >
        {walletType === 'DFNS' ? (
          <Shield className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <Wallet className="h-3.5 w-3.5 text-orange-500" />
        )}
        <span className="hidden sm:inline">
          {walletType === 'DFNS' ? 'DFNS' : 'MM'}
        </span>
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
        {isCustodial && (
          <Key className="h-3 w-3 ml-1 text-blue-400" />
        )}
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
