// src/app/(public)/head-endorsements/confirm/success/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function HeadEndorsementSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </motion.div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Endorsement Confirmed!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for endorsing this travel request. The requester has been notified and can now proceed with submission.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#7A0010] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#5a000c] transition-colors"
          >
            Return to Home
          </button>
          
          <button
            onClick={() => {
              if (window.opener) {
                window.close();
              } else {
                router.back();
              }
            }}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

