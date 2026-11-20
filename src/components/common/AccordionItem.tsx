import { useId, type ReactNode } from 'react';

interface AccordionItemProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  buttonClassName?: string;
  panelClassName?: string;
  indicatorClassName?: string;
}

/** Accessible disclosure (button + region) used by the product page and the FAQ list. */
export function AccordionItem({
  title,
  open,
  onToggle,
  children,
  className = 'overflow-hidden rounded-lg border border-[#7E7C77]/20 bg-[#FFFCF7]',
  buttonClassName = 'p-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#2E2D2B] hover:bg-[#F0EBE2]',
  panelClassName = 'px-4 pb-4 text-sm text-[#66645F] leading-relaxed',
  indicatorClassName = '',
}: AccordionItemProps) {
  const panelId = useId();
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`w-full flex justify-between items-center ${buttonClassName}`}
      >
        <span>{title}</span>
        <span className={indicatorClassName} aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div id={panelId} role="region" className={panelClassName}>
          {children}
        </div>
      )}
    </div>
  );
}
