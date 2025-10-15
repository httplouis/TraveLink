"use client";
import * as React from "react";

export default function Pagination({
  page, total, pageSize, onPrev, onNext
}: {
  page: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(total, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex items-center justify-between p-3">
      <div className="text-xs text-gray-500">
        Showing {start}-{end} of {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded-full border px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={onPrev}
          disabled={page === 1}
          title="Prev"
        >
          Prev
        </button>
        <span className="text-sm">Page {page} / {totalPages}</span>
        <button
          className="rounded-full border px-3 py-1.5 text-sm disabled:opacity-50"
          onClick={onNext}
          disabled={page >= totalPages}
          title="Next"
        >
          Next
        </button>
      </div>
    </div>
  );
}
