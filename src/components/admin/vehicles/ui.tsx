"use client";
import * as React from "react";
import { Download, Filter, Plus, Trash2, Edit, Search } from "lucide-react";
import type { Vehicle, VehicleFilters } from "@/lib/admin/vehicles/types";
import { VehiclesRepo } from "@/lib/admin/vehicles/store";
import { toCSV, validate } from "@/lib/admin/vehicles/utils";

/* ---------- small ui atoms ---------- */
const Brand = "#7a0019";

export function FiltersBar({
  value, onChange, onClear,
}: {
  value: VehicleFilters;
  onChange: (v: VehicleFilters) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2 bg-white">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border">
        <Search size={16} className="opacity-60" />
        <input
          placeholder="Search plate, code, brand, model…"
          className="outline-none text-sm"
          value={value.search ?? ""}
          onChange={e => onChange({ ...value, search: e.target.value })}
        />
      </div>

      <select
        className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.type ?? ""}
        onChange={e => onChange({ ...value, type: e.target.value as any })}
      >
        <option value="">All Types</option>
        {VehiclesRepo.constants.types.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      <select
        className="rounded-md border px-2 py-1.5 text-sm bg-white"
        value={value.status ?? ""}
        onChange={e => onChange({ ...value, status: e.target.value as any })}
      >
        <option value="">All Status</option>
        {VehiclesRepo.constants.statuses.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <button
        onClick={onClear}
        className="ml-auto text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
        title="Clear filters"
      >
        Clear
      </button>
    </div>
  );
}

export function BulkBar({
  selection, rows, onDeleteSelected, onExportCSV,
}: {
  selection: string[];
  rows: Vehicle[];
  onDeleteSelected: () => void;
  onExportCSV: () => void;
}) {
  const any = selection.length > 0;
  return (
    <div className="flex items-center gap-2">
      <button
        disabled={!any}
        onClick={onDeleteSelected}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-white disabled:opacity-50"
        title="Delete selected"
      >
        <Trash2 size={16} /> Delete
      </button>

      <button
        onClick={onExportCSV}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border bg-white"
      >
        <Download size={16} /> Export CSV
      </button>

      <span className="ml-auto text-sm text-gray-600">
        Showing <b>{rows.length}</b> item(s){any ? ` • Selected ${selection.length}` : ""}
      </span>
    </div>
  );
}

export function VehiclesTable({
  rows, selection, setSelection, onEdit, onDelete,
}: {
  rows: Vehicle[];
  selection: string[];
  setSelection: (ids: string[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const allChecked = rows.length > 0 && selection.length === rows.length;
  const toggleAll = () =>
    setSelection(allChecked ? [] : rows.map(r => r.id));

  const toggleOne = (id: string) =>
    setSelection(selection.includes(id) ? selection.filter(x => x !== id) : [...selection, id]);

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="min-w-[800px] w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="w-10 p-2 text-left">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} />
            </th>
            <th className="p-2 text-left">Plate</th>
            <th className="p-2 text-left">Code</th>
            <th className="p-2 text-left">Brand / Model</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-right">Capacity</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-right">Odometer</th>
            <th className="p-2 text-left">Last Service</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(v => (
            <tr key={v.id} className="border-t">
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={selection.includes(v.id)}
                  onChange={() => toggleOne(v.id)}
                />
              </td>
              <td className="p-2 font-medium">{v.plateNo}</td>
              <td className="p-2">{v.code}</td>
              <td className="p-2">{v.brand} <span className="text-gray-500">/ {v.model}</span></td>
              <td className="p-2">{v.type}</td>
              <td className="p-2 text-right">{v.capacity}</td>
              <td className="p-2">
                <span
                  className={
                    "px-2 py-0.5 rounded-full text-xs " +
                    (v.status === "active"
                      ? "bg-green-100 text-green-700"
                      : v.status === "maintenance"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-200 text-gray-700")
                  }
                >
                  {v.status}
                </span>
              </td>
              <td className="p-2 text-right">{v.odometerKm.toLocaleString()} km</td>
              <td className="p-2">{v.lastServiceISO}</td>
              <td className="p-2">
                <div className="flex justify-end gap-1.5">
                  <button
                    onClick={() => onEdit(v.id)}
                    className="p-1.5 rounded-md border hover:bg-gray-50"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(v.id)}
                    className="p-1.5 rounded-md border hover:bg-gray-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td className="p-6 text-center text-gray-500" colSpan={10}>
                No vehicles match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function VehicleForm({
  initial, onCancel, onSubmit,
}: {
  initial?: Partial<Vehicle>;
  onCancel: () => void;
  onSubmit: (data: Omit<Vehicle,"id"|"createdAt"|"updatedAt">) => void;
}) {
  const [form, setForm] = React.useState<Omit<Vehicle,"id"|"createdAt"|"updatedAt">>(() => ({
    plateNo: initial?.plateNo ?? "",
    code: initial?.code ?? "",
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    type: (initial?.type as any) ?? "Bus",
    capacity: initial?.capacity ?? 1,
    status: (initial?.status as any) ?? "active",
    odometerKm: initial?.odometerKm ?? 0,
    lastServiceISO: initial?.lastServiceISO ?? new Date().toISOString().slice(0,10),
    notes: initial?.notes ?? "",
  }));
  const [err, setErr] = React.useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form as any);
    if (v) { setErr(v); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      {err && <div className="rounded-md bg-rose-50 text-rose-700 px-3 py-2 text-sm">{err}</div>}

      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Plate No." value={form.plateNo} onChange={v => setForm(f => ({...f, plateNo: v}))} />
        <Input label="Vehicle Code" value={form.code} onChange={v => setForm(f => ({...f, code: v}))} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Brand" value={form.brand} onChange={v => setForm(f => ({...f, brand: v}))} />
        <Input label="Model" value={form.model} onChange={v => setForm(f => ({...f, model: v}))} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Select label="Type" value={form.type} options={VehiclesRepo.constants.types} onChange={v => setForm(f => ({...f, type: v as any}))} />
        <NumberInput label="Capacity" value={form.capacity} min={1} onChange={v => setForm(f => ({...f, capacity: v}))} />
        <Select label="Status" value={form.status} options={VehiclesRepo.constants.statuses} onChange={v => setForm(f => ({...f, status: v as any}))} />
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <NumberInput label="Odometer (km)" value={form.odometerKm} min={0} onChange={v => setForm(f => ({...f, odometerKm: v}))} />
        <DateInput label="Last Service" value={form.lastServiceISO} onChange={v => setForm(f => ({...f, lastServiceISO: v}))} />
        <Input label="Notes (optional)" value={form.notes ?? ""} onChange={v => setForm(f => ({...f, notes: v}))} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-md border bg-white">Cancel</button>
        <button type="submit" className="px-3 py-1.5 rounded-md text-white" style={{ background: Brand }}>
          Save
        </button>
      </div>
    </form>
  );
}

/* ---------- tiny inputs (UI-only) ---------- */
function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string)=>void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <input className="rounded-md border px-3 py-2" value={value} onChange={e=>onChange(e.target.value)} />
    </label>
  );
}
function NumberInput({ label, value, onChange, min=0 }: { label: string; value: number; onChange: (v:number)=>void; min?: number }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <input type="number" min={min} className="rounded-md border px-3 py-2" value={value} onChange={e=>onChange(Number(e.target.value))} />
    </label>
  );
}
function DateInput({ label, value, onChange }: { label: string; value: string; onChange:(v:string)=>void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <input type="date" className="rounded-md border px-3 py-2" value={value} onChange={e=>onChange(e.target.value)} />
    </label>
  );
}
function Select<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: readonly T[]; onChange:(v:T)=>void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-gray-700">{label}</span>
      <select className="rounded-md border px-3 py-2 bg-white" value={value} onChange={e=>onChange(e.target.value as T)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
