"use client";
import * as React from "react";
import type { Driver, DriverCreate } from "@/lib/admin/drivers/types";
import { todayISO } from "@/lib/admin/drivers/utils";

type Props = {
  mode: "create" | "edit";
  driver?: Driver;
  onClose: () => void;
  onSubmit: (data: DriverCreate | Partial<Driver>) => void;
};

export default function DriverForm({ mode, driver, onClose, onSubmit }: Props) {
  const [form, setForm] = React.useState<DriverCreate>(() => ({
    employeeNo: driver?.employeeNo ?? "",
    firstName: driver?.firstName ?? "",
    lastName: driver?.lastName ?? "",
    email: driver?.email ?? "",
    phone: driver?.phone ?? "",
    status: driver?.status ?? "active",
    photoUrl: driver?.photoUrl,
    hiredAt: driver?.hiredAt ?? todayISO(),
    license: driver?.license ?? { number: "", category: "B", expiry: todayISO() },
    requirements: driver?.requirements,
    primaryVehicleId: driver?.primaryVehicleId ?? null,
    allowedVehicleTypes: driver?.allowedVehicleTypes ?? ["van","bus","car"],
    notes: driver?.notes ?? ""
  }));

  const handle = (k: any, v: any) => setForm(s => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(mode === "create" ? form : { ...form });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">{mode === "create" ? "Add Driver" : "Edit Driver"}</h2>
          <button className="rounded px-2 py-1 text-sm hover:bg-gray-100" onClick={onClose}>Close</button>
        </div>

        <form onSubmit={submit} className="grid gap-4 p-4 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs text-gray-600">Employee #</span>
            <input className="rounded border px-3 py-2" value={form.employeeNo} onChange={e=>handle("employeeNo", e.target.value)} required />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">Status</span>
            <select className="rounded border px-3 py-2" value={form.status} onChange={e=>handle("status", e.target.value)}>
              <option value="active">active</option>
              <option value="suspended">suspended</option>
              <option value="archived">archived</option>
              <option value="pending_verification">pending_verification</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">First name</span>
            <input className="rounded border px-3 py-2" value={form.firstName} onChange={e=>handle("firstName", e.target.value)} required />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">Last name</span>
            <input className="rounded border px-3 py-2" value={form.lastName} onChange={e=>handle("lastName", e.target.value)} required />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">Email</span>
            <input type="email" className="rounded border px-3 py-2" value={form.email} onChange={e=>handle("email", e.target.value)} required />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">Phone</span>
            <input className="rounded border px-3 py-2" value={form.phone} onChange={e=>handle("phone", e.target.value)} />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">License Number</span>
            <input className="rounded border px-3 py-2" value={form.license.number} onChange={e=>setForm(s=>({...s, license:{...s.license, number: e.target.value}}))} required />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">License Category</span>
            <input className="rounded border px-3 py-2" value={form.license.category} onChange={e=>setForm(s=>({...s, license:{...s.license, category: e.target.value}}))} />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-gray-600">License Expiry</span>
            <input type="date" className="rounded border px-3 py-2" value={form.license.expiry} onChange={e=>setForm(s=>({...s, license:{...s.license, expiry: e.target.value}}))} />
          </label>

          <label className="grid gap-1 md:col-span-2">
            <span className="text-xs text-gray-600">Notes</span>
            <textarea className="rounded border px-3 py-2" rows={3} value={form.notes} onChange={e=>handle("notes", e.target.value)} />
          </label>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" className="rounded border px-4 py-2 hover:bg-gray-50" onClick={onClose}>Cancel</button>
            <button type="submit" className="rounded bg-[#7a1f2a] px-4 py-2 text-white hover:opacity-90">{mode === "create" ? "Create" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
