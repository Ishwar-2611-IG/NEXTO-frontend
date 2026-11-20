import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Check,
  ExternalLink,
  Flag,
  MessageSquare,
  Star,
  User as UserIcon,
  X,
} from 'lucide-react';
import {
  DataTable,
  EmptyState,
  PageHeader,
  SlideOverDrawer,
  StatusBadge,
  useToast,
  type Column,
} from '../../components/admin/index';
import { api } from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PopulatedProduct {
  _id: string;
  name: string;
  slug: string;
}

export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
}

export interface ReviewDoc {
  _id: string;
  productId: PopulatedProduct | string | null;
  userId: PopulatedUser | string | null;
  orderId: string;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  isFlagged?: boolean;
  createdAt: string;
}

interface ReviewPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ReviewListResponse {
  reviews: ReviewDoc[];
  pagination: ReviewPagination;
}

interface ModerateReviewResponse {
  review: ReviewDoc;
}

type ModerationAction = 'approve' | 'reject' | 'flag';
type ReviewTab = 'all' | 'approved' | 'rejected';

const TABS: Array<{ key: ReviewTab; label: string }> = [
  { key: 'all', label: 'All Reviews' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const PAGE_LIMIT = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTab(param: string | null): ReviewTab {
  if (param === 'approved' || param === 'rejected' || param === 'all') {
    return param;
  }
  return 'all';
}

function isPopulatedProduct(
  product: ReviewDoc['productId']
): product is PopulatedProduct {
  return (
    typeof product === 'object' &&
    product !== null &&
    'name' in product &&
    typeof product.name === 'string'
  );
}

function isPopulatedUser(user: ReviewDoc['userId']): user is PopulatedUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    ('name' in user || 'email' in user)
  );
}

function getReviewStatus(review: ReviewDoc): 'approved' | 'rejected' | 'flagged' {
  if (review.isFlagged) return 'flagged';
  return review.isApproved ? 'approved' : 'rejected';
}

