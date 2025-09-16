"use client";

import dynamic from "next/dynamic";

const SchedulePageClient = dynamic(() => import("./SchedulePageClient"), {
  ssr: false,
  loading: () => <div className="p-4 text-sm text-neutral-500">Loading…</div>,
});

export default function ClientWrapper() {
  return <SchedulePageClient />;
}
