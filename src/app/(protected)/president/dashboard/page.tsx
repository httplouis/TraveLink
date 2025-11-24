"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import PresidentDashboardContainer from "@/components/president/dashboard/Dashboard.container";
import { cardVariants } from "@/lib/animations";

export default function PresidentDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <motion.div 
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">President Dashboard</h1>
          <p className="text-gray-600 mt-1">University-wide strategic overview</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7a0019] to-[#9a0020] text-white rounded-lg text-sm font-medium shadow-lg">
          <Shield className="h-4 w-4" />
          Final Authority
        </div>
      </motion.div>
      
      <PresidentDashboardContainer />
    </div>
  );
}
