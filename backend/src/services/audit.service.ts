import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogInput {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export interface GetLogsOptions {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  search?: string;
  from?: Date;
  to?: Date;
}

export const auditService = {
  /**
   * Persist a single audit event. Fire-and-forget — errors are swallowed to
   * avoid breaking the caller's response path.
   */
  async logAction(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: input.userId ?? null,
          action: input.action,
          entity_type: input.entityType,
          entity_id: input.entityId,
          metadata: input.metadata ?? {},
          ip_address: input.ipAddress ?? null,
        },
      });
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', err);
    }
  },

  /**
   * Return paginated audit logs, with optional filters.
   */
  async getLogs(opts: GetLogsOptions = {}) {
    const page = Math.max(1, opts.page ?? 1);
    const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Parameters<typeof prisma.auditLog.findMany>[0]['where'] = {};

    if (opts.userId) where.user_id = opts.userId;
    if (opts.action) where.action = { contains: opts.action, mode: 'insensitive' };
    if (opts.entityType) where.entity_type = { equals: opts.entityType, mode: 'insensitive' };
    if (opts.from || opts.to) {
      where.created_at = {};
      if (opts.from) where.created_at.gte = opts.from;
      if (opts.to) where.created_at.lte = opts.to;
    }

    // Free-text search across user name/email using relation filter
    if (opts.search) {
      where.user = {
        OR: [
          { name: { contains: opts.search, mode: 'insensitive' } },
          { email: { contains: opts.search, mode: 'insensitive' } },
        ],
      };
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              department: true,
              hq: true,
            },
          },
        },
      }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Quick summary stats for the dashboard strip.
   */
  async getStats() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [total, todayCount, uniqueUsers] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.count({ where: { created_at: { gte: today } } }),
      prisma.auditLog.findMany({
        select: { user_id: true },
        distinct: ['user_id'],
      }),
    ]);

    return {
      total,
      todayCount,
      uniqueUsers: uniqueUsers.length,
    };
  },
};
