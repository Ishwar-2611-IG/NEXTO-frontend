import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Check,
  CheckCircle2,
  Copy,
  Pencil,
  Plus,
  Ticket,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  ConfirmModal,
  DataTable,
  EmptyState,
  PageHeader,
  SlideOverDrawer,
  useToast,
  type Column,
} from '../../components/admin/index';
import { api } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CouponDoc {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSubtotal: number;
  maxDiscount?: number;
  startsAt: string;
  expiresAt: string;
  usageLimit?: number;
  perUserLimit: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

interface CouponPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface CouponListResponse {
  coupons: CouponDoc[];
  pagination: CouponPagination;
}

interface CouponMutationResponse {
  coupon: CouponDoc;
}

interface CouponPayload {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSubtotal: number;
  maxDiscount?: number;
  startsAt: string;
  expiresAt: string;
  usageLimit?: number;
  perUserLimit: number;
  isActive: boolean;
}

// ─── Validation Schema ───────────────────────────────────────────────────────

const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Code must be at least 3 characters')
      .max(40, 'Code must be at most 40 characters')
      .regex(
        /^[A-Z0-9_-]+$/,
        'Use uppercase letters, numbers, hyphens, or underscores only'
      ),
    description: z.string().trim().max(300, 'Description cannot exceed 300 characters'),
    discountType: z.enum(['percentage', 'fixed']),
    discountValue: z.string().trim().min(1, 'Discount value is required'),
    maxDiscountRupees: z.string().trim(),
    minSubtotalRupees: z.string().trim(),
    startsAt: z.string().min(1, 'Start date is required'),
    expiresAt: z.string().min(1, 'Expiry date is required'),
    usageLimit: z.string().trim(),
    perUserLimit: z.string().trim().min(1, 'Per-user limit is required'),
    isActive: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const discountNum = Number(values.discountValue);
    if (!Number.isFinite(discountNum) || discountNum <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['discountValue'],
        message: 'Enter a positive discount value',
      });
    } else if (values.discountType === 'percentage') {
      if (!Number.isInteger(discountNum) || discountNum < 1 || discountNum > 100) {
        ctx.addIssue({
          code: 'custom',
          path: ['discountValue'],
          message: 'Percentage discount must be a whole number between 1 and 100',
        });
      }
    } else {
      const paise = Math.round(discountNum * 100);
      if (paise < 1 || paise > 100_000_000) {
        ctx.addIssue({
          code: 'custom',
          path: ['discountValue'],
          message: 'Fixed discount must be between ₹0.01 and ₹10,00,000',
        });
      }
    }

    if (values.discountType === 'percentage' && values.maxDiscountRupees !== '') {
      const maxNum = Number(values.maxDiscountRupees);
      if (!Number.isFinite(maxNum) || maxNum <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['maxDiscountRupees'],
          message: 'Max discount must be greater than 0',
        });
      }
    }

    if (values.minSubtotalRupees !== '') {
      const minNum = Number(values.minSubtotalRupees);
      if (!Number.isFinite(minNum) || minNum < 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['minSubtotalRupees'],
          message: 'Minimum subtotal cannot be negative',
        });
      }
    }

    if (values.startsAt && values.expiresAt && values.expiresAt <= values.startsAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'Expiry date must be after start date',
      });
    }

    if (values.usageLimit !== '') {
      const limitNum = Number(values.usageLimit);
      if (!Number.isInteger(limitNum) || limitNum < 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['usageLimit'],
          message: 'Usage limit must be a positive whole number',
        });
      }
    }

    const perUserNum = Number(values.perUserLimit);
    if (!Number.isInteger(perUserNum) || perUserNum < 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['perUserLimit'],
        message: 'Per-user limit must be a positive whole number',
      });
    }
  });

type CouponFormValues = z.infer<typeof couponFormSchema>;

// ─── Formatters & Helpers ────────────────────────────────────────────────────

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatPaiseToInr(paise: number): string {
  const safe = Number.isFinite(paise) ? Math.max(0, paise) : 0;
  return inrFormatter.format(safe / 100);
}

