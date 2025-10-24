"use client";
import { FileText, Image as Img } from "lucide-react";
import type { MaintAttachment } from "@/lib/admin/maintenance/types";

export default function AttachmentBadges({ items, files }: { items?: MaintAttachment[]; files?: MaintAttachment[] }) {
  const arr = (items ?? files ?? []) as MaintAttachment[];
  if (!arr.length) return <span className="text-neutral-400 italic text-xs">None</span>;
  const cImg = arr.filter((i) => i.kind === "image").length;
  const cPdf = arr.filter((i) => i.kind === "pdf").length;
  return (
    <div className="flex items-center gap-2 text-neutral-700 text-xs">
      {cImg ? (<span className="inline-flex items-center gap-1"><Img size={14}/> {cImg}</span>) : null}
      {cPdf ? (<span className="inline-flex items-center gap-1"><FileText size={14}/> {cPdf}</span>) : null}
    </div>
  );
}
