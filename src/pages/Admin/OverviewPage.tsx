import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, StatusBadge, EmptyState } from '../../components/admin/index';
import { AdminStatsSkeleton } from '../../components/common/Skeleton';
import { api } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  revenuePaise: { today: number; last7Days: number; last30Days: number };
  orders: { today: number; last7Days: number; last30Days: number };
  newCustomersLast30Days: number;
  averageOrderValuePaise: number;
  topProducts: Array<{ productId: string; name: string; quantity: number; revenuePaise: number }>;
  lowStock: Array<{
    productId: string;
    productName: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
  }>;
  recentOrders: Array<{
    _id: string;
    total: number;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
    userId?: { name?: string; email?: string };
  }>;
  salesSeries: Array<{ date: string; revenuePaise: number; orders: number }>;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

const inr = (paise: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function deltaBadge(val7: number, val30: number): { label: string; positive: boolean } | null {
  if (!val30) return null;
  const pct = Math.round(((val30 - val7) / Math.max(1, val7)) * 100);
  if (pct === 0) return null;
  return { label: `${pct > 0 ? '+' : ''}${pct}% vs last 7d`, positive: pct > 0 };
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  hint: string;
  delta?: { label: string; positive: boolean } | null;
}

function KpiCard({ label, value, hint, delta }: KpiCardProps) {
  return (
    <div className="rounded-2xl border border-[#E5E4DF] bg-white p-5 space-y-3">
      <p className="text-xs font-semibold text-[#6B6B65] uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">{value}</p>
      <div className="flex items-center gap-2">
        <p className="text-[11px] text-[#6B6B65]">{hint}</p>
        {delta && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              delta.positive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {delta.label}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────────────────────

type ChartPeriod = 7 | 30;

function RevenueChart({ series }: { series: DashboardData['salesSeries'] }) {
  const [period, setPeriod] = useState<ChartPeriod>(30);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    item: DashboardData['salesSeries'][number];
  } | null>(null);

  const displaySeries = series.slice(-period);
  const max = Math.max(1, ...displaySeries.map((p) => p.revenuePaise));

  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<SVGRectElement>, item: DashboardData['salesSeries'][number]) => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
      const rect = (e.target as SVGRectElement).getBoundingClientRect();
      setTooltip({ x: rect.left, y: rect.top - 8, item });
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    hideTimeout.current = setTimeout(() => setTooltip(null), 150);
  }, []);

  return (
    <section className="rounded-2xl border border-[#E5E4DF] bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#1A1A1A]">Revenue</h2>
        <div className="flex gap-1">
          {([7, 30] as ChartPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${
                period === p
                  ? 'bg-[#E8EDE9] text-[#1F3A2E]'
                  : 'text-[#6B6B65] hover:bg-[#F7F6F2]'
              }`}
            >
              {p}D
            </button>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${displaySeries.length * 14} 120`}
        preserveAspectRatio="none"
        className="w-full h-40"
        style={{ overflow: 'visible' }}
      >
        {displaySeries.map((point, i) => {
          const h = Math.max(2, (point.revenuePaise / max) * 110);
          const x = i * 14 + 1;
          const y = 120 - h;
          return (
            <rect
              key={point.date}
              x={x}
              y={y}
              width={12}
              height={h}
              rx={2}
              className="fill-[#718273] hover:fill-[#1F3A2E] cursor-pointer transition-colors"
              onMouseEnter={(e) => handleMouseEnter(e, point)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </svg>
      {displaySeries.length === 0 && (
        <p className="text-sm text-[#6B6B65] text-center py-6">No sales data for this period.</p>
      )}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-[#1A1A1A] text-white text-xs rounded-xl px-3 py-2 shadow-lg whitespace-nowrap">
            <p className="font-semibold">{tooltip.item.date}</p>
            <p>{inr(tooltip.item.revenuePaise)}</p>
            <p>{tooltip.item.orders} orders</p>
          </div>
        </div>
      )}
      <p className="mt-3 text-[10px] text-[#6B6B65]">
        Daily captured revenue for the last {period} days. Days with no paid orders are omitted by
        the API.
      </p>
    </section>
  );
}

// ─── Low Stock Widget ─────────────────────────────────────────────────────────

function LowStockWidget({ items }: { items: DashboardData['lowStock'] }) {
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <section className="rounded-2xl border border-[#E5E4DF] bg-white p-5">
        <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Low stock alerts</h2>
        <EmptyState
          title="No low-stock products 🎉"
          description="All variants have sufficient stock."
        />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-[#E5E4DF] bg-white p-5">
      <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">
        Low stock alerts
        <span className="ml-2 text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[#6B6B65] border-b border-[#E5E4DF]">
              <th className="pb-2 font-semibold">Product</th>
              <th className="pb-2 font-semibold">SKU</th>
              <th className="pb-2 font-semibold">Variant</th>
              <th className="pb-2 font-semibold text-right">Stock</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={`${item.productId}-${item.sku}`}
                className="border-b border-[#E5E4DF] last:border-0"
              >
                <td className="py-2 font-medium text-[#1A1A1A] max-w-[140px] truncate">
                  {item.productName}
                </td>
                <td className="py-2 font-mono text-[#6B6B65]">{item.sku}</td>
                <td className="py-2 text-[#6B6B65]">
                  {[item.size, item.color].filter(Boolean).join(' / ')}
                </td>
                <td className="py-2 text-right">
                  <span
                    className={`font-bold ${
                      item.stock === 0 ? 'text-red-600' : 'text-amber-600'
                    }`}
                  >
                    {item.stock}
                  </span>
                </td>
                <td className="py-2 pl-3">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/inventory')}
                    className="text-[10px] font-semibold text-[#1F3A2E] hover:underline whitespace-nowrap"
                  >
                    Manage →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Recent Orders ────────────────────────────────────────────────────────────

function RecentOrders({ orders }: { orders: DashboardData['recentOrders'] }) {
  const navigate = useNavigate();

  return (
    <section className="rounded-2xl border border-[#E5E4DF] bg-white p-5">
      <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Recent orders</h2>
      {orders.length === 0 ? (
        <EmptyState title="No orders yet" description="Orders will appear here once customers start buying." />
      ) : (
        <div className="space-y-1">
          {orders.slice(0, 10).map((order) => (
            <button
              key={order._id}
              type="button"
              onClick={() => navigate(`/admin/orders/${order._id}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F7F6F2] transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-[#6B6B65]">
                  #{order._id.slice(-8).toUpperCase()}
                </p>
                <p className="text-sm font-medium text-[#1A1A1A] truncate">
                  {order.userId?.name ?? order.userId?.email ?? 'Customer'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-sm font-semibold text-[#1A1A1A]">{inr(order.total)}</span>
                <div className="flex gap-1">
                  <StatusBadge status={order.paymentStatus} variant="payment" />
                  <StatusBadge status={order.orderStatus} variant="order" />
                </div>
              </div>
              <span className="text-[10px] text-[#6B6B65] shrink-0 w-14 text-right">
                {timeAgo(order.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Top Products ─────────────────────────────────────────────────────────────

function TopProducts({ products }: { products: DashboardData['topProducts'] }) {
  return (
    <section className="rounded-2xl border border-[#E5E4DF] bg-white p-5">
      <h2 className="text-sm font-semibold text-[#1A1A1A] mb-4">Top products · 30 days</h2>
      {products.length === 0 ? (
        <EmptyState title="No data" description="Top products will appear after sales." />
      ) : (
        <div className="space-y-3">
          {products.map((item, index) => (
            <div key={item.productId} className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F7F6F2] text-xs font-bold text-[#1F3A2E]">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-[#1A1A1A]">{item.name}</p>
                <p className="text-[10px] text-[#6B6B65]">{item.quantity} units sold</p>
              </div>
              <span className="text-sm font-semibold text-[#1A1A1A] shrink-0">
                {inr(item.revenuePaise)}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Main OverviewPage ────────────────────────────────────────────────────────

export function OverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<DashboardData>('/admin/dashboard')
      .then((result) => {
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : 'Could not load dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <AdminStatsSkeleton />;

  if (error || !data) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error || 'Dashboard data is unavailable.'}
      </div>
    );
  }

  const revDelta = deltaBadge(data.revenuePaise.last7Days, data.revenuePaise.last30Days);
  const ordDelta = deltaBadge(data.orders.last7Days, data.orders.last30Days);

  const kpiCards: KpiCardProps[] = [
    {
      label: 'Total Revenue (30d)',
      value: inr(data.revenuePaise.last30Days),
      hint: `${data.orders.last30Days} orders`,
      delta: revDelta,
    },
    {
      label: 'Total Orders (30d)',
      value: String(data.orders.last30Days),
      hint: `${data.orders.last7Days} in last 7 days`,
      delta: ordDelta,
    },
    {
      label: 'Avg. Order Value',
      value: inr(data.averageOrderValuePaise),
      hint: 'Based on paid orders (30d)',
    },
    {
      label: 'New Customers (30d)',
      value: String(data.newCustomersLast30Days),
      hint: 'Registered accounts',
    },
    {
      label: 'Revenue Today',
      value: inr(data.revenuePaise.today),
      hint: `${data.orders.today} orders today`,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Store performance"
        title="Overview"
        subtitle="A live snapshot of your NEXTO store."
      />

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* Revenue chart */}
      <RevenueChart series={data.salesSeries} />

      {/* Low stock + Recent orders */}
      <div className="grid gap-5 xl:grid-cols-2">
        <LowStockWidget items={data.lowStock} />
        <RecentOrders orders={data.recentOrders} />
      </div>

      {/* Top products */}
      <TopProducts products={data.topProducts} />
    </div>
  );
}
