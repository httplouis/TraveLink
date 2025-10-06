// src/components/faculty/request/Form.tsx
"use client";

export type RequestForm = {
  purpose: string;
  origin: string;
  destination: string;
  schedule: string;                 // datetime-local
  passengers: string | number;
  notes: string;
};

type Props = {
  form: RequestForm;
  errors: Partial<Record<keyof RequestForm, string>>;
  submitting?: boolean;
  onChange: <K extends keyof RequestForm>(key: K, value: RequestForm[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
};

const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300";
const labelCls = "text-sm font-medium text-neutral-700";
const sectionCls = "rounded-lg border bg-white p-4";

export default function FacultyRequestForm({
  form,
  errors,
  submitting,
  onChange,
  onSubmit,
  onReset,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 min-w-0">
      <section className={sectionCls}>
        <h2 className="mb-3 font-medium">Trip Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Purpose *</label>
            <input
              className={inputCls}
              placeholder="e.g., Faculty meeting"
              value={form.purpose}
              onChange={(e) => onChange("purpose", e.target.value)}
            />
            {errors.purpose && <p className="mt-1 text-xs text-red-600">{errors.purpose}</p>}
          </div>

          <div>
            <label className={labelCls}>Passengers</label>
            <input
              type="number"
              min={1}
              className={inputCls}
              placeholder="e.g., 12"
              value={form.passengers}
              onChange={(e) =>
                onChange("passengers", e.target.value === "" ? "" : Number(e.target.value))
              }
            />
            {errors.passengers && <p className="mt-1 text-xs text-red-600">{errors.passengers}</p>}
          </div>

          <div>
            <label className={labelCls}>Schedule *</label>
            <input
              type="datetime-local"
              className={inputCls}
              value={form.schedule}
              onChange={(e) => onChange("schedule", e.target.value)}
            />
            {errors.schedule && <p className="mt-1 text-xs text-red-600">{errors.schedule}</p>}
          </div>

          <div>
            <label className={labelCls}>Origin *</label>
            <input
              className={inputCls}
              placeholder="e.g., CCMS Building"
              value={form.origin}
              onChange={(e) => onChange("origin", e.target.value)}
            />
            {errors.origin && <p className="mt-1 text-xs text-red-600">{errors.origin}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Destination *</label>
            <input
              className={inputCls}
              placeholder="e.g., City Hall"
              value={form.destination}
              onChange={(e) => onChange("destination", e.target.value)}
            />
            {errors.destination && <p className="mt-1 text-xs text-red-600">{errors.destination}</p>}
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Notes (optional)</label>
            <textarea
              rows={4}
              className={inputCls}
              placeholder="Anything the dispatcher should know?"
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className={sectionCls}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-[#7a0019] px-4 py-2 text-sm text-white hover:opacity-95 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
          <button
            type="button"
            className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
            onClick={onReset}
          >
            Reset
          </button>
        </div>
      </section>
    </form>
  );
}
