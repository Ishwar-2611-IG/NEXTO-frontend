import type { CSSProperties } from 'react';
import { cn } from '../../lib/cn';

const barHeights = [
  45, 65, 35, 80, 55,
  90, 40, 70, 60, 85,
  50, 75, 35, 65, 95,
];

/** Base shimmer block — compose into page-matched skeletons */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        'animate-pulse rounded-md bg-[#E8E4DD]',
        className,
      )}
    />
  );
}

/** 2×4 product grid skeleton — matches ProductGrid layout */
export function ProductGridSkeleton({
  count = 8,
  gridClassName = 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6',
}: {
  count?: number;
  gridClassName?: string;
}) {
  return (
    <div className={`grid ${gridClassName}`} aria-label="Loading products…" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-[#7E7C77]/15 bg-[#FFFCF7]">
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="p-4 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Stat card row skeleton — matches AccountPage overview */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label="Loading stats…">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-5 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Order list row skeleton */
export function OrderRowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="divide-y divide-[#7E7C77]/15" role="status" aria-label="Loading orders…">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 p-5 sm:p-6">
          <Skeleton className="size-[84px] sm:size-[100px] shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full hidden sm:block" />
        </li>
      ))}
    </ul>
  );
}

/** Admin dashboard stat cards skeleton */
export function AdminStatsSkeleton() {
  return (
    <div className="space-y-7" role="status" aria-label="Loading dashboard…">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#7E7C77]/15 bg-white p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[#7E7C77]/15 bg-white p-5 space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="flex h-40 items-end gap-1">
  {barHeights.map((height, i) => (
    <Skeleton
      key={i}
      className="flex-1 rounded-t"
      style={{ height: `${height}%` }}
    />
  ))}
</div>
        </div>
        <div className="rounded-2xl border border-[#7E7C77]/15 bg-white p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between border-b border-[#7E7C77]/10 pb-3">
              <div className="space-y-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Product detail page skeleton */
export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12" role="status" aria-label="Loading product…">
      {/* Gallery */}
      <div className="lg:col-span-7 space-y-3">
        <Skeleton className="aspect-[4/5] w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
      {/* Purchase panel */}
      <div className="lg:col-span-5 space-y-5 pt-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-9 rounded-full" />)}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-16 rounded-lg" />)}
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  );
}

/** Order confirmation skeleton */
export function OrderConfirmationSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-7 px-4 py-10 sm:px-6 sm:py-16" role="status" aria-label="Loading order…">
      <div className="rounded-3xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-6 text-center sm:p-12 space-y-4">
        <Skeleton className="mx-auto size-16 rounded-full" />
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto h-10 w-72" />
        <Skeleton className="mx-auto h-3 w-80" />
        <Skeleton className="mx-auto h-8 w-48 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-5 sm:p-7 space-y-4">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between py-4 border-b border-[#7E7C77]/15">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-[#7E7C77]/20 bg-[#FFFCF7] p-5 sm:p-7 space-y-4">
          <Skeleton className="h-6 w-36" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Catalog page product section skeleton */
export function CatalogSkeleton() {
  return (
    <div className="lg:col-span-9 space-y-8" role="status" aria-label="Loading catalog…">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-36 rounded-full" />
      </div>
      <ProductGridSkeleton count={8} gridClassName="grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6" />
    </div>
  );
}
