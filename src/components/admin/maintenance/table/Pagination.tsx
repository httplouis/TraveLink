"use client";
export default function Pagination({
  page, pageSize, total, onPage,
}: { page: number; pageSize: number; total: number; onPage: (n: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between px-2 py-2 text-sm">
      <div className="opacity-70">
        Showing {(total && (page - 1) * pageSize + 1) || 0}–{Math.min(page * pageSize, total)} of {total}
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded border px-2 py-1 disabled:opacity-50" disabled={page <= 1} onClick={()=>onPage(page-1)}>Prev</button>
        <span>Page {page} / {totalPages}</span>
        <button className="rounded border px-2 py-1 disabled:opacity-50" disabled={page >= totalPages} onClick={()=>onPage(page+1)}>Next</button>
      </div>
    </div>
  );
}
