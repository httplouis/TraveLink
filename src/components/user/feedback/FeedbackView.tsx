"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MessageSquare,
  Send,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ThumbsUp,
  Car,
  Clock,
  MapPin,
  User,
  Paperclip,
  Shield,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import Stars from "./Stars";

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

const categories = [
  { value: "Overall trip experience", icon: Sparkles, color: "text-purple-500" },
  { value: "Driver behavior & professionalism", icon: User, color: "text-blue-500" },
  { value: "Vehicle condition & comfort", icon: Car, color: "text-green-500" },
  { value: "Schedule / timeliness", icon: Clock, color: "text-orange-500" },
  { value: "Route / destination", icon: MapPin, color: "text-red-500" },
  { value: "Other trip-related concern", icon: HelpCircle, color: "text-gray-500" },
];

export default function FeedbackView({
  category,
  rating,
  subject,
  message,
  anonymous,
  contact,
  attachmentName,
  errors = {},
  submitting = false,
  successId,
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
  // Success state
  if (successId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">
            Your feedback has been submitted successfully.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-green-200 text-sm">
            <span className="text-gray-500">Reference:</span>
            <span className="font-semibold text-green-700">{successId}</span>
          </div>
          <div className="mt-6 p-4 bg-white/50 rounded-xl">
            <p className="text-sm text-gray-600">
              We appreciate you taking the time to share your experience. Your feedback helps us improve our transport services.
            </p>
          </div>
          <button
            onClick={onReset}
            className="mt-6 px-6 py-2.5 bg-[#7a0019] text-white rounded-lg hover:bg-[#9c2a3a] transition-colors font-medium inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Submit Another Feedback
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
      {/* LEFT: FORM */}
      <form onSubmit={onSubmit} className="space-y-6 min-w-0">
        {/* Category Selection */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#7a0019]/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-[#7a0019]" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">What would you like to rate?</h2>
              <p className="text-sm text-gray-500">Select the aspect of your trip</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const isSelected = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => onChangeCategory(cat.value)}
                  className={`p-4 rounded-xl border-2 transition-all text-left group ${
                    isSelected
                      ? "border-[#7a0019] bg-[#7a0019]/5"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <cat.icon className={`h-5 w-5 mb-2 ${isSelected ? "text-[#7a0019]" : cat.color}`} />
                  <p className={`text-sm font-medium ${isSelected ? "text-[#7a0019]" : "text-gray-700"}`}>
                    {cat.value.split(" ")[0]}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                    {cat.value.split(" ").slice(1).join(" ")}
                  </p>
                </button>
              );
            })}
          </div>
          {errors.category && (
            <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              {errors.category}
            </p>
          )}
        </motion.section>

        {/* Rating */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">How was your experience?</h2>
              <p className="text-sm text-gray-500">Rate your overall satisfaction</p>
            </div>
          </div>

          <div className="flex flex-col items-center py-4">
            <Stars value={rating} onChange={onChangeRating} size={"lg" as const} />
            <p className="mt-3 text-sm text-gray-500">
              {rating === 0 && "Tap a star to rate"}
              {rating === 1 && "Very Poor"}
              {rating === 2 && "Poor"}
              {rating === 3 && "Average"}
              {rating === 4 && "Good"}
              {rating === 5 && "Excellent!"}
            </p>
          </div>
        </motion.section>

        {/* Message */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Tell us more</h2>
              <p className="text-sm text-gray-500">Share details about your experience</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7a0019]/20 focus:border-[#7a0019] outline-none text-sm transition-all"
                placeholder="e.g., Driver was very punctual and helpful"
                value={subject}
                onChange={(e) => onChangeSubject(e.target.value)}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#7a0019]/20 focus:border-[#7a0019] outline-none text-sm transition-all resize-none ${
                  errors.message ? "border-red-300 bg-red-50" : "border-gray-200"
                }`}
                placeholder="Describe what happened during the trip. Include details about the driver, vehicle, schedule, or any issues you encountered..."
                value={message}
                onChange={(e) => onChangeMessage(e.target.value)}
              />
              <div className="flex items-center justify-between mt-1.5">
                {errors.message ? (
                  <p className="text-sm text-red-600">{errors.message}</p>
                ) : (
                  <p className="text-xs text-gray-400">Minimum 10 characters</p>
                )}
                <p className={`text-xs ${message.length >= 10 ? "text-green-600" : "text-gray-400"}`}>
                  {message.length} characters
                </p>
              </div>
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Attachment <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  <Paperclip className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {attachmentName || "Click to upload a photo (PNG/JPG, max 2MB)"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Identity */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Your identity</h2>
              <p className="text-sm text-gray-500">Choose how you want to submit</p>
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => onToggleAnonymous(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#7a0019] focus:ring-[#7a0019]"
            />
            <div>
              <p className="font-medium text-gray-900">Submit anonymously</p>
              <p className="text-sm text-gray-500">Your identity will not be shared</p>
            </div>
          </label>

          <AnimatePresence>
            {!anonymous && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contact information <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#7a0019]/20 focus:border-[#7a0019] outline-none text-sm transition-all ${
                    errors.contact ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                  placeholder="Your email or phone number"
                  value={contact}
                  onChange={(e) => onChangeContact(e.target.value)}
                />
                {errors.contact && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.contact}</p>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  We'll contact you if we need more details about your feedback.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Submit */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-[#7a0019] to-[#9c2a3a] text-white rounded-xl hover:shadow-lg transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Form
            </button>
          </div>
        </motion.section>
      </form>

      {/* RIGHT: Tips */}
      <aside className="space-y-4">
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-[#7a0019] to-[#5c0013] text-white rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
              <ThumbsUp className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold">We're listening</h3>
          </div>
          <p className="text-white/90 text-sm leading-relaxed mb-4">
            Your feedback helps improve drivers, vehicles, scheduling, and overall trip coordination.
          </p>
          <ul className="space-y-2">
            {[
              "Mention what went well or wrong",
              "Include driver & vehicle details",
              "Suggest improvements",
            ].map((tip, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-white/80">
                <ChevronRight className="h-4 w-4 text-white/60" />
                {tip}
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
          <div className="space-y-4">
            {[
              { step: 1, title: "We log your feedback", desc: "Your submission is recorded for review" },
              { step: 2, title: "Admin review", desc: "Our team reviews and may reach out" },
              { step: 3, title: "Improvements made", desc: "Changes appear in future updates" },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-[#7a0019]/10 rounded-full flex items-center justify-center text-[#7a0019] font-semibold text-sm">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 rounded-2xl border border-blue-100 p-6"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Need help?</h3>
              <p className="text-sm text-blue-700">
                For urgent concerns, contact the Transport Office directly.
              </p>
            </div>
          </div>
        </motion.section>
      </aside>
    </div>
  );
}
