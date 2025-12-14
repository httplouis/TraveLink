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
  rating: number;         // 0–5
  subject: string;
  message: string;
  anonymous: boolean;
  contact: string;        // email or phone (optional if anonymous)
  attachment?: File | null;
};
type Errors = Partial<Record<keyof Form, string>>;

type TripSummary = {
  requestNumber: string;
  destination: string;
  travelStartDate: string;
  travelEndDate: string;
};

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

// Wrapper component to handle Suspense for useSearchParams
export default function UserFeedbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0010]"></div>
      </div>
    }>
      <UserFeedbackContent />
    </Suspense>
  );
}

function UserFeedbackContent() {
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

  // Load basic trip info for locked feedback (e.g., request number)
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
        console.error("[User Feedback] Failed to load trip info", error);
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
    let submitSuccess = false;

    try {
      // Get request_id and locked flag from URL params if present
      const requestId = requestIdFromUrl;
      const isLocked = searchParams?.get("locked") === "true";

      console.log("[User Feedback] Submitting feedback for request:", requestId, "locked:", isLocked);

      // Get current user
      const meRes = await fetch("/api/me");
      const meData = await meRes.json();

      if (!meData?.id) {
        console.error("[User Feedback] Failed to get user data:", meData);
        throw new Error("Could not get user information. Please try again.");
      }

      console.log("[User Feedback] User data:", { id: meData.id, email: meData.email });

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

      // CRITICAL: Always set trip_id if we have a request_id
      if (requestId) {
        feedbackData.trip_id = requestId;
        console.log("[User Feedback] Setting trip_id:", requestId);
      }

      console.log("[User Feedback] Sending feedback data:", feedbackData);

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackData),
      });

      const result = await res.json();
      console.log("[User Feedback] API response:", result);

      if (result.ok) {
        submitSuccess = true;
        setSuccessId(result.data?.id || `FB-${Date.now()}`);
        
        // Clear form on success
        setForm((f) => ({
          ...f,
          category: "",
          rating: 0,
          subject: "",
          message: "",
          attachment: null,
        }));
        
        // If locked, refresh lock status to unlock UI
        if (isLocked) {
          console.log("[User Feedback] Feedback submitted for locked trip, redirecting...");
          // Determine redirect URL based on user role
          let redirectUrl = "/user";
          if (meData.is_president) redirectUrl = "/president/dashboard";
          else if (meData.is_vp) redirectUrl = "/vp/dashboard";
          else if (meData.is_hr) redirectUrl = "/hr/dashboard";
          else if (meData.is_head) redirectUrl = "/head/dashboard";
          else if (meData.is_exec) redirectUrl = "/exec/dashboard";
          else if (meData.is_comptroller || meData.role === "comptroller") redirectUrl = "/comptroller/inbox";
          else if (meData.role === "admin") redirectUrl = "/admin";
          else if (meData.role === "driver") redirectUrl = "/driver";
          
          console.log("[User Feedback] Redirecting to:", redirectUrl);
          // Give database time to save, then redirect (layout will re-check lock on pathname change)
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 2500);
        }
      } else {
        console.error("[User Feedback] API returned error:", result.error);
        throw new Error(result.error || "Failed to submit feedback");
      }
    } catch (error: any) {
      console.error("[User Feedback] Submit error:", error);
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
            href="/user"
            className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50"
          >
            Back to Dashboard
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
