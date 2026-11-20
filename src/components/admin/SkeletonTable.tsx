import React from 'react';
import { Skeleton } from '../../components/common/Skeleton';

export interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  cols = 4,
  className = '',
}) => {
  const rowArray = Array.from({ length: rows });
  const colArray = Array.from({ length: cols });

  return (
    <div
      className={`w-full bg-white border border-[#E5E4DF] rounded-xl overflow-hidden shadow-xs ${className}`.trim()}
      role="status"
      aria-label="Loading table data..."
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {/* Header Skeleton */}
          <thead className="bg-[#FAF9F6] border-b border-[#E5E4DF]">
            <tr>
              {colArray.map((_, colIndex) => (
                <th key={`head-col-${colIndex}`} className="px-6 py-3.5">
                  <Skeleton className="h-4 w-24 rounded" />
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Skeleton */}
          <tbody className="divide-y divide-[#E5E4DF] bg-white">
            {rowArray.map((_, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="hover:bg-[#FAF9F6]/50">
                {colArray.map((_, colIndex) => (
                  <td key={`cell-${rowIndex}-${colIndex}`} className="px-6 py-4">
                    <Skeleton
                      className={`h-4 rounded ${
                        colIndex === 0
                          ? 'w-32'
                          : colIndex === cols - 1
                          ? 'w-16'
                          : 'w-24'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SkeletonTable;
