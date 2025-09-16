"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ScheduleModal from "../modals/ScheduleModal";
import MaintenanceModal from "../modals/MaintenanceModal";

const BRAND = "#7A0010";
const BRAND_HOVER = "#60000C";

export default function ActionsGroup() {
  const [openSched, setOpenSched] = useState(false);
  const [openMaint, setOpenMaint] = useState(false);

  return (
    <div className="flex items-center gap-3">
      {/* New Request (route) */}
      <Link
        href="/admin/requests/new"
        className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        style={{ background: BRAND }}
        onMouseOver={(e) => (e.currentTarget.style.background = BRAND_HOVER)}
        onMouseOut={(e) => (e.currentTarget.style.background = BRAND)}
      >
        + New Request
      </Link>

      {/* Schedule split */}
      <SplitDropdown
        label="+ Schedule"
        onPrimary={() => setOpenSched(true)}
        items={[
          { label: "Create schedule", href: "/admin/schedules/new" },
          { label: "Recurring template", href: "/admin/schedules/recurring/new" },
          { label: "Import from CSV", href: "/admin/schedules/import" },
        ]}
      />

      {/* Maintenance split */}
      <SplitDropdown
        label="+ Maintenance"
        onPrimary={() => setOpenMaint(true)}
        items={[
          { label: "New maintenance log", href: "/admin/maintenance/new" },
          { label: "Preventive schedule", href: "/admin/maintenance/preventive" },
          { label: "Parts inventory", href: "/admin/maintenance/inventory" },
        ]}
      />

      {/* Modals */}
      <ScheduleModal open={openSched} onClose={() => setOpenSched(false)} />
      <MaintenanceModal open={openMaint} onClose={() => setOpenMaint(false)} />
    </div>
  );
}

function SplitDropdown({
  label,
  onPrimary,
  items,
}: {
  label: string;
  onPrimary: () => void;
  items: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickAway = (e: MouseEvent) => {
      if (!ref.current) return;
      if (open && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("click", clickAway);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", clickAway);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div className="flex overflow-hidden rounded-full shadow-sm ring-1 ring-white/20">
        <button
          className="bg-white/14 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          onClick={onPrimary}
        >
          {label}
        </button>
        <button
          className="bg-white/10 px-2 text-white hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5.5 7 10 11.5 14.5 7l1 1L10 14 4.5 8l1-1Z" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-50 mt-2 min-w-[220px] rounded-lg bg-white p-1 text-neutral-900 shadow-2xl ring-1 ring-black/10">
          {items.map((it) => (
            <Link
              key={it.label}
              href={it.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
