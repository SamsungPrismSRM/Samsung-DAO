import { Request, Response } from 'express';
import { PrismaClient, WalletType } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

export const WalletController = {

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
      const firebaseUser = (req as any).user;
      
      const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUser.uid } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const wallets = await prisma.wallet.findMany({ where: { user_id: user.id } });
      
      let shardData = null;
      if (user.role === 'COUNCIL' && wallets.length > 0) {
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
