"use client";

import Stars from "./Stars";

const sectionCls = "rounded-lg border bg-white p-4";
const inputCls =
  "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-300";
const labelCls = "text-sm font-medium text-neutral-700";
const hintCls = "text-xs text-neutral-500";

type Props = {
  /* values */
  category: string;
  rating: number;
  subject: string;
  message: string;
  anonymous: boolean;
  contact: string;
  attachmentName?: string;
  /* errors */
  errors?: Partial<Record<
    "category" | "rating" | "subject" | "message" | "anonymous" | "contact" | "attachment",
    string
  >>;
  /* flags */
  submitting?: boolean;
  successId?: string | null;
  /* handlers */
  onChangeCategory: (v: string) => void;
  onChangeRating: (v: number) => void;
  onChangeSubject: (v: string) => void;
  onChangeMessage: (v: string) => void;
  onToggleAnonymous: (v: boolean) => void;
  onChangeContact: (v: string) => void;
  onFile: (file?: File) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
};

export default function FeedbackView({
  /* values */
  category,
  rating,
  subject,
  message,
  anonymous,
  contact,
  attachmentName,
  /* errors */
  errors = {},
  /* flags */
  submitting = false,
  successId,
  /* handlers */
  onChangeCategory,
  onChangeRating,
  onChangeSubject,
  onChangeMessage,
  onToggleAnonymous,
  onChangeContact,
  onFile,
  onSubmit,
  onReset,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      {/* LEFT: FORM */}
      <form onSubmit={onSubmit} className="space-y-4 min-w-0">
        <section className={sectionCls}>
          <h2 className="mb-3 font-medium">Tell us more</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className={labelCls}>Category *</label>
              <select
                className={inputCls}
                value={category}
                onChange={(e) => onChangeCategory(e.target.value)}
              >
                <option value="">Select…</option>
                <option>Bug</option>
                <option>Feature Request</option>
                <option>Driver Experience</option>
                <option>Schedule / Booking</option>
                <option>App UI/UX</option>
                <option>Other</option>
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
            </div>

            {/* Rating */}
            <div>
              <label className={labelCls}>Rating (optional)</label>
              <Stars value={rating} onChange={onChangeRating} />
              <p className={hintCls}>How was your overall experience? 1–5 stars.</p>
            </div>

            {/* Subject */}
            <div className="md:col-span-2">
              <label className={labelCls}>Subject (optional)</label>
              <input
                className={inputCls}
                placeholder="e.g., Request form is confusing"
                value={subject}
                onChange={(e) => onChangeSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div className="md:col-span-2">
              <label className={labelCls}>Message *</label>
              <textarea
                rows={6}
                className={inputCls}
                placeholder="Describe the issue or suggestion in detail…"
                value={message}
                onChange={(e) => onChangeMessage(e.target.value)}
              />
              {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
            </div>

            {/* Attachment */}
            <div>
              <label className={labelCls}>Attachment (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <p className={hintCls}>Add a screenshot/photo (PNG/JPG), max ~2MB.</p>
              {attachmentName ? (
                <p className="mt-1 text-xs text-neutral-600">Selected: {attachmentName}</p>
              ) : null}
            </div>

            {/* Identity */}
            <div className="space-y-1">
              <label className={labelCls}>Identity & contact</label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => onToggleAnonymous(e.target.checked)}
                />
                Submit anonymously
              </label>
              {!anonymous && (
                <>
                  <input
                    className={`${inputCls} mt-2`}
                    placeholder="Your email or phone (optional)"
                    value={contact}
                    onChange={(e) => onChangeContact(e.target.value)}
                  />
                  {errors.contact && <p className="mt-1 text-xs text-red-600">{errors.contact}</p>}
                  <p className={hintCls}>We’ll contact you if we need more details.</p>
                </>
              )}
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
              {submitting ? "Sending…" : "Send Feedback"}
            </button>
            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm hover:bg-neutral-50"
              onClick={onReset}
            >
              Reset
            </button>

            {successId && (
              <span className="ml-auto text-sm text-green-700">
                Thanks! Feedback <span className="font-semibold">{successId}</span> submitted.
              </span>
            )}
          </div>
        </section>
      </form>

      {/* RIGHT: Tips */}
      <aside className="space-y-4">
        <section className="rounded-lg bg-[#5c0013] text-white p-4">
          <div className="text-lg font-semibold">We’re listening</div>
          <p className="mt-1 text-sm opacity-90">
            Your feedback helps improve scheduling, notifications, and trip coordination.
          </p>
          <ul className="mt-3 text-sm space-y-1 opacity-90 list-disc pl-5">
            <li>Include dates and request IDs when relevant.</li>
            <li>Attach screenshots for UI problems.</li>
            <li>Suggest how we can make it better.</li>
          </ul>
        </section>

        <section className={sectionCls}>
          <h3 className="font-medium mb-2">What happens next?</h3>
          <ol className="list-decimal pl-5 text-sm text-neutral-700 space-y-1">
            <li>We log your feedback for review.</li>
            <li>Admins may reach out if more info is needed.</li>
            <li>Fixes and improvements appear in release notes.</li>
          </ol>
        </section>
      </aside>
    </div>
  );
}
