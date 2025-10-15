// src/lib/common/pagination.ts
export type Pagination = { page: number; pageSize: number; total: number };

export function clampPage(total: number, pageSize: number, page: number) {
  const maxPage = Math.max(1, Math.ceil((total || 0) / pageSize));
  return Math.min(Math.max(1, page), maxPage);
}
