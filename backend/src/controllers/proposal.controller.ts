import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
// import { pinToIPFS } from '../utils/ipfs'; // Assuming this utility exists

const prisma = new PrismaClient();

export const ProposalController = {
  // 1. Create Proposal (Draft Phase)
  async createDraft(req: Request, res: Response) {
    try {
      const { title, description, type } = req.body;
      const firebaseUid = (req as any).user.uid; 
      
      const user = await prisma.user.findUnique({ where: { firebase_uid: firebaseUid } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const proposal = await prisma.proposal.create({
        data: { 
          title, 
          description, 
          type, 
          created_by: user.id 
        }
      });
      
      // Audit Log
      await prisma.auditLog.create({
        data: {
          user_id: user.id,
          action: 'CREATED_DRAFT_PROPOSAL',
          entity_type: 'PROPOSAL',
          entity_id: proposal.id
        }
      });
      
      // Notify clients
      const io = req.app.get('io');
      if (io) io.emit('proposal_created', proposal);

      res.status(201).json(proposal);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error", details: error });
    }
  },

  // 2. Finalize & Publish to On-Chain
  async publishProposal(req: Request, res: Response) {
    try {
      const { proposalId } = req.params;
      const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
      
      if (!proposal) return res.status(404).json({ error: "Proposal not found" });
      
      // 1. Pin structured JSON to IPFS (Simulated)
      // const cid = await pinToIPFS({ title: proposal.title, description: proposal.description });
      const cid = "QmPlaceholderHash123456789"; 
      
      // 2. We don't execute transaction directly from backend to avoid paying gas.
      // We return the cid payload for the user's wallet to execute on Hedera via Hedera Web3 JS SDK.
      
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { ipfs_cid: cid, status: 'ON_CHAIN_VOTE' }
      });
      
      const io = req.app.get('io');
      if (io) io.emit('proposal_updated', proposalId);
      
      res.json({ cid, message: 'Ready for on-chain submission' });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // 3. Signaling Vote (Off-chain)
  async castSignalingVote(req: Request, res: Response) {
    try {
      const { proposalId } = req.params;
      const { voteType, signature, walletAddress } = req.body;
      
      // NOTE: Verify wallet signature matches payload! (Security Rule)
      // verifySignature(walletAddress, signature, voteType, proposalId);
      
      const wallet = await prisma.wallet.findUnique({ where: { wallet_address: walletAddress }});
      if (!wallet) return res.status(404).json({ error: "Unregistered wallet" });
      
      const vote = await prisma.signalingVote.create({
        data: {
          proposal_id: proposalId,
          user_id: wallet.user_id,
          vote_type: voteType,
          voting_power: 100 // Should ideally be calculated based on snapshot block
        }
      });
      
      const io = req.app.get('io');
      if (io) io.emit('signaling_vote_cast', vote);
      
      res.json({ success: true, vote });
    } catch (error) {
      if ((error as any).code === 'P2002') {
        return res.status(400).json({ error: "User has already cast a signaling vote" });
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
