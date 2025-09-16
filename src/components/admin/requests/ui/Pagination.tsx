"use client";
export default function Pagination({
  page, pageSize, total, onPage, onSize,
}: {
  page: number; pageSize: number; total: number;
  onPage: (p: number) => void;
  onSize: (s: number) => void;
}) {
  const max = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-700 shadow-sm disabled:opacity-50"
      >Prev</button>
      <button
        disabled={page >= max}
        onClick={() => onPage(page + 1)}
        className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-700 shadow-sm disabled:opacity-50"
      >Next</button>
      <select
        className="ml-2 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-700 shadow-sm"
        value={pageSize}
        onChange={(e) => onSize(parseInt(e.target.value, 10))}
      >
        {[15, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
      </select>
    </div>
  );
}
