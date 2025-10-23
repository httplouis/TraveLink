// src/components/user/schedule/parts/DateDetailsModal.ui.tsx
"use client";

import * as React from "react";
import { Dialog, Transition } from "@headlessui/react";
import type { Booking } from "@/lib/user/schedule/types";
import { MAX_SLOTS } from "@/lib/user/schedule/repo";

type Props = {
  open: boolean;
  dateISO: string | null;
  bookings: Booking[];
  index: number;                   // which booking is currently focused
  onClose: () => void;
  onIndex: (i: number) => void;    // set index
};

export default function DateDetailsModal({ open, dateISO, bookings, index, onClose, onIndex }: Props) {
  const hasItems = bookings.length > 0;
  const current = hasItems ? bookings[index] : null;

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!hasItems) return;
      if (e.key === "ArrowRight") onIndex((index + 1) % bookings.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + bookings.length) % bookings.length);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, bookings.length, index, hasItems, onIndex]);

  return (
    <Transition appear show={open}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl rounded-2xl bg-white shadow-xl border">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div>
                    <Dialog.Title className="text-base font-semibold">{dateISO ?? ""}</Dialog.Title>
                    <p className="text-xs text-neutral-500">
                      {bookings.length}/{MAX_SLOTS} slots
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onIndex((index - 1 + bookings.length) % bookings.length)}
                      disabled={!hasItems} className="h-8 rounded-md border px-3 text-sm disabled:opacity-50"
                    >‹ Prev</button>
                    <button
                      onClick={() => onIndex((index + 1) % bookings.length)}
                      disabled={!hasItems} className="h-8 rounded-md border px-3 text-sm disabled:opacity-50"
                    >Next ›</button>
                    <button onClick={onClose} className="h-8 rounded-md border px-3 text-sm">Close</button>
                  </div>
                </div>

                {!hasItems ? (
                  <div className="p-6 text-sm text-neutral-500">No reservations for this date.</div>
                ) : (
                  <div className="p-5">
                    <h3 className="text-sm font-semibold">{current!.destination}</h3>
                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                      <Field label="Vehicle" value={current!.vehicle} />
                      <Field label="Driver" value={current!.driver} />
                      <Field label="Department" value={current!.department} />
                      <Field label="Purpose" value={current!.purpose} />
                      <Field label="Departure" value={current!.departAt} />
                      <Field label="Return" value={current!.returnAt} />
                    </div>

                    {/* small paginator hint */}
                    {bookings.length > 1 && (
                      <div className="mt-4 text-xs text-neutral-500">
                        {index + 1} of {bookings.length} — use ← / → keys
                      </div>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
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
