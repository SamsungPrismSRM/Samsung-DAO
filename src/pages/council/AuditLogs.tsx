import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Search, Filter, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Clock, User, Activity,
  AlertTriangle, RefreshCw, Calendar, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { auditService, AuditLogEntry, AuditStatsResponse } from '@/services/auditService';

// ── Action colour map ─────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN:             'bg-blue-500/15 text-blue-400 border-blue-500/30',
  COUNCIL_LOGIN:          'bg-blue-600/15 text-blue-300 border-blue-600/30',
  USER_ONBOARD:           'bg-teal-500/15 text-teal-400 border-teal-500/30',
  PROPOSAL_CREATED:       'bg-violet-500/15 text-violet-400 border-violet-500/30',
  PROPOSAL_PUBLISHED:     'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  PROPOSAL_APPROVED:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PROPOSAL_REJECTED:      'bg-rose-500/15 text-rose-400 border-rose-500/30',
  SIGNALING_VOTE_CAST:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  ELECTION_VOTE_CAST:     'bg-amber-600/15 text-amber-300 border-amber-600/30',
  ELECTION_CREATED:       'bg-purple-500/15 text-purple-400 border-purple-500/30',
  DELEGATION_CREATED:     'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  DELEGATION_REVOKED:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  LOTTERY_ENTERED:        'bg-pink-500/15 text-pink-400 border-pink-500/30',
  LOTTERY_CREATED:        'bg-pink-600/15 text-pink-300 border-pink-600/30',
  GIVEAWAY_REGISTERED:    'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
  GIVEAWAY_CREATED:       'bg-fuchsia-600/15 text-fuchsia-300 border-fuchsia-600/30',
  RULE_UPDATED:           'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  VOTING_CONFIG_UPDATED:  'bg-yellow-600/15 text-yellow-300 border-yellow-600/30',
  HASHPACK_WALLET_CONNECTED: 'bg-green-500/15 text-green-400 border-green-500/30',
  METAMASK_WALLET_CONNECTED: 'bg-green-600/15 text-green-400 border-green-600/30',
  DFNS_WALLET_CREATED:    'bg-lime-500/15 text-lime-400 border-lime-500/30',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN:   'bg-red-500/20 text-red-300 border-red-500/30',
  COUNCIL: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  MEMBER:  'bg-sky-500/20 text-sky-300 border-sky-500/30',
};

const ENTITY_TYPES = ['', 'USER', 'PROPOSAL', 'ELECTION', 'DELEGATION', 'LOTTERY', 'GIVEAWAY', 'WALLET', 'GOVERNANCE_RULE', 'VOTING_CONFIG'];
const ACTIONS = [
  '', 'USER_LOGIN', 'COUNCIL_LOGIN', 'USER_ONBOARD',
  'PROPOSAL_CREATED', 'PROPOSAL_PUBLISHED', 'PROPOSAL_APPROVED', 'PROPOSAL_REJECTED',
  'SIGNALING_VOTE_CAST', 'ELECTION_VOTE_CAST', 'ELECTION_CREATED',
  'DELEGATION_CREATED', 'DELEGATION_REVOKED',
  'LOTTERY_ENTERED', 'LOTTERY_CREATED',
  'GIVEAWAY_REGISTERED', 'GIVEAWAY_CREATED',
  'RULE_UPDATED', 'VOTING_CONFIG_UPDATED',
  'HASHPACK_WALLET_CONNECTED', 'METAMASK_WALLET_CONNECTED',
];

