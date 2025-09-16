"use client";
type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
};
export default function ConfirmUI({
  open,
  title,
  message,
  confirmText = "Confirm",
  confirmClass = "bg-red-600 text-white",
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="absolute left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-white p-4 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-neutral-700">{message}</p>
        <div className="flex justify-end gap-2">
          <button className="rounded border px-3 py-1.5 text-sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`rounded px-3 py-1.5 text-sm ${confirmClass}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
