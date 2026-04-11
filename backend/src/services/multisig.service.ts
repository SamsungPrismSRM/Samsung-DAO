import { PrismaClient } from '@prisma/client';
import { HederaDAOService } from './hedera.service';
import { verifyMessage } from 'ethers';

const prisma = new PrismaClient();
const hederaService = new HederaDAOService();

export class MultisigService {
  private threshold = 3; // N-of-M required signatures
  
  /**
   * Submit an off-chain multisig approval signature for a proposal.
   */
  async submitSignature(proposalId: string, walletAddress: string, signature: string) {
    // 1. Verify that the proposal actually PASSED on-chain/off-chain results
    const result = await prisma.proposalResult.findUnique({ where: { proposal_id: proposalId } });
    if (!result || result.yes_votes <= result.no_votes) {
      throw new Error("Proposal has not passed yet. Cannot gather execution signatures.");
    }

    // 2. Verify signature validity (Ethers.js for EVM compatible wallets, hashgraph for native)
    const payloadToSign = `Execute Proposal: ${proposalId}`;
    const recoveredAddress = verifyMessage(payloadToSign, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error("Invalid signature.");
    }

    // 3. Verify the wallet is an authorized council member
    const councilWallet = await prisma.wallet.findUnique({ 
      where: { wallet_address: walletAddress } 
    });
    
    if (!councilWallet || !councilWallet.is_council_wallet) {
      throw new Error("Wallet is not an authorized council member.");
    }

    // 4. Save signature (using audit log or dedicated table. 
    // For now, storing as metadata in AuditLog to avoid adding a new schema right now)
    await prisma.auditLog.create({
      data: {
        action: 'MULTISIG_SIGNATURE_SUBMITTED',
        entity_type: 'PROPOSAL',
        entity_id: proposalId,
        metadata: { walletAddress, signature }
      }
    });

    // 5. Check if threshold is met
    await this.checkThresholdAndExecute(proposalId);
  }

  private async checkThresholdAndExecute(proposalId: string) {
    const signatureLogs = await prisma.auditLog.findMany({
      where: {
        action: 'MULTISIG_SIGNATURE_SUBMITTED',
        entity_type: 'PROPOSAL',
        entity_id: proposalId
      }
    });

    // Extract unique signatures
    const uniqueSignatures = Array.from(
      new Map(signatureLogs.map((log: any) => [
        (log.metadata as any).walletAddress, 
        (log.metadata as any).signature
      ])).values()
    );

    if (uniqueSignatures.length >= this.threshold) {
      console.log(`Threshold met for proposal ${proposalId}. Executing on-chain...`);
      
      const proposal = await prisma.proposal.findUnique({ where: { id: proposalId } });
      
      if (proposal?.onchain_proposal_id) {
        // Execute on Hedera
        const txHash = await hederaService.executeProposal(
          parseInt(proposal.onchain_proposal_id), 
          uniqueSignatures as string[]
        );
        
        console.log(`Executed. TxHash: ${txHash}`);
        
        // Update status
        await prisma.proposal.update({
          where: { id: proposalId },
          data: { status: 'EXECUTED' }
        });
      }
    }
  }
}
