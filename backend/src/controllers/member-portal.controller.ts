import { Request, Response } from 'express';
import { PrismaClient, ProposalType, Role } from '@prisma/client';
import { auditService } from '../services/audit.service';

const prisma = new PrismaClient();
const MAX_OUTGOING_DELEGATIONS = 5;

function firebaseUid(req: Request): string | undefined {
  return (req as Request & { user?: { uid: string } }).user?.uid;
}

export const MemberPortalController = {
  async listProposals(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const proposals = await prisma.proposal.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        created_at: true,
        created_by: true,
        creator: { select: { name: true, email: true } },
      },
    });
    res.json({ proposals });
  },

  async createProposalDraft(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }
    const user = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const proposal = await prisma.proposal.create({
      data: {
        title,
        description,
        type: ProposalType.FEATURE,
        created_by: user.id,
      },
    });
    void auditService.logAction({
      userId: user.id,
      action: 'PROPOSAL_CREATED',
      entityType: 'PROPOSAL',
      entityId: proposal.id,
      metadata: { title, type: ProposalType.FEATURE },
      ipAddress: req.ip,
    });
    res.status(201).json(proposal);
  },

  async castElectionVote(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const electionId = typeof req.body?.electionId === 'string' ? req.body.electionId : '';
    const candidateId = typeof req.body?.candidateId === 'string' ? req.body.candidateId : '';
    if (!electionId || !candidateId) {
      return res.status(400).json({ error: 'electionId and candidateId are required' });
    }
    const user = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const election = await prisma.election.findFirst({
      where: { id: electionId, status: 'LIVE' },
    });
    if (!election) return res.status(404).json({ error: 'No active election found' });

    const candidate = await prisma.candidate.findFirst({
      where: { id: candidateId, election_id: electionId },
    });
    if (!candidate) return res.status(400).json({ error: 'Invalid candidate for this election' });

    if (election.require_reputation && user.reputation < 1) {
      return res.status(403).json({ error: 'Insufficient reputation to vote' });
    }

    try {
      const vote = await prisma.electionVote.create({
        data: {
          election_id: electionId,
          user_id: user.id,
          candidate_id: candidateId,
        },
      });
      void auditService.logAction({
        userId: user.id,
        action: 'ELECTION_VOTE_CAST',
        entityType: 'ELECTION',
        entityId: electionId,
        metadata: { candidateId, electionTitle: election.title },
        ipAddress: req.ip,
      });
      res.status(201).json({ vote });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        return res.status(400).json({ error: 'You have already voted in this election' });
      }
      throw e;
    }
  },

  async createDelegation(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const toEmail = typeof req.body?.toEmail === 'string' ? req.body.toEmail.trim().toLowerCase() : '';
    if (!toEmail) return res.status(400).json({ error: 'toEmail is required' });

    const fromUser = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!fromUser) return res.status(404).json({ error: 'User not found' });
    if (fromUser.role !== Role.MEMBER) {
      return res.status(403).json({ error: 'Only members can delegate' });
    }

    const toUser = await prisma.user.findFirst({
      where: { email: toEmail, role: Role.MEMBER },
    });
    if (!toUser) return res.status(404).json({ error: 'No member found with that email' });
    if (toUser.id === fromUser.id) {
      return res.status(400).json({ error: 'Cannot delegate to yourself' });
    }

    const outgoing = await prisma.delegation.count({ where: { from_user_id: fromUser.id } });
    if (outgoing >= MAX_OUTGOING_DELEGATIONS) {
      return res.status(400).json({ error: `Maximum of ${MAX_OUTGOING_DELEGATIONS} delegations reached` });
    }

    try {
      const d = await prisma.delegation.create({
        data: { from_user_id: fromUser.id, to_user_id: toUser.id },
        include: {
          to_user: { select: { id: true, name: true, email: true, department: true } },
        },
      });
      void auditService.logAction({
        userId: fromUser.id,
        action: 'DELEGATION_CREATED',
        entityType: 'DELEGATION',
        entityId: d.id,
        metadata: { toUserId: toUser.id, toEmail: toUser.email, toName: toUser.name },
        ipAddress: req.ip,
      });
      res.status(201).json({
        delegation: {
          id: d.id,
          name: d.to_user.name,
          email: d.to_user.email,
          department: d.to_user.department,
        },
      });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        return res.status(400).json({ error: 'You already delegate to this member' });
      }
      throw e;
    }
  },

  async revokeDelegation(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'id required' });

    const fromUser = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!fromUser) return res.status(404).json({ error: 'User not found' });

    const row = await prisma.delegation.findFirst({
      where: { id, from_user_id: fromUser.id },
    });
    if (!row) return res.status(404).json({ error: 'Delegation not found' });

    await prisma.delegation.delete({ where: { id } });
    void auditService.logAction({
      userId: fromUser.id,
      action: 'DELEGATION_REVOKED',
      entityType: 'DELEGATION',
      entityId: id,
      ipAddress: req.ip,
    });
    res.json({ ok: true });
  },

  async getLottery(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lottery = await prisma.lottery.findFirst({
      where: { draw_date: { gt: new Date() } },
      orderBy: { draw_date: 'asc' },
    });
    if (!lottery) {
      return res.json({ lottery: null, entered: false, entryCount: 0 });
    }
    const entry = await prisma.lotteryEntry.findUnique({
      where: { lottery_id_user_id: { lottery_id: lottery.id, user_id: user.id } },
    });
    const entryCount = await prisma.lotteryEntry.count({ where: { lottery_id: lottery.id } });
    res.json({
      lottery,
      entered: !!entry,
      entryCount,
    });
  },

  async enterLottery(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lotteryId =
      typeof req.body?.lotteryId === 'string' && req.body.lotteryId
        ? req.body.lotteryId
        : (
            await prisma.lottery.findFirst({
              where: { draw_date: { gt: new Date() } },
              orderBy: { draw_date: 'asc' },
            })
          )?.id;
    if (!lotteryId) return res.status(404).json({ error: 'No open lottery' });

    const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery || lottery.draw_date <= new Date()) {
      return res.status(400).json({ error: 'Lottery is not open' });
    }
    if (user.reputation < lottery.min_reputation) {
      return res.status(403).json({
        error: `Minimum reputation ${lottery.min_reputation} required`,
      });
    }

    try {
      await prisma.lotteryEntry.create({
        data: { lottery_id: lotteryId, user_id: user.id },
      });
      const entryCount = await prisma.lotteryEntry.count({ where: { lottery_id: lotteryId } });
      void auditService.logAction({
        userId: user.id,
        action: 'LOTTERY_ENTERED',
        entityType: 'LOTTERY',
        entityId: lotteryId,
        metadata: { lotteryTitle: lottery.title, prize: lottery.prize },
        ipAddress: req.ip,
      });
      res.status(201).json({ ok: true, entered: true, entryCount });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        return res.status(400).json({ error: 'Already entered this lottery' });
      }
      throw e;
    }
  },

  async getGiveaway(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const giveaway = await prisma.giveaway.findFirst({
      where: { closes_at: { gt: new Date() } },
      orderBy: { closes_at: 'asc' },
    });
    if (!giveaway) {
      return res.json({ giveaway: null, registered: false, registeredCount: 0 });
    }
    const reg = await prisma.giveawayEntry.findUnique({
      where: { giveaway_id_user_id: { giveaway_id: giveaway.id, user_id: user.id } },
    });
    const registeredCount = await prisma.giveawayEntry.count({
      where: { giveaway_id: giveaway.id },
    });
    res.json({
      giveaway,
      registered: !!reg,
      registeredCount,
    });
  },

  async registerGiveaway(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const giveawayId =
      typeof req.body?.giveawayId === 'string' && req.body.giveawayId
        ? req.body.giveawayId
        : (
            await prisma.giveaway.findFirst({
              where: { closes_at: { gt: new Date() } },
              orderBy: { closes_at: 'asc' },
            })
          )?.id;
    if (!giveawayId) return res.status(404).json({ error: 'No open giveaway' });

    const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
    if (!giveaway || giveaway.closes_at <= new Date()) {
      return res.status(400).json({ error: 'Giveaway is closed' });
    }
    if (giveaway.require_kyc && !user.is_onboarded) {
      return res.status(403).json({ error: 'Complete onboarding (KYC) to register' });
    }

    try {
      await prisma.giveawayEntry.create({
        data: { giveaway_id: giveawayId, user_id: user.id },
      });
      const registeredCount = await prisma.giveawayEntry.count({
        where: { giveaway_id: giveawayId },
      });
      void auditService.logAction({
        userId: user.id,
        action: 'GIVEAWAY_REGISTERED',
        entityType: 'GIVEAWAY',
        entityId: giveawayId,
        metadata: { giveawayTitle: giveaway.title, prize: giveaway.prize },
        ipAddress: req.ip,
      });
      res.status(201).json({ ok: true, registered: true, registeredCount });
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        return res.status(400).json({ error: 'Already registered' });
      }
      throw e;
    }
  },

  async searchMembers(req: Request, res: Response) {
    const uid = firebaseUid(req);
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) return res.json({ members: [] });

    const me = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!me) return res.status(404).json({ error: 'User not found' });

    const members = await prisma.user.findMany({
      where: {
        role: Role.MEMBER,
        id: { not: me.id },
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 15,
      select: { id: true, name: true, email: true, department: true },
    });
    res.json({ members });
  },
};
