import { HashConnect } from 'hashconnect';
import { AccountId, LedgerId } from '@hashgraph/sdk';

function normalizeHederaAccountId(raw: string): string {
  const s = raw.trim();
  if (s.includes(':')) {
    return s.split(':').pop() ?? s;
  }
  return s;
}

/**
 * Opens WalletConnect pairing (choose **HashPack** in the modal), then signs a binding message.
 * Requires `VITE_WALLETCONNECT_PROJECT_ID` from https://cloud.walletconnect.com/
 */
export async function pairHashPackAndSignBindingMessage(): Promise<{
  accountId: string;
  message: string;
  signatureHex: string;
}> {
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error(
      'Missing VITE_WALLETCONNECT_PROJECT_ID. Add it to your .env (see https://cloud.walletconnect.com/).'
    );
  }

  const metadata = {
    name: 'Samsung Members DAO',
    description: 'Link your HashPack wallet to your member profile',
    icons: [`${window.location.origin}/favicon.ico`],
    url: window.location.origin,
  };

  const hc = new HashConnect(LedgerId.TESTNET, projectId, metadata, false);

  const session = await new Promise<{ accountIds: string[] }>((resolve, reject) => {
    const timeoutMs = 120_000;
    const t = setTimeout(() => {
      reject(new Error('Pairing timed out. Open the modal and select HashPack.'));
    }, timeoutMs);

    hc.pairingEvent.once((data) => {
      clearTimeout(t);
      resolve(data);
    });

    hc.init()
      .then(() => hc.openPairingModal('light'))
      .catch((err) => {
        clearTimeout(t);
        reject(err instanceof Error ? err : new Error(String(err)));
      });
  });

  const rawId = session.accountIds?.[0];
  if (!rawId) {
    await hc.disconnect().catch(() => {});
    throw new Error('No Hedera account was paired.');
  }

  const accountId = normalizeHederaAccountId(rawId);
  if (!/^\d+\.\d+\.\d+$/.test(accountId)) {
    await hc.disconnect().catch(() => {});
    throw new Error('Paired account is not a valid Hedera id.');
  }

  const id = AccountId.fromString(accountId);
  const message = `Authenticate Samsung Members DAO for profile wallet binding.\nAccount: ${accountId}\nTimestamp: ${Date.now()}`;

  let sigs;
  try {
    sigs = await hc.signMessages(id, message);
  } finally {
    await hc.disconnect().catch(() => {});
  }

  if (!sigs?.length) {
    throw new Error('HashPack did not return a signature.');
  }

  const sig = sigs[0];
  const signatureHex = Array.from(sig.signature, (b) => b.toString(16).padStart(2, '0')).join('');

  return { accountId, message, signatureHex };
}
