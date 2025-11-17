"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import HeadDashboardContainer from "@/components/head/dashboard/Dashboard.container";
import { cardVariants } from "@/lib/animations";

export default function HeadDashboardPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Head Dashboard</h1>
          <p className="text-gray-600 mt-1">Department management and request endorsements</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium shadow-lg">
          <Users className="h-4 w-4" />
          Department Head
        </div>
      </motion.div>
      
      <HeadDashboardContainer />
    </div>
  );
}
