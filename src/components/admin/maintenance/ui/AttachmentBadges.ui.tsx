"use client";

import * as React from "react";
import type { MaintAttachment } from "@/lib/admin/maintenance/types";

type Props = { items: MaintAttachment[] | undefined | null };

function labelFor(a: MaintAttachment) {
  const t = (a.mimeType || "").toLowerCase();
  if (t.startsWith("image/")) return "IMG";
  if (t === "application/pdf" || a.name?.toLowerCase().endsWith(".pdf")) return "PDF";
  return "FILE";
}

export default function AttachmentBadges({ items }: Props) {
  const list = items ?? [];
  if (!list.length) return <span className="text-neutral-400">—</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          title={a.name || labelFor(a)}
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-neutral-50 text-neutral-700 ring-neutral-200 hover:bg-neutral-100"
        >
          {labelFor(a)}
        </a>
      ))}
    </div>
  );
}
