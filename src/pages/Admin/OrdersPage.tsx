import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer, RefreshCw, Truck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
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
import { api } from '../../services/api';

type OrderStatus = 'placed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface OrderItem {
  productName: string;
  sku: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
}

interface OrderTimelineEntry {
  type: 'status' | 'tracking';
  status?: OrderStatus;
  note?: string;
  createdAt: string;
}

interface OrderRecord {
  _id: string;
  userId?: { name?: string; email?: string } | string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: 'cod' | 'razorpay';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  carrier?: string;
  trackingNumber?: string;
  timeline?: OrderTimelineEntry[];
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ORDER_STATUSES: OrderStatus[] = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
const CURRENCY = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const FILTERS: FilterConfig[] = [
  { key: 'search', label: 'Orders', type: 'search', placeholder: 'Search order, customer, SKU...' },
  {
    key: 'status',
    label: 'Order status',
    type: 'select',
    placeholder: 'All order statuses',
    options: ORDER_STATUSES.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) })),
  },
  {
    key: 'paymentStatus',
    label: 'Payment',
    type: 'select',
    placeholder: 'All payment statuses',
    options: ['pending', 'paid', 'failed', 'refunded'].map((value) => ({
      value,
      label: value[0].toUpperCase() + value.slice(1),
    })),
  },
  { key: 'dateRange', label: 'Created', type: 'daterange' },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

function getCustomer(order: OrderRecord): { name: string; email: string } {
  if (order.userId && typeof order.userId === 'object') {
    return {
      name: order.userId.name?.trim() || order.shippingAddress.fullName,
      email: order.userId.email?.trim() || '',
    };
  }
  return { name: order.shippingAddress.fullName, email: '' };
}

function money(paise: number): string {
  return CURRENCY.format(paise / 100);
}

