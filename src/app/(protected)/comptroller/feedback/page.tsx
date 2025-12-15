"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageHeader, PageBody } from "@/components/common/Page";
import FeedbackView from "@/components/user/feedback/FeedbackView";
import { formatLongDate } from "@/lib/datetime";

/* ------------ Types used only by the container ------------ */
type Form = {
  category: string;
  rating: number;
  subject: string;
  message: string;
  anonymous: boolean;
  contact: string;
  attachment?: File | null;
};
type Errors = Partial<Record<keyof Form, string>>;

type TripSummary = {
  requestNumber: string;
  destination: string;
  travelStartDate: string;
  travelEndDate: string;
};

/* ------------ Simple validators ------------ */
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

export default function ComptrollerFeedbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0010]"></div>
      </div>
    }>
      <ComptrollerFeedbackContent />
    </Suspense>
  );
}

function ComptrollerFeedbackContent() {
  const searchParams = useSearchParams();
  const requestIdFromUrl = searchParams?.get("request_id") ?? null;
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [tripSummary, setTripSummary] = useState<TripSummary | null>(null);

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

  useEffect(() => {
    const fetchTripInfo = async () => {
      if (!requestIdFromUrl) return;

      try {
        const res = await fetch(`/api/requests/${requestIdFromUrl}`);
        if (!res.ok) return;
        const data = await res.json();
        const req = data?.data || data;
        if (req?.request_number) {
          setRequestNumber(req.request_number as string);
          setTripSummary({
            requestNumber: req.request_number as string,
            destination: (req.seminar_data?.venue as string) || (req.destination as string) || "",
            travelStartDate: req.travel_start_date as string,
            travelEndDate: req.travel_end_date as string,
          });
        }
      } catch (error) {
        console.error("[Comptroller Feedback] Failed to load trip info", error);
      }
    };

    fetchTripInfo();
  }, [requestIdFromUrl]);

  const update = <K extends keyof Form>(key: K, val: Form[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);

    try {
      const requestId = requestIdFromUrl;
      const isLocked = searchParams?.get("locked") === "true";

      const meRes = await fetch("/api/me");
      const meData = await meRes.json();

      if (!meData?.id) {
        throw new Error("Could not get user information. Please try again.");
      }

      const feedbackData: any = {
        category: form.category,
        rating: form.rating,
        message: form.message,
        anonymous: form.anonymous,
        contact: form.contact || null,
        user_id: meData.id,
        user_name: form.anonymous ? "Anonymous" : (meData.name || meData.email || "User"),
        user_email: form.anonymous ? null : (meData.email || null),
      };

      if (requestId) {
        feedbackData.trip_id = requestId;
      }

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      const result = await res.json();

      if (result.ok) {
        setSuccessId(result.data?.id || `FB-${Date.now()}`);
        
        setForm((f) => ({
          ...f,
          category: "",
          rating: 0,
          subject: "",
          message: "",
          attachment: null,
        }));
        
        if (isLocked) {
          setTimeout(() => {
            window.location.href = "/comptroller/inbox";
          }, 2500);
        }
      } else {
        throw new Error(result.error || "Failed to submit feedback");
      }
    } catch (error: any) {
      console.error("[Comptroller Feedback] Submit error:", error);
      setErrors({ message: error.message || "Failed to submit feedback. Please try again." });
    } finally {
      setSubmitting(false);
    }
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
        description={
          requestNumber
            ? `You are giving feedback for your completed trip (Request ${requestNumber}).`
            : "Send feedback about the transport service."
        }
        actions={
          <Link
            href="/comptroller/inbox"
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
          >
            Back to Budget Reviews
          </Link>
        }
      />
      <PageBody>
        {tripSummary && (
          <section className="mb-4 rounded-xl border border-[#7a0019]/15 bg-[#fff5f7] px-4 py-3 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-[#7a0019]/80 uppercase tracking-wide">
                  Rating this trip
                </p>
                <p className="text-sm font-bold text-[#7a0019]">
                  Request {tripSummary.requestNumber}
                </p>
                <p className="text-xs text-neutral-700 mt-1">
                  {tripSummary.destination || "Destination not specified"}
                </p>
              </div>
              <div className="text-xs md:text-right text-neutral-700">
                <p className="font-medium">Travel dates</p>
                <p>
                  {formatLongDate(tripSummary.travelStartDate)}
                  {tripSummary.travelEndDate &&
                    tripSummary.travelEndDate !== tripSummary.travelStartDate && (
                      <>
                        {" "}-{" "}
                        {formatLongDate(tripSummary.travelEndDate)}
                      </>
                    )}
                </p>
              </div>
            </div>
          </section>
        )}
        <FeedbackView
          category={form.category}
          rating={form.rating}
          subject={form.subject}
          message={form.message}
          anonymous={form.anonymous}
          contact={form.contact}
          attachmentName={form.attachment?.name ?? ""}
          errors={errors}
          submitting={submitting}
          successId={successId}
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
