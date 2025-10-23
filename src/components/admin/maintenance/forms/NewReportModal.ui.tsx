"use client";
import * as React from "react";
import type {
  Driver,
  MaintRecord,
  MaintStatus,
  MaintType,
  Vehicle,
  Attachment,
} from "@/lib/admin/maintenance";
import { filesToAttachments } from "@/lib/admin/maintenance/maintenance.attachments";

const TYPES: MaintType[] = [
  "Preventive (PMS)",
  "Repair",
  "LTO Renewal",
  "Insurance Renewal",
  "Vulcanize/Tire",
  "Other",
];
const STATUSES: MaintStatus[] = [
  "Submitted",
  "Acknowledged",
  "In-Progress",
  "Completed",
  "Rejected",
];

type Props = {
  open: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  onCreate: (rec: MaintRecord) => void;
};

export default function NewReportModal({
  open,
  onClose,
  vehicles,
  drivers,
  onCreate,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [vehicleId, setVehicleId] = React.useState(vehicles[0]?.id ?? "");
  const [type, setType] = React.useState<MaintType>("Preventive (PMS)");
  const [status, setStatus] = React.useState<MaintStatus>("Submitted");
  const [createdAt, setCreatedAt] = React.useState(today);
  const [description, setDescription] = React.useState("");
  const [vendor, setVendor] = React.useState("");
  const [odometer, setOdometer] = React.useState<string>("");
  const [cost, setCost] = React.useState<string>("");
  const [assignedDriverId, setAssignedDriverId] = React.useState<string>("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      // reset when closing so creating a second record is clean
      setVehicleId(vehicles[0]?.id ?? "");
      setType("Preventive (PMS)");
      setStatus("Submitted");
      setCreatedAt(today);
      setDescription("");
      setVendor("");
      setOdometer("");
      setCost("");
      setAssignedDriverId("");
      setAttachments([]);
      setBusy(false);
    }
  }, [open, vehicles, today]);

  if (!open) return null;

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    const newOnes = await filesToAttachments(list);
    setAttachments((prev) => [...prev, ...newOnes]);
    // allow picking the same file again by resetting the input
    e.currentTarget.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function submit() {
    if (!vehicleId) return alert("Please choose a vehicle.");
    if (!type) return alert("Please choose a maintenance type.");

    setBusy(true);
    const rec: MaintRecord = {
      id: crypto.randomUUID(),
      vehicleId,
      type,
      status,
      createdAt,
      createdBy: "admin",
      description: description || undefined,
      vendor: vendor || undefined,
      odometer: odometer ? Number(odometer) : undefined,
      cost: cost ? Number(cost) : undefined,
      nextDueDate: undefined,
      assignedDriverId: assignedDriverId || undefined,
      attachments,
      history: [
        {
          at: new Date().toISOString(),
          by: "admin",
          from: "Submitted",
          to: status,
          note: description ? `Created: ${description}` : undefined,
        },
      ],
    };

    onCreate(rec);
    setBusy(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-8 mx-auto w-[720px] max-w-[92vw] rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b bg-[#7a1f2a]/5 flex items-center justify-between">
          <div className="font-semibold text-lg">Add Maintenance Report</div>
          <button onClick={onClose} className="px-3 py-1 rounded border">Close</button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* essentials */}
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-neutral-600 mb-1">Vehicle *</div>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 bg-white"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name || v.id}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-xs text-neutral-600 mb-1">Type *</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MaintType)}
                className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 bg-white"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-xs text-neutral-600 mb-1">Status</div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintStatus)}
                className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 bg-white"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-xs text-neutral-600 mb-1">Date</div>
              <input
                type="date"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 bg-white"
              />
            </label>
          </div>

          {/* details */}
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <div className="text-xs text-neutral-600 mb-1">Vendor</div>
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g., Isuzu Lucena"
                className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 bg-white"
              />
            </label>

            <label className="block">
              <div className="text-xs text-neutral-600 mb-1">Assigned Driver</div>
              <select
                value={assignedDriverId}
                onChange={(e) => setAssignedDriverId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 bg-white"
              >
                <option value="">—</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <div className="text-xs text-neutral-600 mb-1">Odometer (km)</div>
              <input
                type="number"
                min={0}
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder="e.g., 38500"
                className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 bg-white"
              />
            </label>

            <label className="block">
              <div className="text-xs text-neutral-600 mb-1">Cost (₱)</div>
              <input
                type="number"
                min={0}
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="e.g., 12950.00"
                className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 bg-white"
              />
            </label>
          </div>

          <label className="block">
            <div className="text-xs text-neutral-600 mb-1">Description</div>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note about the work or paperwork"
              className="w-full px-3 py-2 rounded-lg ring-1 ring-black/10 bg-white"
            />
          </label>

          {/* attachments */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Attachments</div>
            <div className="text-xs text-neutral-600">
              Optional — you can add **images** (JPG/PNG) or **PDFs**. You don’t need to attach anything.
            </div>
            <label className="block">
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={onPickFiles}
                className="hidden"
                id="new-report-files"
              />
              <div className="flex items-center gap-2">
                <label
                  htmlFor="new-report-files"
                  className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ring-1 ring-black/10 bg-white hover:bg-neutral-50"
                >
                  <span>+ Add files</span>
                </label>
                <span className="text-xs text-neutral-500">
                  {attachments.length ? `${attachments.length} file(s) selected` : "No files added"}
                </span>
              </div>
            </label>

            {/* small list */}
            {attachments.length > 0 && (
              <ul className="max-h-28 overflow-auto divide-y rounded-lg ring-1 ring-black/10 bg-white">
                {attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-3 py-1.5">
                    <div className="text-sm">
                      <span className="mr-2 text-xs px-1.5 py-0.5 rounded-full ring-1 ring-black/10 bg-neutral-50">
                        {a.mime.startsWith("image/") ? "IMG" : "PDF"}
                      </span>
                      {a.name}
                    </div>
                    <button
                      className="text-xs text-rose-600 hover:underline"
                      onClick={() => removeAttachment(a.id)}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t bg-neutral-50/60 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg ring-1 ring-black/10 bg-white">Cancel</button>
          <button
            onClick={submit}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg bg-[#7a1f2a] text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Create report"}
          </button>
        </div>
      </div>
    </div>
  );
}