export default function OrdersPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<OrderRecord | null>(null);
  const [nextStatus, setNextStatus] = useState<OrderStatus>('placed');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [saving, setSaving] = useState(false);

  const filters = useMemo(() => {
    const from = searchParams.get('createdFrom') ?? '';
    const to = searchParams.get('createdTo') ?? '';
    return {
      search: searchParams.get('search') ?? '',
      status: searchParams.get('status') ?? '',
      paymentStatus: searchParams.get('paymentStatus') ?? '',
      dateRange: `${from},${to}`,
    };
  }, [searchParams]);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ page: String(page), limit: '20' });
      for (const key of ['search', 'status', 'paymentStatus', 'createdFrom', 'createdTo']) {
        const value = searchParams.get(key);
        if (value) query.set(key, value);
      }
      const response = await api.get<{ orders: OrderRecord[]; pagination: Pagination }>(
        `/orders/admin?${query.toString()}`,
      );
      setOrders(response.orders);
      setPagination(response.pagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, searchParams]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (key === 'dateRange') {
          const [from = '', to = ''] = value.split(',');
          if (from) next.set('createdFrom', from);
          else next.delete('createdFrom');
          if (to) next.set('createdTo', to);
          else next.delete('createdTo');
        } else if (key === 'dateRange_start' || key === 'dateRange_end') {
          const dateKey = key === 'dateRange_start' ? 'createdFrom' : 'createdTo';
          if (value) next.set(dateKey, value);
          else next.delete(dateKey);
        } else if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const openOrder = (order: OrderRecord) => {
    setSelected(order);
    setNextStatus(order.orderStatus);
    setCancelReason('');
    setCarrier(order.carrier ?? '');
    setTrackingNumber(order.trackingNumber ?? '');
    setRefundAmount('');
    setRefundReason('');
  };

  const saveStatus = async (status: OrderStatus) => {
    if (!selected) return;
    if (status === 'cancelled' && cancelReason.trim().length < 3) {
      toast({ message: 'Enter a reason of at least 3 characters before cancelling.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const response = await api.patch<{ order: OrderRecord }>(
        `/orders/admin/${selected._id}/status`,
        {
          status,
          ...(status === 'cancelled' ? { cancellationReason: cancelReason.trim() } : {}),
        },
      );
      setSelected(response.order);
      setNextStatus(response.order.orderStatus);
      toast({ message: `Order marked ${status}.`, type: 'success' });
      await loadOrders();
    } catch (requestError) {
      toast({ message: getErrorMessage(requestError), type: 'error' });
    } finally {
      setSaving(false);
      setShowCancelConfirm(false);
    }
  };

  const submitStatus = () => {
    if (nextStatus === 'cancelled') {
      if (cancelReason.trim().length < 3) {
        toast({ message: 'Enter a reason of at least 3 characters before cancelling.', type: 'error' });
        return;
      }
      setShowCancelConfirm(true);
      return;
    }
    void saveStatus(nextStatus);
  };

  const submitTracking = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const response = await api.patch<{ order: OrderRecord }>(
        `/orders/admin/${selected._id}/tracking`,
        { carrier: carrier.trim(), trackingNumber: trackingNumber.trim() },
      );
      setSelected(response.order);
      toast({ message: 'Tracking details saved.', type: 'success' });
      await loadOrders();
    } catch (requestError) {
      toast({ message: getErrorMessage(requestError), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const submitRefund = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const amountRupees = refundAmount.trim() ? Number(refundAmount) : undefined;
    if (amountRupees !== undefined && (!Number.isFinite(amountRupees) || amountRupees <= 0)) {
      toast({ message: 'Enter a valid refund amount greater than zero.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.post(
        '/admin/refunds',
        {
          orderId: selected._id,
          ...(amountRupees !== undefined ? { amount: Math.round(amountRupees * 100) } : {}),
          reason: refundReason.trim(),
        },
        { headers: { 'Idempotency-Key': crypto.randomUUID() } },
      );
      toast({
        message: 'Refund request submitted. Wait for provider confirmation before cancelling the order.',
        type: 'success',
        duration: 7000,
      });
      setRefundAmount('');
      setRefundReason('');
      await loadOrders();
    } catch (requestError) {
      toast({ message: getErrorMessage(requestError), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<Column<OrderRecord>[]>(
    () => [
      {
        key: '_id',
        header: 'Order',
        sortable: true,
        render: (order) => (
          <div>
            <p className="font-semibold">#{order._id.slice(-8).toUpperCase()}</p>
            <time className="text-xs text-[#6B6B65]" dateTime={order.createdAt}>
              {new Date(order.createdAt).toLocaleString('en-IN')}
            </time>
          </div>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (order) => {
          const customer = getCustomer(order);
          return (
            <div className="min-w-36">
              <p className="font-medium">{customer.name}</p>
              <p className="text-xs text-[#6B6B65]">{customer.email || order.shippingAddress.phone}</p>
            </div>
          );
        },
      },
      {
        key: 'total',
        header: 'Total',
        sortable: true,
        render: (order) => <span className="font-semibold">{money(order.total)}</span>,
      },
      {
        key: 'orderStatus',
        header: 'Order',
        render: (order) => <StatusBadge status={order.orderStatus} variant="order" />,
      },
      {
        key: 'paymentStatus',
        header: 'Payment',
        render: (order) => <StatusBadge status={order.paymentStatus} variant="payment" />,
      },
      {
        key: 'paymentMethod',
        header: 'Method',
        render: (order) => order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Razorpay',
      },
      {
        key: 'actions',
        header: 'Details',
        render: (order) => (
          <button
            type="button"
            onClick={() => openOrder(order)}
            className="rounded-lg border border-[#E5E4DF] px-3 py-2 text-xs font-semibold hover:bg-[#F7F6F2]"
          >
            View order
          </button>
        ),
      },
    ],
    [],
  );

  const printOrder = () => {
    if (!selected) return;
    window.print();
  };

  return (
    <section className="admin-orders-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Orders"
        subtitle="Search and manage fulfillment, tracking, payment, refunds, and order history."
        actions={
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={15} aria-hidden="true" /> Refresh
          </button>
        }
      />
      <FilterBar filters={FILTERS} values={filters} onChange={updateFilter} onReset={() => setSearchParams({})} />
      {error && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <span>{error}</span>
          <button type="button" onClick={() => void loadOrders()} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        keyExtractor={(order) => order._id}
        emptyState={
          <EmptyState
            title="No orders found"
            description="Try adjusting the search, status, payment, or date filters."
          />
        }
        pagination={
          pagination.totalPages > 1
            ? {
                page: pagination.page,
                totalPages: pagination.totalPages,
                onPageChange: (nextPage) =>
                  setSearchParams((previous) => {
                    const next = new URLSearchParams(previous);
                    if (nextPage > 1) next.set('page', String(nextPage));
                    else next.delete('page');
                    return next;
                  }),
              }
            : undefined
        }
      />
      <p className="text-xs text-[#6B6B65]">Showing {orders.length} of {pagination.total} orders.</p>

      <SlideOverDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Order #${selected._id.slice(-8).toUpperCase()}` : 'Order details'}
        width="lg"
        footer={
          <button
            type="button"
            onClick={printOrder}
            disabled={!selected}
            className="mr-auto inline-flex items-center gap-2 rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm font-semibold"
          >
            <Printer size={15} aria-hidden="true" /> Print slip
          </button>
        }
      >
        {selected && (
          <div className="space-y-7">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.orderStatus} variant="order" />
              <StatusBadge status={selected.paymentStatus} variant="payment" />
              <span className="text-xs text-[#6B6B65]">
                {new Date(selected.createdAt).toLocaleString('en-IN')}
              </span>
            </div>

            <section className="space-y-2">
              <h3 className="font-semibold">Items</h3>
              {selected.items.map((item, index) => (
                <div key={`${item.sku}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-[#E5E4DF] p-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.productName}</p>
                    <p className="text-xs text-[#6B6B65]">
                      {item.sku} · {item.size} / {item.color} · Qty {item.quantity}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium">{money(item.lineTotal)}</span>
                </div>
              ))}
              <div className="space-y-1 border-t border-[#E5E4DF] pt-3 text-sm">
                <p className="flex justify-between"><span>Subtotal</span><span>{money(selected.subtotal)}</span></p>
                <p className="flex justify-between"><span>Shipping</span><span>{money(selected.shippingFee)}</span></p>
                {selected.discount > 0 && (
                  <p className="flex justify-between"><span>Discount{selected.couponCode ? ` (${selected.couponCode})` : ''}</span><span>-{money(selected.discount)}</span></p>
                )}
                <p className="flex justify-between font-semibold"><span>Total</span><span>{money(selected.total)}</span></p>
              </div>
            </section>

            <section className="space-y-1">
              <h3 className="font-semibold">Ship to</h3>
              <p className="text-sm">{selected.shippingAddress.fullName} · {selected.shippingAddress.phone}</p>
              <p className="text-sm text-[#6B6B65]">
                {selected.shippingAddress.addressLine1}
                {selected.shippingAddress.addressLine2 ? `, ${selected.shippingAddress.addressLine2}` : ''}
                , {selected.shippingAddress.city}, {selected.shippingAddress.state} {selected.shippingAddress.postalCode}, {selected.shippingAddress.country}
              </p>
            </section>

            {selected.orderStatus !== 'delivered' && selected.orderStatus !== 'cancelled' && (
              <section className="space-y-3 rounded-xl border border-[#E5E4DF] p-4">
                <h3 className="font-semibold">Fulfillment</h3>
                <label className="block text-xs font-medium">
                  Update order status
                  <select
                    value={nextStatus}
                    onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
                    className="mt-1 w-full rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 text-sm"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>
                    ))}
                  </select>
                </label>
                {nextStatus === 'cancelled' && (
                  <label className="block text-xs font-medium">
                    Cancellation reason
                    <textarea
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                      minLength={3}
                      maxLength={300}
                      required
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm"
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={submitStatus}
                  disabled={saving || nextStatus === selected.orderStatus}
                  className="rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Save status
                </button>

                <form onSubmit={submitTracking} className="grid gap-3 border-t border-[#E5E4DF] pt-4 sm:grid-cols-2">
                  <label className="text-xs font-medium">
                    Carrier
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      value={carrier}
                      onChange={(event) => setCarrier(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm"
                      placeholder="Delivery partner"
                    />
                  </label>
                  <label className="text-xs font-medium">
                    Tracking number
                    <input
                      required
                      minLength={3}
                      maxLength={160}
                      value={trackingNumber}
                      onChange={(event) => setTrackingNumber(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm"
                      placeholder="Tracking ID"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm font-semibold disabled:opacity-50 sm:col-span-2"
                  >
                    <Truck size={15} aria-hidden="true" /> Save tracking
                  </button>
                </form>
              </section>
            )}
            {(selected.carrier || selected.trackingNumber) && (
              <p className="rounded-lg bg-[#F7F6F2] p-3 text-sm">
                <span className="font-semibold">{selected.carrier || 'Carrier'}:</span> {selected.trackingNumber || 'Tracking number pending'}
              </p>
            )}

            {user?.role === 'admin' && selected.paymentStatus === 'paid' && (
              <form onSubmit={submitRefund} className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <h3 className="font-semibold">Request refund</h3>
                <p className="text-xs text-[#6B6B65]">
                  Leave the amount empty to request a full refund. Refund completion is asynchronous.
                </p>
                <label className="block text-xs font-medium">
                  Partial amount in INR (optional)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs font-medium">
                  Reason
                  <input
                    required
                    minLength={3}
                    maxLength={500}
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#E5E4DF] bg-white px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50"
                >
                  Submit refund request
                </button>
              </form>
            )}

            <section>
              <h3 className="mb-3 font-semibold">Order timeline</h3>
              {(selected.timeline ?? []).length === 0 ? (
                <p className="text-sm text-[#6B6B65]">No administrative events recorded yet.</p>
              ) : (
                <ol className="space-y-3 border-l border-[#E5E4DF] pl-4">
                  {[...(selected.timeline ?? [])].reverse().map((entry, index) => (
                    <li key={`${entry.createdAt}-${index}`} className="relative text-sm">
                      <span className="absolute -left-[1.32rem] top-1 h-2 w-2 rounded-full bg-[#1F3A2E]" />
                      <p className="font-medium">
                        {entry.type === 'tracking' ? 'Tracking updated' : `Status: ${entry.status ?? 'updated'}`}
                      </p>
                      {entry.note && <p className="text-xs text-[#6B6B65]">{entry.note}</p>}
                      <time className="text-xs text-[#6B6B65]" dateTime={entry.createdAt}>
                        {new Date(entry.createdAt).toLocaleString('en-IN')}
                      </time>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}
      </SlideOverDrawer>

      <ConfirmModal
        open={showCancelConfirm}
        title="Cancel this order?"
        description={`This will release the order's stock and record the reason: ${cancelReason.trim() || '—'}`}
        confirmLabel="Cancel order"
        isDangerous
        onCancel={() => setShowCancelConfirm(false)}
        onConfirm={() => saveStatus('cancelled')}
      />

      {selected && (
        <div className="order-print-layout hidden">
          <h1>NEXTO · Packing slip</h1>
          <p>Order #{selected._id}</p>
          <p>{new Date(selected.createdAt).toLocaleString('en-IN')}</p>
          <h2>Ship to</h2>
          <p>{selected.shippingAddress.fullName} · {selected.shippingAddress.phone}</p>
          <p>
            {selected.shippingAddress.addressLine1}
            {selected.shippingAddress.addressLine2 ? `, ${selected.shippingAddress.addressLine2}` : ''}
            , {selected.shippingAddress.city}, {selected.shippingAddress.state} {selected.shippingAddress.postalCode}, {selected.shippingAddress.country}
          </p>
          <h2>Items</h2>
          <ul>
            {selected.items.map((item, index) => (
              <li key={`${item.sku}-print-${index}`}>
                {item.productName} · {item.sku} · {item.size}/{item.color} · Qty {item.quantity} · {money(item.lineTotal)}
              </li>
            ))}
          </ul>
          <p>Total: {money(selected.total)} · Payment: {selected.paymentMethod.toUpperCase()}</p>
        </div>
      )}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .order-print-layout, .order-print-layout * { visibility: visible !important; }
          .order-print-layout {
            display: block !important;
            position: absolute;
            inset: 0;
            padding: 32px;
            color: #111;
            background: #fff;
            font: 14px/1.5 Arial, sans-serif;
          }
          .order-print-layout h1 { font-size: 24px; margin: 0 0 16px; }
          .order-print-layout h2 { font-size: 16px; margin-top: 24px; }
        }
      `}</style>
    </section>
  );
}
