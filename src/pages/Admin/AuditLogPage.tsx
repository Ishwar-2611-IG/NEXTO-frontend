import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  EmptyState,
  FilterBar,
  PageHeader,
  SkeletonTable,
  useToast,
} from '../../components/admin/index';
import type { FilterConfig } from '../../components/admin/index';
import { api } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AuditActor {
  _id: string;
  name?: string;
  email?: string;
}

export interface AuditLog {
  _id: string;
  userId?: AuditActor | string | null;
  actorUserId?: AuditActor | string | null;
  action: string;
  resourceType?: string;
  entityType?: string;
  resourceId?: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  createdAt: string;
}

interface AuditLogPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AuditLogsResponse {
  logs?: AuditLog[];
  items?: AuditLog[];
  pagination?: Partial<AuditLogPagination>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_LIMIT = 25;

const RESOURCE_TYPE_OPTIONS = [
  { value: 'product', label: 'Product' },
  { value: 'order', label: 'Order' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'user', label: 'User' },
  { value: 'refund', label: 'Refund' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'coupon', label: 'Coupon' },
  { value: 'category', label: 'Category' },
  { value: 'review', label: 'Review' },
  { value: 'settings', label: 'Settings' },
];

const AUDIT_FILTERS: FilterConfig[] = [
  {
    key: 'action',
    label: 'Action',
    type: 'search',
    placeholder: 'Filter by action (e.g. product.created)...',
  },
  {
    key: 'resourceType',
    label: 'Resource Type',
    type: 'select',
    placeholder: 'All Resource Types',
    options: RESOURCE_TYPE_OPTIONS,
  },
  {
    key: 'dateRange',
    label: 'Date',
    type: 'daterange',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getActorInfo(log: AuditLog): { name: string; email: string } {
  const actor = log.userId ?? log.actorUserId;
  if (actor && typeof actor === 'object') {
    return {
      name: actor.name?.trim() || 'Admin User',
      email: actor.email?.trim() || actor._id,
    };
  }
  if (typeof actor === 'string' && actor.trim()) {
    return {
      name: 'User',
      email: truncateId(actor.trim()),
    };
  }
  return { name: 'System', email: 'Automated process' };
}

function getResourceType(log: AuditLog): string {
  return log.resourceType || log.entityType || 'unknown';
}

function getResourceId(log: AuditLog): string {
  return log.resourceId || log.entityId || '—';
}

function truncateId(id: string, maxLength = 14): string {
  if (!id || id.length <= maxLength) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function formatFullDateTime(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

function formatJsonBlock(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function escapeCsvCell(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

function resolveDiffSections(log: AuditLog): {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
} {
  const rawMeta = isRecord(log.metadata) ? log.metadata : null;
  const before = isRecord(log.before)
    ? log.before
    : rawMeta && isRecord(rawMeta.before)
      ? rawMeta.before
      : null;
  const after = isRecord(log.after)
    ? log.after
    : rawMeta && isRecord(rawMeta.after)
      ? rawMeta.after
      : null;

  let metadata: Record<string, unknown> | null = null;
  if (rawMeta && Object.keys(rawMeta).length > 0) {
    metadata = rawMeta;
  }

  return { before, after, metadata };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AuditLogPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const pageParam = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const actionParam = searchParams.get('action') || '';
  const resourceTypeParam = searchParams.get('resourceType') || '';
  const fromParam = searchParams.get('from') || '';
  const toParam = searchParams.get('to') || '';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(pageParam));
      qs.set('limit', String(PAGE_LIMIT));
      if (actionParam.trim()) {
        qs.set('action', actionParam.trim());
      }
      if (resourceTypeParam.trim()) {
        qs.set('entityType', resourceTypeParam.trim());
      }
      if (fromParam) qs.set('from', fromParam);
      if (toParam) qs.set('to', toParam);

      const response = await api.get<AuditLogsResponse>(`/admin/audit-logs?${qs.toString()}`);
      const list = Array.isArray(response?.logs)
        ? response.logs
        : Array.isArray(response?.items)
          ? response.items
          : [];

      setLogs(list);
      setTotalPages(Math.max(1, response?.pagination?.pages ?? 1));
      setTotalCount(response?.pagination?.total ?? list.length);
      setExpandedIds(new Set());
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Could not load audit logs.';
      setError(message);
      toast({ message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [pageParam, actionParam, resourceTypeParam, fromParam, toParam, toast]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  // Client-side date range filter (preserves compatibility with backend strict query schema)
  const visibleLogs = useMemo(() => {
    if (!fromParam && !toParam) return logs;
    const fromTime = fromParam ? new Date(`${fromParam}T00:00:00.000`).getTime() : null;
    const toTime = toParam ? new Date(`${toParam}T23:59:59.999`).getTime() : null;

    return logs.filter((log) => {
      const created = new Date(log.createdAt).getTime();
      if (Number.isNaN(created)) return true;
      if (fromTime !== null && !Number.isNaN(fromTime) && created < fromTime) return false;
      if (toTime !== null && !Number.isNaN(toTime) && created > toTime) return false;
      return true;
    });
  }, [logs, fromParam, toParam]);

  const filterValues = useMemo<Record<string, string>>(
    () => ({
      action: actionParam,
      resourceType: resourceTypeParam,
      dateRange: fromParam || toParam ? `${fromParam},${toParam}` : '',
      dateRange_start: fromParam,
      dateRange_end: toParam,
    }),
    [actionParam, resourceTypeParam, fromParam, toParam]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (key === 'dateRange') {
            const [start = '', end = ''] = value.includes(',') ? value.split(',') : ['', ''];
            if (start) next.set('from', start);
            else next.delete('from');
            if (end) next.set('to', end);
            else next.delete('to');
          } else if (key === 'dateRange_start') {
            if (value) next.set('from', value);
            else next.delete('from');
          } else if (key === 'dateRange_end') {
            if (value) next.set('to', value);
            else next.delete('to');
          } else {
            if (value.trim()) next.set(key, value.trim());
            else next.delete(key);
          }
          next.set('page', '1');
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleResetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('page', String(Math.max(1, nextPage)));
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExportCsv = useCallback(() => {
    if (visibleLogs.length === 0) {
      toast({ message: 'No audit log entries to export.', type: 'info' });
      return;
    }

    const headers = [
      'ID',
      'Actor Name',
      'Actor Email',
      'Action',
      'Resource Type',
      'Resource ID',
      'IP Address',
      'Created At',
      'Metadata',
    ];

    const rows = visibleLogs.map((log) => {
      const actor = getActorInfo(log);
      return [
        log._id,
        actor.name,
        actor.email,
        log.action,
        getResourceType(log),
        getResourceId(log),
        log.ipAddress || '',
        log.createdAt,
        log.metadata ? JSON.stringify(log.metadata) : '',
      ]
        .map((cell) => escapeCsvCell(String(cell)))
        .join(',');
    });

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `nexto-audit-logs-p${pageParam}-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ message: `Exported ${visibleLogs.length} audit log records to CSV.`, type: 'success' });
  }, [visibleLogs, pageParam, toast]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="Audit Log"
        subtitle="Immutable record of administrative mutations, access updates, and operational events."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchLogs()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[#E5E4DF] bg-white px-3.5 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2] disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={loading || visibleLogs.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#162a21] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        }
      />

      <FilterBar
        filters={AUDIT_FILTERS}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => void fetchLogs()}
            className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {/* Immutable Audit Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : visibleLogs.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={26} />}
          title="No audit logs found"
          description={
            actionParam || resourceTypeParam || fromParam || toParam
              ? 'No audit events match your current filter criteria. Try resetting the filters.'
              : 'Administrative and security events will appear here automatically as activity occurs.'
          }
          action={
            actionParam || resourceTypeParam || fromParam || toParam ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="rounded-lg border border-[#E5E4DF] bg-white px-4 py-2 text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2]"
              >
                Reset Filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E5E4DF] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-[#E5E4DF] bg-[#FAF9F6]">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    Actor
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    Action
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    Resource
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    IP Address
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    Date
                  </th>
                  <th className="w-16 px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
                    Details
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E5E4DF] bg-white">
                {visibleLogs.map((log) => {
                  const isExpanded = expandedIds.has(log._id);
                  const actor = getActorInfo(log);
                  const resType = getResourceType(log);
                  const resId = getResourceId(log);
                  const { before, after, metadata } = resolveDiffSections(log);

                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        className={`transition-colors hover:bg-[#F7F6F2] ${
                          isExpanded ? 'bg-[#E8EDE9]/30' : ''
                        }`}
                      >
                        <td className="px-5 py-4 align-middle">
                          <p className="font-medium text-[#1A1A1A]">{actor.name}</p>
                          <p className="text-xs text-[#6B6B65]">{actor.email}</p>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <span className="inline-flex items-center rounded-md border border-[#1F3A2E]/15 bg-[#E8EDE9] px-2.5 py-1 font-mono text-xs font-medium text-[#1F3A2E]">
                            {log.action}
                          </span>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold uppercase tracking-wide text-[#1A1A1A]">
                              {resType.replace(/_/g, ' ')}
                            </span>
                            <span
                              title={resId}
                              className="font-mono text-xs text-[#6B6B65]"
                            >
                              {truncateId(resId)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle font-mono text-xs text-[#6B6B65]">
                          {log.ipAddress?.trim() || '—'}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 align-middle text-xs text-[#1A1A1A]">
                          {formatFullDateTime(log.createdAt)}
                        </td>

                        <td className="px-4 py-4 text-right align-middle">
                          <button
                            type="button"
                            onClick={() => toggleExpand(log._id)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? 'Collapse event details' : 'Expand event details'}
                            className="inline-flex items-center justify-center rounded-lg border border-[#E5E4DF] bg-white p-1.5 text-[#6B6B65] transition-colors hover:bg-[#F7F6F2] hover:text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
                          >
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#FAF9F6]">
                          <td colSpan={6} className="px-6 py-5">
                            <div className="space-y-4">
                              {/* Contextual identifiers */}
                              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-[#6B6B65]">
                                <span>
                                  <strong className="text-[#1A1A1A]">Log ID:</strong>{' '}
                                  <code className="font-mono">{log._id}</code>
                                </span>
                                <span>
                                  <strong className="text-[#1A1A1A]">Resource ID:</strong>{' '}
                                  <code className="font-mono">{resId}</code>
                                </span>
                                {log.requestId && (
                                  <span>
                                    <strong className="text-[#1A1A1A]">Request ID:</strong>{' '}
                                    <code className="font-mono">{log.requestId}</code>
                                  </span>
                                )}
                                {log.userAgent && (
                                  <span className="max-w-md truncate" title={log.userAgent}>
                                    <strong className="text-[#1A1A1A]">User Agent:</strong>{' '}
                                    {log.userAgent}
                                  </span>
                                )}
                              </div>

                              {/* Before & After side-by-side diff */}
                              {before && after ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
                                      Before
                                    </p>
                                    <pre className="max-h-72 overflow-auto rounded-lg border border-[#E5E4DF] bg-[#F2F1EC] p-3.5 font-mono text-xs leading-relaxed text-[#1A1A1A]">
                                      {formatJsonBlock(before)}
                                    </pre>
                                  </div>
                                  <div>
                                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#1F3A2E]">
                                      After
                                    </p>
                                    <pre className="max-h-72 overflow-auto rounded-lg border border-[#E5E4DF] bg-[#F2F1EC] p-3.5 font-mono text-xs leading-relaxed text-[#1A1A1A]">
                                      {formatJsonBlock(after)}
                                    </pre>
                                  </div>
                                </div>
                              ) : after ? (
                                <div>
                                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#1F3A2E]">
                                    Created
                                  </p>
                                  <pre className="max-h-72 overflow-auto rounded-lg border border-[#E5E4DF] bg-[#F2F1EC] p-3.5 font-mono text-xs leading-relaxed text-[#1A1A1A]">
                                    {formatJsonBlock(after)}
                                  </pre>
                                </div>
                              ) : null}

                              {/* Metadata block */}
                              {metadata && (
                                <div>
                                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
                                    Metadata
                                  </p>
                                  <pre className="max-h-72 overflow-auto rounded-lg border border-[#E5E4DF] bg-[#F2F1EC] p-3.5 font-mono text-xs leading-relaxed text-[#1A1A1A]">
                                    {formatJsonBlock(metadata)}
                                  </pre>
                                </div>
                              )}

                              {!before && !after && !metadata && (
                                <p className="text-xs italic text-[#6B6B65]">
                                  No structured diff or metadata was attached to this audit record.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E4DF] bg-[#FAF9F6] px-6 py-3.5 text-xs text-[#6B6B65] sm:flex-row">
            <div>
              Showing <span className="font-semibold text-[#1A1A1A]">{visibleLogs.length}</span> of{' '}
              <span className="font-semibold text-[#1A1A1A]">{totalCount}</span> events • Page{' '}
              <span className="font-semibold text-[#1A1A1A]">{pageParam}</span> of{' '}
              <span className="font-semibold text-[#1A1A1A]">{totalPages}</span>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={pageParam <= 1}
                  onClick={() => handlePageChange(pageParam - 1)}
                  className="rounded-md border border-[#E5E4DF] bg-white px-3 py-1.5 font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) => p === 1 || p === totalPages || Math.abs(p - pageParam) <= 1
                  )
                  .reduce<Array<number | '...'>>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push('...');
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-2 py-1 text-[#6B6B65]">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${item}`}
                        type="button"
                        onClick={() => handlePageChange(item)}
                        className={`min-w-[2rem] rounded-md border px-2.5 py-1.5 font-medium transition-colors ${
                          pageParam === item
                            ? 'border-[#1F3A2E] bg-[#1F3A2E] text-white'
                            : 'border-[#E5E4DF] bg-white text-[#1A1A1A] hover:bg-[#F7F6F2]'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                <button
                  type="button"
                  disabled={pageParam >= totalPages}
                  onClick={() => handlePageChange(pageParam + 1)}
                  className="rounded-md border border-[#E5E4DF] bg-white px-3 py-1.5 font-medium text-[#1A1A1A] transition-colors hover:bg-[#F7F6F2] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AuditLogPage;
