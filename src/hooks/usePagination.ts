import { useState, useMemo } from 'react';

export interface PaginationResult<T> {
  page:        number;
  totalPages:  number;
  totalItems:  number;
  pageItems:   T[];
  setPage:     (p: number) => void;
  nextPage:    () => void;
  prevPage:    () => void;
  hasNext:     boolean;
  hasPrev:     boolean;
  pageSize:    number;
  setPageSize: (s: number) => void;
  startIndex:  number;
  endIndex:    number;
}

/**
 * Client-side pagination hook.
 *
 * Usage:
 *   const pg = usePagination(allItems, 20);
 *   pg.pageItems   → items for the current page
 *   pg.page        → current page (1-based)
 *   pg.totalPages  → total number of pages
 *   pg.setPage(n)  → jump to page n
 *   pg.nextPage()  → go to next page
 *   pg.prevPage()  → go to previous page
 */
export function usePagination<T>(
  items: T[],
  defaultPageSize = 20
): PaginationResult<T> {
  const [page, setPageRaw]     = useState(1);
  const [pageSize, setPageSizeRaw] = useState(defaultPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp page when items change (e.g. after a search filter)
  const safePage = Math.min(page, totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex   = Math.min(startIndex + pageSize, totalItems);

  const pageItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const setPage = (p: number) => setPageRaw(Math.max(1, Math.min(p, totalPages)));
  const setPageSize = (s: number) => { setPageSizeRaw(s); setPageRaw(1); };
  const nextPage = () => setPage(safePage + 1);
  const prevPage = () => setPage(safePage - 1);

  return {
    page: safePage,
    totalPages,
    totalItems,
    pageItems,
    setPage,
    nextPage,
    prevPage,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
    pageSize,
    setPageSize,
    startIndex,
    endIndex,
  };
}
