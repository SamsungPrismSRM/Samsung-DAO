import { create } from 'zustand';

export interface KeyShard {
  hq: string;
  city: string;
  region: string;
  shardIndex: number;
  status: 'active' | 'pending' | 'revoked';
}

interface WalletState {
  address: string | null;
  isConnected: boolean;
  network: string;
  balance: string;
  walletType: 'METAMASK' | 'DFNS' | 'HASHPACK' | null;
  isCustodial: boolean;
  hqAssignment: string | null;
  keyShards: KeyShard[];

  connect: (address: string, walletType?: 'METAMASK' | 'DFNS') => void;
  disconnect: () => void;
  setKeyShards: (shards: KeyShard[]) => void;
  setHqAssignment: (hq: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  network: 'Hedera Testnet',
  balance: '0',
  walletType: null,
  isCustodial: false,
  hqAssignment: null,
  keyShards: [],

  connect: (address, walletType = 'METAMASK') => set({
    address,
    isConnected: true,
    balance: '1,250.00',
    walletType,
    isCustodial: walletType === 'DFNS',
  }),

  disconnect: () => set({
    address: null,
    isConnected: false,
    balance: '0',
    walletType: null,
    isCustodial: false,
    hqAssignment: null,
    keyShards: []
  }),

  setKeyShards: (shards) => set({ keyShards: shards }),
  setHqAssignment: (hq) => set({ hqAssignment: hq }),
}));
