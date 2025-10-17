// src/components/admin/requests/ui/RequestDetailsModal.ui.tsx
"use client";

import * as React from "react";
import { Dialog } from "@headlessui/react";
import { X, FileDown } from "lucide-react";

import type { AdminRequest } from "@/lib/admin/requests/store";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";
import { generateRequestPDF } from "@/lib/admin/requests/pdfWithTemplate";
import { generateSeminarPDF } from "@/lib/admin/requests/pdfSeminar";

// 🔹 Detailed Seminar block (keeps this modal tidy)
import SeminarDetails from "@/components/admin/requests/parts/SeminarDetails.ui";

const DRIVERS = ["Juan Dela Cruz", "Pedro Santos", "Maria Reyes"];
const VEHICLES = ["Van 01", "Bus 02", "SUV 03"];

/** Peso formatter */
function peso(n: number | null | undefined) {
  if (typeof n !== "number" || !isFinite(n)) return "₱0.00";
  return `₱${n.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
}

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
  const [driver, setDriver] = React.useState("");
  const [vehicle, setVehicle] = React.useState("");

  // hydrate local assignment state from selected row
  React.useEffect(() => {
    setDriver(row?.driver || "");
    setVehicle(row?.vehicle || "");
  }, [row]);

  // persist driver/vehicle assignments back to repo
  React.useEffect(() => {
    if (row?.id && driver !== undefined) {
      AdminRequestsRepo.setDriver(row.id, driver);
    }
  }, [driver, row?.id]);

  React.useEffect(() => {
    if (row?.id && vehicle !== undefined) {
      AdminRequestsRepo.setVehicle(row.id, vehicle);
    }
  }, [vehicle, row?.id]);

  // compute total cost (supports both number fields and optional array items)
  const totalCost = React.useMemo(() => {
    const c = row?.travelOrder?.costs;
    if (!c) return 0;
    let sum = 0;
    Object.values(c).forEach((v) => {
      if (typeof v === "number") sum += v;
      if (Array.isArray(v)) {
        v.forEach((item) => {
          if (item && typeof item.amount === "number") sum += item.amount;
        });
      }
    });
    return sum;
  }, [row?.travelOrder?.costs]);

  const deptName = row?.travelOrder?.department || "";

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="relative z-50 w-full max-w-5xl rounded-2xl bg-white p-6 shadow-xl">
        {!row ? (
          <div className="text-center text-sm text-neutral-500">No request selected</div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Request Details</h2>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="space-y-8 max-h-[72vh] overflow-y-auto pr-2">
              {/* Travel Order */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-neutral-700">Travel Order</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="font-semibold">Date</dt>
                  <dd>{row.travelOrder?.date || "—"}</dd>

                  <dt className="font-semibold">Requesting Person</dt>
                  <dd>{row.travelOrder?.requestingPerson || "—"}</dd>

                  <dt className="font-semibold">Department</dt>
                  <dd>{deptName || "—"}</dd>

                  <dt className="font-semibold">Destination</dt>
                  <dd>{row.travelOrder?.destination || "—"}</dd>

                  <dt className="font-semibold">Departure Date</dt>
                  <dd>{row.travelOrder?.departureDate || "—"}</dd>

                  <dt className="font-semibold">Return Date</dt>
                  <dd>{row.travelOrder?.returnDate || "—"}</dd>

                  <dt className="font-semibold">Purpose of Travel</dt>
                  <dd className="col-span-1">{row.travelOrder?.purposeOfTravel || "—"}</dd>
                </dl>

                {/* Estimated costs */}
                {row.travelOrder?.costs && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-semibold text-neutral-700">Estimated Costs</h4>
                    <table className="w-full text-sm border border-neutral-200 rounded">
                      <tbody>
                        {"food" in row.travelOrder.costs && (
                          <tr>
                            <td className="px-2 py-1">Food</td>
                            <td className="px-2 py-1 text-right">{peso(row.travelOrder.costs.food as any)}</td>
                          </tr>
                        )}
                        {"driversAllowance" in row.travelOrder.costs && (
                          <tr>
                            <td className="px-2 py-1">Driver’s allowance</td>
                            <td className="px-2 py-1 text-right">
                              {peso(row.travelOrder.costs.driversAllowance as any)}
                            </td>
                          </tr>
                        )}
                        {"rentVehicles" in row.travelOrder.costs && (
                          <tr>
                            <td className="px-2 py-1">Rent vehicles</td>
                            <td className="px-2 py-1 text-right">{peso(row.travelOrder.costs.rentVehicles as any)}</td>
                          </tr>
                        )}
                        {"hiredDrivers" in row.travelOrder.costs && (
                          <tr>
                            <td className="px-2 py-1">Hired drivers</td>
                            <td className="px-2 py-1 text-right">{peso(row.travelOrder.costs.hiredDrivers as any)}</td>
                          </tr>
                        )}
                        {"accommodation" in row.travelOrder.costs && (
                          <tr>
                            <td className="px-2 py-1">Accommodation</td>
                            <td className="px-2 py-1 text-right">{peso(row.travelOrder.costs.accommodation as any)}</td>
                          </tr>
                        )}

                        {"otherLabel" in row.travelOrder.costs &&
                          "otherAmount" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).otherLabel && (
                            <tr>
                              <td className="px-2 py-1">{(row.travelOrder.costs as any).otherLabel}</td>
                              <td className="px-2 py-1 text-right">
                                {peso((row.travelOrder.costs as any).otherAmount)}
                              </td>
                            </tr>
                          )}

                        {Array.isArray((row.travelOrder.costs as any).otherItems) &&
                          (row.travelOrder.costs as any).otherItems.map(
                            (item: { label: string; amount: number }, i: number) => (
                              <tr key={i}>
                                <td className="px-2 py-1">{item.label}</td>
                                <td className="px-2 py-1 text-right">{peso(item.amount)}</td>
                              </tr>
                            )
                          )}

                        <tr className="border-t font-semibold">
                          <td className="px-2 py-1">Total</td>
                          <td className="px-2 py-1 text-right">{peso(totalCost)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Endorsement / Signature */}
                <div className="mt-8">
                  <h4 className="mb-2 text-sm font-semibold text-neutral-700">Endorsement</h4>

                  {/* Centered "signature over printed name" block */}
                  <div className="flex flex-col items-center">
                    {row.travelOrder?.endorsedByHeadSignature ? (
                      <img
                        src={row.travelOrder.endorsedByHeadSignature}
                        alt="Signature"
                        className="h-16 object-contain -mb-3"  /* pull signature closer to the line (overlap a bit) */
                      />
                    ) : (
                      <div className="h-16" />
                    )}

                    {/* signature line */}
                    <div className="w-64 border-t border-neutral-500" />

                    {/* printed name */}
                    <p className="mt-1 text-sm font-medium text-center">
                      {row.travelOrder?.endorsedByHeadName || "—"}
                    </p>

                    {/* role + department (so “Dept. Head, CITE” for example) */}
                    <p className="text-xs text-neutral-500 text-center">
                      Dept. Head{deptName ? `, ${deptName}` : ""}
                    </p>

                    {/* optional date */}
                    {row.travelOrder?.endorsedByHeadDate && (
                      <p className="text-xs text-neutral-500">
                        {row.travelOrder.endorsedByHeadDate}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Assignments */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-neutral-700">Assignments</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Driver</label>
                    <select
                      value={driver}
                      onChange={(e) => setDriver(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
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
                    <label className="block text-xs font-medium mb-1">Vehicle</label>
                    <select
                      value={vehicle}
                      onChange={(e) => setVehicle(e.target.value)}
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010]"
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

              {/* Seminar details (if present) */}
              <SeminarDetails seminar={row.seminar} />
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => row && generateRequestPDF(row)}
                  className="flex items-center gap-2 rounded-md bg-[#7A0010] hover:bg-[#5c000c] px-4 py-2 text-sm text-white transition"
                >
                  <FileDown className="h-4 w-4" />
                  Travel Order PDF
                </button>
                {row.seminar && (
                  <button
                    onClick={() => row && generateSeminarPDF(row)}
                    className="flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm text-white transition"
                  >
                    <FileDown className="h-4 w-4" />
                    Seminar PDF
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {onApprove && (
                  <button
                    onClick={onApprove}
                    className="rounded-md bg-green-600 hover:bg-green-700 px-4 py-2 text-sm text-white transition"
                  >
                    Approve
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={onReject}
                    className="rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm text-white transition"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