function badgeClass(map: Record<string, string>, key: string, fallback: string) {
  return map[key] ?? fallback;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function shortId(id: string) {
  return id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

// ── Metadata expander ─────────────────────────────────────────────────────────
function MetaExpander({ data }: { data: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  if (!data || Object.keys(data).length === 0) {
    return <span className="text-xs text-muted-foreground/50 italic">—</span>;
  }
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? 'Collapse' : 'View metadata'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-lg bg-muted/40 border border-border/50 p-3 text-[10px] font-mono text-muted-foreground overflow-x-auto"
          >
            {JSON.stringify(data, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, color, delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-xl border border-border bg-card p-5 flex items-center gap-4"
    >
      <div className={`rounded-lg p-2.5 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStatsResponse | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const LIMIT = 15;

  const fetchData = useCallback(async (pg = 1) => {
    setLoading(true);
    setError(null);
    try {
      const [logsRes, statsRes] = await Promise.all([
        auditService.getLogs({
          page: pg,
          limit: LIMIT,
          search: search || undefined,
          action: actionFilter || undefined,
          entityType: entityFilter || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        }),
        auditService.getStats(),
      ]);
      setLogs(logsRes.logs);
      setTotal(logsRes.total);
      setTotalPages(logsRes.totalPages);
      setStats(statsRes);
    } catch (e) {
      setError('Failed to load audit logs. Ensure you are logged in as a Council or Admin member.');
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, entityFilter, fromDate, toDate]);

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [search, actionFilter, entityFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData(page);
  }, [page]);

  // CSV export
  const exportCSV = () => {
    const headers = ['Timestamp', 'User Name', 'User Email', 'Role', 'Department', 'HQ', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'Metadata'];
    const rows = logs.map((l) => [
      formatDate(l.created_at),
      l.user?.name ?? 'System',
      l.user?.email ?? '—',
      l.user?.role ?? '—',
      l.user?.department ?? '—',
      l.user?.hq ?? '—',
      l.action,
      l.entity_type,
      l.entity_id,
      l.ip_address ?? '—',
      l.metadata ? JSON.stringify(l.metadata) : '—',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 border border-primary/20">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Full traceability of all system actions and user events
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchData(page)} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </motion.div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={Activity}    label="Total events logged"  value={stats.total.toLocaleString()}      color="bg-primary/10 text-primary"         delay={0} />
          <StatCard icon={Clock}       label="Events today"          value={stats.todayCount.toLocaleString()} color="bg-amber-500/10 text-amber-400"      delay={0.06} />
          <StatCard icon={User}        label="Unique users acting"   value={stats.uniqueUsers.toLocaleString()} color="bg-emerald-500/10 text-emerald-400" delay={0.12} />
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              id="audit-search"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          {/* Action filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger id="audit-action-filter" className="h-9 text-sm">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a} value={a}>{a || 'All actions'}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Entity type filter */}
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger id="audit-entity-filter" className="h-9 text-sm">
              <SelectValue placeholder="All entity types" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t || 'All entity types'}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <div className="flex gap-2 items-center sm:col-span-2 lg:col-span-1">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              id="audit-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 text-sm flex-1"
              title="From date"
            />
            <span className="text-muted-foreground text-xs">–</span>
            <Input
              id="audit-to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 text-sm flex-1"
              title="To date"
            />
          </div>
        </div>

        {(search || actionFilter || entityFilter || fromDate || toDate) && (
          <button
            onClick={() => { setSearch(''); setActionFilter(''); setEntityFilter(''); setFromDate(''); setToDate(''); }}
            className="mt-3 text-xs text-primary hover:underline"
          >
            Clear all filters
          </button>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {/* Table header */}
        <div className="px-6 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {loading ? 'Loading…' : `${total.toLocaleString()} events`}
          </span>
          <span className="text-xs text-muted-foreground">
            Page {page} / {totalPages}
          </span>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-center max-w-sm">{error}</p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <div className="divide-y divide-border/50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex gap-4">
                <div className="h-4 w-32 rounded bg-muted/50" />
                <div className="h-4 flex-1 rounded bg-muted/50" />
                <div className="h-4 w-24 rounded bg-muted/50" />
              </div>
            ))}
          </div>
        )}

        {/* Log rows */}
        {!loading && !error && (
          <>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <ShieldCheck className="h-8 w-8 opacity-30" />
                <p className="text-sm">No audit events match your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                <AnimatePresence mode="popLayout">
                  {logs.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="px-6 py-4 hover:bg-muted/20 transition-colors group"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_1fr_auto] gap-3 items-start">
                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono shrink-0">
                          <Clock className="h-3 w-3 opacity-60" />
                          {formatDate(log.created_at)}
                        </div>

                        {/* User block */}
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <div className="h-6 w-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                                {(log.user?.name ?? 'S').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-foreground truncate">
                                {log.user?.name ?? <span className="italic text-muted-foreground">System</span>}
                              </span>
                            </div>
                            {log.user?.role && (
                              <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeClass(ROLE_COLORS, log.user.role, 'bg-muted text-muted-foreground border-border')}`}>
                                {log.user.role}
                              </span>
                            )}
                          </div>
                          {log.user?.email && (
                            <span className="text-xs text-muted-foreground truncate">{log.user.email}</span>
                          )}
                          {(log.user?.department || log.user?.hq) && (
                            <span className="text-[10px] text-muted-foreground/70">
                              {[log.user.department, log.user.hq].filter(Boolean).join(' · ')}
                            </span>
                          )}
                          {log.ip_address && (
                            <span className="text-[10px] font-mono text-muted-foreground/60">IP: {log.ip_address}</span>
                          )}
                        </div>

                        {/* Action + Entity */}
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <span className={`inline-flex self-start items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${badgeClass(ACTION_COLORS, log.action, 'bg-muted/50 text-muted-foreground border-border')}`}>
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="font-mono bg-muted/40 rounded px-1 py-0.5 text-[10px] border border-border/50">
                              {log.entity_type}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground/60 truncate" title={log.entity_id}>
                              {shortId(log.entity_id)}
                            </span>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div className="lg:min-w-[140px]">
                          <MetaExpander data={log.metadata} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <span className="text-sm text-muted-foreground">
            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <Button
              id="audit-prev-page"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </Button>

            {/* Page pills */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    id={`audit-page-${pg}`}
                    onClick={() => setPage(pg)}
                    className={`h-8 w-8 rounded-lg text-sm font-mono transition-colors ${
                      pg === page
                        ? 'bg-primary text-primary-foreground font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>

            <Button
              id="audit-next-page"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
