"use client";
import { FileText, Image as ImgIcon, File } from "lucide-react";
import type { MaintAttachment } from "@/lib/admin/maintenance/types";

type Props = {
  items?: MaintAttachment[];
  onOpenLightbox?: (index: number) => void;
};

export default function AttachmentsGrid({ items = [], onOpenLightbox }: Props) {
  if (!items.length) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <DocTile label="No preview available" muted />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((a, i) => (
        <DocTile
          key={a.id}
          label={a.name || (a.kind === "pdf" ? "PDF document" : "Image")}
          kind={a.kind}
          onClick={() => onOpenLightbox?.(i)}
        />
      ))}
    </div>
  );
}

function DocTile({
  label,
  kind,
  muted,
  onClick,
}: {
  label: string;
  kind?: "pdf" | "image";
  muted?: boolean;
  onClick?: () => void;
}) {
  const tone =
    muted
      ? "border-dashed border-neutral-300 bg-neutral-50 text-neutral-400"
      : kind === "pdf"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : kind === "image"
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : "border-neutral-200 bg-white text-neutral-700";

  const Icon =
    muted ? File : kind === "pdf" ? FileText : kind === "image" ? ImgIcon : File;

  const badge =
    kind === "pdf" ? "PDF" : kind === "image" ? "IMG" : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative w-full aspect-[3/4] rounded-2xl border",
        "flex items-center justify-center",
        "shadow-sm hover:shadow-md transition",
        tone,
      ].join(" ")}
    >
      {/* document header */}
      <div className="absolute top-0 left-0 right-0 h-8 rounded-t-2xl bg-white/60 border-b border-inherit" />
      {/* badge */}
      {badge && (
        <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-inherit">
          {badge}
        </div>
      )}
      <div className="flex flex-col items-center gap-2 px-3 text-xs">
        <Icon className="h-6 w-6 opacity-80" />
        <div className="line-clamp-2 text-center leading-tight">{label}</div>
        {!muted && <div className="text-[10px] opacity-60">Tap to preview</div>}
      </div>
    </button>
  );
}
