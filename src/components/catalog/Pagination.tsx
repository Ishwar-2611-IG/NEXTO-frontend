const PAGES = [1, 2, 3, 4, 5];
const baseButton = 'grid size-10 place-items-center rounded-full border border-[#7E7C77]/20 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6B7B6E]';

/**
 * Presentational pager kept from the original design. The catalogue is one page of local data,
 * so it does not change the product list yet — wire `onPageChange` to the API once there is one.
 */
export function Pagination({ current = 1 }: { current?: number }) {
  return (
    <nav aria-label="Pagination" className="flex justify-center items-center space-x-2 pt-6">
      <button type="button" aria-label="Previous page" className={`${baseButton} bg-[#FFFCF7] text-[#2E2D2B] hover:border-[#6B7B6E]`}>‹</button>
      {PAGES.map((page) => (
        <button
          key={page}
          type="button"
          aria-label={`Page ${page}`}
          aria-current={page === current ? 'page' : undefined}
          className={`${baseButton} font-bold ${page === current ? 'bg-[#526457] text-white border-[#6B7B6E]' : 'bg-[#FFFCF7] text-[#2E2D2B] hover:border-[#6B7B6E]'}`}
        >
          {page}
        </button>
      ))}
      <button type="button" aria-label="Next page" className={`${baseButton} bg-[#FFFCF7] text-[#2E2D2B] hover:border-[#6B7B6E]`}>›</button>
    </nav>
  );
}
