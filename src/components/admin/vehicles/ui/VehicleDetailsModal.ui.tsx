"use client";
import * as React from "react";
import type { Vehicle } from "@/lib/admin/vehicles/types";

const BRAND = "#7a0019";

type RichVehicle = Vehicle & {
  photoUrl?: string;
  assignedDriver?: string;
  driverDocs?: { label: string; url?: string }[];
  routePreviewUrl?: string;
  nextServiceISO?: string;
  maxLoadKg?: number;
  lastCheckIn?: string;
  notes?: string;
};

export function VehicleDetailsModal({
  open,
  onClose,
  v,
}: {
  open: boolean;
  onClose: () => void;
  v: RichVehicle | null;
}) {
  // lock background scroll
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState<string>("vehicle");

  const sections = [
    { id: "vehicle", label: "Vehicle details" },
    { id: "status", label: "Status" },
    { id: "personnel", label: "Assigned personnel" },
    { id: "tools", label: "Tools & Equipments" },
    { id: "notes", label: "Comments/Notes" },
    { id: "route", label: "Route preview" },
  ];

  // observe sections to highlight tab
  React.useEffect(() => {
    if (!open) return;
    const root = contentRef.current;
    if (!root) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target) setActive((visible.target as HTMLElement).id);
      },
      { root, rootMargin: "0px 0px -60% 0px", threshold: [0, 0.2, 0.5] }
    );

    sections.forEach(s => {
      const node = root.querySelector<HTMLElement>(`#${s.id}`);
      if (node) obs.observe(node);
    });

    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, v]);

  const goTo = (id: string) => {
    const root = contentRef.current;
    const el = root?.querySelector<HTMLElement>(`#${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (!open || !v) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white/90 px-5 py-4 backdrop-blur-sm">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">{v.brand} {v.model}</div>
            <div className="text-sm text-gray-500">{v.plateNo}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white shadow hover:bg-red-700"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="grid gap-5 p-5 lg:grid-cols-[360px,1fr]">
            {/* Left column */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl ring-1 ring-gray-200 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {v.photoUrl
                  ? <img src={v.photoUrl} alt="" className="h-60 w-full object-cover" />
                  : <div className="h-60 w-full bg-gray-100" />}
              </div>

              <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200 shadow-sm">
                <div className="text-sm font-medium">Driver documents</div>
                <div className="mt-2 grid gap-2 text-sm">
                  {(v.driverDocs ?? []).map(d => (
                    <div key={d.label} className="flex items-center justify-between">
                      <span className="text-gray-700">{d.label}</span>
                      {d.url
                        ? <a className="text-blue-600 hover:underline" href={d.url} target="_blank" rel="noreferrer">View</a>
                        : <span className="text-gray-400">—</span>}
                    </div>
                  ))}
                  {(v.driverDocs ?? []).length === 0 && (
                    <div className="text-gray-500">No documents.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="min-w-0">
              {/* Tabs (links) */}
              <nav className="flex gap-3 border-b border-gray-200 px-1">
                {sections.map(s => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={(e) => { e.preventDefault(); goTo(s.id); }}
                    className={`relative px-2 py-3 text-sm font-medium ${active === s.id ? "text-gray-900" : "text-gray-600 hover:text-gray-900"
                      }`}
                    style={{ cursor: "pointer" }}
                  >
                    {s.label}
                    <span
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-all"
                      style={{ background: active === s.id ? BRAND : "transparent" }}
                    />
                  </a>
                ))}
              </nav>

              {/* Sections */}
              <Card id="vehicle" title="Vehicle details">
                <Spec k="Plate" v={<b className="font-semibold">{v.plateNo}</b>} />
                <Spec k="Code" v={v.code} />
                <Spec k="Brand/Model" v={`${v.brand} ${v.model}`} />
                <Spec k="Type" v={v.type} />
                <Spec k="Capacity" v={v.capacity} />
                <Spec k="Odometer" v={`${v.odometerKm.toLocaleString()} km`} />
                <Spec k="Last service" v={v.lastServiceISO} />
                <Spec k="Next service" v={v.nextServiceISO ?? "—"} />
              </Card>

              <Card id="status" title="Status">
                <div className="grid gap-3 sm:grid-cols-2">
                  <SoftPanel>
                    <div className="text-sm font-medium">Load status</div>
                    <div className="mt-1 text-sm text-gray-600">68% loaded / 32% available</div>
                  </SoftPanel>
                  <SoftPanel>
                    <div className="text-sm font-medium">Last check-in/out</div>
                    <div className="mt-1 text-sm text-gray-600">{v.lastCheckIn ?? "—"}</div>
                  </SoftPanel>
                </div>
              </Card>

              <Card id="personnel" title="Assigned personnel">
                <Spec k="Driver" v={v.assignedDriver ?? "—"} />
              </Card>

              <Card id="tools" title="Tools & Equipments">
                <div className="text-sm text-gray-600">List of equipment can go here.</div>
              </Card>

              <Card id="notes" title="Comments/Notes">
                <div className="text-sm whitespace-pre-wrap text-gray-800">{v.notes ?? "—"}</div>
              </Card>

              <Card id="route" title="Route preview" className="mb-2">
                <div className="h-48 rounded-lg bg-gray-100" />
              </Card>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/90 px-5 py-3 backdrop-blur-sm">
          <div className="flex justify-end">

          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- tiny presentational pieces ---------- */
function Card({
  id, title, children, className = "",
}: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`mt-4 rounded-xl bg-white p-4 ring-1 ring-gray-200 shadow-sm ${className}`}>
      <div className="mb-3 text-sm font-semibold">{title}</div>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function Spec({ k, v }: { k: React.ReactNode; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px,1fr] items-baseline gap-4">
      <div className="text-sm text-gray-600">{k}</div>
      <div className="text-sm text-gray-900">{v}</div>
    </div>
  );
}

function SoftPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 shadow-xs">
      {children}
    </div>
  );
}
