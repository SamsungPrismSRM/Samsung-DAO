import { getFirebaseToken } from '@/lib/getFirebaseToken';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api/v1';

async function fetchWithAuth(url: string) {
  const token = await getFirebaseToken();
  if (!token) throw new Error('Unauthenticated');
  
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  
  return res.json();
}

export async function fetchMemberMetrics() {
  return fetchWithAuth('/member-dashboard/metrics');
}

export async function fetchMemberDashboard() {
  return fetchWithAuth('/member-dashboard/dashboard');
}

export async function fetchMemberHistory() {
  return fetchWithAuth('/member-dashboard/history');
}

export async function fetchMemberDelegations() {
  return fetchWithAuth('/member-dashboard/delegations');
}
