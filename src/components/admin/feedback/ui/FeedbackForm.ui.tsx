// src/components/admin/feedback/ui/FeedbackForm.ui.tsx
"use client";
import * as React from "react";
import type { Feedback } from "@/lib/admin/feedback/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Feedback, "id" | "createdAt">) => void;
};

export default function FeedbackForm({ open, onClose, onSave }: Props) {
  const [user, setUser] = React.useState("");
  const [message, setMessage] = React.useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-lg font-semibold">New Feedback</h2>
        <input
          className="mb-2 w-full rounded border p-2"
          placeholder="User"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <textarea
          className="mb-2 w-full rounded border p-2"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="rounded border px-3 py-1">
            Cancel
          </button>
          <button
            onClick={() => {
              if (user && message) {
                onSave({ user, message, status: "NEW" });
                setUser("");
                setMessage("");
                onClose();
              }
            }}
            className="rounded bg-[#7A0010] px-3 py-1 text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
