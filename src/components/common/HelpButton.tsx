// src/components/common/HelpButton.tsx
"use client";

import * as React from "react";
import { HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import HelpManual from "./HelpManual";

type RoleType = "user" | "head" | "admin" | "hr" | "comptroller" | "vp" | "president" | "driver" | "exec";

interface HelpButtonProps {
  role?: RoleType;
}

export default function HelpButton({ role = "user" }: HelpButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Floating Help Button - positioned outside sidebar (260px + 24px margin) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-[284px] z-50 p-3 bg-white border-2 border-gray-200 rounded-full shadow-lg hover:shadow-xl hover:border-[#7a0019] transition-all group"
        title="Help & User Manual"
        aria-label="Open Help Manual"
      >
        <HelpCircle className="h-6 w-6 text-gray-600 group-hover:text-[#7a0019] transition-colors" />
      </motion.button>

      {/* Help Manual Modal */}
      <HelpManual
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        role={role}
      />
    </>
  );
}
