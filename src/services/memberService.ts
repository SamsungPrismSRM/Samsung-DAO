const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api/v1';

export type MemberDto = {
  id: string;
  nickname: string;
  walletAddress: string | null;
};

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  } as const;
}

export async function memberLogin(nickname: string): Promise<{ token: string; member: MemberDto }> {
  const res = await fetch(`${API_BASE}/member/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Login failed (${res.status})`);
  }
  return res.json() as Promise<{ token: string; member: MemberDto }>;
}

export async function memberMe(token: string): Promise<{ member: MemberDto }> {
  const res = await fetch(`${API_BASE}/member/me`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const err = new Error('Unauthorized') as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  return res.json() as Promise<{ member: MemberDto }>;
}

export async function memberConnectWallet(
  token: string,
  walletAddress: string
): Promise<{ member: MemberDto }> {
  const res = await fetch(`${API_BASE}/member/connect-wallet`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ walletAddress }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Connect wallet failed (${res.status})`);
  }
  return res.json() as Promise<{ member: MemberDto }>;
}

export async function memberDisconnectWallet(token: string): Promise<{ member: MemberDto }> {
  const res = await fetch(`${API_BASE}/member/disconnect-wallet`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Disconnect failed (${res.status})`);
  }
  return res.json() as Promise<{ member: MemberDto }>;
}
