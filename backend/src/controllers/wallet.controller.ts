import { Request, Response } from 'express';
import { PrismaClient, Role, WalletType } from '@prisma/client';
import { ethers } from 'ethers';
import {
  fetchTestnetAccountPublicKey,
  hederaSignedMessageBytes,
} from '../services/hedera-mirror.service';

const prisma = new PrismaClient();

function normalizeHederaAccountId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (s.includes(':')) {
    const tail = s.split(':').pop() ?? '';
    return /^\d+\.\d+\.\d+$/.test(tail) ? tail : null;
  }
  return /^\d+\.\d+\.\d+$/.test(s) ? s : null;
}

export const WalletController = {
  /**
   * POST /wallet/hashpack/connect
   * Member: Pair HashPack via HashConnect, sign a message, verify against mirror public key.
   */
  async connectHashPack(req: Request, res: Response) {
    try {
      const firebaseUser = (req as any).user;
      if (!firebaseUser?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { account_id: accountIdRaw, message, signature_hex: signatureHex } = req.body ?? {};
      if (typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'message is required' });
      }
      if (typeof signatureHex !== 'string' || !/^[0-9a-fA-F]+$/.test(signatureHex) || signatureHex.length % 2 !== 0) {
        return res.status(400).json({ error: 'signature_hex must be an even-length hex string' });
      }

      const accountId = normalizeHederaAccountId(typeof accountIdRaw === 'string' ? accountIdRaw : '');
      if (!accountId) {
        return res.status(400).json({ error: 'Invalid Hedera account id' });
      }

      const mirrorPub = await fetchTestnetAccountPublicKey(accountId);
      if (!mirrorPub) {
        return res.status(400).json({ error: 'Could not load account key from Hedera testnet mirror' });
      }

      let sigBytes: Uint8Array;
      try {
        sigBytes = Uint8Array.from(Buffer.from(signatureHex, 'hex'));
      } catch {
        return res.status(400).json({ error: 'Invalid signature_hex' });
      }

      const payload = hederaSignedMessageBytes(message);
      if (!mirrorPub.verify(payload, sigBytes)) {
        return res.status(401).json({ error: 'Signature verification failed' });
      }

      const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUser.uid } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const hederaAddr = accountId;
      const existingOwner = await prisma.wallet.findFirst({
        where: { wallet_address: hederaAddr },
      });
      if (existingOwner && existingOwner.user_id !== user.id) {
        return res.status(409).json({ error: 'This Hedera account is already linked to another user' });
      }

      let wallet;
      if (existingOwner && existingOwner.user_id === user.id) {
        wallet = existingOwner;
        if (wallet.wallet_type !== WalletType.HASHPACK) {
          wallet = await prisma.wallet.update({
            where: { id: wallet.id },
            data: { wallet_type: WalletType.HASHPACK },
          });
        }
      } else {
        wallet = await prisma.wallet.create({
          data: {
            user_id: user.id,
            wallet_address: hederaAddr,
            wallet_type: WalletType.HASHPACK,
            network: 'HEDERA_TESTNET',
            is_custodial: false,
            is_multisig: false,
            is_council_wallet: false,
            is_primary: true,
          },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { is_wallet_created: true },
      });

      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          action: 'HASHPACK_WALLET_CONNECTED',
          entity_type: 'WALLET',
          entity_id: wallet.id,
          metadata: { hedera_account_id: hederaAddr },
        },
      });

      res.status(200).json({ wallet });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * POST /wallet/metamask/connect
   * Member: Connect a MetaMask wallet with signature verification
   */
  async connectMetaMask(req: Request, res: Response) {
    try {
      const { wallet_address, signature, message } = req.body;
      const firebaseUser = (req as any).user;

      if (!wallet_address || !signature || !message) {
        return res.status(400).json({ error: 'wallet_address, signature, and message are required' });
      }

      // 1. Verify the signature
      let recoveredAddress: string;
      try {
        recoveredAddress = ethers.verifyMessage(message, signature);
      } catch {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
        return res.status(401).json({ error: 'Signature mismatch: recovered address does not match' });
      }

      const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUser.uid } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // 2. Check if this wallet_address is already claimed by another user
      const existingOwner = await prisma.wallet.findFirst({
        where: { wallet_address: wallet_address.toLowerCase() }
      });
      if (existingOwner && existingOwner.user_id !== user.id) {
        return res.status(409).json({ error: 'This wallet address is already linked to another account' });
      }

      // 3. Upsert the wallet
      let wallet;
      if (existingOwner && existingOwner.user_id === user.id) {
        wallet = existingOwner; // Already linked
      } else {
        wallet = await prisma.wallet.create({
          data: {
            user_id: user.id,
            wallet_address: wallet_address.toLowerCase(),
            wallet_type: WalletType.METAMASK,
            network: 'HEDERA_TESTNET',
            is_custodial: false,
            is_multisig: false,
            is_council_wallet: false,
            is_primary: true
          }
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { is_wallet_created: true }
      });

      // 4. Audit log
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          action: 'METAMASK_WALLET_CONNECTED',
          entity_type: 'WALLET',
          entity_id: wallet.id,
          metadata: { wallet_address: wallet_address.toLowerCase(), verified: true }
        }
      });

      res.status(200).json({ wallet });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * GET /wallet/me
   * Get current user's wallet(s) + shard data if council
   */
  async me(req: Request, res: Response) {
    try {
      const firebaseUser = req.user;
      if (!firebaseUser?.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { firebase_uid: firebaseUser.uid },
        include: { hq_wallet: true },
      });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const dbWallets = await prisma.wallet.findMany({
        where: { user_id: user.id },
        orderBy: [{ is_primary: 'desc' }, { created_at: 'desc' }],
      });

      let wallets = [...dbWallets];

      if (user.role === Role.COUNCIL && user.hq_wallet) {
        const hw = user.hq_wallet;
        const treasuryAddr = hw.hedera_account_id.trim();
        const rest = wallets.filter(
          (w) => w.wallet_address.toLowerCase() !== treasuryAddr.toLowerCase()
        );
        const fromTreasury = {
          id: hw.id,
          user_id: user.id,
          wallet_address: treasuryAddr,
          wallet_type: WalletType.DFNS,
          dfns_wallet_id: hw.dfns_wallet_id,
          network: 'HEDERA_TESTNET',
          is_custodial: true,
          is_multisig: true,
          is_council_wallet: true,
          is_primary: true,
          created_at: hw.created_at,
        };
        wallets = [fromTreasury, ...rest];
      }

      let shardData = null;
      if (user.role === Role.COUNCIL && wallets.length > 0) {
        const auditEntry = await prisma.auditLog.findFirst({
          where: { user_id: user.id, action: 'DFNS_WALLET_CREATED' },
          orderBy: { created_at: 'desc' }
        });
        if (auditEntry?.metadata) {
          shardData = auditEntry.metadata;
        }
      }

      res.status(200).json({ wallets, shardData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
