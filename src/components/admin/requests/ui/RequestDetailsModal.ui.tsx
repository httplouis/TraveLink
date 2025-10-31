// src/components/admin/requests/ui/RequestDetailsModal.ui.tsx
"use client";

import * as React from "react";
import { Dialog } from "@headlessui/react";
import { X, FileDown, CheckCircle, AlertTriangle } from "lucide-react";

import type { AdminRequest } from "@/lib/admin/requests/store";
import { AdminRequestsRepo } from "@/lib/admin/requests/store";
import { generateRequestPDF } from "@/lib/admin/requests/pdfWithTemplate";
import { generateSeminarPDF } from "@/lib/admin/requests/pdfSeminar";

// 🔹 Detailed Seminar block (keeps this modal tidy)
import SeminarDetails from "@/components/admin/requests/parts/SeminarDetails.ui";

// 🔹 Your signature pad component
import SignaturePad from "@/components/common/inputs/SignaturePad.ui";

const DRIVERS = ["Juan Dela Cruz", "Pedro Santos", "Maria Reyes"];
const VEHICLES = ["Van 01", "Bus 02", "SUV 03"];

/** Peso formatter */
function peso(n: number | null | undefined) {
  const num = typeof n === "number" && isFinite(n) ? n : 0;
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Read requester signature regardless of the saved key */
function getRequesterSig(to?: any): string | null {
  return (
    to?.requesterSignature ||
    to?.requestingPersonSignature || // legacy/alternate
    to?.requesterSig ||
    null
  );
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

  // signature modal (for Approve)
  const [signOpen, setSignOpen] = React.useState(false);
  const [sigDataUrl, setSigDataUrl] = React.useState<string | null>(null);

  // Hydrate local assignment state from the selected row (robust over many shapes)
  React.useEffect(() => {
    if (!row) {
      setDriver("");
      setVehicle("");
      return;
    }
    const t: any = row.travelOrder ?? {};
    const drv =
      row.driver ||
      t.driver ||
      t.schoolService?.driverName ||
      t.schoolService?.driver ||
      t.selectedDriverName ||
      t.selectedDriver ||
      t.assignedDriverName ||
      t.assignedDriver ||
      "";
    const veh =
      row.vehicle ||
      t.vehicle ||
      t.schoolService?.vehicleName ||
      t.schoolService?.vehicle ||
      t.selectedVehicleName ||
      t.selectedVehicle ||
      t.assignedVehicleName ||
      t.assignedVehicle ||
      "";
    setDriver(drv);
    setVehicle(veh);
  }, [row]);

  // Persist driver/vehicle assignments back to repo when changed (only if not final approved)
  React.useEffect(() => {
    if (row?.id && row.status !== "approved") AdminRequestsRepo.setDriver(row.id, driver);
  }, [driver, row?.id, row?.status]);

  React.useEffect(() => {
    if (row?.id && row.status !== "approved") AdminRequestsRepo.setVehicle(row.id, vehicle);
  }, [vehicle, row?.id, row?.status]);

  // Compute total cost — sum base categories + otherItems + single "other"
  const totalCost = React.useMemo(() => {
    const c: any = row?.travelOrder?.costs || {};
    const baseKeys = ["food", "driversAllowance", "rentVehicles", "hiredDrivers", "accommodation"] as const;

    const base = baseKeys.reduce((sum, k) => {
      const v = c[k];
      return sum + (typeof v === "number" && isFinite(v) ? v : 0);
    }, 0);

    const othersArray = Array.isArray(c.otherItems)
      ? c.otherItems.reduce(
          (s: number, it: any) => s + (it && typeof it.amount === "number" && isFinite(it.amount) ? it.amount : 0),
          0
        )
      : 0;

    const singleOther =
      c.otherLabel && typeof c.otherAmount === "number" && isFinite(c.otherAmount) ? c.otherAmount : 0;

    return base + othersArray + singleOther;
  }, [row?.travelOrder?.costs]);

  const deptName = row?.travelOrder?.department || "";

  // Derived rules for routing after Admin approval
  const usesVehicle = React.useMemo(() => {
    const t: any = row?.travelOrder || {};
    const vm = (t.vehicleMode || "").toString().toLowerCase();
    // Treat any non-empty mode as vehicle use; if you have "none" as value, it will be skipped
    return !!vm && vm !== "none";
  }, [row?.travelOrder]);

  const requiresComptroller = usesVehicle || totalCost > 0;

  // Can Admin approve now?
  const awaitingHead = row?.status === "pending_head";
  const canAdminApprove =
    !!row &&
    !awaitingHead &&
    (row.status === "head_approved" ||
      row.status === "admin_received" ||
      row.status === "pending" || // legacy fallback
      row.status === "comptroller_pending" || // allow re-approval loops if needed
      row.status === "hr_pending" ||
      row.status === "executive_pending" ||
      row.status === "approved"); // already approved (button hidden below anyway)

  // PDF uses current driver/vehicle selections
  const handlePrintTravelPDF = React.useCallback(() => {
    if (!row) return;
    const printable: AdminRequest = {
      ...row,
      driver,
      vehicle,
    } as AdminRequest;

    generateRequestPDF(printable);
  }, [row, driver, vehicle]);

  const isApproved = row?.status === "approved";
  const approvedWhen = row?.approvedAt
    ? new Date(row.approvedAt).toLocaleString()
    : null;

  // open signature flow
  function requestApproval() {
    setSigDataUrl(null);
    setSignOpen(true);
  }

  function confirmSignature() {
    if (!row?.id || !sigDataUrl) return;

    const nowIso = new Date().toISOString();
    const nextStatus =
      requiresComptroller
        ? ("comptroller_pending" as AdminRequest["status"])
        : ("hr_pending" as AdminRequest["status"]);

    // 👉 Use an "any" shim to avoid TS narrowing issues
    const repoAny = AdminRequestsRepo as unknown as {
      adminApproveAndRoute?: (
        id: string,
        opts: { signature: string; approvedBy?: string | null; requiresComptroller: boolean }
      ) => void;
      upsert: (req: AdminRequest) => void;
    };

    if (typeof repoAny.adminApproveAndRoute === "function") {
      repoAny.adminApproveAndRoute(row.id, {
        signature: sigDataUrl,
        approvedBy: "Admin User", // TODO: inject current admin name
        requiresComptroller,
      });
    } else {
      // Fallback: emulate same effect via upsert
      repoAny.upsert({
        ...row,
        approverSignature: sigDataUrl,
        approvedAt: nowIso,
        approvedBy: "Admin User",
        updatedAt: nowIso,
        status: nextStatus,
      } as AdminRequest);
    }

    onApprove?.();
    setSignOpen(false);
  }

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

              {/* Status pill for final approved */}
              {isApproved && (
                <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    Approved{row.approvedBy ? ` by ${row.approvedBy}` : ""}{approvedWhen ? ` • ${approvedWhen}` : ""}
                  </span>
                </div>
              )}

              <button
                onClick={onClose}
                className="ml-3 rounded-md p-2 text-neutral-500 hover:bg-neutral-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Context banners */}
            {awaitingHead && (
              <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <div className="font-medium">Awaiting Department Head Endorsement</div>
                  <div>Admin approval is disabled until the Head signs.</div>
                </div>
              </div>
            )}
            {row.status === "head_approved" && (
              <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Head endorsement received. You may review and approve.
              </div>
            )}

            {/* Scrollable body */}
            <div className="space-y-8 max-h-[72vh] overflow-y-auto pr-2">
              {/* Travel Order */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-neutral-700">Travel Order</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="font-semibold">Date</dt>
                  <dd>{row.travelOrder?.date || "—"}</dd>

                  <dt className="font-semibold">Requesting Person</dt>
                  <dd className="flex items-center gap-3">
                    <span className="truncate">{row.travelOrder?.requestingPerson || "—"}</span>
                    {getRequesterSig(row.travelOrder) ? (
                      <img
                        src={getRequesterSig(row.travelOrder)!}
                        alt="Requester signature"
                        className="h-8 w-auto max-w-[160px] object-contain"
                        title="Requester e-signature"
                      />
                    ) : null}
                  </dd>

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
                        {"food" in row.travelOrder.costs && (row.travelOrder.costs as any).food > 0 && (
                          <tr>
                            <td className="px-2 py-1">Food</td>
                            <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).food)}</td>
                          </tr>
                        )}
                        {"driversAllowance" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).driversAllowance > 0 && (
                            <tr>
                              <td className="px-2 py-1">Driver’s allowance</td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).driversAllowance)}</td>
                            </tr>
                          )}
                        {"rentVehicles" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).rentVehicles > 0 && (
                            <tr>
                              <td className="px-2 py-1">Rent vehicles</td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).rentVehicles)}</td>
                            </tr>
                          )}
                        {"hiredDrivers" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).hiredDrivers > 0 && (
                            <tr>
                              <td className="px-2 py-1">Hired drivers</td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).hiredDrivers)}</td>
                            </tr>
                          )}
                        {"accommodation" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).accommodation > 0 && (
                            <tr>
                              <td className="px-2 py-1">Accommodation</td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).accommodation)}</td>
                            </tr>
                          )}

                        {"otherLabel" in row.travelOrder.costs &&
                          "otherAmount" in row.travelOrder.costs &&
                          (row.travelOrder.costs as any).otherLabel &&
                          (row.travelOrder.costs as any).otherAmount > 0 && (
                            <tr>
                              <td className="px-2 py-1">{(row.travelOrder.costs as any).otherLabel}</td>
                              <td className="px-2 py-1 text-right">{peso((row.travelOrder.costs as any).otherAmount)}</td>
                            </tr>
                          )}

                        {Array.isArray((row.travelOrder.costs as any).otherItems) &&
                          (row.travelOrder.costs as any).otherItems.map(
                            (item: { label: string; amount: number }, i: number) =>
                              item?.amount > 0 && (
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
                        className="h-16 object-contain -mb-3"
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

                    {/* role + department */}
                    <p className="text-xs text-neutral-500 text-center">
                      Dept. Head{deptName ? `, ${deptName}` : ""}
                    </p>

                    {/* optional date */}
                    {row.travelOrder?.endorsedByHeadDate && (
                      <p className="text-xs text-neutral-500">{row.travelOrder.endorsedByHeadDate}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Assignments + Admin Note */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-neutral-700">Assignments</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Driver</label>
                    <select
                      value={driver}
                      onChange={(e) => setDriver(e.target.value)}
                      disabled={isApproved}
                      className={`w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010] ${
                        isApproved ? "bg-neutral-100 text-neutral-500" : ""
                      }`}
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
                      disabled={isApproved}
                      className={`w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0010] ${
                        isApproved ? "bg-neutral-100 text-neutral-500" : ""
                      }`}
                    >
                      <option value="">— Select Vehicle —</option>
                      {VEHICLES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Admin vehicle note (owned / for rent) */}
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Vehicle Note</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => row?.id && AdminRequestsRepo.setTmNote(row.id, "Owned vehicle")}
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
                      >
                        Mark as Owned
                      </button>
                      <button
                        type="button"
                        onClick={() => row?.id && AdminRequestsRepo.setTmNote(row.id, "For rent")}
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
                      >
                        Mark as For Rent
                      </button>
                      <button
                        type="button"
                        onClick={() => row?.id && AdminRequestsRepo.setTmNote(row.id, null)}
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-neutral-50"
                      >
                        Clear note
                      </button>
                      {row?.tmNote && (
                        <span className="ml-2 text-xs text-neutral-600">Current note: {row.tmNote}</span>
                      )}
                    </div>
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
                  onClick={handlePrintTravelPDF}
                  className="flex items-center gap-2 rounded-md bg-[#7A0010] hover:bg-[#5c000c] px-4 py-2 text-sm text-white transition"
                >
                  <FileDown className="h-4 w-4" />
                  Travel Order PDF
                </button>
                {row.seminar && (
                  <button
                    onClick={() => generateSeminarPDF(row)}
                    className="flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm text-white transition"
                  >
                    <FileDown className="h-4 w-4" />
                    Seminar PDF
                  </button>
                )}
              </div>

              {/* Right side: actions or status */}
              {!isApproved ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={requestApproval}
                    disabled={!canAdminApprove}
                    className={`rounded-md px-4 py-2 text-sm text-white transition ${
                      canAdminApprove
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-neutral-400 cursor-not-allowed"
                    }`}
                  >
                    Approve
                  </button>
                  {onReject && (
                    <button
                      onClick={onReject}
                      className="rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-sm text-white transition"
                    >
                      Reject
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>
                    Approved{row.approvedBy ? ` by ${row.approvedBy}` : ""}{approvedWhen ? ` • ${approvedWhen}` : ""}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Signature dialog (Approve flow) */}
      <Dialog open={signOpen} onClose={() => setSignOpen(false)} className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="relative z-[61] w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Approve — Signature</h3>
            <button onClick={() => setSignOpen(false)} className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          <SignaturePad
            height={220}
            value={null}
            onSave={(dataUrl) => setSigDataUrl(dataUrl)}
            onClear={() => setSigDataUrl(null)}
            hideSaveButton
          />

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setSignOpen(false)}
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmSignature}
              disabled={!sigDataUrl}
              className={`rounded-md px-4 py-2 text-sm text-white transition ${
                sigDataUrl ? "bg-green-600 hover:bg-green-700" : "bg-neutral-400 cursor-not-allowed"
              }`}
            >
              {sigDataUrl ? (requiresComptroller ? "Approve & Send to Comptroller" : "Approve & Send to HR") : "Approve"}
            </button>
          </div>
        </div>
      </Dialog>
    </Dialog>
  );
}
