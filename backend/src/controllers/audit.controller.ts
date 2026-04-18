import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const AuditController = {
  /**
   * GET /api/v1/audit-logs
   * Query params: page, limit, userId, action, entityType, search, from, to
   * Requires COUNCIL or ADMIN role.
   */
  async getLogs(req: Request, res: Response) {
    try {
      // Resolve caller to check role
      const uid = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const caller = await prisma.user.findUnique({ where: { firebase_uid: uid } });
      if (!caller || !['COUNCIL', 'ADMIN'].includes(caller.role)) {
        return res.status(403).json({ error: 'Forbidden — council or admin only' });
      }

      const {
        page,
        limit,
        userId,
        action,
        entityType,
        search,
        from,
        to,
      } = req.query as Record<string, string | undefined>;

      const result = await auditService.getLogs({
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        userId,
        action,
        entityType,
        search,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      });

      res.json(result);
    } catch (err) {
      console.error('[AuditController.getLogs]', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  /**
   * GET /api/v1/audit-logs/stats
   * Returns summary counts (total, today, unique users).
   */
  async getStats(req: Request, res: Response) {
    try {
      const uid = (req as Request & { user?: { uid: string } }).user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const caller = await prisma.user.findUnique({ where: { firebase_uid: uid } });
      if (!caller || !['COUNCIL', 'ADMIN'].includes(caller.role)) {
        return res.status(403).json({ error: 'Forbidden — council or admin only' });
      }

      const stats = await auditService.getStats();
      res.json(stats);
    } catch (err) {
      console.error('[AuditController.getStats]', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
