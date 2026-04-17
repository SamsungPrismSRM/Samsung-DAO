import { PrismaClient, ProposalStatus } from '@prisma/client';
import { blockchainService } from './blockchain.service';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

// Map on-chain states (derived from block data) to DB statuses
function deriveOnchainStatus(onchain: {
  start: number;
  end: number;
  executed: boolean;
  canceled?: boolean;
}, currentBlock: number): ProposalStatus {
  if (onchain.canceled) return 'FAILED';
  if (onchain.executed) return 'EXECUTED';
  if (currentBlock < onchain.start) return 'PENDING';
  if (currentBlock >= onchain.start && currentBlock <= onchain.end) return 'ACTIVE';
  // Voting ended — we can't check pass/fail without VotingEngine here,
  // so mark as PASSED (the execute flow validates via VotingEngine.isPassed)
  if (currentBlock > onchain.end) return 'PASSED';
  return 'PENDING';
}

export class ProposalSyncService {
  private isSyncing = false;
  private io: any = null;
  private maxRetries = 3;

  setSocketIO(io: any) {
    this.io = io;
  }

  /**
   * Main sync loop — run every 30–60s via setInterval
   */
  public async syncProposals() {
    if (this.isSyncing) {
      console.warn('[ProposalSync] Skipping — cycle in progress');
      return;
    }
    this.isSyncing = true;

    try {
      // Phase 1: Push eligible DRAFTs on-chain
      await this.escalateDrafts();

      // Phase 2: Sync on-chain state back to DB
      await this.syncOnchainStatuses();

      // Phase 3: Consistency audit
      await this.auditConsistency();
    } catch (err) {
      console.error('[ProposalSync] Critical sync failure:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Phase 1: Find SIGNALING proposals ready for on-chain escalation
   * (Only SIGNALING proposals that have been council-approved get escalated)
   */
  private async escalateDrafts() {
    const candidates = await prisma.proposal.findMany({
      where: {
        status: 'SIGNALING',
        onchain_id: null,
      },
    });

    for (const proposal of candidates) {
      let retries = 0;
      while (retries < this.maxRetries) {
        try {
          console.log(`[ProposalSync] Escalating "${proposal.title}" (${proposal.id}) to on-chain...`);

          const scope = proposal.scope === 'LOCAL' ? 0 : 1;
          const region = proposal.region ? ethers.encodeBytes32String(proposal.region) : ethers.ZeroHash;
          const result = await blockchainService.createProposal(proposal.title, scope, region);

          await prisma.proposal.update({
            where: { id: proposal.id },
            data: {
              status: 'PENDING',
              onchain_id: result.onchain_id,
              onchain_proposal_id: result.txHash,
            },
          });

          console.log(`[ProposalSync] ✅ Escalated "${proposal.title}" → onchain_id=${result.onchain_id}`);

          // Emit real-time update
          if (this.io) {
            this.io.emit('proposal_updated', {
              id: proposal.id,
              status: 'PENDING',
              onchain_id: result.onchain_id,
            });
          }

          break; // Success — exit retry loop
        } catch (err) {
          retries++;
          console.error(`[ProposalSync] ❌ Escalation failed (attempt ${retries}/${this.maxRetries}):`, err);

          if (retries >= this.maxRetries) {
            await prisma.proposal.update({
              where: { id: proposal.id },
              data: { status: 'FAILED' },
            });
            console.error(`[ProposalSync] Marked proposal ${proposal.id} as FAILED after ${this.maxRetries} attempts`);
          }
        }
      }
    }
  }

  /**
   * Phase 2: For all proposals with onchain_id, fetch chain state and update DB
   */
  private async syncOnchainStatuses() {
    const tracked = await prisma.proposal.findMany({
      where: {
        onchain_id: { not: null },
        status: { notIn: ['EXECUTED', 'FAILED'] }, // Don't re-sync terminal states
      },
    });

    if (tracked.length === 0) return;

    let currentBlock: number;
    try {
      currentBlock = await blockchainService.getCurrentBlock();
    } catch (err) {
      console.error('[ProposalSync] Failed to fetch current block:', err);
      return;
    }

    for (const proposal of tracked) {
      try {
        const onchain = await blockchainService.getProposalState(proposal.onchain_id!);
        const newStatus = deriveOnchainStatus(onchain, currentBlock);

        if (newStatus !== proposal.status) {
          console.log(`[ProposalSync] State transition: ${proposal.id} ${proposal.status} → ${newStatus}`);

          await prisma.proposal.update({
            where: { id: proposal.id },
            data: { status: newStatus },
          });

          if (this.io) {
            this.io.emit('proposal_updated', {
              id: proposal.id,
              status: newStatus,
              onchain_id: proposal.onchain_id,
            });
          }
        }
      } catch (err) {
        console.warn(`[ProposalSync] Failed to sync proposal ${proposal.id}:`, err);
      }
    }
  }

  /**
   * Phase 3: Periodic consistency audit — compare DB vs chain
   */
  private async auditConsistency() {
    const dbProposals = await prisma.proposal.findMany({
      where: { onchain_id: { not: null } },
    });

    let mismatches = 0;
    let currentBlock: number;

    try {
      currentBlock = await blockchainService.getCurrentBlock();
    } catch {
      return; // Can't audit without block number
    }

    for (const proposal of dbProposals) {
      try {
        const onchain = await blockchainService.getProposalState(proposal.onchain_id!);
        const expectedStatus = deriveOnchainStatus(onchain, currentBlock);

        if (expectedStatus !== proposal.status) {
          mismatches++;
          console.warn(`[Audit] Mismatch: proposal ${proposal.id} DB=${proposal.status} Chain=${expectedStatus} — auto-correcting`);

          await prisma.proposal.update({
            where: { id: proposal.id },
            data: { status: expectedStatus },
          });
        }
      } catch {
        // Skip individual failures
      }
    }

    if (mismatches > 0) {
      console.log(`[Audit] Corrected ${mismatches} mismatches`);
    }
  }
}

export const proposalSyncService = new ProposalSyncService();
