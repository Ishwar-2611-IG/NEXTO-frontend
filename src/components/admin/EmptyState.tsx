import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white border border-[#E5E4DF] rounded-xl shadow-xs ${className}`.trim()}
    >
      {icon ? (
        <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[#E8EDE9] text-[#1F3A2E]">
          {icon}
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-[#E8EDE9] text-[#1F3A2E]">
          <svg
            className="w-7 h-7"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
      )}

      <h3 className="font-serif text-lg font-semibold text-[#1A1A1A]">
        {title}
      </h3>

      {description && (
        <p className="mt-1 text-sm text-[#6B6B65] max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
