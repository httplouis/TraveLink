// src/components/user/schedule/parts/DateDetailsCard.ui.tsx
"use client";

import * as React from "react";
import type { Booking } from "@/lib/user/schedule/types";
import { MAX_SLOTS } from "@/lib/user/schedule/repo";

export function DateDetailsCard({
  dateISO,
  bookings,
}: {
  dateISO: string | null;
  bookings: Booking[];
}) {
  if (!dateISO) return null;
  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="text-base font-semibold">{dateISO}</div>
        <div className="text-sm text-neutral-500">{bookings.length}/{MAX_SLOTS} slots</div>
      </div>

      {bookings.length === 0 ? (
        <div className="p-6 text-sm text-neutral-500">No reservations for this date.</div>
      ) : (
        <div className="divide-y">
          {bookings.map((b) => (
            <article key={b.id} className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{b.destination}</h3>
                <span className="rounded-full border px-2 py-0.5 text-[11px] text-neutral-600">{b.id}</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                <Field label="Vehicle" value={b.vehicle} />
                <Field label="Driver" value={b.driver} />
                <Field label="Department" value={b.department} />
                <Field label="Purpose" value={b.purpose} />
                <Field label="Departure" value={b.departAt} />
                <Field label="Return" value={b.returnAt} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="text-[13px] text-neutral-800">{value}</div>
    </div>
  );
}
