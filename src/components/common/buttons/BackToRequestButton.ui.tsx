"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function BackToRequestButton() {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        href="/user/request"
        className="group inline-flex items-center gap-2.5 rounded-xl border-2 border-[#7A0010]/20 bg-gradient-to-r from-white to-[#7A0010]/5 px-4 py-2.5 text-sm font-semibold text-[#7A0010] shadow-md transition-all duration-200 hover:border-[#7A0010]/40 hover:from-[#7A0010]/10 hover:to-[#7A0010]/15 hover:shadow-lg"
      >
        <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2.5} />
        <span>Back to Request</span>
        <FileText className="h-3.5 w-3.5 opacity-60" strokeWidth={2.5} />
      </Link>
    </motion.div>
  );
}
