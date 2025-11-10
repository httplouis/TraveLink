"use client";

import React from "react";
import { Settings, Bell, Lock, User } from "lucide-react";

export default function ComptrollerSettingsPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Account</h2>
          </div>
          <p className="text-gray-600 text-sm">Manage your profile information and password</p>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          </div>
          <p className="text-gray-600 text-sm">Configure notification preferences</p>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Security</h2>
          </div>
          <p className="text-gray-600 text-sm">Manage security and privacy settings</p>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
          </div>
          <p className="text-gray-600 text-sm">Customize your experience</p>
        </div>
      </div>
    </div>
  );
}
