import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'ghost';
type Size = 'lg' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'rounded-full bg-[#526457] text-white shadow-[0_8px_20px_-10px_rgba(46,45,43,0.22)] hover:bg-[#445549] hover:text-white',
  ghost: 'rounded-full bg-transparent text-[#2E2D2B] border border-[#7E7C77]/30 hover:border-[#6B7B6E] hover:bg-[#6B7B6E]/10',
};

const SIZES: Record<Size, string> = {
  lg: 'px-8 py-4 shadow-[0_10px_30px_-10px_rgba(46,45,43,0.12)]',
  md: 'px-6 py-3',
};

const buttonClasses = (variant: Variant, size: Size, className: string) =>
  `inline-flex items-center justify-center space-x-2 text-[10px] font-extrabold uppercase tracking-[0.14em] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B7B6E] disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`.trim();

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Appends a "→" after the label. */
  arrow?: boolean;
}

export function Button({ variant = 'primary', size = 'md', arrow = false, className = '', type = 'button', children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      <span>{children}</span>
      {arrow && <span aria-hidden="true">→</span>}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
}

/** A router link that looks like a Button (use for navigation; use Button for actions). */
export function ButtonLink({ variant = 'primary', size = 'md', arrow = false, className = '', children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      <span>{children}</span>
      {arrow && <span aria-hidden="true">→</span>}
    </Link>
  );
}
