import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MIRROR_NODE_URL = process.env.HEDERA_MIRROR_NODE || 'https://mainnet-public.mirrornode.hedera.com';
const CONTRACT_ID = process.env.DAO_CONTRACT_ID || '';

/**
 * HederaEventSyncService
 * Responsibilities:
 * - Poll Hedera Mirror Node for contract execution logs
 * - Decode event payloads (votes, proposal executions)
 * - Map and sync off-chain Postgres database to on-chain reality
 */
export class HederaEventSyncService {
  
  /**
   * Polls Mirror Node for contract logs periodically.
   */
  async syncContractEvents() {
    // Determine the last synced timestamp cursor
    const lastSyncLog = await prisma.auditLog.findFirst({
      where: { action: 'HEDERA_SYNC_CURSOR' },
      orderBy: { created_at: 'desc' }
    });

    const lastSyncedTimestamp = lastSyncLog?.metadata 
      ? (lastSyncLog.metadata as any).timestamp 
      : '0.0';

    try {
      const response = await axios.get(
        `${MIRROR_NODE_URL}/api/v1/contracts/${CONTRACT_ID}/results/logs`,
        { params: { 'timestamp': `gt:${lastSyncedTimestamp}`, order: 'asc', limit: 100 } }
      );
      
      const logs = response.data.logs;
      if (!logs || logs.length === 0) return;

      for (const log of logs) {
        await this.processLog(log);
      }
      
      // Update sync cursor
      const latestTimestamp = logs[logs.length - 1].timestamp;
      await prisma.auditLog.create({
        data: {
          action: 'HEDERA_SYNC_CURSOR',
          entity_type: 'SYSTEM',
          entity_id: 'SYNC_DAEMON',
          metadata: { timestamp: latestTimestamp }
        }
      });
      
    } catch (error) {
      console.error("Hedera Sync Error:", error);
    }
  }

  private async processLog(log: any) {
    const topic0 = log.topic0; 
    
    // Topic hashes would normally be imported from generated ABI bindings (e.g. TypeChain)
    const VOTE_CAST_TOPIC = '0x...'; 
    const PROPOSAL_EXECUTED_TOPIC = '0x...';

    if (topic0 === VOTE_CAST_TOPIC) {
      // Logic to decode log.data into: proposalId, voterAddress, support, weight
      const decodedVoterAddress = '0xDecodedAddress';
      const decodedSupport = 1; // 0=NO, 1=YES, 2=ABSTAIN
      const decodedWeight = 100.0;
      const onchainProposalId = '1';

      // Find relative off-chain proposal
      const proposal = await prisma.proposal.findUnique({
        where: { onchain_proposal_id: onchainProposalId }
      });

      if (proposal) {
        const voteType = decodedSupport === 1 ? 'YES' : decodedSupport === 0 ? 'NO' : 'ABSTAIN';

        await prisma.onchainVote.upsert({
          where: {
            proposal_id_wallet_address: {
              proposal_id: proposal.id,
              wallet_address: decodedVoterAddress
            }
          },
          update: {
            vote_type: voteType,
            voting_power: decodedWeight,
            transaction_hash: log.transaction_id,
            block_timestamp: new Date(Number(log.timestamp.split('.')[0]) * 1000)
          },
          create: {
            proposal_id: proposal.id,
            wallet_address: decodedVoterAddress,
            vote_type: voteType,
            voting_power: decodedWeight,
            transaction_hash: log.transaction_id,
            block_timestamp: new Date(Number(log.timestamp.split('.')[0]) * 1000)
          }
        });
      }
    } else if (topic0 === PROPOSAL_EXECUTED_TOPIC) {
        // Handle treasury transfers or state finalization here
        const onchainProposalId = '1';
        await prisma.proposal.update({
          where: { onchain_proposal_id: onchainProposalId },
          data: { status: 'EXECUTED' }
        });
    }
  }
}
