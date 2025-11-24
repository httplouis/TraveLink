// src/app/(protected)/admin/settings/page.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Database, Mail, Phone, Globe, Save } from "lucide-react";
import { useToast } from "@/components/common/ui/ToastProvider.ui";

export default function AdminSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState({
    notifications: {
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: false,
    },
    system: {
      autoApproveThreshold: 5000,
      requireJustificationAbove: 10000,
      defaultDriverAllowance: 1000,
    },
    maintenance: {
      oilChangeInterval: 5000,
      ltoReminderDays: 30,
      insuranceReminderDays: 30,
    },
    display: {
      itemsPerPage: 20,
      showAdvancedOptions: false,
    },
  });

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.data) {
          setSettings({ ...settings, ...data.data });
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.ok) {
        toast.success("Settings saved", "Your settings have been updated successfully.");
      } else {
        toast.error("Failed to save", data.error || "An error occurred while saving settings.");
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast.error("Error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-5 w-5" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      {/* Notification Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-blue-600 p-2">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-semibold text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications via email</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.emailEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, emailEnabled: e.target.checked },
                })
              }
              className="w-5 h-5 rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
            />
          </label>
          <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-600" />
              <div>
                <p className="font-semibold text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-600">Receive notifications via SMS</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.smsEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  notifications: { ...settings.notifications, smsEnabled: e.target.checked },
                })
              }
              className="w-5 h-5 rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
            />
          </label>
        </div>
      </motion.div>

      {/* System Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-purple-600 p-2">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Auto-approve Threshold (₱)
            </label>
            <input
              type="number"
              value={settings.system.autoApproveThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  system: { ...settings.system, autoApproveThreshold: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Requests below this amount may be auto-approved</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Require Justification Above (₱)
            </label>
            <input
              type="number"
              value={settings.system.requireJustificationAbove}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  system: { ...settings.system, requireJustificationAbove: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Requests above this amount require detailed justification</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Default Driver Allowance (₱)
            </label>
            <input
              type="number"
              value={settings.system.defaultDriverAllowance}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  system: { ...settings.system, defaultDriverAllowance: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Default driver allowance for institutional vehicles</p>
          </div>
        </div>
      </motion.div>

      {/* Maintenance Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-emerald-600 p-2">
            <Database className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Maintenance Settings</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Oil Change Interval (km)
            </label>
            <input
              type="number"
              value={settings.maintenance.oilChangeInterval}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenance: { ...settings.maintenance, oilChangeInterval: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              LTO Renewal Reminder (days before expiry)
            </label>
            <input
              type="number"
              value={settings.maintenance.ltoReminderDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenance: { ...settings.maintenance, ltoReminderDays: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Insurance Renewal Reminder (days before expiry)
            </label>
            <input
              type="number"
              value={settings.maintenance.insuranceReminderDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maintenance: { ...settings.maintenance, insuranceReminderDays: parseInt(e.target.value) || 0 },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Display Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-amber-600 p-2">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Display Settings</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Items Per Page
            </label>
            <select
              value={settings.display.itemsPerPage}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  display: { ...settings.display, itemsPerPage: parseInt(e.target.value) || 20 },
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010] focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <label className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-semibold text-gray-900">Show Advanced Options</p>
              <p className="text-sm text-gray-600">Display advanced configuration options</p>
            </div>
            <input
              type="checkbox"
              checked={settings.display.showAdvancedOptions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  display: { ...settings.display, showAdvancedOptions: e.target.checked },
                })
              }
              className="w-5 h-5 rounded border-gray-300 text-[#7A0010] focus:ring-[#7A0010]"
            />
          </label>
        </div>
      </motion.div>
    </div>
  );
}

