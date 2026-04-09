import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const UserController = {
  async me(req: Request, res: Response) {
    try {
      const firebaseUser = (req as any).user;
      
      const user = await prisma.user.findUnique({
        where: { firebase_uid: firebaseUser.uid },
        include: { wallets: true }
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      res.status(200).json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
