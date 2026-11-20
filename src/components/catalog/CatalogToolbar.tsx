import { SortDropdown } from '../common/SortDropdown';

interface CatalogToolbarProps {
  title: string;
  subtitle: string;
  sortOptions: string[];
  sortValue: string;
  onSortChange: (value: string) => void;
}

/** Title + product count on the left, sort options on the right. */
export function CatalogToolbar({ title, subtitle, sortOptions, sortValue, onSortChange }: CatalogToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg bg-[#FFFCF7] p-5 sm:p-6 border border-[#7E7C77]/20 shadow-[0_10px_30px_-10px_rgba(46,45,43,0.04)]">
      <div>
        <h2 className="text-xl font-semibold text-[#2E2D2B]">{title}</h2>
        <p className="text-xs text-[#7E7C77] mt-0.5">{subtitle}</p>
      </div>
      <div className="mt-4 sm:mt-0">
        <SortDropdown
          options={sortOptions.map((option) => ({ label: option, value: option }))}
          value={sortValue}
          onChange={onSortChange}
        />
      </div>
    </div>
  );
}
