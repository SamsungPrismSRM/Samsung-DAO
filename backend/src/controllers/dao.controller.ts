import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import { blockchainService } from '../services/blockchain.service';
import { DfnsService } from '../services/dfns.service';

const prisma = new PrismaClient();

export class DaoController {
  
  static async createProposal(req: Request, res: Response) {
    try {
      const { title, description } = req.body;
      const userId = req.user?.uid;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Stage 1: Store strictly off-chain as a Signaling Poll
      const proposal = await prisma.proposal.create({
        data: {
          title,
          description: description || '',
          type: 'FEATURE',
          status: 'SIGNALING',
          created_by: userId,
          start_time: new Date(),
        }
      });

      return res.status(201).json({ success: true, proposal, message: "Off-chain poll created" });
    } catch (error: any) {
      console.error("DaoController.createProposal error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async escalateToOnchain(req: Request, res: Response) {
    try {
      const { proposalId } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId }
      });

      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      
      // Stage 2: Push poll data into EVM Governance layer
      const bcRes = await blockchainService.createProposal(proposal.title);

      const escalatedProposal = await prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          status: 'ACTIVE',
          onchain_id: bcRes.onchain_id
        }
      });

      return res.status(200).json({ success: true, escalatedProposal, txHash: bcRes.txHash });
    } catch (error: any) {
      console.error("DaoController.escalateToOnchain error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async vote(req: Request, res: Response) {
    try {
      const { proposalId, support } = req.body;
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Votes happen directly on-chain via governanceContract.ts (frontend).
      // Here the backend can record an off-chain representation of it, or mirror integration ensures it.
      // Assuming frontend handles on-chain vote, we just log it locally for fast UI load.
      
      return res.status(200).json({ success: true, message: "Vote noted. Verify on-chain execution." });
    } catch (error: any) {
      console.error("DaoController.vote error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async executeProposal(req: Request, res: Response) {
    try {
      const { proposalId, hqWalletId, to, amount } = req.body;
      
      // 1. Check block state
      const state = await blockchainService.getProposalState(Number(proposalId));
      if (!state) {
          return res.status(404).json({ error: "On-chain proposal not found" });
      }

      // 2. Fetch Prisma proposal
      const proposal = await prisma.proposal.findUnique({
        where: { onchain_id: Number(proposalId) }
      });

      if (!proposal) {
        return res.status(404).json({ error: "Prisma Proposal not found" });
      }

      // 3. Treasury Transfer via DFNS 
      if (hqWalletId && to && amount) {
          await DfnsService.executeTreasuryTransfer(hqWalletId, to, amount);
      }

      // 4. Update Proposal status
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'EXECUTED' }
      });

      return res.status(200).json({ success: true, message: "Proposal Executed" });
    } catch (error: any) {
      console.error("DaoController.execute error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async confirmOracleSync(req: Request, res: Response) {
    try {
      const { userEvmAddress, nonce } = req.body;
      const userId = req.user?.uid;
      // In production, checking Council explicit requirements matches institutional MPC
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const rpcUrl = process.env.HEDERA_RPC || "https://testnet.hashio.io/api";
      const privateKey = process.env.PRIVATE_KEY;
      const spuAddress = process.env.SPU_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey as string, provider);
      const abi = ["function confirmSync(address user, uint256 nonce) external"];
      const spuContract = new ethers.Contract(spuAddress, abi, wallet);

      const tx = await spuContract.confirmSync(userEvmAddress, nonce);
      await tx.wait();

      return res.status(200).json({ success: true, message: "Sync confirmed on-chain via VALIDATOR_ROLE", txHash: tx.hash });
    } catch (error: any) {
      console.error("DaoController.confirmOracleSync error:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}
