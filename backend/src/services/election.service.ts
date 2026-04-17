import { PrismaClient, ProposalRegion, ProposalScope } from '@prisma/client';

const prisma = new PrismaClient();
const REGIONS: ProposalRegion[] = ['INDIA', 'KOREA', 'US'];

function normalizeScope(scope?: string): ProposalScope {
  return scope === 'LOCAL' ? 'LOCAL' : 'GLOBAL';
}

function normalizeRegion(region?: string | null): ProposalRegion | null {
  if (!region) return null;
  const normalized = region.toUpperCase() as ProposalRegion;
  return REGIONS.includes(normalized) ? normalized : null;
}

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
    scope?: string;
    region?: string | null;
    createdBy?: string;
  }) {
    const scope = normalizeScope(data.scope);
    const region = normalizeRegion(data.region);
    if (scope === 'LOCAL' && !region) {
      throw new Error('LOCAL election requires region');
    }
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
        scope,
        region: scope === 'LOCAL' ? region : null,
        created_by: data.createdBy,
        candidates: data.candidates?.length
          ? { create: data.candidates.map((c) => ({ name: c.name, department: c.department })) }
          : undefined,
      },
      include: { candidates: true },
    });
  },
};
