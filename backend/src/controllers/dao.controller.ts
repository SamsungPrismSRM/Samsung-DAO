import { Request, Response } from 'express';
import { PrismaClient, ProposalScope, Role, VoteType } from '@prisma/client';
import { ethers } from 'ethers';
import { blockchainService } from '../services/blockchain.service';
import { DfnsService } from '../services/dfns.service';

const prisma = new PrismaClient();

export class DaoController {
  
  static async createProposal(req: Request, res: Response) {
    try {
      const { title, description, scope, region } = req.body;
      const userId = req.user?.uid;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({
        where: { firebase_uid: userId },
        include: { hq_record: true },
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const normalizedScope = scope === 'LOCAL' ? ProposalScope.LOCAL : ProposalScope.GLOBAL;
      const normalizedRegion =
        normalizedScope === ProposalScope.LOCAL
          ? ((region ?? user.region ?? user.hq_record?.region ?? '').toUpperCase() || null)
          : null;
      if (normalizedScope === ProposalScope.LOCAL && !normalizedRegion) {
        return res.status(400).json({ error: 'LOCAL proposal requires region' });
      }

      const proposal = await prisma.proposal.create({
        data: {
          title,
          description: description || '',
          type: 'FEATURE',
          status: 'SIGNALING',
          scope: normalizedScope,
          region: normalizedScope === ProposalScope.LOCAL ? normalizedRegion : null,
          created_by: user.id,
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
      const user = await prisma.user.findUnique({ where: { firebase_uid: userId } });
      if (!user || (user.role !== Role.COUNCIL && user.role !== Role.ADMIN)) {
        return res.status(403).json({ error: 'Only council can push proposal on-chain' });
      }

      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId }
      });

      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }
      
      // Stage 2: Push poll data into EVM Governance layer
      const scopeValue = proposal.scope === ProposalScope.LOCAL ? 0 : 1;
      const regionBytes = proposal.region ? ethers.encodeBytes32String(proposal.region) : ethers.ZeroHash;
      const bcRes = await blockchainService.createProposal(proposal.title, scopeValue, regionBytes);

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

      const user = await prisma.user.findUnique({ where: { firebase_uid: userId }, include: { hq_record: true } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      const proposal = await prisma.proposal.findUnique({ where: { id: String(proposalId) } });
      if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
      const userRegion = user.region ?? ((user.hq_record?.region?.toUpperCase() as any) || null);
      if (proposal.scope === ProposalScope.LOCAL && proposal.region !== userRegion) {
        return res.status(403).json({ error: 'Cross-region vote blocked' });
      }
      await prisma.signalingVote.create({
        data: {
          proposal_id: proposal.id,
          user_id: user.id,
          vote_type: support ? VoteType.YES : VoteType.NO,
          voting_power: 100,
        },
      });
      
      return res.status(200).json({ success: true, message: "Vote noted. Verify on-chain execution." });
    } catch (error: any) {
      console.error("DaoController.vote error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async executeProposal(req: Request, res: Response) {
    try {
      const { proposalId, hqWalletId, to, amount } = req.body;
      const userId = req.user?.uid;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const user = await prisma.user.findUnique({ where: { firebase_uid: userId } });
      if (!user || (user.role !== Role.COUNCIL && user.role !== Role.ADMIN)) {
        return res.status(403).json({ error: 'Only COUNCIL_ROLE can execute' });
      }
      
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

      const io = req.app.get('io');
      io?.emit('proposal_executed', { id: proposal.id, onchain_id: proposal.onchain_id });
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
