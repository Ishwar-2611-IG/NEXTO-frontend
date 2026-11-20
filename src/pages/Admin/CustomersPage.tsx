import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  Eye,
  MapPin,
  Save,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  StickyNote,
  Users,
  XCircle,
} from 'lucide-react';
import {
  ConfirmModal,
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  SlideOverDrawer,
  StatusBadge,
  useToast,
} from '../../components/admin';
import type { Column, FilterConfig } from '../../components/admin';
import { ApiError, api } from '../../services/api';

type UserRole = 'customer' | 'support' | 'inventory_manager' | 'admin';

interface CustomerRecord {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface CustomersResponse {
  items: CustomerRecord[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit?: number;
  };
}

interface CustomerOrder {
  _id: string;
  total: number;
  orderStatus: string;
  paymentStatus?: string;
  createdAt: string;
  userId?: {
    _id?: string;
    name?: string;
    email?: string;
  } | string;
}

interface CustomerNote {
  _id?: string;
  text: string;
  createdAt: string;
  actorUserId?: { name?: string; email?: string } | string;
}

interface AdminOrdersResponse {
  orders?: CustomerOrder[];
  items?: CustomerOrder[];
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'customer', label: 'Customer' },
  { value: 'support', label: 'Support' },
  { value: 'inventory_manager', label: 'Inventory Manager' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  support: 'Support',
  inventory_manager: 'Inventory Manager',
  admin: 'Admin',
};

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: 'search',
    label: 'customers',
    type: 'search',
    placeholder: 'Search by name or email...',
  },
  {
    key: 'role',
    label: 'Roles',
    type: 'select',
    placeholder: 'All Roles',
    options: ROLE_OPTIONS,
  },
  {
    key: 'status',
    label: 'Statuses',
    type: 'select',
    placeholder: 'All Statuses',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'blocked', label: 'Blocked' },
    ],
  },
];

