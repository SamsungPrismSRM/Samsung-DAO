import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Blockchain Event Listener (Polling-based for Hedera compatibility)
 * Listens for ProposalCreated, ProposalExecuted, ProposalCanceled, VoteCast
 */
export class BlockchainListenerService {
  private provider: ethers.JsonRpcProvider;
  private governanceContract: ethers.Contract;
  private lastPolledBlock = 0;
  private io: any = null;

  constructor() {
    const rpcUrl = process.env.HEDERA_RPC || 'https://testnet.hashio.io/api';
    const governanceAddress = process.env.GOVERNANCE_ADDRESS || '0x0000000000000000000000000000000000000000';

    // Hedera rejects batch requests
    this.provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { batchMaxCount: 1 });

    const abi = [
      'event ProposalCreated(uint proposalId, uint8 scope, bytes32 region)',
      'event ProposalExecuted(uint proposalId)',
      'event ProposalCanceled(uint proposalId)',
      'event VoteCast(uint proposalId, address voter, bool support, uint256 weight)',
    ];

    this.governanceContract = new ethers.Contract(governanceAddress, abi, this.provider);
  }

  setSocketIO(io: any) {
    this.io = io;
  }

  /**
   * Poll for governance events — call every 30s alongside proposal sync
   */
  public async pollEvents() {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      if (this.lastPolledBlock === 0) {
        this.lastPolledBlock = Math.max(0, currentBlock - 50);
      }
      if (currentBlock <= this.lastPolledBlock) return;

      const fromBlock = this.lastPolledBlock + 1;
      const toBlock = currentBlock;

      // ProposalCreated events
      const createdFilter = this.governanceContract.filters.ProposalCreated();
      const createdEvents = await this.governanceContract.queryFilter(createdFilter, fromBlock, toBlock);

      for (const ev of createdEvents) {
        const parsed = this.governanceContract.interface.parseLog({ topics: ev.topics as string[], data: ev.data });
        if (!parsed) continue;

        const proposalId = Number(parsed.args[0]);
        const scope = Number(parsed.args[1]);
        const region = parsed.args[2];
        console.log(`[Listener] ProposalCreated: id=${proposalId} scope=${scope} region=${region}`);

        // If somehow a proposal was created on-chain but not in our DB, create it
        const exists = await prisma.proposal.findFirst({ where: { onchain_id: proposalId } });
        if (!exists) {
          console.warn(`[Listener] Unknown on-chain proposal ${proposalId} — skipping auto-create (manual review needed)`);
        }

        if (this.io) {
          this.io.emit('governance_event', { type: 'ProposalCreated', proposalId, scope, region });
          this.io.emit('proposal_created', { onchain_id: proposalId, scope, region });
        }
      }

      // ProposalExecuted events
      const executedFilter = this.governanceContract.filters.ProposalExecuted();
      const executedEvents = await this.governanceContract.queryFilter(executedFilter, fromBlock, toBlock);

      for (const ev of executedEvents) {
        const parsed = this.governanceContract.interface.parseLog({ topics: ev.topics as string[], data: ev.data });
        if (!parsed) continue;

        const proposalId = Number(parsed.args[0]);
        console.log(`[Listener] ProposalExecuted: id=${proposalId}`);

        await prisma.proposal.updateMany({
          where: { onchain_id: proposalId },
          data: { status: 'EXECUTED' },
        });

        if (this.io) {
          this.io.emit('governance_event', { type: 'ProposalExecuted', proposalId });
          this.io.emit('proposal_updated', { onchain_id: proposalId, status: 'EXECUTED' });
        }
      }

      const voteFilter = this.governanceContract.filters.VoteCast();
      const voteEvents = await this.governanceContract.queryFilter(voteFilter, fromBlock, toBlock);
      for (const ev of voteEvents) {
        const parsed = this.governanceContract.interface.parseLog({ topics: ev.topics as string[], data: ev.data });
        if (!parsed) continue;
        const proposalId = Number(parsed.args[0]);
        const voter = String(parsed.args[1]);
        const support = Boolean(parsed.args[2]);
        const weight = Number(parsed.args[3]);
        if (this.io) {
          this.io.emit('governance_event', { type: 'VoteCast', proposalId, voter, support, weight });
          this.io.emit('proposal_updated', { onchain_id: proposalId });
        }
      }

      // ProposalCanceled events
      const canceledFilter = this.governanceContract.filters.ProposalCanceled();
      const canceledEvents = await this.governanceContract.queryFilter(canceledFilter, fromBlock, toBlock);

      for (const ev of canceledEvents) {
        const parsed = this.governanceContract.interface.parseLog({ topics: ev.topics as string[], data: ev.data });
        if (!parsed) continue;

        const proposalId = Number(parsed.args[0]);
        console.log(`[Listener] ProposalCanceled: id=${proposalId}`);

        await prisma.proposal.updateMany({
          where: { onchain_id: proposalId },
          data: { status: 'FAILED' },
        });

        if (this.io) {
          this.io.emit('governance_event', { type: 'ProposalCanceled', proposalId });
          this.io.emit('proposal_updated', { onchain_id: proposalId, status: 'FAILED' });
        }
      }

      this.lastPolledBlock = currentBlock;
    } catch (err) {
      console.warn('[Listener] Event polling error (non-fatal):', err);
    }
  }
}

export const blockchainListenerService = new BlockchainListenerService();
