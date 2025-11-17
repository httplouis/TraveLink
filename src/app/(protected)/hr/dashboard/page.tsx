"use client";

import React from "react";
import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import HRDashboardContainer from "@/components/hr/dashboard/Dashboard.container";
import { cardVariants } from "@/lib/animations";

export default function HRDashboardPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <p className="text-gray-600 mt-1">Human resources approval and management</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium shadow-lg">
          <Briefcase className="h-4 w-4" />
          HR Portal
        </div>
      </motion.div>
      
      <HRDashboardContainer />
    </div>
  );
}
