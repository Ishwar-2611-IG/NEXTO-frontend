import React from 'react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  breadcrumbs,
  actions,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 flex-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2">
            <ol className="flex items-center space-x-2 text-xs font-medium text-[#6B6B65]">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <li key={`${crumb.label}-${idx}`} className="flex items-center space-x-2">
                    {idx > 0 && <span className="text-[#E5E4DF]">/</span>}
                    {crumb.href && !isLast ? (
                      <Link
                        to={crumb.href}
                        className="hover:text-[#1A1A1A] transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? 'text-[#1A1A1A] font-semibold' : ''}>
                        {crumb.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}

        {/* Eyebrow */}
        {eyebrow && (
          <div className="text-xs font-bold uppercase tracking-wider text-[#6B6B65] mb-1">
            {eyebrow}
          </div>
        )}

        {/* Title */}
        <h1 className="font-serif text-3xl font-semibold text-[#1A1A1A] tracking-tight">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="mt-1 text-sm text-[#6B6B65] max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex flex-wrap items-center gap-3 md:flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
