// src/app/(public)/requesters/confirm/success/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft, X, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function RequesterConfirmationSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden"
      >
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full -mr-16 -mt-16 opacity-20" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full -ml-12 -mb-12 opacity-20" />

        <div className="relative z-10">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
            className="mb-6"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-900 mb-3"
          >
            Confirmation Successful!
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6 leading-relaxed"
          >
            Your participation has been confirmed. The requester will be notified.
          </motion.p>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                <X className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  You can safely close this page
                </p>
                <p className="text-xs text-blue-700">
                  Your response has been saved. You will receive updates about this request via email.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3"
          >
            <button
              onClick={() => router.push("/")}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#7A0010] text-white hover:bg-[#5e000d] transition-all font-medium shadow-lg hover:shadow-xl"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Home
            </button>
            <button
              onClick={() => window.close()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all font-medium"
            >
              <LogOut className="h-4 w-4" />
              Close This Page
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

