"use client";
import * as React from "react";
import type { Reason, VehicleMode, RequesterRole } from "@/lib/user/request/types";


const REASONS: { label: string; value: Reason }[] = [
{ label: "Seminar / Meeting", value: "seminar" },
{ label: "Educational Trip", value: "educational" },
{ label: "Competition", value: "competition" },
{ label: "Visit", value: "visit" },
];


const VEHICLES: { label: string; value: VehicleMode }[] = [
{ label: "Institutional vehicle", value: "institutional" },
{ label: "Owned vehicle", value: "owned" },
{ label: "Rent (external)", value: "rent" },
];


const ROLES: { label: string; value: RequesterRole }[] = [
{ label: "Faculty", value: "faculty" },
{ label: "Head", value: "head" },
{ label: "Org", value: "org" },
];


export default function ChoicesBar({
value,
lockedVehicle,
onReason,
onVehicle,
onRequester,
}: {
value: { reason: Reason; vehicleMode: VehicleMode; requesterRole: RequesterRole };
lockedVehicle: VehicleMode | null;
onReason: (r: Reason) => void;
onVehicle: (v: VehicleMode) => void;
onRequester: (r: RequesterRole) => void;
}) {
return (
<div className="rounded-2xl border bg-white p-4 shadow-sm">
<div className="grid gap-3 md:grid-cols-3">
<RadioGroup label="Reason of trip" value={value.reason} options={REASONS} onChange={onReason} />
<RadioGroup
label="Vehicle"
value={value.vehicleMode}
options={VEHICLES.map((o) => ({ ...o, disabled: lockedVehicle ? o.value !== lockedVehicle : false }))}
onChange={onVehicle}
/>
<RadioGroup label="Requester" value={value.requesterRole} options={ROLES} onChange={onRequester} />
</div>
{lockedVehicle && (
<p className="mt-2 text-xs text-neutral-500">Vehicle locked to <b>{lockedVehicle}</b> by reason.</p>
)}
</div>
);
}


function RadioGroup<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { label: string; value: T; disabled?: boolean }[]; onChange: (v: T) => void; }) {
return (
<div>
<div className="mb-1 text-sm font-medium text-neutral-700">{label}</div>
<div className="flex flex-wrap gap-2">
{options.map((opt) => (
<label key={String(opt.value)} className={`cursor-pointer rounded-xl border px-3 py-2 text-sm ${opt.disabled ? "opacity-50" : "hover:bg-neutral-50"}`}>
<input type="radio" className="mr-2" checked={value === opt.value} disabled={opt.disabled} onChange={() => onChange(opt.value)} />
{opt.label}
</label>
))}
</div>
</div>
);
}