import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';

/**
 * Hydrates auth + wallet state from backend on app load.
 * Ensures identity and wallet persist across sessions.
 */
export function AuthHydrator() {
  const hydrate = useAuthStore(s => s.hydrate);
  const wallets = useAuthStore(s => s.wallets);
  const user = useAuthStore(s => s.user);
  const isHydrated = useAuthStore(s => s.isHydrated);
  const { connect, setHqAssignment, isConnected } = useWalletStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Once hydrated, sync wallet store from auth store wallets
  useEffect(() => {
    if (!isHydrated || isConnected || !user || wallets.length === 0) return;

    const primaryWallet = wallets.find(w => w.is_primary) || wallets[0];
    connect(
      primaryWallet.wallet_address,
      primaryWallet.wallet_type as 'METAMASK' | 'DFNS'
    );

    if (user.assigned_hq) {
      setHqAssignment(user.assigned_hq);
    }
  }, [isHydrated, wallets, user, isConnected, connect, setHqAssignment]);

  return null;
}
