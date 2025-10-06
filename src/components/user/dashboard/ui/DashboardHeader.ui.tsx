"use client";

export default function DashboardHeader() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">User Dashboard</h1>
        <p className="text-sm text-neutral-600">See availability, requests, and updates.</p>
      </div>
    </header>
  );
}
