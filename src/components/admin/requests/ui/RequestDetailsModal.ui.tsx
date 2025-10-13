// src/components/admin/requests/ui/RequestDetailsModal.ui.tsx
"use client";

import * as React from "react";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";

import type { AdminRequest } from "@/lib/admin/requests/store";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";
import { buildRequestPDF } from "@/lib/admin/requests/pdf";

// Mock data – replace later with real data from repo
const DRIVERS = ["Juan Dela Cruz", "Pedro Santos", "Maria Reyes"];
const VEHICLES = ["Van 01", "Bus 02", "SUV 03"];

type Props = {
  open: boolean;
  onClose: () => void;
  row?: AdminRequest;
  onApprove?: () => void;
  onReject?: () => void;
};

export default function RequestDetailsModalUI({
  open,
  onClose,
  row,
  onApprove,
  onReject,
}: Props) {
  if (!row) return null;

  const to = row.travelOrder;

  const [driver, setDriver] = React.useState(row.driver || "");
  const [vehicle, setVehicle] = React.useState(row.vehicle || "");

  // auto-save driver
  React.useEffect(() => {
    if (row?.id && driver) {
      AdminRequestsRepo.setDriver(row.id, driver);
    }
  }, [driver, row?.id]);

  // auto-save vehicle
  React.useEffect(() => {
    if (row?.id && vehicle) {
      AdminRequestsRepo.setVehicle(row.id, vehicle);
    }
  }, [vehicle, row?.id]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="relative z-50 w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Request Details</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Travel Order */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">
              Travel Order
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt>Date</dt>
              <dd>{to?.date || "—"}</dd>
              <dt>Requesting Person</dt>
              <dd>{to?.requestingPerson || "—"}</dd>
              <dt>Department</dt>
              <dd>{to?.department || "—"}</dd>
              <dt>Destination</dt>
              <dd>{to?.destination || "—"}</dd>
              <dt>Departure Date</dt>
              <dd>{to?.departureDate || "—"}</dd>
              <dt>Return Date</dt>
              <dd>{to?.returnDate || "—"}</dd>
              <dt>Purpose of Travel</dt>
              <dd>{to?.purposeOfTravel || "—"}</dd>
            </dl>

            {to?.costs && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold text-neutral-600">
                  Estimated Costs
                </h4>
                <ul className="mt-1 text-sm text-neutral-700">
                  {Object.entries(to.costs).map(([k, v]) => {
                    if (!v) return null;
                    if (Array.isArray(v)) {
                      return v.map((item, i) => (
                        <li key={`${k}-${i}`}>
                          {item.label}: ₱{item.amount}
                        </li>
                      ));
                    }
                    return (
                      <li key={k}>
                        {k}: ₱{v}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* Assignments */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-neutral-700">
              Assignments
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  Driver
                </label>
                <select
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-sm"
                >
                  <option value="">— Select Driver —</option>
                  {DRIVERS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  Vehicle
                </label>
                <select
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-sm"
                >
                  <option value="">— Select Vehicle —</option>
                  {VEHICLES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Seminar */}
          {row.seminar && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-neutral-700">
                Seminar Application
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt>Application Date</dt>
                <dd>{row.seminar.applicationDate || "—"}</dd>
                <dt>Title</dt>
                <dd>{row.seminar.title || "—"}</dd>
                <dt>Category</dt>
                <dd>{row.seminar.trainingCategory || "—"}</dd>
                <dt>Date From</dt>
                <dd>{row.seminar.dateFrom || "—"}</dd>
                <dt>Date To</dt>
                <dd>{row.seminar.dateTo || "—"}</dd>
                <dt>Venue</dt>
                <dd>{row.seminar.venue || "—"}</dd>
                <dt>Modality</dt>
                <dd>{row.seminar.modality || "—"}</dd>
              </dl>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => buildRequestPDF(row)}
            className="rounded-md bg-[#7A0010] px-4 py-2 text-sm text-white hover:opacity-90"
          >
            Download PDF
          </button>
          <div className="flex gap-2">
            {onApprove && (
              <button
                onClick={onApprove}
                className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Approve
              </button>
            )}
            {onReject && (
              <button
                onClick={onReject}
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:opacity-90"
              >
                Reject
              </button>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
