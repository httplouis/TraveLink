// src/app/(protected)/super-admin/analytics/page.tsx
"use client";

import * as React from "react";
import { BarChart3 } from "lucide-react";

export default function SuperAdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
        <p className="mt-2 text-gray-600">System-wide analytics and insights</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          System analytics page - Coming soon
        </p>
      </div>
    </div>
  );
}

