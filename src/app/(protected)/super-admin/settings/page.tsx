// src/app/(protected)/super-admin/settings/page.tsx
"use client";

import * as React from "react";
import { Settings } from "lucide-react";

export default function SuperAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-gray-600">Configure system-wide settings</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          System settings page - Coming soon
        </p>
      </div>
    </div>
  );
}

