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

export const EventService = {
  // Giveaway
  async listGiveaways(scope?: string, region?: string | null) {
    const normalizedScope = scope ? normalizeScope(scope) : undefined;
    const normalizedRegion = normalizeRegion(region);
    return prisma.giveaway.findMany({
      where: normalizedScope
        ? {
            scope: normalizedScope,
            ...(normalizedScope === 'LOCAL' ? { region: normalizedRegion } : {}),
          }
        : undefined,
      orderBy: { created_at: 'desc' },
    });
  },
  async createGiveaway(data: {
    title: string;
    prize: string;
    description?: string;
    closesAt: string;
    requireKyc?: boolean;
    allowMultiple?: boolean;
    scope?: string;
    region?: string | null;
    createdBy?: string;
  }) {
    const scope = normalizeScope(data.scope);
    const region = normalizeRegion(data.region);
    if (scope === 'LOCAL' && !region) {
      throw new Error('LOCAL giveaway requires region');
    }
    return prisma.giveaway.create({
      data: {
        title: data.title,
        scope,
        region: scope === 'LOCAL' ? region : null,
        prize: data.prize,
        description: data.description,
        closes_at: new Date(data.closesAt),
        require_kyc: data.requireKyc ?? false,
        allow_multiple: data.allowMultiple ?? false,
        created_by: data.createdBy,
      },
    });
  },

  // Lottery
  async listLotteries(scope?: string, region?: string | null) {
    const normalizedScope = scope ? normalizeScope(scope) : undefined;
    const normalizedRegion = normalizeRegion(region);
    return prisma.lottery.findMany({
      where: normalizedScope
        ? {
            scope: normalizedScope,
            ...(normalizedScope === 'LOCAL' ? { region: normalizedRegion } : {}),
          }
        : undefined,
      orderBy: { created_at: 'desc' },
    });
  },
  async createLottery(data: {
    title: string;
    prize: string;
    drawDate: string;
    minReputation?: number;
    isOnchainRandom?: boolean;
    scope?: string;
    region?: string | null;
    createdBy?: string;
  }) {
    const scope = normalizeScope(data.scope);
    const region = normalizeRegion(data.region);
    if (scope === 'LOCAL' && !region) {
      throw new Error('LOCAL lottery requires region');
    }
    return prisma.lottery.create({
      data: {
        title: data.title,
        scope,
        region: scope === 'LOCAL' ? region : null,
        prize: data.prize,
        draw_date: new Date(data.drawDate),
        min_reputation: data.minReputation ?? 0,
        is_onchain_random: data.isOnchainRandom ?? false,
        created_by: data.createdBy,
      },
    });
  },
};
