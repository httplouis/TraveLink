"use client";

export default function StatusChip(
  { s }: { s: "Draft"|"Submitted"|"Acknowledged"|"In-Progress"|"Completed"|"Rejected" }
) {
  const map: Record<string,string> = {
    Draft: "bg-neutral-100 text-neutral-700",
    Submitted: "bg-amber-100 text-amber-800",
    Acknowledged: "bg-blue-100 text-blue-800",
    "In-Progress": "bg-indigo-100 text-indigo-800",
    Completed: "bg-green-100 text-green-800",
    Rejected: "bg-rose-100 text-rose-800",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${map[s]}`}>{s}</span>;
}

