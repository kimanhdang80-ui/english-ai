/** Cursor/offset-agnostic pagination value objects (framework-free). */

export interface PageQuery {
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Normalize raw query params into a safe PageQuery. */
export function toPageQuery(input: {
  page?: number | string | null;
  pageSize?: number | string | null;
}): PageQuery {
  const page = Math.max(1, Number(input.page) || 1);
  const rawSize = Number(input.pageSize) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize));
  return { page, pageSize };
}

export function toPage<T>(
  items: T[],
  total: number,
  query: PageQuery,
): Page<T> {
  return { items, total, page: query.page, pageSize: query.pageSize };
}

export function toSkipTake(query: PageQuery): { skip: number; take: number } {
  return { skip: (query.page - 1) * query.pageSize, take: query.pageSize };
}
