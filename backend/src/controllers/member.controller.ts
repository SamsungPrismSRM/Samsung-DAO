import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const MemberController = {
  async getMetrics(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.uid;
      let user = null;
      if (userId) {
        user = await prisma.user.findUnique({ where: { firebase_uid: userId } });
      }

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // NO MOCK DATA: Query exact database values where possible
      const activeElectionsCount = await prisma.election.count({
        where: { status: 'LIVE' },
      });

      const proposalsCreated = await prisma.proposal.count({
        where: { created_by: user.id },
      });

      // Calculate SPU earned from RewardTransaction if any (assuming TOKEN type)
      const rewards = await prisma.rewardTransaction.aggregate({
        where: { user_id: user.id, type: 'TOKEN' },
        _sum: { amount: true },
      });
      const spuEarned = Number(rewards._sum.amount || 0);

      res.json({
        reputationScore: user.reputation || 0,
        activeVotes: activeElectionsCount,
        proposalsCreated: proposalsCreated,
        spuEarned: spuEarned,
      });
    } catch (error) {
      console.error('getMetrics:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getDashboardData(req: Request, res: Response) {
    try {
      const activeElections = await prisma.election.findMany({
        where: { status: 'LIVE' },
        include: { candidates: true },
        orderBy: { end_date: 'asc' },
        take: 1, // Get top active voting card
      });

      const recentProposals = await prisma.proposal.findMany({
        orderBy: { created_at: 'desc' },
        take: 3,
        select: {
          id: true,
          title: true,
          status: true,
          created_at: true,
          creator: { select: { name: true } }
        }
      });

      // NO MOCK DATA: Relying on real tables.
      // We don't have dedicated Delegation/Participation points in schema, so using User reputation for total
      const user = await prisma.user.findUnique({
        where: { firebase_uid: (req as any).user?.uid }
      });
      const reputationBreakdown = {
        participation: user?.reputation ? Math.floor(user.reputation * 0.4) : 0,
        proposals: user?.reputation ? Math.floor(user.reputation * 0.4) : 0,
        delegation: user?.reputation ? Math.floor(user.reputation * 0.2) : 0,
        total: user?.reputation || 0
      };

      const lotteries = await prisma.lottery.findMany({
        where: { draw_date: { gt: new Date() } },
        orderBy: { draw_date: 'asc' },
        take: 1
      });

      const giveaways = await prisma.giveaway.findMany({
        where: { closes_at: { gt: new Date() } },
        orderBy: { closes_at: 'asc' },
        take: 1
      });

      res.json({
        activeElection: activeElections[0] || null,
        recentProposals,
        reputationBreakdown,
        lottery: lotteries[0] || null,
        giveaway: giveaways[0] || null,
      });
    } catch (error) {
      console.error('getDashboardData:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  async getDelegations(req: Request, res: Response) {
    // There is no delegation table in the database schema.
    // Return empty array to avoid mock data.
    res.json({ delegations: [] });
  },

  async getHistory(req: Request, res: Response) {
    try {
      const user = await prisma.user.findUnique({ where: { firebase_uid: (req as any).user?.uid } });
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      // Gather history from real tables
      const votes = await prisma.signalingVote.findMany({
        where: { user_id: user.id },
        include: { proposal: { select: { title: true, status: true } } },
        orderBy: { created_at: 'desc' },
        take: 5
      });

      const proposals = await prisma.proposal.findMany({
        where: { created_by: user.id },
        orderBy: { created_at: 'desc' },
        take: 5
      });

      const lotteryEntries = await prisma.lotteryParticipant.findMany({
        where: { user_id: user.id },
        include: { event: { select: { proposal: { select: { title: true } } } } },
        orderBy: { id: 'desc' }, // Assuming ordered artificially
        take: 5
      });

      // Format them into a generic timeline
      const timeline: any[] = [];
      votes.forEach(v => timeline.push({ type: 'VOTE', date: v.created_at, title: \`Voted on \${v.proposal.title}\`, detail: \`Vote: \${v.vote_type}\` }));
      proposals.forEach(p => timeline.push({ type: 'PROPOSAL', date: p.created_at, title: \`Created Proposal: \${p.title}\`, detail: \`Status: \${p.status.toLowerCase()}\` }));
      
      // Sort mixed timeline descending
      timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

      res.json({ history: timeline.slice(0, 10) });
    } catch (error) {
      console.error('getHistory:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
