"use client";
import * as React from "react";
import type { Attachment } from "@/lib/admin/maintenance";

export default function AttachmentBadges({
  files,
  onOpen,
}: { files: Attachment[]; onOpen?: (index: number) => void }) {
  if (!files?.length) return <span className="text-sm text-neutral-400">—</span>;

  const hasImg = files.some((f) => f.mime.startsWith("image/"));
  const hasPdf = files.some((f) => f.mime === "application/pdf");

  return (
    <div className="flex items-center gap-2">
      {hasImg && (
        <button
          onClick={() => onOpen?.(files.findIndex(f => f.mime.startsWith("image/")) || 0)}
          className="text-xs px-2.5 py-1 rounded-full bg-neutral-50 text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-100 transition"
          title="Open images"
        >
          IMG
        </button>
      )}
      {hasPdf && (
        <a
          href={files.find(f => f.mime === "application/pdf")?.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs px-2.5 py-1 rounded-full bg-neutral-50 text-neutral-700 ring-1 ring-black/10 hover:bg-neutral-100 transition"
          title="Open PDF"
        >
          PDF
        </a>
      )}
    </div>
  );
}
