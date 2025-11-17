"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, PageBody } from "@/components/common/Page";
import FeedbackView from "@/components/user/feedback/FeedbackView";

/* ------------ Types used only by the container ------------ */
type Form = {
  category: string;
  rating: number;         // 0–5
  subject: string;
  message: string;
  anonymous: boolean;
  contact: string;        // email or phone (optional if anonymous)
  attachment?: File | null;
};
type Errors = Partial<Record<keyof Form, string>>;

/* ------------ Simple validators (can be moved to utils) ------------ */
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v: string) => /^(\+?\d{10,15}|0\d{9,10})$/.test(v.replace(/\s|-/g, ""));
const validate = (f: Form): Errors => {
  const e: Errors = {};
  if (!f.category) e.category = "Please pick a category.";
  if (!f.message.trim() || f.message.trim().length < 10)
    e.message = "Please write at least 10 characters.";
  if (!f.anonymous && f.contact.trim() && !(isEmail(f.contact) || isPhone(f.contact))) {
    e.contact = "Enter a valid email or phone, or leave blank.";
  }
  return e;
};

export default function UserFeedbackPage() {
  const [form, setForm] = useState<Form>({
    category: "",
    rating: 0,
    subject: "",
    message: "",
    anonymous: false,
    contact: "",
    attachment: null,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const update = <K extends keyof Form>(key: K, val: Form[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);

    try {
      // Get request_id from URL params if present
      const urlParams = new URLSearchParams(window.location.search);
      const requestId = urlParams.get("request_id");
      const isLocked = urlParams.get("locked") === "true";

      // Get current user
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();

      const feedbackData: any = {
        category: form.category,
        rating: form.rating,
        subject: form.subject,
        message: form.message,
        anonymous: form.anonymous,
        contact: form.contact || null,
      };

      if (requestId) {
        feedbackData.trip_id = requestId;
      }

      if (meData?.id) {
        feedbackData.user_id = meData.id;
        feedbackData.user_name = form.anonymous ? "Anonymous" : (meData.name || "User");
        feedbackData.user_email = form.anonymous ? null : (meData.email || null);
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      const result = await res.json();

      if (result.ok) {
        setSuccessId(result.data?.id || `FB-${Date.now()}`);
        
        // If locked, refresh lock status to unlock UI
        if (isLocked) {
          // Reload page to remove lock
          setTimeout(() => {
            window.location.href = "/user";
          }, 2000);
        }
      } else {
        throw new Error(result.error || "Failed to submit feedback");
      }
    } catch (error: any) {
      console.error("[User Feedback] Submit error:", error);
      setErrors({ message: error.message || "Failed to submit feedback. Please try again." });
    } finally {
      setSubmitting(false);
    }

    // keep contact preference; clear other fields
    setForm((f) => ({
      ...f,
      category: "",
      rating: 0,
      subject: "",
      message: "",
      attachment: null,
    }));
  };

  const onReset = () => {
    setForm({
      category: "",
      rating: 0,
      subject: "",
      message: "",
      anonymous: false,
      contact: "",
      attachment: null,
    });
    setErrors({});
    setSuccessId(null);
  };

  return (
    <>
      <PageHeader
        title="Feedback"
        description="Send feedback about the transport service."
        actions={
          <Link
            href="/user"
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
          >
            Back to Dashboard
          </Link>
        }
      />
      <PageBody>
        <FeedbackView
          /* values */
          category={form.category}
          rating={form.rating}
          subject={form.subject}
          message={form.message}
          anonymous={form.anonymous}
          contact={form.contact}
          attachmentName={form.attachment?.name ?? ""}
          /* errors */
          errors={errors}
          /* flags */
          submitting={submitting}
          successId={successId}
          /* handlers */
          onChangeCategory={(v) => update("category", v)}
          onChangeRating={(v) => update("rating", v)}
          onChangeSubject={(v) => update("subject", v)}
          onChangeMessage={(v) => update("message", v)}
          onToggleAnonymous={(v) => update("anonymous", v)}
          onChangeContact={(v) => update("contact", v)}
          onFile={(file?: File | undefined) => update("attachment", file ?? null)}
          onSubmit={onSubmit}
          onReset={onReset}
        />
      </PageBody>
    </>
  );
}