function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ─── Star Rating Subcomponent ────────────────────────────────────────────────

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md';
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 'sm' }) => {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  const iconCls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div
      className="inline-flex items-center gap-0.5"
      aria-label={`${clamped} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconCls} ${
            star <= clamped
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-[#E5E4DF]'
          }`}
        />
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function ReviewsPage(): React.ReactElement {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = parseTab(searchParams.get('tab'));
  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedReview, setSelectedReview] = useState<ReviewDoc | null>(null);
  const [moderatingIds, setModeratingIds] = useState<Set<string>>(new Set());

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_LIMIT));
      if (activeTab === 'approved') {
        params.set('isApproved', 'true');
      } else if (activeTab === 'rejected') {
        params.set('isApproved', 'false');
      }

      const result = await api.get<ReviewListResponse>(
        `/reviews/admin/all?${params.toString()}`
      );
      setReviews(result.reviews ?? []);
      setTotalPages(Math.max(1, result.pagination?.pages ?? 1));
      setTotalCount(result.pagination?.total ?? result.reviews?.length ?? 0);
    } catch (err: unknown) {
      toast({
        message: err instanceof Error ? err.message : 'Failed to load reviews',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, toast]);

  useEffect(() => {
    void fetchReviews();
  }, [fetchReviews]);

  const handleTabChange = useCallback(
    (nextTab: ReviewTab) => {
      const next = new URLSearchParams(searchParams);
      if (nextTab === 'all') {
        next.delete('tab');
      } else {
        next.set('tab', nextTab);
      }
      next.delete('page');
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const next = new URLSearchParams(searchParams);
      if (nextPage <= 1) {
        next.delete('page');
      } else {
        next.set('page', String(nextPage));
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handleModerate = useCallback(
    async (review: ReviewDoc, action: ModerationAction) => {
      const previousReviews = reviews;
      const previousSelected = selectedReview;

      const optimisticPatch: Partial<ReviewDoc> =
        action === 'approve'
          ? { isApproved: true, isFlagged: false }
          : action === 'flag'
            ? { isApproved: false, isFlagged: true }
            : { isApproved: false, isFlagged: false };

      const updatedOptimistic: ReviewDoc = { ...review, ...optimisticPatch };

      setModeratingIds((prev) => new Set(prev).add(review._id));

      // Optimistically update table (filter out if item no longer belongs to active tab)
      const matchesCurrentTab =
        activeTab === 'all' ||
        (activeTab === 'approved' && updatedOptimistic.isApproved) ||
        (activeTab === 'rejected' && !updatedOptimistic.isApproved);

      setReviews((prev) =>
        matchesCurrentTab
          ? prev.map((item) => (item._id === review._id ? updatedOptimistic : item))
          : prev.filter((item) => item._id !== review._id)
      );

      setSelectedReview((current) =>
        current && current._id === review._id ? updatedOptimistic : current
      );

      try {
        const res = await api.patch<ModerateReviewResponse>(
          `/reviews/admin/${review._id}/moderation`,
          { action }
        );
        const serverReview = res?.review;
        if (serverReview) {
          const merged: ReviewDoc = {
            ...updatedOptimistic,
            isApproved: serverReview.isApproved,
            isFlagged: serverReview.isFlagged ?? updatedOptimistic.isFlagged,
          };
          setReviews((prev) =>
            prev.map((item) => (item._id === review._id ? merged : item))
          );
          setSelectedReview((current) =>
            current && current._id === review._id ? merged : current
          );
        }

        const label =
          action === 'approve'
            ? 'Review approved'
            : action === 'reject'
              ? 'Review rejected'
              : 'Review flagged for follow-up';
        toast({ message: label, type: 'success' });
      } catch (err: unknown) {
        // Rollback optimistic update
        setReviews(previousReviews);
        setSelectedReview(previousSelected);
        toast({
          message: err instanceof Error ? err.message : 'Failed to update moderation status',
          type: 'error',
        });
      } finally {
        setModeratingIds((prev) => {
          const next = new Set(prev);
          next.delete(review._id);
          return next;
        });
      }
    },
    [activeTab, reviews, selectedReview, toast]
  );

  const columns: Column<ReviewDoc>[] = useMemo(
    () => [
      {
        key: 'rating',
        header: 'Rating',
        sortable: true,
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelectedReview(row)}
            className="text-left focus:outline-none"
          >
            <StarRating rating={row.rating} />
          </button>
        ),
      },
      {
        key: 'title',
        header: 'Review',
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelectedReview(row)}
            className="text-left group block max-w-md focus:outline-none"
          >
            <p className="font-medium text-[#1A1A1A] group-hover:text-[#1F3A2E] group-hover:underline transition-colors">
              {row.title?.trim() || 'Untitled review'}
            </p>
            <p className="mt-0.5 text-xs text-[#6B6B65] leading-relaxed">
              {truncateText(row.comment, 100)}
            </p>
          </button>
        ),
      },
      {
        key: 'productId',
        header: 'Product',
        render: (row) => {
          const productName = isPopulatedProduct(row.productId)
            ? row.productId.name
            : 'Unknown Product';
          return (
            <button
              type="button"
              onClick={() => setSelectedReview(row)}
              className="text-left text-sm font-medium text-[#1A1A1A] hover:text-[#1F3A2E] max-w-[180px] truncate block"
              title={productName}
            >
              {productName}
            </button>
          );
        },
      },
      {
        key: 'userId',
        header: 'Customer',
        render: (row) => {
          const user = isPopulatedUser(row.userId) ? row.userId : null;
          const primary = user?.name || user?.email || 'Unknown Customer';
          const secondary = user?.name && user?.email ? user.email : null;
          return (
            <button
              type="button"
              onClick={() => setSelectedReview(row)}
              className="text-left block focus:outline-none"
            >
              <p className="text-sm font-medium text-[#1A1A1A]">{primary}</p>
              {secondary && <p className="text-xs text-[#6B6B65]">{secondary}</p>}
            </button>
          );
        },
      },
      {
        key: 'createdAt',
        header: 'Date',
        sortable: true,
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelectedReview(row)}
            className="text-sm text-[#6B6B65] whitespace-nowrap focus:outline-none"
          >
            {formatDate(row.createdAt)}
          </button>
        ),
      },
      {
        key: 'isApproved',
        header: 'Status',
        render: (row) => (
          <button
            type="button"
            onClick={() => setSelectedReview(row)}
            className="focus:outline-none"
          >
            <StatusBadge status={getReviewStatus(row)} variant="review" />
          </button>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => {
          const isBusy = moderatingIds.has(row._id);
          const status = getReviewStatus(row);
          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isBusy || status === 'approved'}
                onClick={() => void handleModerate(row, 'approve')}
                className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Approve review"
                aria-label="Approve review"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isBusy || status === 'rejected'}
                onClick={() => void handleModerate(row, 'reject')}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Reject review"
                aria-label="Reject review"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isBusy || status === 'flagged'}
                onClick={() => void handleModerate(row, 'flag')}
                className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Flag review"
                aria-label="Flag review"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [handleModerate, moderatingIds]
  );

  const emptyCopy = useMemo(() => {
    if (activeTab === 'approved') {
      return {
        title: 'No approved reviews',
        description: 'Approved customer reviews will appear here.',
      };
    }
    if (activeTab === 'rejected') {
      return {
        title: 'No rejected reviews',
        description: 'Reviews that have been rejected or flagged will appear here.',
      };
    }
    return {
      title: 'No reviews yet',
      description: 'Customer reviews will appear here once buyers rate delivered orders.',
    };
  }, [activeTab]);

  const selectedStatus = selectedReview ? getReviewStatus(selectedReview) : null;
  const selectedBusy = selectedReview ? moderatingIds.has(selectedReview._id) : false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Reviews"
        subtitle="Inspect and moderate customer product reviews."
      />

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E4DF] pb-3">
        <nav aria-label="Review status tabs" className="flex items-center gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#E8EDE9] text-[#1F3A2E] font-semibold'
                    : 'text-[#6B6B65] hover:text-[#1A1A1A] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {!loading && (
          <p className="text-xs font-medium text-[#6B6B65]">
            {totalCount.toLocaleString('en-IN')}{' '}
            {totalCount === 1 ? 'review' : 'reviews'}
          </p>
        )}
      </div>

      {/* Reviews DataTable */}
      <DataTable<ReviewDoc>
        columns={columns}
        data={reviews}
        loading={loading}
        keyExtractor={(row) => row._id}
        pagination={
          totalPages > 1
            ? {
                page,
                totalPages,
                onPageChange: handlePageChange,
              }
            : undefined
        }
        emptyState={
          <EmptyState
            icon={<MessageSquare className="w-7 h-7" />}
            title={emptyCopy.title}
            description={emptyCopy.description}
          />
        }
      />

      {/* Review Detail Drawer */}
      <SlideOverDrawer
        open={Boolean(selectedReview)}
        onClose={() => setSelectedReview(null)}
        title="Review Details"
        width="md"
        footer={
          selectedReview ? (
            <div className="flex flex-wrap items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                disabled={selectedBusy || selectedStatus === 'approved'}
                onClick={() => void handleModerate(selectedReview, 'approve')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
              <button
                type="button"
                disabled={selectedBusy || selectedStatus === 'rejected'}
                onClick={() => void handleModerate(selectedReview, 'reject')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
                Reject
              </button>
              <button
                type="button"
                disabled={selectedBusy || selectedStatus === 'flagged'}
                onClick={() => void handleModerate(selectedReview, 'flag')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Flag className="w-4 h-4" />
                Flag
              </button>
            </div>
          ) : undefined
        }
      >
        {selectedReview && (
          <div className="space-y-6">
            {/* Rating + Status */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <StarRating rating={selectedReview.rating} size="md" />
                <span className="text-sm font-semibold text-[#1A1A1A]">
                  {selectedReview.rating} / 5
                </span>
              </div>
              <StatusBadge status={getReviewStatus(selectedReview)} variant="review" />
            </div>

            {/* Review Content */}
            <div className="rounded-xl border border-[#E5E4DF] bg-[#F7F6F2] p-5 space-y-2.5">
              <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
                {selectedReview.title?.trim() || 'Untitled review'}
              </h3>
              <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">
                {selectedReview.comment}
              </p>
            </div>

            {/* Product Details */}
            <div className="rounded-xl border border-[#E5E4DF] bg-white p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
                Product
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {isPopulatedProduct(selectedReview.productId)
                    ? selectedReview.productId.name
                    : 'Unknown Product'}
                </p>
                {isPopulatedProduct(selectedReview.productId) && (
                  <Link
                    to="/admin/products"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3A2E] hover:underline shrink-0"
                  >
                    View Products
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Customer Details */}
            <div className="rounded-xl border border-[#E5E4DF] bg-white p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
                Customer
              </p>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8EDE9] text-[#1F3A2E]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {isPopulatedUser(selectedReview.userId)
                      ? selectedReview.userId.name || 'Customer'
                      : 'Unknown Customer'}
                  </p>
                  {isPopulatedUser(selectedReview.userId) && selectedReview.userId.email && (
                    <p className="text-xs text-[#6B6B65] truncate">
                      {selectedReview.userId.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#E5E4DF] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
                  Submitted
                </p>
                <p className="mt-1 text-sm text-[#1A1A1A]">
                  {formatDateTime(selectedReview.createdAt)}
                </p>
              </div>
              <div className="rounded-xl border border-[#E5E4DF] bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B6B65]">
                  Order ID
                </p>
                <p className="mt-1 font-mono text-xs text-[#1A1A1A] break-all">
                  {selectedReview.orderId || '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}

export default ReviewsPage;
