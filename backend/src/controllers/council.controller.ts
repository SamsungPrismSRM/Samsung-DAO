import { Request, Response } from 'express';
import { PrismaClient, ProposalStatus } from '@prisma/client';
import { CouncilService } from '../services/council.service';
import { GovernanceService } from '../services/governance.service';
import { ElectionService } from '../services/election.service';
import { EventService } from '../services/event.service';

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
      res.json(proposal);
    } catch (e) {
      console.error('rejectProposal:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // ── Giveaways ──
  async getGiveaways(_req: Request, res: Response) {
    try {
      const scope = typeof _req.query.scope === 'string' ? _req.query.scope : undefined;
      const region = typeof _req.query.region === 'string' ? _req.query.region : undefined;
      res.json(await EventService.listGiveaways(scope, region));
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
      res.status(201).json(giveaway);
    } catch (e) {
      console.error('createGiveaway:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  // ── Lotteries ──
  async getLotteries(_req: Request, res: Response) {
    try {
      const scope = typeof _req.query.scope === 'string' ? _req.query.scope : undefined;
      const region = typeof _req.query.region === 'string' ? _req.query.region : undefined;
      res.json(await EventService.listLotteries(scope, region));
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
      res.status(201).json(lottery);
    } catch (e) {
      console.error('createLottery:', e);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
