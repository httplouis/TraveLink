// src/components/faculty/request/Summary.tsx
"use client";
import type { RequestForm } from "./Form";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-600">{label}</dt>
      <dd className="text-right">{value || "—"}</dd>
    </div>
  );
}

export default function RequestSummary({ form }: { form: RequestForm }) {
  return (
    <section className="rounded-lg border bg-white p-4">
      <h3 className="font-medium mb-3">Summary</h3>
      <dl className="text-sm space-y-2">
        <Row label="Purpose" value={form.purpose} />
        <Row label="Schedule" value={form.schedule} />
        <Row label="Origin" value={form.origin} />
        <Row label="Destination" value={form.destination} />
        <Row
          label="Passengers"
          value={form.passengers === "" ? "" : String(form.passengers)}
        />
      </dl>
    </section>
  );
}
