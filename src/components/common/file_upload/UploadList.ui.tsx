"use client";
import * as React from "react";

export type UploadStatus = "idle" | "uploading" | "done" | "error";

export type UploadItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  url?: string;
  progress: number;
  status: UploadStatus;
  error?: string;
};

const fmt = (b: number) =>
  b < 1024 ? `${b}B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1048576).toFixed(1)} MB`;

export function UploadList({
  items,
  accent = "#7a0019",
  onRetry,
  onRemove,
  onCancelAll,
}: {
  items: UploadItem[];
  accent?: string; // maroon
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
  onCancelAll: () => void;
}) {
  if (items.length === 0) return null;

  const uploading = items.some(i => i.status === "uploading");

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-gray-900">
          {uploading ? "Uploading…" : "Uploads"}
        </div>
        {uploading && (
          <button
            type="button"
            onClick={onCancelAll}
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="grid gap-2">
        {items.map((it) => (
          <div key={it.id} className="rounded-lg border p-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-gray-100">
                {it.url && it.file.type.startsWith("image/")
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={it.url} alt="" className="h-full w-full object-cover" />
                  : <span className="text-xs text-gray-500">FILE</span>}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium">{it.name}</div>
                  <div className="whitespace-nowrap text-xs text-gray-500">{fmt(it.size)}</div>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 w-full overflow-hidden rounded bg-gray-100">
                    <div
                      className="h-full"
                      style={{
                        width: `${it.status === "done" ? 100 : it.progress}%`,
                        background: it.status === "error" ? "#ef4444" : accent,
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-xs text-gray-500">
                    {it.status === "done" ? "Completed" : it.status === "error" ? "Error" : `${Math.min(it.progress, 99)}%`}
                  </div>
                </div>

                {it.status === "error" && (
                  <div className="mt-1 text-xs text-rose-600">{it.error ?? "Upload failed."}</div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {it.status === "error" && (
                  <button
                    type="button"
                    onClick={() => onRetry(it.id)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(it.id)}
                  className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
