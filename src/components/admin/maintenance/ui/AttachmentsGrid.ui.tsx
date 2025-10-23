"use client";
import * as React from "react";
import type { Attachment } from "@/lib/admin/maintenance";

export default function AttachmentsGrid({
  files,
  onOpen,
}: { files: Attachment[]; onOpen?: (i: number) => void }) {
  if (!files?.length) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {files.map((f, i) => (
        <button
          key={f.id}
          onClick={() => onOpen?.(i)}
          className="group border rounded-lg overflow-hidden bg-white hover:shadow"
          title={f.name}
        >
          {f.mime.startsWith("image/") ? (
            <img src={f.url} alt={f.name} className="w-full h-28 object-cover" />
          ) : (
            <div className="h-28 grid place-items-center text-sm text-gray-600">
              PDF • {f.name}
            </div>
          )}
          <div className="px-2 py-1 text-xs text-gray-600 truncate">{f.name}</div>
        </button>
      ))}
    </div>
  );
}
