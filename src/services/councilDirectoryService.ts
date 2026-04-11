const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api/v1';

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

export async function fetchCouncilHqDirectory(): Promise<CouncilHqDirectoryEntry[]> {
  const res = await fetch(`${API_BASE}/data/council-hqs`);
  if (!res.ok) {
    throw new Error('Failed to load council HQs');
  }
  const data = (await res.json()) as { hqs: CouncilHqDirectoryEntry[] };
  return data.hqs ?? [];
}
