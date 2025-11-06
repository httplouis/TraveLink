// src/app/(protected)/head/layout.tsx
"use client";

import React from "react";
import HeadTopBar from "@/components/head/nav/HeadTopBar";
import HeadLeftNav from "@/components/head/nav/HeadLeftNav";
import PageTitle from "@/components/common/PageTitle";
import "leaflet/dist/leaflet.css";

export default function HeadLayout({ children }: { children: React.ReactNode }) {
  const topbarH = "56px";

  return (
    <>
      <PageTitle title="TraviLink | Head" />
      <div
        className="bg-[var(--background)] text-[var(--foreground)]"
        style={{ ["--topbar-h" as any]: topbarH }}
      >
      {/* fixed top bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-[var(--topbar-h)]">
        <HeadTopBar />
      </div>

      {/* app body */}
      <div className="fixed inset-x-0 bottom-0 top-[var(--topbar-h)] grid grid-cols-[260px_minmax(0,1fr)]">
        <aside className="overflow-y-auto border-r border-slate-200 bg-white">
          <div className="p-4">
            <HeadLeftNav />
          </div>
        </aside>

        <main className="overflow-y-auto bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
    </>
  );
}
