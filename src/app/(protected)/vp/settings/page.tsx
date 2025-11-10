"use client";

import React from "react";
import { Settings } from "lucide-react";

export default function VPSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">VP Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure your preferences
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Settings Panel Coming Soon
        </h3>
        <p className="text-gray-600">
          Customize notifications, display preferences, and more
        </p>
      </div>
    </div>
  );
}
