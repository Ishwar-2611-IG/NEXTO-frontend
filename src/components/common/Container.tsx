import type { ElementType, ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}

/** The site-wide centred content column (max 1440px with 24px gutters). */
export function Container({ children, className = '', as: Tag = 'div' }: ContainerProps) {
  return <Tag className={`max-w-[1440px] mx-auto px-6 ${className}`.trim()}>{children}</Tag>;
}
