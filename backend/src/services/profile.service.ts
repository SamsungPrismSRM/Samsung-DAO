import { PrismaClient } from '@prisma/client';
import { fetchTestnetHbarBalance } from './hedera-mirror.service';

const prisma = new PrismaClient();

export type ProfileResponse = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  hq: string | null;
  alias: string | null;
  wallet: {
    connected: boolean;
    hederaAccountId: string | null;
    dfnsWalletId: string | null;
    walletType: string | null;
    source: 'user_wallet' | 'hq_treasury' | null;
    /** HBAR on Hedera testnet from mirror; null if unknown or fetch failed */
    hbarBalance: string | null;
  };
  stats: {
    votingPower: number;
    proposals: number;
    votes: number;
  };
};

export async function getProfile(firebaseUid: string): Promise<ProfileResponse | null> {
  const user = await prisma.user.findUnique({
    where: { firebase_uid: firebaseUid },
    include: {
      wallets: { orderBy: { created_at: 'desc' } },
      hq_wallet: true,
      hq_record: true,
    },
  });

  if (!user) return null;

  const [proposalCount, voteCount] = await Promise.all([
    prisma.proposal.count({ where: { created_by: user.id } }),
    prisma.signalingVote.count({ where: { user_id: user.id } }),
  ]);

  const delegation = 0;
  const votingPower = user.reputation + delegation;

  let connected = false;
  let hederaAccountId: string | null = null;
  let dfnsWalletId: string | null = null;
  let walletType: string | null = null;
  let source: 'user_wallet' | 'hq_treasury' | null = null;

  const dfnsUserWallet = user.wallets.find((w) => w.wallet_type === 'DFNS' && w.dfns_wallet_id);
  const anyWallet = user.wallets[0];

  if (user.hq_wallet) {
    connected = true;
    hederaAccountId = user.hq_wallet.hedera_account_id;
    dfnsWalletId = user.hq_wallet.dfns_wallet_id;
    walletType = 'DFNS';
    source = 'hq_treasury';
  } else if (dfnsUserWallet) {
    connected = true;
    hederaAccountId = dfnsUserWallet.wallet_address;
    dfnsWalletId = dfnsUserWallet.dfns_wallet_id;
    walletType = 'DFNS';
    source = 'user_wallet';
  } else if (anyWallet) {
    connected = true;
    hederaAccountId = anyWallet.wallet_address;
    dfnsWalletId = anyWallet.dfns_wallet_id;
    walletType = anyWallet.wallet_type;
    source = 'user_wallet';
  }

  const hqLabel =
    user.hq_record != null
      ? [user.hq_record.name, user.hq_record.region].filter(Boolean).join(' · ')
      : user.hq;

  let hbarBalance: string | null = null;
  if (connected && hederaAccountId) {
    hbarBalance = await fetchTestnetHbarBalance(hederaAccountId);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hq: hqLabel,
    alias: user.alias,
    wallet: {
      connected,
      hederaAccountId,
      dfnsWalletId,
      walletType,
      source,
      hbarBalance,
    },
    stats: {
      votingPower,
      proposals: proposalCount,
      votes: voteCount,
    },
  };
}
