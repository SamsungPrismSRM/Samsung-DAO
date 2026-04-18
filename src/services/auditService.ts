import { useAuthStore } from '@/stores/useAuthStore';

const API_BASE = 'http://localhost:3001/api/v1';

export interface AuditLogUser {
  id: string;
  name: string;
  email: string;
  role: 'MEMBER' | 'COUNCIL' | 'ADMIN';
  department: string | null;
  hq: string | null;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user: AuditLogUser | null;
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditStatsResponse {
  total: number;
  todayCount: number;
  uniqueUsers: number;
}

export interface AuditLogsQuery {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  search?: string;
  from?: string;
  to?: string;
}

async function getToken(): Promise<string | null> {
  return useAuthStore.getState().freshToken();
}

export const auditService = {
  async getLogs(query: AuditLogsQuery = {}): Promise<AuditLogsResponse> {
    const token = await getToken();
    const params = new URLSearchParams();
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.action) params.set('action', query.action);
    if (query.entityType) params.set('entityType', query.entityType);
    if (query.search) params.set('search', query.search);
    if (query.from) params.set('from', query.from);
    if (query.to) params.set('to', query.to);

    const res = await fetch(`${API_BASE}/audit-logs?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getStats(): Promise<AuditStatsResponse> {
    const token = await getToken();
    const res = await fetch(`${API_BASE}/audit-logs/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch audit stats');
    return res.json();
  },
};
