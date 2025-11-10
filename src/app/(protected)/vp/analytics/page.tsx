"use client";

import React from "react";
import { BarChart3 } from "lucide-react";

export default function VPAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">VP Analytics</h1>
        <p className="text-gray-600 mt-1">
          Performance metrics and insights
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Analytics Dashboard Coming Soon
        </h3>
        <p className="text-gray-600">
          Advanced analytics and reporting features will be available here
        </p>
      </div>
    </div>
  );
}
