import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  eyebrow?: string;
  as?: 'h2' | 'h3';
  titleClassName?: string;
  className?: string;
  /** Right-hand content (links, arrows). */
  actions?: ReactNode;
}

export function SectionHeading({
  title,
  eyebrow,
  as: Tag = 'h2',
  titleClassName = 'text-3xl sm:text-5xl',
  className = 'pb-4',
  actions,
}: SectionHeadingProps) {
  return (
    <div className={`flex flex-col items-start gap-3 border-b border-[#7E7C77]/20 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && <span className="text-[10px] font-bold text-[#7E7C77] uppercase tracking-[0.18em] block mb-2">{eyebrow}</span>}
        <Tag className={`${titleClassName} font-semibold tracking-tight text-[#2E2D2B]`}>{title}</Tag>
      </div>
      {actions}
    </div>
  );
}

export const LINK_BUTTON_CLASS =
  'text-xs font-mono uppercase tracking-widest text-[#7E7C77] hover:text-[#6B7B6E] underline';

/** The decorative ← → pair next to rail headings (kept from the original design). */
export function RailArrows() {
  return (
    <div className="flex space-x-2" aria-hidden="true">
      <span className="w-10 h-10 rounded-full bg-[#FFFCF7] border border-[#7E7C77]/20 flex items-center justify-center text-[#2E2D2B]">←</span>
      <span className="w-10 h-10 rounded-full bg-[#FFFCF7] border border-[#7E7C77]/20 flex items-center justify-center text-[#2E2D2B]">→</span>
    </div>
  );
}
