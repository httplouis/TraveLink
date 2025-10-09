"use client";
import * as React from "react";


export default function SchoolServiceSection({ data, onChange, errors }: { data: any; onChange: (patch:any)=>void; errors: Record<string,string> }) {
return (
<section className="rounded-2xl border bg-white p-4 shadow-sm">
<h3 className="mb-3 text-lg font-semibold">School Service Request</h3>
<div className="grid gap-3 md:grid-cols-2">
<Field label="Driver" error={errors["schoolService.driver"]}>
<input className="input" value={data?.driver||""} onChange={(e)=>onChange({ driver: e.target.value })} />
</Field>
<Field label="Vehicle" error={errors["schoolService.vehicle"]}>
<input className="input" value={data?.vehicle||""} onChange={(e)=>onChange({ vehicle: e.target.value })} />
</Field>
<Field label="Vehicle Dispatcher (Trizzia Maree Z. Casino) signed?" error={undefined}>
<input type="checkbox" className="mr-2" checked={!!data?.vehicleDispatcherSigned} onChange={(e)=>onChange({ vehicleDispatcherSigned: e.target.checked })} />
<span className="text-sm text-neutral-700">Yes</span>
</Field>
<Field label="Dispatcher date" error={errors["schoolService.vehicleDispatcherDate"]}>
<input type="date" className="input" value={data?.vehicleDispatcherDate||""} onChange={(e)=>onChange({ vehicleDispatcherDate: e.target.value })} />
</Field>
</div>
</section>
);
}


function Field({ label, error, children }: React.PropsWithChildren<{ label: string; error?: string }>) {
return (
<label className="grid gap-1">
<span className="text-sm text-neutral-700">{label}</span>
{children}
{error && <span className="text-xs text-red-600">{error}</span>}
</label>
);
}