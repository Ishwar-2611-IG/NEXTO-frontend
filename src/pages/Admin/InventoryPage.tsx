import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes, History, PackagePlus, RefreshCw, SlidersHorizontal } from 'lucide-react';
import {
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

interface InventoryRow {
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  size: string;
  color: string;
  imageUrl: string;
  availableStock: number;
  reservedStock: number;
  lowStockThreshold: number;
  unitPricePaise: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LedgerEntry {
  _id: string;
  delta: number;
  before: number;
  after: number;
  reason: string;
  createdAt: string;
  actorUserId?: { name?: string } | string;
}

const FILTERS: FilterConfig[] = [
  { key: 'search', label: 'Products', type: 'search', placeholder: 'Search name or SKU...' },
  {
    key: 'stock',
    label: 'Stock',
    type: 'select',
    placeholder: 'All stock levels',
    options: [
      { value: 'low', label: 'Low stock' },
      { value: 'out', label: 'Out of stock' },
    ],
  },
];

const CURRENCY = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

export default function InventoryPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<InventoryRow | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [threshold, setThreshold] = useState('');
  const [saving, setSaving] = useState(false);

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') ?? '',
      stock: searchParams.get('stock') ?? '',
    }),
    [searchParams],
  );
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: '25',
        stock: filters.stock || 'all',
      });
      if (filters.search) query.set('search', filters.search);
      const response = await api.get<{ items: InventoryRow[]; pagination: Pagination }>(
        `/admin/inventory?${query.toString()}`,
      );
      setRows(response.items);
      setPagination(response.pagination);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.stock, page]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    if (!selected) {
      setLedger([]);
      return;
    }
    let active = true;
    setLedgerLoading(true);
    const query = new URLSearchParams({
      productId: selected.productId,
      sku: selected.sku,
      limit: '10',
      page: '1',
    });
    void api
      .get<{ items: LedgerEntry[] }>(`/admin/inventory/ledger?${query.toString()}`)
      .then((response) => {
        if (active) setLedger(response.items);
      })
      .catch((requestError: unknown) => {
        if (active) toast({ message: getErrorMessage(requestError), type: 'error' });
      })
      .finally(() => {
        if (active) setLedgerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selected, toast]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  const changePage = (nextPage: number) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      if (nextPage > 1) next.set('page', String(nextPage));
      else next.delete('page');
      return next;
    });
  };

  const openVariant = (row: InventoryRow) => {
    setSelected(row);
    setDelta('');
    setReason('');
    setThreshold(String(row.lowStockThreshold));
  };

  const submitAdjustment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const parsedDelta = Number(delta);
    if (!Number.isSafeInteger(parsedDelta) || parsedDelta === 0) {
      toast({ message: 'Enter a non-zero whole-number stock adjustment.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/inventory/adjust', {
        productId: selected.productId,
        sku: selected.sku,
        delta: parsedDelta,
        reason: reason.trim(),
      });
      toast({ message: 'Inventory adjustment recorded.', type: 'success' });
      setDelta('');
      setReason('');
      await loadInventory();
      const query = new URLSearchParams({
        productId: selected.productId,
        sku: selected.sku,
        limit: '10',
        page: '1',
      });
      const history = await api.get<{ items: LedgerEntry[] }>(
        `/admin/inventory/ledger?${query.toString()}`,
      );
      setLedger(history.items);
    } catch (requestError) {
      toast({ message: getErrorMessage(requestError), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const submitThreshold = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const value = Number(threshold);
    if (!Number.isSafeInteger(value) || value < 0 || value > 100000) {
      toast({ message: 'Threshold must be a whole number between 0 and 100,000.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await api.patch('/admin/inventory/threshold', {
        productId: selected.productId,
        sku: selected.sku,
        lowStockThreshold: value,
      });
      toast({ message: 'Low-stock threshold saved.', type: 'success' });
      await loadInventory();
      setSelected((previous) =>
        previous ? { ...previous, lowStockThreshold: value } : previous,
      );
    } catch (requestError) {
      toast({ message: getErrorMessage(requestError), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<Column<InventoryRow>[]>(
    () => [
      {
        key: 'productName',
        header: 'Product / Variant',
        sortable: true,
        render: (row) => (
          <div className="flex min-w-48 items-center gap-3">
            {row.imageUrl ? (
              <img src={row.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7F6F2]">
                <Boxes size={16} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{row.productName}</p>
              <p className="text-xs text-[#6B6B65]">
                {row.size} / {row.color}
              </p>
            </div>
          </div>
        ),
      },
      { key: 'sku', header: 'SKU', sortable: true, render: (row) => row.sku },
      { key: 'availableStock', header: 'Available', sortable: true, render: (row) => row.availableStock },
      { key: 'reservedStock', header: 'Reserved', sortable: true, render: (row) => row.reservedStock },
      {
        key: 'lowStockThreshold',
        header: 'Low-stock at',
        sortable: true,
        render: (row) => row.lowStockThreshold,
      },
      {
        key: 'stockStatus',
        header: 'Status',
        render: (row) => (
          <StatusBadge
            status={
              row.availableStock === 0
                ? 'out_of_stock'
                : row.availableStock <= row.lowStockThreshold
                  ? 'low_stock'
                  : 'in_stock'
            }
            variant="stock"
          />
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <button
            type="button"
            onClick={() => openVariant(row)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E4DF] px-3 py-2 text-xs font-semibold hover:bg-[#F7F6F2]"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            Manage
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <section className="admin-inventory-page space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Inventory"
        subtitle="Review available and reserved stock, record adjustments, and set low-stock alerts."
        actions={
          <button
            type="button"
            onClick={() => void loadInventory()}
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
          <button type="button" onClick={() => void loadInventory()} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        keyExtractor={(row) => `${row.productId}:${row.sku}`}
        emptyState={
          <EmptyState
            title="No inventory found"
            description="Try changing the stock filter or search for a different product."
          />
        }
        pagination={
          pagination.totalPages > 1
            ? { page: pagination.page, totalPages: pagination.totalPages, onPageChange: changePage }
            : undefined
        }
      />
      <p className="text-xs text-[#6B6B65]">
        Showing {rows.length} of {pagination.total} variants. Reserved quantities are open placed,
        processing, and shipped orders.
      </p>

      <SlideOverDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.productName} · ${selected.sku}` : 'Manage inventory'}
        width="lg"
      >
        {selected && (
          <div className="space-y-7">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F7F6F2] p-4">
                <p className="text-xs text-[#6B6B65]">Available</p>
                <p className="mt-1 text-xl font-semibold">{selected.availableStock}</p>
              </div>
              <div className="rounded-xl bg-[#F7F6F2] p-4">
                <p className="text-xs text-[#6B6B65]">Reserved</p>
                <p className="mt-1 text-xl font-semibold">{selected.reservedStock}</p>
              </div>
            </div>

            <form onSubmit={submitAdjustment} className="space-y-3 rounded-xl border border-[#E5E4DF] p-4">
              <h3 className="flex items-center gap-2 font-semibold">
                <PackagePlus size={16} aria-hidden="true" /> Adjust stock
              </h3>
              <p className="text-xs text-[#6B6B65]">Use a positive number to receive stock or a negative number to remove it.</p>
              <label className="block text-xs font-medium">
                Quantity change
                <input
                  type="number"
                  step="1"
                  required
                  value={delta}
                  onChange={(event) => setDelta(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm"
                  placeholder="e.g. 12 or -2"
                />
              </label>
              <label className="block text-xs font-medium">
                Reason
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={300}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm"
                  placeholder="Receiving, damage, correction..."
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#1F3A2E] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Record adjustment
              </button>
            </form>

            <form onSubmit={submitThreshold} className="flex items-end gap-3 rounded-xl border border-[#E5E4DF] p-4">
              <label className="flex-1 text-xs font-medium">
                Low-stock alert threshold
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="1"
                  required
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg border border-[#E5E4DF] px-3 py-2 text-sm font-semibold disabled:opacity-50"
              >
                Save threshold
              </button>
            </form>

            <section>
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <History size={16} aria-hidden="true" /> Recent stock history
              </h3>
              {ledgerLoading ? (
                <p className="text-sm text-[#6B6B65]">Loading history…</p>
              ) : ledger.length === 0 ? (
                <p className="text-sm text-[#6B6B65]">No adjustments have been recorded for this variant.</p>
              ) : (
                <ol className="space-y-3">
                  {ledger.map((entry) => (
                    <li key={entry._id} className="rounded-lg border border-[#E5E4DF] p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className={entry.delta > 0 ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
                          {entry.delta > 0 ? '+' : ''}{entry.delta} · {entry.before} → {entry.after}
                        </span>
                        <time className="text-xs text-[#6B6B65]" dateTime={entry.createdAt}>
                          {new Date(entry.createdAt).toLocaleString('en-IN')}
                        </time>
                      </div>
                      <p className="mt-1 text-xs text-[#6B6B65]">{entry.reason}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <p className="text-xs text-[#6B6B65]">
              Unit price: {CURRENCY.format(selected.unitPricePaise / 100)}
            </p>
          </div>
        )}
      </SlideOverDrawer>
      <style>{`
        @media print {
          .admin-inventory-page { display: none !important; }
        }
      `}</style>
    </section>
  );
}
