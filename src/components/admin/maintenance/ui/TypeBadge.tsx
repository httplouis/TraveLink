"use client";
import type { MaintType } from "@/lib/admin/maintenance";

const COLORS: Record<MaintType, string> = {
  "Preventive (PMS)": "bg-[#fef3f2] text-[#991b1b] ring-1 ring-[#fecaca]",
  Repair: "bg-[#eef2ff] text-[#3730a3] ring-1 ring-[#c7d2fe]",
  "LTO Renewal": "bg-[#ecfeff] text-[#155e75] ring-1 ring-[#a5f3fc]",
  "Insurance Renewal": "bg-[#f0fdf4] text-[#166534] ring-1 ring-[#bbf7d0]",
  "Vulcanize/Tire": "bg-[#fffbeb] text-[#92400e] ring-1 ring-[#fde68a]",
  Other: "bg-[#f8fafc] text-[#334155] ring-1 ring-[#e2e8f0]",
};

export default function TypeBadge({ type }: { type: MaintType }) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full ${COLORS[type]}`}>{type}</span>
  );
}
