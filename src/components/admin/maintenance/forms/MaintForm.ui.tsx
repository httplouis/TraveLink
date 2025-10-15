"use client";
import * as React from "react";
import type { Maintenance } from "@/lib/admin/maintenance/types";
import { TextInput, NumberInput, DateInput, SelectInput } from "@/components/common/forms/Inputs";

const BRAND = "#7a0019";

export function MaintForm({
  initial, onCancel, onSubmit
}: {
  initial?: Partial<Maintenance>;
  onCancel: () => void;
  onSubmit: (data: Omit<Maintenance,"id"|"createdAt"|"updatedAt">) => void;
}) {
  const [form, setForm] = React.useState<Omit<Maintenance,"id"|"createdAt"|"updatedAt">>(() => ({
    vehicleId: initial?.vehicleId ?? "",
    vehicleCode: initial?.vehicleCode ?? "",
    plateNo: initial?.plateNo ?? "",
    type: (initial?.type as any) ?? "Preventive",
    description: initial?.description ?? "",
    odometerKm: initial?.odometerKm ?? 0,
    requestDate: initial?.requestDate ?? new Date().toISOString().slice(0,10),
    serviceDate: initial?.serviceDate ?? "",
    status: (initial?.status as any) ?? "draft",
    photoUrl: initial?.photoUrl ?? null,
    remarks: initial?.remarks ?? "",
  }));

  return (
    <form onSubmit={(e)=>{ e.preventDefault(); onSubmit(form); }} className="grid gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <TextInput label="Vehicle Code" value={form.vehicleCode} onChange={v=>setForm(f=>({...f, vehicleCode:v}))}/>
        <TextInput label="Plate No." value={form.plateNo} onChange={v=>setForm(f=>({...f, plateNo:v}))}/>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <SelectInput label="Type" value={form.type} options={["Preventive","Repair","Inspection"]} onChange={v=>setForm(f=>({...f, type:v as any}))}/>
        <SelectInput label="Status" value={form.status} options={["draft","submitted","acknowledged","in-progress","completed","rejected"]} onChange={v=>setForm(f=>({...f, status:v as any}))}/>
      </div>

      <TextInput label="Description" value={form.description} onChange={v=>setForm(f=>({...f, description:v}))}/>
      <NumberInput label="Odometer (km)" value={form.odometerKm} min={0} onChange={v=>setForm(f=>({...f, odometerKm:v}))}/>

      <div className="grid sm:grid-cols-2 gap-3">
        <DateInput label="Request Date" value={form.requestDate} onChange={v=>setForm(f=>({...f, requestDate:v}))}/>
        <DateInput label="Service Date" value={form.serviceDate ?? ""} onChange={v=>setForm(f=>({...f, serviceDate:v}))}/>
      </div>

      <TextInput label="Remarks" value={form.remarks ?? ""} onChange={v=>setForm(f=>({...f, remarks:v}))}/>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-md border bg-white">Cancel</button>
        <button type="submit" className="px-3 py-1.5 rounded-md text-white" style={{ background: BRAND }}>
          Save
        </button>
      </div>
    </form>
  );
}
