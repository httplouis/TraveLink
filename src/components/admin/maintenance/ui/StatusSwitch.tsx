"use client";
import * as React from "react";
import type { MaintStatus } from "@/lib/admin/maintenance";
import StatusBadge from "./StatusBadge";

const ORDER: MaintStatus[] = ["Submitted","Acknowledged","In-Progress","Completed","Rejected"];

export default function StatusSwitch({
  value, onChange,
}: { value: MaintStatus; onChange: (next: MaintStatus) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) { if (!ref.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className="inline-flex items-center gap-1" title="Change status">
        <StatusBadge status={value} />
        <svg width="14" height="14" viewBox="0 0 20 20" className="text-neutral-500"><path d="M5 8l5 5 5-5H5z" fill="currentColor"/></svg>
      </button>
      {open && (
        <div className="absolute z-20 mt-2 w-44 rounded-lg bg-white ring-1 ring-black/10 shadow-lg p-2">
          {ORDER.map((s) => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left text-sm px-2 py-1 rounded hover:bg-neutral-100 ${s===value?"bg-neutral-50":""}`}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
