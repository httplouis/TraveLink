"use client";
import type { MaintType } from "@/lib/admin/maintenance/types";

type Props = { value?: MaintType; type?: MaintType; className?: string };
const MAP: Record<MaintType, { bg: string; text: string; ring: string }> = {
  PMS:             { bg:"bg-teal-50",    text:"text-teal-800",    ring:"ring-teal-200" },
  Repair:          { bg:"bg-orange-50",  text:"text-orange-800",  ring:"ring-orange-200" },
  LTORenewal:      { bg:"bg-cyan-50",    text:"text-cyan-800",    ring:"ring-cyan-200" },
  InsuranceRenewal:{ bg:"bg-sky-50",     text:"text-sky-800",     ring:"ring-sky-200" },
  VulcanizeTire:   { bg:"bg-yellow-50",  text:"text-yellow-800",  ring:"ring-yellow-200" },
  Other:           { bg:"bg-neutral-100",text:"text-neutral-800", ring:"ring-neutral-200" },
};
export default function TypeBadge(props: Props) {
  const val = (props.value ?? props.type)!;
  const c = MAP[val];
  return <span className={["inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset", c.bg, c.text, c.ring, props.className || ""].join(" ")}>{val}</span>;
}
