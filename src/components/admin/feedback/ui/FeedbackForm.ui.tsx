// src/components/admin/feedback/ui/FeedbackForm.ui.tsx
"use client";
import * as React from "react";
import type { Feedback } from "@/lib/admin/feedback/types";

type Trip = {
  id: string;
  request_number: string;
  requester_name: string;
  destination: string;
  travel_start_date: string;
  travel_end_date: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Feedback, "id" | "createdAt">) => void;
  trips?: Trip[];
};

export default function FeedbackForm({ open, onClose, onSave, trips = [] }: Props) {
  const [user, setUser] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [selectedTripId, setSelectedTripId] = React.useState<string>("");
  const [rating, setRating] = React.useState<number>(5);

  React.useEffect(() => {
    if (open && trips.length > 0 && !selectedTripId) {
      setSelectedTripId(trips[0].id);
    }
  }, [open, trips, selectedTripId]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-bold text-gray-900">New Feedback</h2>
        
        {trips.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Related Trip (Optional)
            </label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            >
              <option value="">No specific trip</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.request_number} - {trip.destination} ({new Date(trip.travel_start_date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            User Name
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            placeholder="Enter user name"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Rating (1-5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRating(r)}
                className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                  rating === r
                    ? "bg-[#7A0010] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Message
          </label>
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            placeholder="Enter feedback message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <button 
            onClick={onClose} 
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (user && message) {
                onSave({ 
                  user, 
                  message, 
                  rating,
                  status: "NEW",
                  tripId: selectedTripId || undefined
                } as any);
                setUser("");
                setMessage("");
                setSelectedTripId("");
                setRating(5);
                onClose();
              }
            }}
            disabled={!user || !message}
            className="rounded-lg bg-[#7A0010] px-4 py-2 font-medium text-white hover:bg-[#9c2a3a] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
