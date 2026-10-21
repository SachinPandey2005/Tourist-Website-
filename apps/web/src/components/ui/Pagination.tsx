import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  // Generate visible page numbers with ellipsis window
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }
    return pages;
  };

  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <nav
      className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-4', className)}
      aria-label="Pagination Navigation"
    >
      {totalItems !== undefined && (
        <p className="text-xs text-slate-400">
          Showing <span className="font-semibold text-slate-200">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-200">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalItems}</span> results
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-500">
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={cn(
                'min-w-[36px] h-9 px-3 rounded-xl text-xs font-semibold transition-all duration-200',
                page === currentPage
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next Page"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
