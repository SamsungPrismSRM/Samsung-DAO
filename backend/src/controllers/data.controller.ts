import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const DataController = {
  async getProposals(req: Request, res: Response) {
    try {
      const proposals = await prisma.proposal.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          creator: {
            select: { id: true, name: true }
          },
          signaling_votes: true,
          onchain_votes: true,
        }
      });
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async getForum(req: Request, res: Response) {
    try {
      const categories = await prisma.forumCategory.findMany({
        include: {
          _count: {
            select: { posts: true }
          }
        }
      });
      const posts = await prisma.forumPost.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          author: { select: { id: true, name: true } },
          _count: { select: { comments: true } }
        }
      });
      res.json({ categories, posts });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  async getCouncil(req: Request, res: Response) {
    try {
      const councilMembers = await prisma.user.findMany({
        where: { role: 'COUNCIL' },
        include: { wallets: true }
      });
      res.json(councilMembers);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  
  async getCurrentUser(req: Request, res: Response) {
    try {
      // In production, extract user id from req auth token. Using random member for this demo fetch if unauthenticated.
      const userId = (req as any).user?.uid;
      let user;
      if (userId) {
        user = await prisma.user.findUnique({ where: { firebase_uid: userId } });
      } else {
        user = await prisma.user.findFirst({ where: { role: 'MEMBER'} });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
