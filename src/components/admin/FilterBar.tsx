import React, { useEffect, useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'search' | 'daterange';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset?: () => void;
  className?: string;
}

const DebouncedSearchInput: React.FC<{
  filter: FilterConfig;
  value: string;
  onChange: (key: string, value: string) => void;
}> = ({ filter, value, onChange }) => {
  const [localValue, setLocalValue] = useState(value || '');

  // Keep in sync with external changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localValue !== (value || '')) {
        onChange(filter.key, localValue);
      }
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localValue, filter.key, onChange, value]);

  return (
    <div className="relative min-w-[220px] flex-1">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B6B65]">
        <svg
          className="w-4 h-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={filter.placeholder || `Search ${filter.label}...`}
        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] placeholder-[#6B6B65] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent transition-shadow"
      />
    </div>
  );
};

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  values,
  onChange,
  onReset,
  className = '',
}) => {
  const hasActiveFilters = Object.values(values).some((v) => Boolean(v && v.trim()));

  const handleClearAll = () => {
    if (onReset) {
      onReset();
    } else {
      filters.forEach((f) => {
        onChange(f.key, '');
        if (f.type === 'daterange') {
          onChange(`${f.key}_start`, '');
          onChange(`${f.key}_end`, '');
        }
      });
    }
  };

  return (
    <div
      className={`p-4 bg-white border border-[#E5E4DF] rounded-xl shadow-xs flex flex-wrap items-center gap-3 ${className}`.trim()}
    >
      {filters.map((filter) => {
        if (filter.type === 'search') {
          return (
            <DebouncedSearchInput
              key={filter.key}
              filter={filter}
              value={values[filter.key] || ''}
              onChange={onChange}
            />
          );
        }

        if (filter.type === 'select') {
          return (
            <div key={filter.key} className="min-w-[160px]">
              <label htmlFor={`filter-${filter.key}`} className="sr-only">
                {filter.label}
              </label>
              <select
                id={`filter-${filter.key}`}
                value={values[filter.key] || ''}
                onChange={(e) => onChange(filter.key, e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E] focus:border-transparent transition-shadow cursor-pointer"
              >
                <option value="">{filter.placeholder || `All ${filter.label}`}</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (filter.type === 'daterange') {
          // Supports combined 'from,to' string or split keys
          const rawVal = values[filter.key] || '';
          const [startSplit = '', endSplit = ''] = rawVal.includes(',')
            ? rawVal.split(',')
            : ['', ''];
          const startDate = values[`${filter.key}_start`] || startSplit;
          const endDate = values[`${filter.key}_end`] || endSplit;

          const handleDateChange = (type: 'start' | 'end', val: string) => {
            const nextStart = type === 'start' ? val : startDate;
            const nextEnd = type === 'end' ? val : endDate;
            onChange(filter.key, nextStart || nextEnd ? `${nextStart},${nextEnd}` : '');
            onChange(`${filter.key}_${type}`, val);
          };

          return (
            <div key={filter.key} className="flex items-center gap-1.5 text-xs text-[#6B6B65]">
              <span className="font-medium text-[#1A1A1A] hidden sm:inline">{filter.label}:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                aria-label={`${filter.label} start date`}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
              <span>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                aria-label={`${filter.label} end date`}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E4DF] rounded-lg text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#1F3A2E]"
              />
            </div>
          );
        }

        return null;
      })}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearAll}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#6B6B65] hover:text-[#1A1A1A] hover:bg-[#F7F6F2] border border-[#E5E4DF] rounded-lg transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
};

export default FilterBar;
