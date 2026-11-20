import type { ReactNode } from 'react';

export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 border-b border-[#7E7C77]/20 pb-6">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#2E2D2B] mb-2">
        <span>{title}</span>
        <span aria-hidden="true">⌄</span>
      </div>
      {children}
    </div>
  );
}
