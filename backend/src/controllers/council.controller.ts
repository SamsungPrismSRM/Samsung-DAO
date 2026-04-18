import { Request, Response } from 'express';
import { PrismaClient, ProposalStatus } from '@prisma/client';
import { CouncilService } from '../services/council.service';
import { GovernanceService } from '../services/governance.service';
import { ElectionService } from '../services/election.service';
import { EventService } from '../services/event.service';
import { auditService } from '../services/audit.service';

const prisma = new PrismaClient();

async function getCouncilUser(req: Request) {
  const uid = (req as any).user?.uid;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { firebase_uid: uid } });
}

export const CouncilController = {
  // ── Metrics ──
  async getMetrics(_req: Request, res: Response) {
    try {
      const metrics = await CouncilService.getMetrics();
      res.json(metrics);
    } catch (e) {
      console.error('getMetrics:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // ── Governance Rules ──
  async getRules(_req: Request, res: Response) {
    try {
      res.json(await GovernanceService.getRules());
    } catch (e) {
      console.error('getRules:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async updateRule(req: Request, res: Response) {
    try {
      const user = await getCouncilUser(req);
      if (!user || user.role !== 'COUNCIL') return res.status(403).json({ error: 'Forbidden' });
      const { key, value } = req.body;
      if (!key || value === undefined) return res.status(400).json({ error: 'key and value required' });
      const rule = await GovernanceService.updateRule(key, String(value), user.id);
      const io = req.app.get('io');
      io?.emit('rule_updated', rule);
      void auditService.logAction({
        userId: user.id,
        action: 'RULE_UPDATED',
        entityType: 'GOVERNANCE_RULE',
        entityId: key,
        metadata: { key, value: String(value) },
        ipAddress: req.ip,
      });
      res.json(rule);
    } catch (e) {
      console.error('updateRule:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // ── Voting Config ──
  async getVotingConfig(_req: Request, res: Response) {
    try {
      const [configs, rules] = await Promise.all([
        GovernanceService.getVotingConfigs(),
        GovernanceService.getVotingRules(),
      ]);
      res.json({ configs, rules });
    } catch (e) {
      console.error('getVotingConfig:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async updateVotingConfig(req: Request, res: Response) {
    try {
      const user = await getCouncilUser(req);
      if (!user || user.role !== 'COUNCIL') return res.status(403).json({ error: 'Forbidden' });
      const { key, value } = req.body;
      const config = await GovernanceService.updateVotingConfig(key, String(value));
      const io = req.app.get('io');
      io?.emit('voting_config_updated', config);
      void auditService.logAction({
        userId: user.id,
        action: 'VOTING_CONFIG_UPDATED',
        entityType: 'VOTING_CONFIG',
        entityId: key,
        metadata: { key, value: String(value) },
        ipAddress: req.ip,
      });
      res.json(config);
    } catch (e) {
      console.error('updateVotingConfig:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // ── Elections ──
  async getElections(_req: Request, res: Response) {
    try {
      res.json(await ElectionService.list());
    } catch (e) {
      console.error('getElections:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async createElection(req: Request, res: Response) {
    try {
      const user = await getCouncilUser(req);
      if (!user || user.role !== 'COUNCIL') return res.status(403).json({ error: 'Forbidden' });
      const election = await ElectionService.create({ ...req.body, createdBy: user.id });
      const io = req.app.get('io');
      io?.emit('election_created', election);
      void auditService.logAction({
        userId: user.id,
        action: 'ELECTION_CREATED',
        entityType: 'ELECTION',
        entityId: election.id,
        metadata: { title: election.title, status: election.status },
        ipAddress: req.ip,
      });
      res.status(201).json(election);
    } catch (e) {
      console.error('createElection:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // ── Proposals (approve/reject) ──
  async approveProposal(req: Request, res: Response) {
    try {
      const user = await getCouncilUser(req);
      if (!user || user.role !== 'COUNCIL') return res.status(403).json({ error: 'Forbidden' });
      const proposal = await prisma.proposal.update({
        where: { id: req.params.id },
        data: { status: ProposalStatus.APPROVED },
      });
      const io = req.app.get('io');
      io?.emit('proposal_updated', proposal);
      void auditService.logAction({
        userId: user.id,
        action: 'PROPOSAL_APPROVED',
        entityType: 'PROPOSAL',
        entityId: proposal.id,
        metadata: { title: proposal.title, previousStatus: 'REVIEW' },
        ipAddress: req.ip,
      });
      res.json(proposal);
    } catch (e) {
      console.error('approveProposal:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async rejectProposal(req: Request, res: Response) {
    try {
      const user = await getCouncilUser(req);
      if (!user || user.role !== 'COUNCIL') return res.status(403).json({ error: 'Forbidden' });
      const proposal = await prisma.proposal.update({
        where: { id: req.params.id },
        data: { status: ProposalStatus.REJECTED },
      });
      const io = req.app.get('io');
      io?.emit('proposal_updated', proposal);
      void auditService.logAction({
        userId: user.id,
        action: 'PROPOSAL_REJECTED',
        entityType: 'PROPOSAL',
        entityId: proposal.id,
        metadata: { title: proposal.title, reason: req.body?.reason ?? null },
        ipAddress: req.ip,
      });
      res.json(proposal);
    } catch (e) {
      console.error('rejectProposal:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // ── Giveaways ──
  async getGiveaways(_req: Request, res: Response) {
    try {
      res.json(await EventService.listGiveaways());
    } catch (e) {
      console.error('getGiveaways:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async createGiveaway(req: Request, res: Response) {
    try {
      const user = await getCouncilUser(req);
      if (!user || user.role !== 'COUNCIL') return res.status(403).json({ error: 'Forbidden' });
      const giveaway = await EventService.createGiveaway({ ...req.body, createdBy: user.id });
      const io = req.app.get('io');
      io?.emit('giveaway_created', giveaway);
      void auditService.logAction({
        userId: user.id,
        action: 'GIVEAWAY_CREATED',
        entityType: 'GIVEAWAY',
        entityId: giveaway.id,
        metadata: { title: giveaway.title, prize: giveaway.prize },
        ipAddress: req.ip,
      });
      res.status(201).json(giveaway);
    } catch (e) {
      console.error('createGiveaway:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // ── Lotteries ──
  async getLotteries(_req: Request, res: Response) {
    try {
      res.json(await EventService.listLotteries());
    } catch (e) {
      console.error('getLotteries:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async createLottery(req: Request, res: Response) {
    try {
      const user = await getCouncilUser(req);
      if (!user || user.role !== 'COUNCIL') return res.status(403).json({ error: 'Forbidden' });
      const lottery = await EventService.createLottery({ ...req.body, createdBy: user.id });
      const io = req.app.get('io');
      io?.emit('lottery_created', lottery);
      void auditService.logAction({
        userId: user.id,
        action: 'LOTTERY_CREATED',
        entityType: 'LOTTERY',
        entityId: lottery.id,
        metadata: { title: lottery.title, prize: lottery.prize },
        ipAddress: req.ip,
      });
      res.status(201).json(lottery);
    } catch (e) {
      console.error('createLottery:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
