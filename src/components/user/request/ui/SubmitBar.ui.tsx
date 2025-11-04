"use client";

export default function SubmitBar({
  invalid,
  saving,
  submitting,
  onSaveDraft,
  onSubmit,
  headName,
  department,
}: {
  invalid: boolean;
  saving: boolean;
  submitting: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  headName?: string;
  department?: string;
}) {
  return (
    <div className="sticky bottom-3 z-30 mt-2 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Ready to submit?</p>
          {headName && department ? (
            <p className="text-xs text-gray-500">
              📩 Will be sent to: <span className="font-medium text-[#7A0010]">{headName}</span> ({department})
            </p>
          ) : (
            <p className="text-xs text-gray-500">Your request will be sent to your department head</p>
          )}
        </div>
        {invalid && (
          <span className="rounded-md bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            ⚠️ Review fields
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onSaveDraft}
          disabled={saving}
          className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
              Saving...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save as Draft
            </span>
          )}
        </button>

        <button
          onClick={onSubmit}
          disabled={submitting || invalid}
          className="flex-1 rounded-lg bg-gradient-to-r from-[#7A0010] to-[#5A0010] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Sending...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send to Department Head
            </span>
          )}
        </button>
      </div>
      
      <p className="text-center text-xs text-gray-400">
        💡 Tip: Save as draft if you need to continue later
      </p>
    </div>
  );
}
