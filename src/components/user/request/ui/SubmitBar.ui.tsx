"use client";
export default function SubmitBar({ canSubmit, saving, submitting, onSaveDraft, onSubmit }: { canSubmit: boolean; saving: boolean; submitting: boolean; onSaveDraft: ()=>void; onSubmit: ()=>void; }) {
return (
<div className="sticky bottom-3 z-30 mt-2 flex items-center gap-2">
<button onClick={onSaveDraft} disabled={saving} className="rounded-xl border bg-white px-4 py-2 text-sm shadow-sm disabled:opacity-50">{saving?"Saving…":"Save draft"}</button>
<button onClick={onSubmit} disabled={!canSubmit||submitting} className="rounded-xl bg-[#7A0010] px-4 py-2 text-sm text-white disabled:opacity-50">{submitting?"Submitting…":"Submit"}</button>
{!canSubmit && <span className="text-xs text-neutral-500">Fill all required fields to enable submit.</span>}
</div>
);
}