// src/components/user/schedule/parts/DateDetailsModal.ui.tsx
"use client";

import * as React from "react";
import { Dialog, Transition } from "@headlessui/react";
import type { Booking } from "@/lib/user/schedule/types";
import { MAX_SLOTS } from "@/lib/user/schedule/repo";

/* tiny inline icons */
function IconDriver(){return <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4Z" fill="currentColor"/></svg>;}
function IconVehicle(){return <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M3 13h18l-2-6a3 3 0 0 0-2.83-2H7.83A3 3 0 0 0 5 7l-2 6Zm1 2v3h2v-3Zm14 0v3h2v-3ZM7 18h10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>;}
function IconClock(){return <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>;}
function IconMapPin(){return <svg viewBox="0 0 24 24" className="h-4 w-4"><path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/></svg>;}

type Props = {
  open: boolean;
  dateISO: string | null;
  bookings?: Booking[];
  onClose: () => void;
  onPrevDate?: () => void;
  onNextDate?: () => void;
  pos?: { index: number; total: number } | null;
  prevLabel?: string;
  nextLabel?: string;
  publicMode?: boolean; // If true, hide trip details and only show counts
};

export default function DateDetailsModal({
  open, dateISO, bookings, onClose, onPrevDate, onNextDate, pos, prevLabel, nextLabel, publicMode = false,
}: Props) {
  const list = bookings ?? [];
  const count = list.length;
  const status = count === 0 ? "Available" : count >= MAX_SLOTS ? "Full" : "Partial";
  
  // Calculate status counts for public view
  const pendingCount = list.filter(b => b.status?.startsWith("pending_")).length;
  const approvedCount = list.filter(b => b.status === "approved").length;

  // keyboard nav
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") onNextDate?.();
      if (e.key === "ArrowLeft") onPrevDate?.();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onPrevDate, onNextDate]);

  return (
    <Transition appear show={open}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100"
                          leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                              leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl rounded-3xl bg-white border border-neutral-200/60 shadow-lg shadow-black/10">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200/70 px-5 py-4">
                  <div>
                    <Dialog.Title className="text-base font-semibold">{dateISO ?? ""}</Dialog.Title>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                      <span>{count}/{MAX_SLOTS} slots</span>
                      <StatusPill status={status as any} />
                      {pos && <span className="text-neutral-400">• Day {pos.index + 1} of {pos.total}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <NavButton onClick={onPrevDate} label={prevLabel ? `‹ ${prevLabel}` : "‹ Prev"} disabled={!onPrevDate} />
                    <NavButton onClick={onNextDate} label={nextLabel ? `${nextLabel} ›` : "Next ›"} disabled={!onNextDate} />
                    <button
                      onClick={onClose}
                      className="h-9 rounded-xl border border-neutral-200 bg-white px-4 text-sm shadow-sm shadow-black/5 
                                 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 active:translate-y-[1px]"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* Body: fixed height to prevent jump */}
                <div className="h-[60vh] overflow-y-auto p-4">
                  {count === 0 ? (
                    <div className="h-full grid place-items-center text-sm text-neutral-500">
                      No reservations for this date.
                    </div>
                  ) : publicMode ? (
                    // Public mode: Only show counts, no trip details
                    <div className="h-full grid place-items-center">
                      <div className="text-center space-y-4">
                        <div className="text-4xl font-bold text-neutral-900">{count}/{MAX_SLOTS}</div>
                        <div className="text-sm text-neutral-600">Slots Taken</div>
                        <div className="flex items-center justify-center gap-4 pt-4">
                          {pendingCount > 0 && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 text-sm font-medium">
                                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                {pendingCount} Pending
                              </span>
                            </div>
                          )}
                          {approvedCount > 0 && (
                            <div className="flex flex-col items-center gap-1">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 text-sm font-medium">
                                <span className="h-2 w-2 rounded-full bg-green-500" />
                                {approvedCount} Approved
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 pt-4">
                          Trip details are hidden for privacy
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {list.map((b) => <BookingCard key={b.id} b={b} />)}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

/* UI atoms */

function NavButton({ onClick, label, disabled }: { onClick?: () => void; label: string; disabled?: boolean; }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-9 rounded-xl border px-3 text-sm shadow-sm shadow-black/5 transition 
                  focus:outline-none focus:ring-2 focus:ring-indigo-200 active:translate-y-[1px] ${
        disabled
          ? "opacity-40 cursor-not-allowed border-neutral-200 bg-neutral-100"
          : "border-neutral-200 bg-white hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: "Available" | "Partial" | "Full" }) {
  const cls =
    status === "Full"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : status === "Partial"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-green-50 text-green-700 border-green-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {status}
    </span>
  );
}

function BookingCard({ b }: { b: Booking }) {
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    if (status.startsWith("pending_")) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          Pending
        </span>
      );
    } else if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 text-[10px] font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Approved
        </span>
      );
    } else if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] font-medium">
          Rejected
        </span>
      );
    }
    return null;
  };

  return (
    <article className="relative overflow-hidden rounded-2xl border border-neutral-200/70 bg-white shadow-sm shadow-black/5 transition hover:shadow-md">
      <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${
        b.status === "approved" ? "bg-green-500" :
        b.status?.startsWith("pending_") ? "bg-blue-500" :
        b.status === "rejected" ? "bg-red-500" :
        "bg-neutral-200"
      }`} />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">{b.department}</div>
            <h3 className="mt-1 text-sm sm:text-base font-semibold text-neutral-900">{b.purpose}</h3>
            {b.request_number && (
              <div className="mt-0.5 text-[10px] text-neutral-400">#{b.request_number}</div>
            )}
          </div>
          {getStatusBadge(b.status)}
        </div>
        <div className="mt-1 inline-flex items-center gap-1 text-xs text-neutral-600">
          <IconMapPin /><span className="truncate">{b.destination || "No destination specified"}</span>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] text-neutral-800">
          <Meta icon={<IconDriver />} label="Driver" value={b.driver || "—"} />
          <Meta icon={<IconVehicle />} label="Vehicle" value={b.vehicle} />
        </div>
        {/* Limited details for user view - no request ID, no full details */}
      </div>
    </article>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string; }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-neutral-200/70 bg-neutral-50 px-2.5 py-1.5">
      <span className="text-neutral-500">{icon}</span>
      <div>
        <div className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</div>
        <div className="text-[13px] font-medium text-neutral-800">{value}</div>
      </div>
    </div>
  );
}
