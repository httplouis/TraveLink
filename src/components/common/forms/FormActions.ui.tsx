// components/common/form/FormActions.ui.tsx
"use client";
export function FormActions({
  onCancel, submitLabel="Save", brand="#7a0019",
}: { onCancel: ()=>void; submitLabel?: string; brand?: string }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onCancel}
        className="rounded-md border bg-white px-3 py-1.5">Cancel</button>
      <button type="submit"
        className="rounded-md px-3 py-1.5 text-white" style={{ background: brand }}>
        {submitLabel}
      </button>
    </div>
  );
}
