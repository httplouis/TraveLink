"use client";

import { PageHeader, PageBody } from "@/components/common/Page";
import type { DriverSettings } from "@/app/(protected)/driver/settings/page";

const card = "rounded-2xl bg-white ring-1 ring-neutral-200/70 shadow-sm";
const section = `${card} p-5`;
const label = "text-sm font-medium text-neutral-700";
const input =
  "w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#7a0019]/20 focus:border-[#7a0019]/50";
const help = "text-xs text-neutral-500";

export default function SettingsView({
  formId = "driverSettingsForm",
  settings,
  saving,
  savedAt,
  onChange,
  onSubmit,
}: {
  formId?: string;
  settings: DriverSettings;
  saving: boolean;
  savedAt: string | null;
  onChange: <K extends keyof DriverSettings>(k: K, v: DriverSettings[K]) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Tune how the app behaves for your day-to-day driving."
        actions={
          <button type="submit" form={formId} className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        }
      />

      <PageBody>
        <form id={formId} onSubmit={onSubmit} className="space-y-5 max-w-3xl">
          {/* Notifications */}
          <section className={section}>
            <h2 className="mb-3 font-medium">Notifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.notifyAssignments}
                  onChange={(e) => onChange("notifyAssignments", e.target.checked)}
                />
                New assignments
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.notifyChanges}
                  onChange={(e) => onChange("notifyChanges", e.target.checked)}
                />
                Changes & cancellations
              </label>
              <div>
                <div className={label}>Reminder lead time</div>
                <select
                  className={input}
                  value={settings.reminderMinutes}
                  onChange={(e) => onChange("reminderMinutes", Number(e.target.value) as DriverSettings["reminderMinutes"])}
                >
                  {[5, 10, 15, 30].map((m) => (
                    <option key={m} value={m}>
                      {m} minutes before
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Status & Workday */}
          <section className={section}>
            <h2 className="mb-3 font-medium">Status & Workday</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className={label}>Default status on app open</div>
                <select
                  className={input}
                  value={settings.defaultStatusOnOpen}
                  onChange={(e) => onChange("defaultStatusOnOpen", e.target.value as DriverSettings["defaultStatusOnOpen"])}
                >
                  <option value="Available">Available</option>
                  <option value="Off Duty">Off Duty</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.autoOnTripOnBegin}
                  onChange={(e) => onChange("autoOnTripOnBegin", e.target.checked)}
                />
                Auto-set status to “On Trip” when I tap Begin Trip
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.promptOffDutyEOD}
                  onChange={(e) => onChange("promptOffDutyEOD", e.target.checked)}
                />
                End-of-day prompt to switch to Off Duty
              </label>
            </div>
          </section>

          {/* Location & Privacy */}
          <section className={section}>
            <h2 className="mb-3 font-medium">Location & Privacy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.shareLiveLocation}
                  onChange={(e) => onChange("shareLiveLocation", e.target.checked)}
                />
                Share live location during active trips
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.bgLocationWhileOnTrip}
                  onChange={(e) => onChange("bgLocationWhileOnTrip", e.target.checked)}
                />
                Allow background location while “On Trip”
              </label>
              <div className="md:col-span-2">
                <div className={label}>Who can see my live location</div>
                <select
                  className={input}
                  value={settings.locationVisibility}
                  onChange={(e) =>
                    onChange("locationVisibility", e.target.value as DriverSettings["locationVisibility"])
                  }
                >
                  <option value="dispatcher">Dispatcher only</option>
                  <option value="dispatcher_requester">Dispatcher & Requester</option>
                </select>
                <p className={`${help} mt-1`}>You can change this anytime.</p>
              </div>
            </div>
          </section>

          {/* Display */}
          <section className={section}>
            <h2 className="mb-3 font-medium">App Display</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className={label}>Language</div>
                <select
                  className={input}
                  value={settings.language}
                  onChange={(e) => onChange("language", e.target.value as DriverSettings["language"])}
                >
                  <option value="ph">Filipino</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <div className={label}>Theme</div>
                <select
                  className={input}
                  value={settings.theme}
                  onChange={(e) => onChange("theme", e.target.value as DriverSettings["theme"])}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <div className={label}>Time format</div>
                <select
                  className={input}
                  value={settings.timeFormat}
                  onChange={(e) => onChange("timeFormat", e.target.value as DriverSettings["timeFormat"])}
                >
                  <option value="24h">24-hour</option>
                  <option value="12h">12-hour</option>
                </select>
              </div>
            </div>
            <p className={`${help} mt-2`}>Dates use local timezone by default.</p>
          </section>

          {/* Footer note */}
          <div className="text-xs text-neutral-500 px-1">
            {savedAt ? <>Last saved: {savedAt}</> : <>Not saved yet</>}
          </div>
        </form>
      </PageBody>
    </>
  );
}
