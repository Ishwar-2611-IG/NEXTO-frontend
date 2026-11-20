import React, { useMemo, useState } from 'react';
import { SkeletonTable } from './SkeletonTable';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface BulkAction {
  label: string;
  onClick: (ids: string[]) => void;
  isDangerous?: boolean;
}

export interface DataTablePagination {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  keyExtractor: (row: T) => string;
  pagination?: DataTablePagination;
  selectedRows?: Set<string>;
  onSelectRow?: (id: string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  bulkActions?: BulkAction[];
  emptyState?: React.ReactNode;
}

type SortOrder = 'asc' | 'desc';

export function DataTable<T>({
  columns,
  data,
  loading = false,
  keyExtractor,
  pagination,
  selectedRows,
  onSelectRow,
  onSelectAll,
  bulkActions,
  emptyState,
}: DataTableProps<T>): React.ReactElement {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortOrder]);

  if (loading) {
    return <SkeletonTable rows={5} cols={columns.length + (onSelectRow ? 1 : 0)} />;
  }

  const hasSelection = Boolean(onSelectRow);
  const selectedCount = selectedRows ? selectedRows.size : 0;
  const allRowIds = data.map(keyExtractor);
  const areAllSelected =
    data.length > 0 && selectedRows ? allRowIds.every((id) => selectedRows.has(id)) : false;
  const isIndeterminate =
    selectedCount > 0 && !areAllSelected && selectedRows ? allRowIds.some((id) => selectedRows.has(id)) : false;

  return (
    <div className="w-full space-y-4">
      {/* Bulk Action Bar */}
      {selectedCount > 0 && bulkActions && bulkActions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-[#E8EDE9] border border-[#1F3A2E]/20 rounded-xl animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-sm font-medium text-[#1F3A2E]">
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#1F3A2E] rounded-full">
              {selectedCount}
            </span>
            <span>selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {bulkActions.map((action, idx) => (
              <button
                key={`${action.label}-${idx}`}
                type="button"
                onClick={() => {
                  if (selectedRows) {
                    action.onClick(Array.from(selectedRows));
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                  action.isDangerous
                    ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
                    : 'bg-[#1F3A2E] hover:bg-[#162a21] text-white focus:ring-[#1F3A2E]'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="w-full bg-white border border-[#E5E4DF] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#FAF9F6] border-b border-[#E5E4DF]">
              <tr>
                {hasSelection && (
                  <th className="w-12 px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={areAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => onSelectAll?.(e.target.checked)}
                      aria-label="Select all rows"
                      className="w-4 h-4 rounded border-[#E5E4DF] text-[#1F3A2E] focus:ring-[#1F3A2E]"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`px-6 py-3.5 text-xs font-semibold text-[#1A1A1A] tracking-wider uppercase ${
                      col.sortable ? 'cursor-pointer select-none hover:text-[#1F3A2E]' : ''
                    }`}
                    onClick={() => {
                      if (col.sortable) handleSort(col.key);
                    }}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[#6B6B65]">
                          {sortKey === col.key ? (
                            sortOrder === 'asc' ? '▲' : '▼'
                          ) : (
                            <span className="opacity-40">⇅</span>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E5E4DF] bg-white">
              {sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (hasSelection ? 1 : 0)}
                    className="p-8 text-center"
                  >
                    {emptyState ?? (
                      <EmptyState
                        title="No records found"
                        description="There are no items to display at this time."
                      />
                    )}
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => {
                  const id = keyExtractor(row);
                  const isChecked = selectedRows ? selectedRows.has(id) : false;

                  return (
                    <tr
                      key={id}
                      className={`transition-colors hover:bg-[#F7F6F2] ${
                        isChecked ? 'bg-[#E8EDE9]/40' : ''
                      }`}
                    >
                      {hasSelection && (
                        <td className="w-12 px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => onSelectRow?.(id, e.target.checked)}
                            aria-label={`Select row ${id}`}
                            className="w-4 h-4 rounded border-[#E5E4DF] text-[#1F3A2E] focus:ring-[#1F3A2E]"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={`cell-${id}-${col.key}`}
                          className="px-6 py-4 text-[#1A1A1A] align-middle"
                        >
                          {col.render(row)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-3.5 border-t border-[#E5E4DF] bg-[#FAF9F6] text-xs text-[#6B6B65]">
            <div>
              Page <span className="font-semibold text-[#1A1A1A]">{pagination.page}</span> of{' '}
              <span className="font-semibold text-[#1A1A1A]">{pagination.totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                className="px-3 py-1.5 border border-[#E5E4DF] rounded-md bg-white text-[#1A1A1A] font-medium hover:bg-[#F7F6F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              {/* Number Buttons */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.totalPages ||
                    Math.abs(p - pagination.page) <= 1
                )
                .reduce<Array<number | '...'>>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '...' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 py-1 text-[#6B6B65]">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${item}`}
                      type="button"
                      onClick={() => pagination.onPageChange(item)}
                      className={`min-w-[2rem] px-2.5 py-1.5 border rounded-md font-medium transition-colors ${
                        pagination.page === item
                          ? 'bg-[#1F3A2E] text-white border-[#1F3A2E]'
                          : 'bg-white text-[#1A1A1A] border-[#E5E4DF] hover:bg-[#F7F6F2]'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                className="px-3 py-1.5 border border-[#E5E4DF] rounded-md bg-white text-[#1A1A1A] font-medium hover:bg-[#F7F6F2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;
