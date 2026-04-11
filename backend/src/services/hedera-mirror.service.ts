import { PublicKey } from '@hashgraph/sdk';

const TESTNET_MIRROR =
  process.env.HEDERA_MIRROR_TESTNET_URL ?? 'https://testnet.mirrornode.hedera.com';

type MirrorAccountJson = {
  balance?: { balance?: number | string };
};

function formatHbarFromTinybars(tinybars: bigint): string {
  const div = 100_000_000n;
  const whole = tinybars / div;
  const frac = tinybars % div;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(8, '0').replace(/0+$/, '') || '0';
  return `${whole}.${fracStr}`;
}

function parseTinybars(raw: number | string): bigint | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return BigInt(Math.trunc(raw));
  }
  if (typeof raw === 'string' && /^-?\d+$/.test(raw.trim())) {
    return BigInt(raw.trim());
  }
  return null;
}

/**
 * Reads HBAR balance from the public Hedera testnet mirror (tinybars → formatted ℏ).
 */
export async function fetchTestnetHbarBalance(accountOrEvmAddress: string): Promise<string | null> {
  const id = accountOrEvmAddress.trim();
  if (!id) return null;

  const url = `${TESTNET_MIRROR}/api/v1/accounts/${encodeURIComponent(id)}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;

    const data = (await res.json()) as MirrorAccountJson;
    const raw = data?.balance?.balance;
    if (raw === undefined || raw === null) return null;

    const tinybars = parseTinybars(raw);
    if (tinybars === null) return null;

    return formatHbarFromTinybars(tinybars);
  } catch {
    return null;
  }
}

type MirrorAccountKeyJson = {
  key?: { key?: string };
};

/**
 * Public key for a Hedera account (testnet mirror). Used to verify HashPack / HashConnect message signatures.
 */
export async function fetchTestnetAccountPublicKey(accountId: string): Promise<PublicKey | null> {
  const id = accountId.trim();
  if (!/^\d+\.\d+\.\d+$/.test(id)) return null;

  const url = `${TESTNET_MIRROR}/api/v1/accounts/${encodeURIComponent(id)}`;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) return null;

    const data = (await res.json()) as MirrorAccountKeyJson;
    const keyStr = data?.key?.key;
    if (typeof keyStr !== 'string' || !keyStr.trim()) return null;

    return PublicKey.fromString(keyStr.trim());
  } catch {
    return null;
  }
}

/** Same prefix as HashConnect `signMessages` (see hashconnect README). */
export function hederaSignedMessageBytes(message: string): Uint8Array {
  const prefixed = '\x19Hedera Signed Message:\n' + String(message.length) + message;
  return new TextEncoder().encode(prefixed);
}

export async function fetchAccountData(accountId: string) {
  const id = accountId.trim();
  if (!id) return null;

  try {
    const accountUrl = `${TESTNET_MIRROR}/api/v1/accounts/${encodeURIComponent(id)}`;
    const txUrl = `${TESTNET_MIRROR}/api/v1/transactions?account.id=${encodeURIComponent(id)}&limit=10`;
    
    const [accountRes, txRes] = await Promise.all([
      fetch(accountUrl, { headers: { Accept: 'application/json' } }),
      fetch(txUrl, { headers: { Accept: 'application/json' } })
    ]);

    if (!accountRes.ok) return null;

    const accountData = await accountRes.json();
    const txData = txRes.ok ? await txRes.json() : { transactions: [] };

    return {
      balance: accountData.balance?.balance || 0,
      transactions: txData.transactions || []
    };
  } catch (error) {
    console.error("Error fetching account data from mirror node:", error);
    return null;
  }
}