const PAGE_LIMIT = 20;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatInr(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function isUserRole(value: string): value is UserRole {
  return (
    value === 'customer' ||
    value === 'support' ||
    value === 'inventory_manager' ||
    value === 'admin'
  );
}

export function CustomersPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const pageParam = Number(searchParams.get('page') || '1');
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1;
  const search = searchParams.get('search') || '';
  const roleFilter = searchParams.get('role') || '';
  const statusFilter = searchParams.get('status') || '';

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [blockTarget, setBlockTarget] = useState<CustomerRecord | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const [noteHistory, setNoteHistory] = useState<CustomerNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [draftNote, setDraftNote] = useState('');

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));
      if (search.trim()) params.set('search', search.trim());
      if (roleFilter && isUserRole(roleFilter)) params.set('role', roleFilter);
      if (statusFilter === 'active' || statusFilter === 'blocked') {
        params.set('status', statusFilter);
      }

      const result = await api.get<CustomersResponse>(`/admin/customers?${params.toString()}`);
      setCustomers(result.items);
      setTotalPages(Math.max(1, result.pagination.pages || 1));
      setTotalCount(result.pagination.total ?? result.items.length);
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : 'Failed to load customers.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const loadCustomerOrders = useCallback(async (customerId: string, customerEmail: string) => {
    setOrdersLoading(true);
    setOrdersError('');
    setOrders([]);

    const normalizedEmail = customerEmail.toLowerCase();

    try {
      const result = await api.get<AdminOrdersResponse>(
        `/orders/admin?page=1&limit=5&search=${encodeURIComponent(customerEmail)}`
      );
      const rawOrders = result.orders ?? result.items ?? [];
      setOrders(rawOrders.slice(0, 5));
    } catch (cause: unknown) {
      if (cause instanceof ApiError && cause.status === 400) {
        try {
          const fallback = await api.get<AdminOrdersResponse>('/orders/admin?page=1&limit=50');
          const allOrders = fallback.orders ?? fallback.items ?? [];
          const matched = allOrders
            .filter((order) => {
              if (typeof order.userId === 'string') {
                return order.userId === customerId;
              }
              if (order.userId?.email) {
                return order.userId.email.toLowerCase() === normalizedEmail;
              }
              return order.userId?._id === customerId;
            })
            .slice(0, 5);
          setOrders(matched);
          return;
        } catch (fallbackCause: unknown) {
          setOrdersError(
            fallbackCause instanceof Error
              ? fallbackCause.message
              : 'Could not load order history.'
          );
          return;
        }
      }
      setOrdersError(cause instanceof Error ? cause.message : 'Could not load order history.');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const selectedCustomerId = selectedCustomer?._id ?? null;
  const selectedCustomerEmail = selectedCustomer?.email ?? null;

  useEffect(() => {
    if (!selectedCustomerId || !selectedCustomerEmail) {
      setOrders([]);
      setOrdersError('');
      return;
    }
    void loadCustomerOrders(selectedCustomerId, selectedCustomerEmail);
  }, [selectedCustomerId, selectedCustomerEmail, loadCustomerOrders]);

  const openCustomerDrawer = useCallback(
    (customer: CustomerRecord) => {
      setSelectedCustomer(customer);
      setDraftNote('');
      setNoteHistory([]);
    },
    []
  );

  useEffect(() => {
    if (!selectedCustomerId) {
      setNoteHistory([]);
      return;
    }
    let active = true;
    setNotesLoading(true);
    void api
      .get<{ notes: CustomerNote[] }>(`/admin/customers/${selectedCustomerId}/notes`)
      .then((response) => {
        if (active) setNoteHistory(response.notes);
      })
      .catch((cause: unknown) => {
        if (active) {
          toast({
            message: cause instanceof Error ? cause.message : 'Could not load customer notes.',
            type: 'error',
          });
        }
      })
      .finally(() => {
        if (active) setNotesLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCustomerId, toast]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value.trim()) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.set('page', '1');
        return next;
      });
    },
    [setSearchParams]
  );

  const handleResetFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(nextPage));
        return next;
      });
    },
    [setSearchParams]
  );

  const handleRoleChange = useCallback(
    async (customer: CustomerRecord, nextRoleValue: string) => {
      if (!isUserRole(nextRoleValue) || nextRoleValue === customer.role) return;
      setBusyId(customer._id);
      try {
        await api.patch(`/admin/customers/${customer._id}/role`, { role: nextRoleValue });
        setCustomers((prev) =>
          prev.map((item) =>
            item._id === customer._id ? { ...item, role: nextRoleValue } : item
          )
        );
        setSelectedCustomer((prev) =>
          prev && prev._id === customer._id ? { ...prev, role: nextRoleValue } : prev
        );
        toast({
          message: `Updated ${customer.name}'s role to ${ROLE_LABELS[nextRoleValue]}.`,
          type: 'success',
        });
      } catch (cause: unknown) {
        toast({
          message: cause instanceof Error ? cause.message : 'Could not update role.',
          type: 'error',
        });
      } finally {
        setBusyId(null);
      }
    },
    [toast]
  );

  const updateAccountStatus = useCallback(
    async (customer: CustomerRecord, isActive: boolean) => {
      setBusyId(customer._id);
      try {
        await api.patch(`/admin/customers/${customer._id}/status`, { isActive });
        setCustomers((prev) =>
          prev.map((item) => (item._id === customer._id ? { ...item, isActive } : item))
        );
        setSelectedCustomer((prev) =>
          prev && prev._id === customer._id ? { ...prev, isActive } : prev
        );
        toast({
          message: isActive
            ? `${customer.name} has been unblocked.`
            : `${customer.name} has been blocked.`,
          type: 'success',
        });
      } catch (cause: unknown) {
        toast({
          message: cause instanceof Error ? cause.message : 'Could not update account status.',
          type: 'error',
        });
      } finally {
        setBusyId(null);
      }
    },
    [toast]
  );

  const handleConfirmBlock = useCallback(async () => {
    if (!blockTarget) return;
    await updateAccountStatus(blockTarget, false);
    setBlockTarget(null);
  }, [blockTarget, updateAccountStatus]);

  const handleSaveNote = useCallback(async () => {
    if (!selectedCustomer || draftNote.trim().length < 3) {
      toast({ message: 'Enter a note of at least 3 characters.', type: 'error' });
      return;
    }
    setNoteSaving(true);
    try {
      const response = await api.post<{ note: CustomerNote }>(
        `/admin/customers/${selectedCustomer._id}/notes`,
        { text: draftNote.trim() },
      );
      setNoteHistory((previous) => [response.note, ...previous]);
      setDraftNote('');
      toast({ message: 'Customer note saved.', type: 'success' });
    } catch (cause: unknown) {
      toast({
        message: cause instanceof Error ? cause.message : 'Could not save customer note.',
        type: 'error',
      });
    } finally {
      setNoteSaving(false);
    }
  }, [selectedCustomer, draftNote, toast]);

  const filterValues = useMemo<Record<string, string>>(
    () => ({
      search,
      role: roleFilter,
      status: statusFilter,
    }),
    [search, roleFilter, statusFilter]
  );

  const columns = useMemo<Column<CustomerRecord>[]>(
    () => [
      {
        key: 'name',
        header: 'Account',
        sortable: true,
        render: (row) => (
          <div className="min-w-0">
            <p className="font-medium text-[#1A1A1A] truncate">{row.name}</p>
            <p className="text-xs text-[#6B6B65] truncate">{row.email}</p>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (row) => (
          <select
            aria-label={`Role for ${row.name}`}
            value={row.role}
            disabled={busyId === row._id}
            onChange={(e) => void handleRoleChange(row, e.target.value)}
            className="rounded-lg border border-[#E5E4DF] bg-white px-2.5 py-1.5 text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] disabled:opacity-50 cursor-pointer"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ),
      },
      {
        key: 'isActive',
        header: 'Status',
        render: (row) => (
          <StatusBadge status={row.isActive ? 'active' : 'blocked'} variant="generic" />
        ),
      },
      {
        key: 'emailVerified',
        header: 'Email Verified',
        render: (row) =>
          row.emailVerified ? (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"
              title="Email verified"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Verified</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B6B65]"
              title="Email not verified"
            >
              <XCircle className="w-4 h-4 text-[#6B6B65]/70" aria-hidden="true" />
              <span>Unverified</span>
            </span>
          ),
      },
      {
        key: 'createdAt',
        header: 'Joined',
        sortable: true,
        render: (row) => (
          <span className="text-xs text-[#6B6B65] whitespace-nowrap">
            {formatDate(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openCustomerDrawer(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1F3A2E] bg-[#E8EDE9] hover:bg-[#dce5de] rounded-lg transition-colors"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>View</span>
            </button>
            <button
              type="button"
              disabled={busyId === row._id}
              onClick={() => {
                if (row.isActive) {
                  setBlockTarget(row);
                } else {
                  void updateAccountStatus(row, true);
                }
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                row.isActive
                  ? 'border-red-200 bg-white text-red-700 hover:bg-red-50'
                  : 'border-[#E5E4DF] bg-white text-[#1A1A1A] hover:bg-[#F7F6F2]'
              }`}
            >
              {row.isActive ? 'Block' : 'Unblock'}
            </button>
          </div>
        ),
      },
    ],
    [busyId, handleRoleChange, openCustomerDrawer, updateAccountStatus]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Customers"
        subtitle="Browse registered accounts, manage roles, and inspect order history."
        actions={
          !loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#E5E4DF] bg-white px-3.5 py-2 text-xs font-medium text-[#6B6B65]">
              <Users className="w-4 h-4 text-[#1F3A2E]" aria-hidden="true" />
              <span>
                <strong className="font-semibold text-[#1A1A1A]">{totalCount}</strong> total
                accounts
              </span>
            </div>
          ) : undefined
        }
      />

      <FilterBar
        filters={FILTER_CONFIGS}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadCustomers()}
            className="shrink-0 rounded-lg border border-red-300 bg-white px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      <DataTable<CustomerRecord>
        columns={columns}
        data={customers}
        loading={loading}
        keyExtractor={(row) => row._id}
        pagination={{
          page,
          totalPages,
          onPageChange: handlePageChange,
        }}
        emptyState={
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No customers found"
            description={
              search || roleFilter || statusFilter
                ? 'Try adjusting or clearing your active search and filter criteria.'
                : 'Customer accounts will appear here once shoppers register.'
            }
            action={
              search || roleFilter || statusFilter ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="rounded-lg bg-[#1F3A2E] px-4 py-2 text-xs font-medium text-white hover:bg-[#162a21] transition-colors"
                >
                  Clear Filters
                </button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmModal
        open={Boolean(blockTarget)}
        title="Block Customer"
        description="Block this customer? They will be unable to log in."
        confirmLabel="Block Customer"
        isDangerous
        onConfirm={handleConfirmBlock}
        onCancel={() => setBlockTarget(null)}
      />

      <SlideOverDrawer
        open={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title="Customer Detail"
        width="md"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Profile Summary */}
            <section className="flex items-start gap-4 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] p-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8EDE9] text-sm font-bold text-[#1F3A2E]"
                aria-hidden="true"
              >
                {getInitials(selectedCustomer.name)}
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-[#1A1A1A] truncate">
                    {selectedCustomer.name}
                  </h3>
                  <span className="inline-flex items-center rounded-full border border-[#1F3A2E]/20 bg-[#E8EDE9] px-2.5 py-0.5 text-xs font-medium text-[#1F3A2E]">
                    {ROLE_LABELS[selectedCustomer.role]}
                  </span>
                  <StatusBadge
                    status={selectedCustomer.isActive ? 'active' : 'blocked'}
                    variant="generic"
                  />
                </div>
                <p className="text-sm text-[#6B6B65] break-all">{selectedCustomer.email}</p>
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#6B6B65]">
                  <span>Joined {formatDate(selectedCustomer.createdAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    {selectedCustomer.emailVerified ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        <span className="text-emerald-700">Email verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-[#6B6B65]" aria-hidden="true" />
                        <span>Email unverified</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </section>

            {/* Order History */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B6B65]">
                  <ShoppingBag className="w-4 h-4 text-[#1F3A2E]" aria-hidden="true" />
                  <span>Order History</span>
                </h4>
                <span className="text-xs text-[#6B6B65]">Latest 5 orders</span>
              </div>

              {ordersLoading ? (
                <div className="space-y-2 rounded-xl border border-[#E5E4DF] p-4">
                  {[1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="h-8 w-full animate-pulse rounded-lg bg-[#F7F6F2]"
                    />
                  ))}
                </div>
              ) : ordersError ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <span>{ordersError}</span>
                  <button
                    type="button"
                    onClick={() =>
                      void loadCustomerOrders(selectedCustomer._id, selectedCustomer.email)
                    }
                    className="rounded-md border border-red-300 bg-white px-2.5 py-1 font-medium text-red-700 hover:bg-red-50"
                  >
                    Retry
                  </button>
                </div>
              ) : orders.length === 0 ? (
                <EmptyState
                  icon={<ShoppingBag className="w-5 h-5" />}
                  title="No orders yet"
                  description="This customer has not placed any orders."
                  className="p-6 sm:p-6"
                />
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#E5E4DF] bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[#E5E4DF] bg-[#FAF9F6] text-[11px] font-semibold uppercase tracking-wider text-[#6B6B65]">
                      <tr>
                        <th className="px-3.5 py-2.5">Order ID</th>
                        <th className="px-3.5 py-2.5">Date</th>
                        <th className="px-3.5 py-2.5">Total</th>
                        <th className="px-3.5 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E4DF]">
                      {orders.map((order) => (
                        <tr key={order._id} className="hover:bg-[#F7F6F2]">
                          <td className="px-3.5 py-2.5 font-mono font-medium text-[#1A1A1A]">
                            #{order._id.slice(-8).toUpperCase()}
                          </td>
                          <td className="px-3.5 py-2.5 text-[#6B6B65] whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-3.5 py-2.5 font-medium text-[#1A1A1A] whitespace-nowrap">
                            {formatInr(order.total)}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <StatusBadge status={order.orderStatus} variant="order" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Addresses */}
            <section className="space-y-2">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B6B65]">
                <MapPin className="w-4 h-4 text-[#1F3A2E]" aria-hidden="true" />
                <span>Addresses</span>
              </h4>
              <div className="rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] px-4 py-3 text-sm text-[#6B6B65]">
                N/A — Customer saved addresses are not directly accessible from this view.
              </div>
            </section>

            {/* Internal Notes */}
            <section className="space-y-2.5">
              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B6B65]">
                <StickyNote className="w-4 h-4 text-[#1F3A2E]" aria-hidden="true" />
                <span>Notes</span>
              </h4>
              <textarea
                rows={3}
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                maxLength={2000}
                placeholder="Add internal notes about this customer..."
                className="w-full rounded-xl border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#6B6B65]">
                  {draftNote.length}/2,000 characters · Visible to authorized admins only.
                </span>
                <button
                  type="button"
                  onClick={() => void handleSaveNote()}
                  disabled={noteSaving || draftNote.trim().length < 3}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1F3A2E] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#162a21] transition-colors"
                >
                  <Save className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{noteSaving ? 'Saving…' : 'Add Note'}</span>
                </button>
              </div>
              {notesLoading ? (
                <p className="text-xs text-[#6B6B65]">Loading notes…</p>
              ) : (
                <ol className="space-y-2">
                  {noteHistory.map((note, index) => (
                    <li key={note._id ?? `${note.createdAt}-${index}`} className="rounded-lg border border-[#E5E4DF] bg-[#FAF9F6] p-3">
                      <p className="whitespace-pre-wrap text-sm text-[#1A1A1A]">{note.text}</p>
                      <time className="mt-2 block text-[11px] text-[#6B6B65]" dateTime={note.createdAt}>
                        {new Date(note.createdAt).toLocaleString('en-IN')}
                      </time>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Actions Panel */}
            <section className="space-y-3 rounded-xl border border-[#E5E4DF] bg-[#FAF9F6] p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B6B65]">
                Actions
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="drawer-customer-role"
                    className="block text-xs font-medium text-[#1A1A1A] mb-1.5"
                  >
                    Change Role
                  </label>
                  <select
                    id="drawer-customer-role"
                    value={selectedCustomer.role}
                    disabled={busyId === selectedCustomer._id}
                    onChange={(e) => void handleRoleChange(selectedCustomer, e.target.value)}
                    className="w-full rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] disabled:opacity-50"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    disabled={busyId === selectedCustomer._id}
                    onClick={() => {
                      if (selectedCustomer.isActive) {
                        setBlockTarget(selectedCustomer);
                      } else {
                        void updateAccountStatus(selectedCustomer, true);
                      }
                    }}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      selectedCustomer.isActive
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-[#1F3A2E] text-white hover:bg-[#162a21]'
                    }`}
                  >
                    {selectedCustomer.isActive ? (
                      <>
                        <ShieldAlert className="w-4 h-4" aria-hidden="true" />
                        <span>Block Account</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                        <span>Unblock Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}

export default CustomersPage;
