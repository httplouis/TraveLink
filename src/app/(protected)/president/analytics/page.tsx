"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

export default function PresidentAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Strategic Analytics</h1>
        <p className="text-gray-600 mt-1">
          University-wide performance metrics
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Strategic Analytics Coming Soon
        </h3>
        <p className="text-gray-600">
          Comprehensive university-wide analytics and trends
        </p>
      </div>
    </div>
  );
}
