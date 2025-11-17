// src/app/feedback/anonymous/page.tsx
/**
 * Anonymous Feedback Page
 * Accessible via QR code link for students to provide feedback without authentication
 */

"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Star, MessageSquare, AlertCircle } from "lucide-react";

type FormData = {
  rating: number;
  message: string;
  category: string;
};

export default function AnonymousFeedbackPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const requestId = searchParams.get("request");
  
  const [form, setForm] = React.useState<FormData>({
    rating: 0,
    message: "",
    category: "general",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.message.trim()) {
      setError("Please provide your feedback message");
      return;
    }

    if (form.rating === 0) {
      setError("Please provide a rating");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: form.category,
          rating: form.rating,
          subject: "Anonymous Feedback",
          message: form.message,
          anonymous: true,
          trip_id: requestId || null,
          token: token || null, // Include token for validation
        }),
      });

      const result = await res.json();

      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error || "Failed to submit feedback");
      }
    } catch (err: any) {
      console.error("[Anonymous Feedback] Submit error:", err);
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your feedback has been submitted successfully. We appreciate your input!
          </p>
          <div className="text-sm text-gray-500">
            This page can now be closed.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#7A0010] to-[#9c2a3a] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Trip Feedback</h1>
          <p className="text-sm text-gray-600">
            Share your experience anonymously. Your feedback helps us improve!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating <span className="text-red-600">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({ ...form, rating: star })}
                  className={`p-2 rounded-lg transition-all ${
                    form.rating >= star
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      form.rating >= star ? "fill-current" : ""
                    }`}
                  />
                </button>
              ))}
            </div>
            {form.rating > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {form.rating === 5 && "Excellent"}
                {form.rating === 4 && "Good"}
                {form.rating === 3 && "Average"}
                {form.rating === 2 && "Below Average"}
                {form.rating === 1 && "Poor"}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            >
              <option value="general">General Feedback</option>
              <option value="vehicle">Vehicle Experience</option>
              <option value="driver">Driver Service</option>
              <option value="safety">Safety</option>
              <option value="comfort">Comfort</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Feedback <span className="text-red-600">*</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us about your experience..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Your feedback is anonymous and will help us improve our services.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !form.message.trim() || form.rating === 0}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 font-semibold"
          >
            {submitting ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5" />
                Submit Feedback
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            🔒 Your feedback is completely anonymous. No personal information is collected.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

