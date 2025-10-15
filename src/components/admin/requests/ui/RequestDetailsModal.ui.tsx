// src/components/admin/requests/ui/RequestDetailsModal.ui.tsx
"use client";

import * as React from "react";
import { Dialog } from "@headlessui/react";
import { X, FileDown } from "lucide-react";

import type { AdminRequest } from "@/lib/admin/requests/store";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";
import { generateRequestPDF } from "@/lib/admin/requests/pdfWithTemplate"; // ✅ now using template
import { generateSeminarPDF } from "@/lib/admin/requests/pdfSeminar";

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
  const [driver, setDriver] = React.useState("");
  const [vehicle, setVehicle] = React.useState("");

  React.useEffect(() => {
    setDriver(row?.driver || "");
    setVehicle(row?.vehicle || "");
  }, [row]);

  React.useEffect(() => {
    if (row?.id && driver) {
      AdminRequestsRepo.setDriver(row.id, driver);
    }
  }, [driver, row?.id]);

  React.useEffect(() => {
    if (row?.id && vehicle) {
      AdminRequestsRepo.setVehicle(row.id, vehicle);
    }
  }, [vehicle, row?.id]);

  const totalCost = React.useMemo(() => {
    if (!row?.travelOrder?.costs) return 0;
    let sum = 0;
    Object.entries(row.travelOrder.costs).forEach(([_, v]) => {
      if (typeof v === "number") sum += v;
      if (Array.isArray(v)) {
        v.forEach((item) => item.amount && (sum += item.amount));
      }
    });
    return sum;
  }, [row?.travelOrder?.costs]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="relative z-50 w-full max-w-3xl rounded-xl bg-white p-6 shadow-lg">
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
                  <dt className="font-semibold">Date</dt>
                  <dd>{row.travelOrder?.date || "—"}</dd>
                  <dt className="font-semibold">Requesting Person</dt>
                  <dd>{row.travelOrder?.requestingPerson || "—"}</dd>
                  <dt className="font-semibold">Department</dt>
                  <dd>{row.travelOrder?.department || "—"}</dd>
                  <dt className="font-semibold">Destination</dt>
                  <dd>{row.travelOrder?.destination || "—"}</dd>
                  <dt className="font-semibold">Departure Date</dt>
                  <dd>{row.travelOrder?.departureDate || "—"}</dd>
                  <dt className="font-semibold">Return Date</dt>
                  <dd>{row.travelOrder?.returnDate || "—"}</dd>
                  <dt className="font-semibold">Purpose of Travel</dt>
                  <dd>{row.travelOrder?.purposeOfTravel || "—"}</dd>
                </dl>

                {row.travelOrder?.costs && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-neutral-700 mb-2">
                      Estimated Costs
                    </h4>
                    <table className="w-full text-sm border border-neutral-200 rounded">
                      <tbody>
                        <tr>
                          <td className="px-2 py-1">Food</td>
                          <td className="px-2 py-1 text-right">
                            ₱{row.travelOrder.costs.food ?? 0}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1">Driver’s allowance</td>
                          <td className="px-2 py-1 text-right">
                            ₱{row.travelOrder.costs.driversAllowance ?? 0}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1">Rent vehicles</td>
                          <td className="px-2 py-1 text-right">
                            ₱{row.travelOrder.costs.rentVehicles ?? 0}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1">Hired drivers</td>
                          <td className="px-2 py-1 text-right">
                            ₱{row.travelOrder.costs.hiredDrivers ?? 0}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1">Accommodation</td>
                          <td className="px-2 py-1 text-right">
                            ₱{row.travelOrder.costs.accommodation ?? 0}
                          </td>
                        </tr>

                        {row.travelOrder.costs.otherLabel &&
                          row.travelOrder.costs.otherAmount && (
                            <tr>
                              <td className="px-2 py-1">
                                {row.travelOrder.costs.otherLabel}
                              </td>
                              <td className="px-2 py-1 text-right">
                                ₱{row.travelOrder.costs.otherAmount}
                              </td>
                            </tr>
                          )}

                        {Array.isArray(row.travelOrder.costs.otherItems) &&
                          row.travelOrder.costs.otherItems.map((item, i) => (
                            <tr key={i}>
                              <td className="px-2 py-1">{item.label}</td>
                              <td className="px-2 py-1 text-right">
                                ₱{item.amount}
                              </td>
                            </tr>
                          ))}

                        <tr className="border-t font-semibold">
                          <td className="px-2 py-1">Total</td>
                          <td className="px-2 py-1 text-right">₱{totalCost}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Signature */}
                <div className="mt-6 grid grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">
                      Endorsed By:
                    </p>
                    <p className="text-sm">{row.travelOrder?.endorsedByHeadName || "—"}</p>
                    <p className="text-xs text-neutral-500">
                      {row.travelOrder?.endorsedByHeadDate || ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    {row.travelOrder?.endorsedByHeadSignature ? (
                      <>
                        <img
                          src={row.travelOrder.endorsedByHeadSignature}
                          alt="Signature"
                          className="h-12 object-contain border rounded bg-white p-1"
                        />
                        <p className="text-xs text-neutral-500 mt-1">Signature</p>
                      </>
                    ) : (
                      <p className="text-xs text-neutral-500 italic">Not signed</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Assignments */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-neutral-700">
                  Assignments
                </h3>
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

              {/* Seminar */}
              {row.seminar && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-neutral-700">
                    Seminar Application
                  </h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="font-semibold">Application Date</dt>
                    <dd>{row.seminar.applicationDate || "—"}</dd>
                    <dt className="font-semibold">Title</dt>
                    <dd>{row.seminar.title || "—"}</dd>
                    <dt className="font-semibold">Category</dt>
                    <dd>{row.seminar.trainingCategory || "—"}</dd>
                    <dt className="font-semibold">Date From</dt>
                    <dd>{row.seminar.dateFrom || "—"}</dd>
                    <dt className="font-semibold">Date To</dt>
                    <dd>{row.seminar.dateTo || "—"}</dd>
                    <dt className="font-semibold">Venue</dt>
                    <dd>{row.seminar.venue || "—"}</dd>
                    <dt className="font-semibold">Modality</dt>
                    <dd>{row.seminar.modality || "—"}</dd>
                  </dl>
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-between">
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
