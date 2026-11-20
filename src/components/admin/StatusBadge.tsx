import React from 'react';

export type StatusBadgeVariant = 'order' | 'payment' | 'stock' | 'review' | 'coupon' | 'generic';

export interface StatusBadgeProps {
  status: string;
  variant?: StatusBadgeVariant;
  className?: string;
}

type ColorScheme = {
  bg: string;
  text: string;
  border: string;
  dot: string;
};

const COLOR_MAP: Record<string, ColorScheme> = {
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  gray: {
    bg: 'bg-[#FAF9F6]',
    text: 'text-[#6B6B65]',
    border: 'border-[#E5E4DF]',
    dot: 'bg-[#6B6B65]',
  },
};

function resolveColor(status: string): ColorScheme {
  const normalized = status.toLowerCase().trim().replace(/[-\s]+/g, '_');

  switch (normalized) {
    case 'pending':
    case 'payment_pending':
    case 'awaiting_payment':
      return COLOR_MAP.amber;

    case 'processing':
    case 'active':
    case 'approved':
    case 'in_stock':
    case 'instock':
    case 'available':
      return COLOR_MAP.emerald;

    case 'shipped':
    case 'completed':
    case 'paid':
    case 'settled':
      return COLOR_MAP.blue;

    case 'delivered':
    case 'fulfilled':
    case 'success':
      return COLOR_MAP.green;

    case 'cancelled':
    case 'canceled':
    case 'failed':
    case 'rejected':
    case 'out_of_stock':
    case 'outofstock':
      return COLOR_MAP.red;

    case 'refunded':
    case 'low_stock':
    case 'lowstock':
      return COLOR_MAP.orange;

    case 'draft':
    case 'inactive':
    case 'flagged':
    case 'archived':
    case 'disabled':
      return COLOR_MAP.gray;

    default:
      return COLOR_MAP.gray;
  }
}

function formatLabel(status: string): string {
  if (!status) return '';
  return status
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant: _variant = 'generic',
  className = '',
}) => {
  const scheme = resolveColor(status);
  const label = formatLabel(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${scheme.bg} ${scheme.text} ${scheme.border} ${className}`.trim()}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${scheme.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
};

export default StatusBadge;
