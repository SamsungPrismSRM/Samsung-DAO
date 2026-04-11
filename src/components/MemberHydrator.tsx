import { useEffect } from 'react';
import { useMemberStore } from '@/stores/useMemberStore';
import { useWalletStore } from '@/stores/useWalletStore';

/**
 * Restores nickname member + linked MetaMask address after refresh.
 */
export function MemberHydrator() {
  const hydrate = useMemberStore((s) => s.hydrate);
  const token = useMemberStore((s) => s.token);
  const member = useMemberStore((s) => s.member);
  const isHydrated = useMemberStore((s) => s.isHydrated);
  const { connect, isConnected, address } = useWalletStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated || !token || !member?.walletAddress) return;
    if (isConnected && address?.toLowerCase() === member.walletAddress.toLowerCase()) return;
    connect(member.walletAddress, 'METAMASK');
  }, [isHydrated, token, member?.walletAddress, isConnected, address, connect]);

  return null;
}
