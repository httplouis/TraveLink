"use client";

export default function SubmitBar({
  invalid,
  saving,
  submitting,
  onSaveDraft,
  onSubmit,
}: {
  invalid: boolean;
  saving: boolean;
  submitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="sticky bottom-3 z-30 mt-2 flex items-center gap-2">
      <button
        onClick={onSaveDraft}
        disabled={saving}
        className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm shadow-sm hover:bg-neutral-50 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save draft"}
      </button>

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="rounded-xl bg-[#7A0010] px-4 py-2 text-sm text-white shadow-sm hover:opacity-95 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>

      {invalid && (
        <span className="text-xs text-neutral-500">Review the highlighted fields.</span>
      )}

      
    </div>
  );
}
