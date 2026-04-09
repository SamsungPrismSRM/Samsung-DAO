import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { DfnsService } from '../services/dfns.service';

const prisma = new PrismaClient();

export const DfnsController = {
  async createWallet(req: Request, res: Response) {
    try {
      const firebaseUser = (req as any).user;
      const requestedHq = req.body?.hq as string | undefined;
      const user = await prisma.user.findUnique({
        where: { firebase_uid: firebaseUser.uid }
      });

      const hq = requestedHq || user?.hq || undefined;
      if (!user || !hq) {
        return res.status(400).json({ error: 'User HQ not found. Please login again.' });
      }

      // Per-HQ wallet: create once, reuse on future logins.
      let wallet = await prisma.hQWallet.findFirst({
        where: { hq }
      });

      if (!wallet) {
        const dfnsWallet = await DfnsService.createCouncilWallet(hq);
        wallet = await prisma.hQWallet.create({
          data: {
            hq,
            name: `SAMSUNG_${hq}_TREASURY`,
            dfns_wallet_id: dfnsWallet.walletId,
            hedera_account_id: dfnsWallet.hederaAccountId
          }
        });
      }

      await prisma.user.update({
        where: { firebase_uid: firebaseUser.uid },
        data: {
          hq_wallet_id: wallet.id,
          is_wallet_created: true
        }
      });

      return res.status(201).json({
        wallet
      });

    } catch (error: any) {
      const message = error?.message || 'Failed to create wallet';
      const statusMatch = String(message).match(/HTTP\s+(\d{3})/i);
      const statusCode = statusMatch ? Number(statusMatch[1]) : 500;
      console.error('DFNS Controller Error:', message);
      res.status(statusCode).json({ error: message });
    }
  },

  async sign(req: Request, res: Response) {
    try {
      const firebaseUser = (req as any).user;
      const { to, amount, memo } = req.body;

      if (!to || !amount) {
        return res.status(400).json({ error: 'to and amount are required' });
      }

      const user = await prisma.user.findUnique({
        where: { firebase_uid: firebaseUser.uid }
      });
      if (!user || !user.hq) {
        return res.status(404).json({ error: 'User/HQ not found' });
      }

      const hqWallet = await prisma.hQWallet.findFirst({
        where: { hq: user.hq }
      });
      if (!hqWallet) {
        return res.status(404).json({ error: 'HQ wallet not found' });
      }

      const signingRequest = await DfnsService.createSigningRequest({
        walletId: hqWallet.dfns_wallet_id,
        to,
        amount,
        memo
      });

      return res.status(201).json({
        walletId: hqWallet.dfns_wallet_id,
        hederaAccountId: hqWallet.hedera_account_id,
        signingRequest
      });
    } catch (error: any) {
      const message = error?.message || 'Failed to initiate DFNS signing request';
      const statusMatch = String(message).match(/HTTP\s+(\d{3})/i);
      const statusCode = statusMatch ? Number(statusMatch[1]) : 500;
      console.error('DFNS Sign Error:', message);
      res.status(statusCode).json({ error: message });
    }
  }
};
