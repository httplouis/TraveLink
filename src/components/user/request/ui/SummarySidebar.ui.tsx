// components/user/request/ui/SummarySidebar.ui.tsx
"use client";

import * as React from "react";
import type { RequestFormData } from "@/lib/user/request/types";

export default function SummarySidebar({
  data,
  firstHop,
  path,
}: {
  data: RequestFormData;
  firstHop: string;
  path: string[];
}) {
  const usedInstitutional = data.vehicleMode === "institutional";

  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      {/* Routing */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Routing Preview</h4>
          <Badge tone="info">{usedInstitutional ? "With TM" : "Budget first"}</Badge>
        </div>

        <div className="text-xs text-neutral-600">First receiver</div>
        <div className="mt-0.5 text-sm font-medium">{pretty(firstHop)}</div>

        <div className="mt-2 text-xs text-neutral-600">Full path</div>
        <Stepper steps={path} />
      </section>

      {/* Selections */}
      <section className="mt-6">
        <h4 className="text-sm font-semibold">Current Choices</h4>
        <dl className="mt-2 space-y-1 text-sm">
          <Row name="Requester" value={titleCase(data.requesterRole)} />
          <Row name="Reason" value={reasonLabel(data.reason)} />
          <Row name="Vehicle" value={vehicleLabel(data.vehicleMode)} />
        </dl>
        {data.reason === "seminar" && (
          <div className="mt-2">
            <Badge tone="neutral" className="mr-2">Seminar application required</Badge>
          </div>
        )}
      </section>

      {/* Travel snapshot */}
      <section className="mt-6">
        <h4 className="text-sm font-semibold">Travel Snapshot</h4>
        <dl className="mt-2 space-y-1 text-sm">
          <Row name="Destination" value={data.travelOrder?.destination || "—"} />
          <Row name="Dates" value={dateRange(data.travelOrder?.departureDate, data.travelOrder?.returnDate)} />
          <Row name="Requester" value={data.travelOrder?.requestingPerson || "—"} />
          <Row name="Department" value={data.travelOrder?.department || "—"} />
        </dl>
      </section>

      {/* Fixed approvers */}
      <section className="mt-6">
        <div className="mb-1 text-xs text-neutral-600">Approvers (fixed)</div>
        <ul className="list-inside list-disc text-sm text-neutral-800">
          <li>Comptroller</li>
          <li>HRD</li>
          <li>VP/COO</li>
          <li className={usedInstitutional ? "opacity-100" : "opacity-60"}>
            TM close-out <span className="text-xs text-neutral-500">(if institutional)</span>
          </li>
        </ul>
      </section>
    </aside>
  );
}

/* ---------- UI bits ---------- */

function Row({ name, value }: { name: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-2">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500">{name}</div>
      <div className="text-sm text-neutral-900">{value}</div>
    </div>
  );
}

function Stepper({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-1 space-y-1">
      {steps.map((s, i) => (
        <li key={`${s}-${i}`} className="flex items-start gap-2">
          <span
            className={[
              "mt-[2px] inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]",
              i === 0
                ? "bg-[#7A0010] text-white"
                : "bg-neutral-200 text-neutral-700",
            ].join(" ")}
            aria-hidden
          >
            {i + 1}
          </span>
          <span className="text-sm">{pretty(s)}</span>
        </li>
      ))}
    </ol>
  );
}

function Badge({
  children,
  tone = "neutral",
  className = "",
}: React.PropsWithChildren<{ tone?: "neutral" | "info" | "success" | "warn" | "danger"; className?: string }>) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-800",
    info: "bg-blue-100 text-blue-800",
    success: "bg-emerald-100 text-emerald-800",
    warn: "bg-amber-100 text-amber-900",
    danger: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

/* ---------- helpers ---------- */

function pretty(s: string) {
  // small prettifier for enum-ish codes like "OSAS_ADMIN" → "OSAS Admin"
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (m) => m.toUpperCase());
}

function reasonLabel(r: RequestFormData["reason"]) {
  switch (r) {
    case "seminar":
      return "Seminar / Meeting";
    case "educational":
      return "Educational Trip";
    case "competition":
      return "Competition";
    case "visit":
    default:
      return "Visit";
  }
}

function vehicleLabel(v: RequestFormData["vehicleMode"]) {
  switch (v) {
    case "institutional":
      return "Institutional vehicle";
    case "owned":
      return "Owned vehicle";
    case "rent":
      return "Rent (external)";
    default:
      return titleCase(v as string);
  }
}

function dateRange(from?: string, to?: string) {
  if (!from && !to) return "—";
  if (from && !to) return new Date(from).toLocaleDateString();
  if (!from && to) return new Date(to).toLocaleDateString();
  try {
    const a = new Date(from as string).toLocaleDateString();
    const b = new Date(to as string).toLocaleDateString();
    return `${a} → ${b}`;
  } catch {
    return `${from || "—"} → ${to || "—"}`;
  }
}
