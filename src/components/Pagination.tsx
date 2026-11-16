import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import type { PaginationResult } from '../hooks/usePagination';

interface Props {
  pg: PaginationResult<any>;
  pageSizeOptions?: number[];
  className?: string;
}

/**
 * Drop-in pagination bar.
 *
 * Usage:
 *   import { Pagination } from '../components/Pagination';
 *   <Pagination pg={pg} />
 */
export function Pagination({ pg, pageSizeOptions = [10, 20, 50, 100], className }: Props) {
  if (pg.totalItems === 0) return null;

  // Show at most 5 page buttons, centred around current page
  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i);

  let pages: (number | '...')[] = [];
  if (pg.totalPages <= 7) {
    pages = range(1, pg.totalPages);
  } else {
    const left  = Math.max(2, pg.page - 1);
    const right = Math.min(pg.totalPages - 1, pg.page + 1);
    pages = [1];
    if (left > 2) pages.push('...');
    pages.push(...range(left, right));
    if (right < pg.totalPages - 1) pages.push('...');
    pages.push(pg.totalPages);
  }

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 pt-4', className)}>
      {/* Left: showing X–Y of Z */}
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
        Showing {pg.startIndex + 1}–{pg.endIndex} of {pg.totalItems}
      </p>

      {/* Centre: page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={pg.prevPage}
          disabled={!pg.hasPrev}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => pg.setPage(p as number)}
              className={cn(
                'w-8 h-8 rounded-lg text-xs font-black transition-all',
                pg.page === p
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-muted-foreground hover:text-white hover:bg-white/10'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={pg.nextPage}
          disabled={!pg.hasNext}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: page size selector */}
      <select
        value={pg.pageSize}
        onChange={e => pg.setPageSize(Number(e.target.value))}
        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
      >
        {pageSizeOptions.map(s => (
          <option key={s} value={s}>{s} per page</option>
        ))}
      </select>
    </div>
  );
}
