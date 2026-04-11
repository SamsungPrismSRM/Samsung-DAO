import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ElectionService = {
  async list() {
    return prisma.election.findMany({
      include: { candidates: true },
      orderBy: { created_at: 'desc' },
    });
  },

  async create(data: {
    title: string;
    type?: string;
    startDate: string;
    endDate: string;
    requireReputation?: boolean;
    allowDelegation?: boolean;
    snapshotEligibility?: boolean;
    candidates?: { name: string; department?: string }[];
    createdBy?: string;
  }) {
    const eligibleCount = await prisma.user.count({ where: { role: 'MEMBER' } });
    return prisma.election.create({
      data: {
        title: data.title,
        type: data.type ?? 'single_choice',
        start_date: new Date(data.startDate),
        end_date: new Date(data.endDate),
        require_reputation: data.requireReputation ?? false,
        allow_delegation: data.allowDelegation ?? false,
        snapshot_eligibility: data.snapshotEligibility ?? false,
        eligible_count: eligibleCount,
        created_by: data.createdBy,
        candidates: data.candidates?.length
          ? { create: data.candidates.map((c) => ({ name: c.name, department: c.department })) }
          : undefined,
      },
      include: { candidates: true },
    });
  },
};
