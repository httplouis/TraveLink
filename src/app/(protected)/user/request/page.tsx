"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, PageBody } from "@/components/common/Page";
import { createTripRequest } from "@/lib/api";
import UserRequestForm, { RequestForm } from "@/components/user/request/Form";
import RequestSummary from "@/components/user/request/Summary";

// simple validator – stays here so design files remain dumb
function validate(form: RequestForm) {
  const e: Partial<Record<keyof RequestForm, string>> = {};
  if (!form.purpose.trim()) e.purpose = "Purpose is required.";
  if (!form.origin.trim()) e.origin = "Origin is required.";
  if (!form.destination.trim()) e.destination = "Destination is required.";
  if (!form.schedule.trim()) e.schedule = "Schedule is required.";
  if (form.passengers !== "" && Number(form.passengers) < 1)
    e.passengers = "At least one passenger is required.";
  return e;
}

export default function UserRequestPage() {
  const [form, setForm] = useState<RequestForm>({
    purpose: "",
    origin: "",
    destination: "",
    schedule: "",
    passengers: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof RequestForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const update = <K extends keyof RequestForm>(key: K, value: RequestForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setSubmitting(true);
    try {
      // 👉 UI → DB mapping (matches your table columns)
      const payload = {
        purpose: form.purpose,
        origin: form.origin,
        destination: form.destination,
        schedule: form.schedule, // single datetime
        start_time: form.schedule || null, // optional mirror
        passengers: form.passengers === "" ? null : Number(form.passengers),
        notes: form.notes || null,
        status: "pending" as const,
      };

      const { id } = await createTripRequest(payload);
      setSubmittedId(id);

      // keep context, clear some fields
      setForm((f) => ({ ...f, purpose: "", notes: "", passengers: "" }));
      setErrors({});
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, purpose: err?.message ?? "Submit failed." }));
    } finally {
      setSubmitting(false);
    }
  };

  const onReset = () => {
    setForm({
      purpose: "",
      origin: "",
      destination: "",
      schedule: "",
      passengers: "",
      notes: "",
    });
    setErrors({});
    setSubmittedId(null);
  };

  return (
    <>
      <PageHeader
        title="New Transport Request"
        description="Fill out the details below to request a vehicle. (Vehicle assignment handled by Admin.)"
        actions={
          <Link href="/user" className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50">
            Back to Dashboard
          </Link>
        }
      />

      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <UserRequestForm
            form={form}
            errors={errors}
            submitting={submitting}
            onChange={update}
            onSubmit={onSubmit}
            onReset={onReset}
          />

          <aside className="space-y-4">
            <RequestSummary form={form} />
            <section className="rounded-lg border bg-white p-4">
              <h3 className="font-medium mb-2">Heads-up</h3>
              <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
                <li>Requests are subject to dispatcher approval.</li>
                <li>Vehicle will be assigned by Admin based on availability.</li>
                <li>
                  Editing is allowed while status is{" "}
                  <span className="font-medium">Pending</span>.
                </li>
              </ul>
              {submittedId && (
                <p className="mt-3 text-sm text-green-700">
                  Request <span className="font-semibold">{submittedId}</span> submitted!
                </p>
              )}
            </section>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
