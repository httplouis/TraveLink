"use client";

import React from "react";
import type { MaintAttachment } from "@/lib/admin/maintenance";

type Props = { items: MaintAttachment[] };

export default function AttachmentsGrid({ items }: Props) {
  if (!items?.length) return <div className="text-xs text-neutral-500">No attachments</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className={[
            "inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs ring-1",
            a.kind === "img"
              ? "bg-teal-50 text-teal-700 ring-teal-200"
              : "bg-sky-50 text-sky-700 ring-sky-200",
          ].join(" ")}
          title={a.name}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
          {a.kind === "img" ? "IMG" : "PDF"}
          <span className="truncate max-w-[12rem]">{a.name}</span>
        </a>
      ))}
    </div>
  );
}
