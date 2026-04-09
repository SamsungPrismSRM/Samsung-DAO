import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { toast } from 'sonner';

/**
 * Hook to enforce wallet connectivity before performing any action.
 * 
 * Flow:
 * 1. Not signed in → redirect to /login
 * 2. Signed in but no wallet → role-appropriate prompt
 * 3. Signed in + wallet → execute
 */
export function useRequireWallet() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { isConnected } = useWalletStore();

  const requireWallet = useCallback((onSuccess?: () => void): boolean => {
    if (!isAuthenticated || !user) {
      toast.error('Sign in required', {
        description: 'Please sign in first to perform this action.',
        action: { label: 'Sign In', onClick: () => navigate('/login') }
      });
      return false;
    }

    if (!isConnected) {
      const role = user.role;
      if (role === 'COUNCIL') {
        toast.error('Council wallet not provisioned', {
          description: 'Your DFNS custodial wallet needs to be provisioned.',
          action: { label: 'Setup Wallet', onClick: () => navigate('/login') }
        });
      } else {
        toast.error('MetaMask not connected', {
          description: 'Connect your MetaMask wallet to continue.',
          action: { label: 'Connect', onClick: () => navigate('/login') }
        });
      }
      return false;
    }

    if (onSuccess) onSuccess();
    return true;
  }, [isAuthenticated, user, isConnected, navigate]);

  return { requireWallet, isAuthenticated, isConnected, user };
}
