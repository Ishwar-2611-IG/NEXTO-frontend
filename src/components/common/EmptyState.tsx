import type { ReactNode } from 'react';

export function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg bg-[#FFFCF7] border border-[#7E7C77]/20 p-8 sm:p-12 shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)] text-center space-y-4">
      <p className="text-[#7E7C77] text-sm font-mono">{message}</p>
      {children}
    </div>
  );
}
