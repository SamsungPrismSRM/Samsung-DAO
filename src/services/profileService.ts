const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api/v1';

export type ProfileApiResponse = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  hq: string | null;
  alias: string | null;
  wallet: {
    connected: boolean;
    hederaAccountId: string | null;
    dfnsWalletId: string | null;
    walletType: string | null;
    source: 'user_wallet' | 'hq_treasury' | null;
    hbarBalance: string | null;
  };
  stats: {
    votingPower: number;
    proposals: number;
    votes: number;
  };
};

export async function getProfile(): Promise<ProfileApiResponse> {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_BASE}/profile/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    const err = new Error('Unauthorized') as Error & { status: number };
    err.status = 401;
    throw err;
  }

  if (res.status === 404) {
    let message = 'User not initialized';
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* use default */
    }
    const err = new Error(message) as Error & { status: number };
    err.status = 404;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Profile request failed: ${res.status}`);
  }

  return res.json() as Promise<ProfileApiResponse>;
}
