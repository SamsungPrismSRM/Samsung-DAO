/**
 * MetaMask integration for Samsung Members (non-custodial wallets)
 */

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
}

export async function connectMetaMask(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  const accounts = await window.ethereum!.request({
    method: 'eth_requestAccounts'
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts returned from MetaMask');
  }

  return accounts[0] as string;
}

export async function signMessage(message: string): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  const accounts = await window.ethereum!.request({
    method: 'eth_accounts'
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('No connected account found');
  }

  const signature = await window.ethereum!.request({
    method: 'personal_sign',
    params: [message, accounts[0]]
  });

  return signature as string;
}

export const AUTH_MESSAGE = 'Authenticate Samsung Members DAO';

/**
 * Full MetaMask auth flow:
 * 1. Connect wallet
 * 2. Sign authentication message
 * 3. Return address + signature for backend verification
 */
export async function authenticateWithMetaMask(): Promise<{
  address: string;
  signature: string;
  message: string;
}> {
  const address = await connectMetaMask();
  const signature = await signMessage(AUTH_MESSAGE);

  return { address, signature, message: AUTH_MESSAGE };
}

/**
 * Add Hedera Testnet to MetaMask
 */
export async function addHederaTestnet(): Promise<void> {
  if (!isMetaMaskInstalled()) return;

  try {
    await window.ethereum!.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x128',
        chainName: 'Hedera Testnet',
        nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
        rpcUrls: ['https://testnet.hashio.io/api'],
        blockExplorerUrls: ['https://hashscan.io/testnet']
      }]
    });
  } catch (err) {
    console.warn('Could not add Hedera Testnet to MetaMask:', err);
  }
}
