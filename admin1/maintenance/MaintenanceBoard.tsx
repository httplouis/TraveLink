"use client";

import { MAINT_STATUSES, MaintenanceTicket } from "@/lib/maintenanceDomain";

export default function MaintenanceBoard({
  rows,
  onOpen,
  onAdvance,
}: {
  rows: MaintenanceTicket[];
  onOpen: (t: MaintenanceTicket) => void;
  onAdvance: (id: string) => void;
}) {
  const groups = MAINT_STATUSES.map(s => ({
    status: s,
    items: rows.filter(r => r.status === s),
  }));

  return (
    <div className="grid md:grid-cols-5 gap-3">
      {groups.map((g) => (
        <div key={g.status} className="rounded-2xl border border-neutral-200 bg-white shadow-sm flex flex-col">
          <div className="px-3 py-2 border-b text-sm font-medium bg-neutral-50">{g.status} <span className="text-neutral-500">• {g.items.length}</span></div>
          <div className="p-3 grid gap-3">
            {g.items.map((t) => (
              <div key={t.id} className="rounded-xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-3">
                <div className="text-sm font-semibold">{t.title}</div>
                <div className="text-[12px] text-neutral-600 mt-0.5 truncate">{t.campus} • {t.vehicleId}</div>
                <div className="text-[12px] text-neutral-600 truncate">{t.severity} • {new Date(t.createdAt).toLocaleDateString()}</div>

                <div className="mt-2 flex items-center justify-between">
                  <button
                    className="text-xs text-[#7A0010] hover:underline"
                    onClick={() => onOpen(t)}
                  >
                    View
                  </button>
                  <button
                    className="text-xs px-2 py-1 rounded-md text-white"
                    style={{ background: "#7A0010" }}
                    onClick={() => onAdvance(t.id)}
                    title="Advance status"
                  >
                    Advance →
                  </button>
                </div>
              </div>
            ))}
            {g.items.length === 0 && (
              <div className="text-[12px] text-neutral-500 px-2 py-6 text-center">No tickets</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
