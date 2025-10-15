// src/app/(protected)/admin/feedback/page.tsx
"use client";
import * as React from "react";
import { useFeedback } from "@/components/admin/feedback/logic/useFeedback";
import { FeedbackRepo } from "@/lib/admin/feedback/store";
import FeedbackTable from "@/components/admin/feedback/ui/FeedbackTable.ui";
import FeedbackForm from "@/components/admin/feedback/ui/FeedbackForm.ui";
import type { Feedback } from "@/lib/admin/feedback/types";

export default function FeedbackPage() {
  const { rows, refresh } = useFeedback();
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<Feedback | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Feedback</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded bg-[#7A0010] px-4 py-2 text-white"
        >
          Add Feedback
        </button>
      </div>
      <FeedbackTable
        rows={rows}
        onView={(f) => setView(f)}
        onDelete={(ids) => {
          FeedbackRepo.removeMany(ids);
          refresh();
        }}
      />
      <FeedbackForm
        open={open}
        onClose={() => setOpen(false)}
        onSave={(data) => {
          FeedbackRepo.create(data);
          refresh();
        }}
      />
      {view && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40"
          onClick={() => setView(null)}
        >
          <div
            className="max-w-md rounded bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Feedback details</h2>
            <p className="mt-2 text-sm">
              <strong>User:</strong> {view.user}
            </p>
            <p className="mt-1 text-sm">{view.message}</p>
            <button
              className="mt-4 rounded bg-[#7A0010] px-3 py-1 text-white"
              onClick={() => setView(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
