"use client";

import SignatureSettings from "@/components/common/SignatureSettings";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <SignatureSettings />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Account Information
        </h3>
        <p className="text-sm text-slate-600">
          Additional settings coming soon.
        </p>
      </div>
    </div>
  );
}
