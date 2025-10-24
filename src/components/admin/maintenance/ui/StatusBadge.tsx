"use client";
import type { MaintStatus } from "@/lib/admin/maintenance/types";

type Props = { value?: MaintStatus; s?: MaintStatus; className?: string };
const MAP: Record<MaintStatus, { bg: string; text: string; ring: string; dot: string }> = {
  Submitted:     { bg:"bg-indigo-50",  text:"text-indigo-700",  ring:"ring-indigo-200",  dot:"bg-indigo-500" },
  Acknowledged:  { bg:"bg-blue-50",    text:"text-blue-700",    ring:"ring-blue-200",    dot:"bg-blue-500" },
  "In-Progress": { bg:"bg-amber-50",   text:"text-amber-800",   ring:"ring-amber-200",   dot:"bg-amber-500" },
  Completed:     { bg:"bg-emerald-50", text:"text-emerald-800", ring:"ring-emerald-200", dot:"bg-emerald-500" },
  Rejected:      { bg:"bg-rose-50",    text:"text-rose-800",    ring:"ring-rose-200",    dot:"bg-rose-500" },
};
export default function StatusBadge({ value, s, className="" }: Props) {
  const val = (value ?? s)!;
  const c = MAP[val];
  return (
    <span className={["inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset", c.bg, c.text, c.ring, className].join(" ")}>
      <span className={["h-1.5 w-1.5 rounded-full", c.dot].join(" ")} /> {val}
    </span>
  );
}
