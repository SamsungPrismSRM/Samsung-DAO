import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const COUNCIL_ONLINE_WINDOW_MS = 120_000;

export type CouncilHqDirectoryEntry = {
  hqId: string;
  displayName: string;
  location: string;
  region: string;
  timezone: string | null;
  hederaAccountId: string | null;
  status: 'online' | 'offline';
  lastSeenAt: string | null;
};

function splitHqDisplayName(fullName: string): { displayName: string; location: string } {
  const m = fullName.match(/^(.+?)\s+\(([^)]+)\)\s*$/);
  if (m) {
    return { displayName: m[1].trim(), location: m[2].trim() };
  }
  return { displayName: fullName.trim(), location: fullName.trim() };
}

export async function listCouncilHqDirectory(): Promise<CouncilHqDirectoryEntry[]> {
  const councilUsers = await prisma.user.findMany({
    where: { role: 'COUNCIL', hq: { not: null } },
    select: { hq: true, last_seen_at: true },
  });

  const hqIds = [...new Set(councilUsers.map((u) => u.hq!).filter(Boolean))];
  if (hqIds.length === 0) return [];

  const [hqRows, hqWallets] = await Promise.all([
    prisma.hQ.findMany({ where: { id: { in: hqIds } } }),
    prisma.hQWallet.findMany({ where: { hq: { in: hqIds } } }),
  ]);

  const now = Date.now();

  const entries: CouncilHqDirectoryEntry[] = hqIds.map((hqId) => {
    const hq = hqRows.find((h) => h.id === hqId);
    const wallet = hqWallets.find((w) => w.hq === hqId);
    const usersHere = councilUsers.filter((u) => u.hq === hqId);
    const latestMs = Math.max(
      0,
      ...usersHere.map((u) => (u.last_seen_at ? u.last_seen_at.getTime() : 0))
    );
    const lastSeenAt = latestMs > 0 ? new Date(latestMs).toISOString() : null;
    const online = latestMs > 0 && now - latestMs < COUNCIL_ONLINE_WINDOW_MS;

    const fullName = hq?.name ?? hqId;
    const { displayName, location } = splitHqDisplayName(fullName);

    return {
      hqId,
      displayName,
      location,
      region: hq?.region ?? '—',
      timezone: hq?.timezone ?? null,
      hederaAccountId: wallet?.hedera_account_id ?? null,
      status: online ? 'online' : 'offline',
      lastSeenAt,
    };
  });

  entries.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return entries;
}
