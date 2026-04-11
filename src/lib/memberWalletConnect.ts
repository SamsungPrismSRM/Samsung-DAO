import { useAuthStore } from '@/stores/useAuthStore';
import { authenticateWithMetaMask, addHederaTestnet, isMetaMaskInstalled } from '@/lib/metamask';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api/v1';

export type MetaMaskConnectResult = {
  address: string;
};

/**
 * Add Hedera testnet, sign message, POST /wallet/metamask/connect, refresh wallets in auth store.
 */
export async function connectMemberMetaMask(): Promise<MetaMaskConnectResult> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install the MetaMask extension.');
  }

  await addHederaTestnet();
  const { address, signature, message } = await authenticateWithMetaMask();
  const token = await useAuthStore.getState().freshToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/wallet/metamask/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ wallet_address: address, signature, message }),
  });

  const raw = await res.text();
  let body: { error?: string } = {};
  try {
    body = JSON.parse(raw) as { error?: string };
  } catch {
    /* plain */
  }
  if (!res.ok) {
    throw new Error(body.error || raw.slice(0, 200) || 'Wallet connect failed');
  }

  const wRes = await fetch(`${API_BASE}/wallet/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const wJson = await wRes.json();
  useAuthStore.getState().setWallets(wJson.wallets || []);
  useAuthStore.getState().updateUser({ is_wallet_created: true });

  return { address };
}
