import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GovernanceService = {
  async getRules() {
    return prisma.governanceRule.findMany({ orderBy: { key: 'asc' } });
  },

  async updateRule(key: string, value: string, userId?: string) {
    return prisma.governanceRule.update({
      where: { key },
      data: { value, updated_by: userId, updated_at: new Date() },
    });
  },

  async getVotingConfigs() {
    return prisma.votingConfig.findMany({ orderBy: { key: 'asc' } });
  },

  async updateVotingConfig(key: string, value: string) {
    return prisma.votingConfig.update({
      where: { key },
      data: { value, updated_at: new Date() },
    });
  },

  async getVotingRules() {
    return prisma.votingRule.findMany({ orderBy: { created_at: 'asc' } });
  },
};