function formatValidity(startsAt: string, expiresAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(expiresAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '—';
  }
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  });
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${startStr} – ${endStr}`;
}

function isoToDateInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function getDefaultDates(): { startsAt: string; expiresAt: string } {
  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setDate(nextMonth.getDate() + 30);
  return {
    startsAt: now.toISOString().slice(0, 10),
    expiresAt: nextMonth.toISOString().slice(0, 10),
  };
}

function getInitialFormValues(coupon: CouponDoc | null): CouponFormValues {
  if (!coupon) {
    const { startsAt, expiresAt } = getDefaultDates();
    return {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      maxDiscountRupees: '',
      minSubtotalRupees: '',
      startsAt,
      expiresAt,
      usageLimit: '',
      perUserLimit: '1',
      isActive: true,
    };
  }

  return {
    code: coupon.code.toUpperCase(),
    description: coupon.description ?? '',
    discountType: coupon.discountType,
    discountValue:
      coupon.discountType === 'percentage'
        ? String(coupon.discountValue)
        : String(coupon.discountValue / 100),
    maxDiscountRupees:
      coupon.discountType === 'percentage' && coupon.maxDiscount != null
        ? String(coupon.maxDiscount / 100)
        : '',
    minSubtotalRupees: coupon.minSubtotal > 0 ? String(coupon.minSubtotal / 100) : '',
    startsAt: isoToDateInput(coupon.startsAt),
    expiresAt: isoToDateInput(coupon.expiresAt),
    usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : '',
    perUserLimit: String(coupon.perUserLimit ?? 1),
    isActive: coupon.isActive,
  };
}

// ─── Shared UI Helpers ───────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-[#E5E4DF] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#6B6B65]/60 outline-none focus:border-[#1F3A2E] focus:ring-1 focus:ring-[#1F3A2E]/20 transition-colors';

const labelCls = 'block text-xs font-semibold text-[#1A1A1A] mb-1.5';

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled = false, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F3A2E] focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-[#1F3A2E]' : 'bg-[#E5E4DF]'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

// ─── Component ───────────────────────────────────────────────────────────────

export function CouponsPage(): React.ReactElement {
  const { toast } = useToast();

  const [coupons, setCoupons] = useState<CouponDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponDoc | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CouponDoc | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: getInitialFormValues(null),
  });

  const watchedDiscountType = useWatch({ control, name: 'discountType' });
  const watchedIsActive = useWatch({ control, name: 'isActive' });

  const fetchCoupons = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const result = await api.get<CouponListResponse | CouponDoc[]>(
          `/coupons?page=${targetPage}&limit=100`
        );
        if (Array.isArray(result)) {
          setCoupons(result);
          setTotalCount(result.length);
          setTotalPages(1);
        } else {
          setCoupons(result.coupons ?? []);
          setTotalCount(result.pagination?.total ?? result.coupons?.length ?? 0);
          setTotalPages(Math.max(1, result.pagination?.pages ?? 1));
        }
      } catch (err: unknown) {
        toast({
          message: err instanceof Error ? err.message : 'Failed to load coupons',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    void fetchCoupons(page);
  }, [fetchCoupons, page]);

  const openCreateDrawer = useCallback(() => {
    setEditingCoupon(null);
    reset(getInitialFormValues(null));
    setDrawerOpen(true);
  }, [reset]);

  const openEditDrawer = useCallback(
    (coupon: CouponDoc) => {
      setEditingCoupon(coupon);
      reset(getInitialFormValues(coupon));
      setDrawerOpen(true);
    },
    [reset]
  );

  const closeDrawer = useCallback(() => {
    if (submitting) return;
    setDrawerOpen(false);
    setEditingCoupon(null);
  }, [submitting]);

  const handleCopyCode = useCallback(
    async (coupon: CouponDoc) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(coupon.code);
        } else {
          const el = document.createElement('textarea');
          el.value = coupon.code;
          el.style.position = 'fixed';
          el.style.opacity = '0';
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
        setCopiedId(coupon._id);
        toast({ message: `Copied "${coupon.code}" to clipboard`, type: 'success' });
        setTimeout(() => {
          setCopiedId((current) => (current === coupon._id ? null : current));
        }, 1800);
      } catch {
        toast({ message: 'Unable to copy coupon code', type: 'error' });
      }
    },
    [toast]
  );

  const handleToggleActive = useCallback(
    async (coupon: CouponDoc) => {
      const nextActive = !coupon.isActive;
      setTogglingIds((prev) => new Set(prev).add(coupon._id));
      setCoupons((prev) =>
        prev.map((item) =>
          item._id === coupon._id ? { ...item, isActive: nextActive } : item
        )
      );

      try {
        await api.patch<CouponMutationResponse>(`/coupons/${coupon._id}`, {
          isActive: nextActive,
        });
        toast({
          message: `Coupon ${coupon.code} ${nextActive ? 'activated' : 'deactivated'}`,
          type: 'success',
        });
      } catch (err: unknown) {
        // Rollback optimistic toggle
        setCoupons((prev) =>
          prev.map((item) =>
            item._id === coupon._id ? { ...item, isActive: coupon.isActive } : item
          )
        );
        toast({
          message: err instanceof Error ? err.message : 'Failed to update coupon status',
          type: 'error',
        });
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(coupon._id);
          return next;
        });
      }
    },
    [toast]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    try {
      await api.delete(`/coupons/${target._id}`);
      setCoupons((prev) => prev.filter((item) => item._id !== target._id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      toast({ message: `Deleted coupon ${target.code}`, type: 'success' });
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast({
        message: err instanceof Error ? err.message : 'Failed to delete coupon',
        type: 'error',
      });
    }
  }, [deleteTarget, toast]);

  const onSubmit = async (values: CouponFormValues) => {
    setSubmitting(true);
    try {
      const discountValueNum = Number(values.discountValue);
      const discountValue =
        values.discountType === 'percentage'
          ? Math.round(discountValueNum)
          : Math.round(discountValueNum * 100);

      const minSubtotal =
        values.minSubtotalRupees !== ''
          ? Math.round(Number(values.minSubtotalRupees) * 100)
          : 0;

      const payload: CouponPayload = {
        code: values.code.trim().toUpperCase(),
        description: values.description.trim(),
        discountType: values.discountType,
        discountValue,
        minSubtotal,
        ...(values.discountType === 'percentage' && values.maxDiscountRupees !== ''
          ? { maxDiscount: Math.round(Number(values.maxDiscountRupees) * 100) }
          : {}),
        startsAt: `${values.startsAt}T00:00:00.000Z`,
        expiresAt: `${values.expiresAt}T23:59:59.999Z`,
        ...(values.usageLimit !== '' ? { usageLimit: Number(values.usageLimit) } : {}),
        perUserLimit: Number(values.perUserLimit),
        isActive: values.isActive,
      };

      if (editingCoupon) {
        const res = await api.patch<CouponMutationResponse>(
          `/coupons/${editingCoupon._id}`,
          payload
        );
        const updated = res.coupon;
        setCoupons((prev) =>
          prev.map((item) => (item._id === editingCoupon._id ? updated : item))
        );
        toast({ message: `Coupon ${updated.code} updated`, type: 'success' });
      } else {
        const res = await api.post<CouponMutationResponse>('/coupons', payload);
        const created = res.coupon;
        setCoupons((prev) => [created, ...prev]);
        setTotalCount((prev) => prev + 1);
        toast({ message: `Coupon ${created.code} created`, type: 'success' });
      }

      setDrawerOpen(false);
      setEditingCoupon(null);
    } catch (err: unknown) {
      toast({
        message: err instanceof Error ? err.message : 'Failed to save coupon',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Summary metrics
  const stats = useMemo(() => {
    const activeCount = coupons.filter((c) => c.isActive).length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usageCount ?? 0), 0);
    return {
      total: Math.max(totalCount, coupons.length),
      active: activeCount,
      redemptions: totalRedemptions,
    };
  }, [coupons, totalCount]);

  const columns: Column<CouponDoc>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'Code',
        sortable: true,
        render: (row) => {
          const isCopied = copiedId === row._id;
          return (
            <div className="inline-flex items-center gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md bg-[#F7F6F2] border border-[#E5E4DF] text-[#1A1A1A]">
                {row.code}
              </span>
              <button
                type="button"
                onClick={() => void handleCopyCode(row)}
                className="p-1.5 rounded-lg text-[#6B6B65] hover:text-[#1F3A2E] hover:bg-[#E8EDE9] transition-colors"
                title={`Copy ${row.code}`}
                aria-label={`Copy code ${row.code}`}
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          );
        },
      },
      {
        key: 'description',
        header: 'Description',
        render: (row) => (
          <p
            className="text-sm text-[#6B6B65] max-w-[220px] truncate"
            title={row.description || undefined}
          >
            {row.description || '—'}
          </p>
        ),
      },
      {
        key: 'discountValue',
        header: 'Discount',
        sortable: true,
        render: (row) => (
          <div>
            <span className="font-semibold text-[#1A1A1A]">
              {row.discountType === 'percentage'
                ? `${row.discountValue}%`
                : `${formatPaiseToInr(row.discountValue)} off`}
            </span>
            {row.discountType === 'percentage' && row.maxDiscount != null && (
              <p className="text-xs text-[#6B6B65] mt-0.5">
                Max {formatPaiseToInr(row.maxDiscount)}
              </p>
            )}
          </div>
        ),
      },
      {
        key: 'minSubtotal',
        header: 'Min Order',
        sortable: true,
        render: (row) =>
          row.minSubtotal > 0 ? (
            <span className="text-sm text-[#1A1A1A]">{formatPaiseToInr(row.minSubtotal)}</span>
          ) : (
            <span className="text-sm text-[#6B6B65]">No minimum</span>
          ),
      },
      {
        key: 'expiresAt',
        header: 'Validity',
        sortable: true,
        render: (row) => {
          const isExpired = new Date(row.expiresAt).getTime() < Date.now();
          return (
            <div className="whitespace-nowrap">
              <span className="text-sm text-[#1A1A1A]">
                {formatValidity(row.startsAt, row.expiresAt)}
              </span>
              {isExpired && (
                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
                  Expired
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'usageCount',
        header: 'Usage',
        sortable: true,
        render: (row) => (
          <span className="text-sm text-[#1A1A1A] tabular-nums whitespace-nowrap">
            {row.usageLimit != null
              ? `${row.usageCount} / ${row.usageLimit}`
              : `${row.usageCount} ${row.usageCount === 1 ? 'use' : 'uses'}`}
          </span>
        ),
      },
      {
        key: 'isActive',
        header: 'Status',
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <Switch
              checked={row.isActive}
              disabled={togglingIds.has(row._id)}
              onChange={() => void handleToggleActive(row)}
              label={`Toggle ${row.code} active status`}
            />
            <span
              className={`text-xs font-medium ${
                row.isActive ? 'text-[#1F3A2E]' : 'text-[#6B6B65]'
              }`}
            >
              {row.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openEditDrawer(row)}
              className="p-2 rounded-lg text-[#6B6B65] hover:text-[#1F3A2E] hover:bg-[#E8EDE9] transition-colors"
              title="Edit coupon"
              aria-label={`Edit coupon ${row.code}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-2 rounded-lg text-[#6B6B65] hover:text-red-700 hover:bg-red-50 transition-colors"
              title="Delete coupon"
              aria-label={`Delete coupon ${row.code}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [copiedId, handleCopyCode, handleToggleActive, openEditDrawer, togglingIds]
  );

  const codeField = register('code');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Promotions"
        title="Coupons"
        subtitle="Create, monitor, and manage checkout discount codes."
        actions={
          <button
            type="button"
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1F3A2E] px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-[#162a21] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:ring-offset-1"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        }
      />

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E5E4DF] bg-white p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
              Total Coupons
            </p>
            <p className="mt-1.5 font-serif text-3xl font-semibold text-[#1A1A1A] tabular-nums">
              {loading ? '—' : stats.total.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EDE9] text-[#1F3A2E]">
            <Ticket className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E4DF] bg-white p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
              Active Coupons
            </p>
            <p className="mt-1.5 font-serif text-3xl font-semibold text-[#1A1A1A] tabular-nums">
              {loading ? '—' : stats.active.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EDE9] text-[#1F3A2E]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E4DF] bg-white p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
              Total Redemptions
            </p>
            <p className="mt-1.5 font-serif text-3xl font-semibold text-[#1A1A1A] tabular-nums">
              {loading ? '—' : stats.redemptions.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EDE9] text-[#1F3A2E]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Coupons DataTable */}
      <DataTable<CouponDoc>
        columns={columns}
        data={coupons}
        loading={loading}
        keyExtractor={(row) => row._id}
        pagination={
          totalPages > 1
            ? {
                page,
                totalPages,
                onPageChange: (nextPage) => setPage(nextPage),
              }
            : undefined
        }
        emptyState={
          <EmptyState
            icon={<Ticket className="w-7 h-7" />}
            title="No coupons yet"
            description="Create your first promotional code to offer percentage or fixed discounts at checkout."
            action={
              <button
                type="button"
                onClick={openCreateDrawer}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1F3A2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#162a21] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Coupon
              </button>
            }
          />
        }
      />

      {/* Create / Edit Coupon Drawer */}
      <SlideOverDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editingCoupon ? 'Edit Coupon' : 'New Coupon'}
        width="md"
        footer={
          <>
            <button
              type="button"
              onClick={closeDrawer}
              disabled={submitting}
              className="rounded-xl border border-[#E5E4DF] bg-white px-4 py-2.5 text-sm font-medium text-[#1A1A1A] hover:bg-[#F7F6F2] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="coupon-drawer-form"
              disabled={submitting}
              className="rounded-xl bg-[#1F3A2E] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#162a21] transition-colors disabled:opacity-50"
            >
              {submitting
                ? 'Saving...'
                : editingCoupon
                  ? 'Save Changes'
                  : 'Create Coupon'}
            </button>
          </>
        }
      >
        <form
          id="coupon-drawer-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {/* Code */}
          <div>
            <label htmlFor="coupon-code" className={labelCls}>
              Coupon Code <span className="text-red-600">*</span>
            </label>
            <input
              id="coupon-code"
              type="text"
              placeholder="e.g. WELCOME15"
              autoComplete="off"
              {...codeField}
              onChange={(e) => {
                const upper = e.target.value.toUpperCase();
                e.target.value = upper;
                void codeField.onChange(e);
              }}
              className={`${inputCls} font-mono uppercase`}
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>
            )}
            <p className="mt-1 text-xs text-[#6B6B65]">
              3–40 characters. Uppercase letters, numbers, hyphens, or underscores.
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="coupon-description" className={labelCls}>
              Description
            </label>
            <textarea
              id="coupon-description"
              rows={2}
              placeholder="Optional internal or customer-facing note"
              {...register('description')}
              className={`${inputCls} resize-none`}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Discount Type Radio */}
          <div>
            <span className={labelCls}>
              Discount Type <span className="text-red-600">*</span>
            </span>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: 'percentage', label: 'Percentage (%)' },
                  { value: 'fixed', label: 'Fixed Amount (₹)' },
                ] as const
              ).map((option) => {
                const selected = watchedDiscountType === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                      selected
                        ? 'border-[#1F3A2E] bg-[#E8EDE9] text-[#1F3A2E]'
                        : 'border-[#E5E4DF] bg-white text-[#1A1A1A] hover:bg-[#F7F6F2]'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      {...register('discountType')}
                      className="h-4 w-4 text-[#1F3A2E] focus:ring-[#1F3A2E]"
                    />
                    <span>{option.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Discount Value & Optional Max Discount */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-discount-value" className={labelCls}>
                {watchedDiscountType === 'percentage'
                  ? 'Discount Percentage (%)'
                  : 'Discount Amount (₹)'}{' '}
                <span className="text-red-600">*</span>
              </label>
              <input
                id="coupon-discount-value"
                type="number"
                min={watchedDiscountType === 'percentage' ? 1 : 0.01}
                max={watchedDiscountType === 'percentage' ? 100 : undefined}
                step={watchedDiscountType === 'percentage' ? 1 : 0.01}
                placeholder={watchedDiscountType === 'percentage' ? '15' : '200'}
                {...register('discountValue')}
                className={inputCls}
              />
              {errors.discountValue && (
                <p className="mt-1 text-xs text-red-600">{errors.discountValue.message}</p>
              )}
            </div>

            {watchedDiscountType === 'percentage' && (
              <div>
                <label htmlFor="coupon-max-discount" className={labelCls}>
                  Max Discount (₹)
                </label>
                <input
                  id="coupon-max-discount"
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="Optional cap"
                  {...register('maxDiscountRupees')}
                  className={inputCls}
                />
                {errors.maxDiscountRupees && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.maxDiscountRupees.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Min Subtotal */}
          <div>
            <label htmlFor="coupon-min-subtotal" className={labelCls}>
              Minimum Order Subtotal (₹)
            </label>
            <input
              id="coupon-min-subtotal"
              type="number"
              min={0}
              step={0.01}
              placeholder="0 (No minimum)"
              {...register('minSubtotalRupees')}
              className={inputCls}
            />
            {errors.minSubtotalRupees && (
              <p className="mt-1 text-xs text-red-600">{errors.minSubtotalRupees.message}</p>
            )}
          </div>

          {/* Starts At & Expires At */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-starts-at" className={labelCls}>
                Starts At <span className="text-red-600">*</span>
              </label>
              <input
                id="coupon-starts-at"
                type="date"
                {...register('startsAt')}
                className={inputCls}
              />
              {errors.startsAt && (
                <p className="mt-1 text-xs text-red-600">{errors.startsAt.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="coupon-expires-at" className={labelCls}>
                Expires At <span className="text-red-600">*</span>
              </label>
              <input
                id="coupon-expires-at"
                type="date"
                {...register('expiresAt')}
                className={inputCls}
              />
              {errors.expiresAt && (
                <p className="mt-1 text-xs text-red-600">{errors.expiresAt.message}</p>
              )}
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="coupon-usage-limit" className={labelCls}>
                Total Usage Limit
              </label>
              <input
                id="coupon-usage-limit"
                type="number"
                min={1}
                step={1}
                placeholder="Unlimited"
                {...register('usageLimit')}
                className={inputCls}
              />
              {errors.usageLimit && (
                <p className="mt-1 text-xs text-red-600">{errors.usageLimit.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="coupon-per-user-limit" className={labelCls}>
                Per-User Limit <span className="text-red-600">*</span>
              </label>
              <input
                id="coupon-per-user-limit"
                type="number"
                min={1}
                step={1}
                {...register('perUserLimit')}
                className={inputCls}
              />
              {errors.perUserLimit && (
                <p className="mt-1 text-xs text-red-600">{errors.perUserLimit.message}</p>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[#E5E4DF] bg-[#F7F6F2] px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Active</p>
              <p className="text-xs text-[#6B6B65]">
                Allow customers to redeem this coupon during its validity window.
              </p>
            </div>
            <Switch
              checked={watchedIsActive}
              onChange={(next) => setValue('isActive', next, { shouldDirty: true })}
              label="Coupon active status"
            />
          </div>
        </form>
      </SlideOverDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete coupon?"
        description={
          deleteTarget
            ? `Permanently delete coupon "${deleteTarget.code}"? Existing orders that already used it will not be affected, but customers will no longer be able to redeem it.`
            : ''
        }
        confirmLabel="Delete Coupon"
        isDangerous
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default CouponsPage;
