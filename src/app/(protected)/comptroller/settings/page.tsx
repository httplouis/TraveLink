"use client";

import React, { useState } from "react";
import SignatureSettings from "@/components/common/SignatureSettings";
import AccessibilitySettingsModal from "@/components/common/AccessibilitySettingsModal";
import { Settings as SettingsIcon } from "lucide-react";

export default function ComptrollerSettingsPage() {
  const [showAccessibilityModal, setShowAccessibilityModal] = useState(false);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <SignatureSettings />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Accessibility Settings
            </h3>
            <p className="text-sm text-slate-600">
              Customize display mode, fonts, contrast, and theme for better usability
            </p>
          </div>
          <button
            onClick={() => setShowAccessibilityModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#7A0010] text-white rounded-lg hover:bg-[#8A0010] transition-colors"
          >
            <SettingsIcon className="h-4 w-4" />
            <span>Open Settings</span>
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Access accessibility settings from the Settings menu in the navigation bar.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Account Information
        </h3>
        <p className="text-sm text-slate-600">
          Additional settings coming soon.
        </p>
      </div>

      <AccessibilitySettingsModal 
        isOpen={showAccessibilityModal} 
        onClose={() => setShowAccessibilityModal(false)} 
      />
    </div>
  );
}
