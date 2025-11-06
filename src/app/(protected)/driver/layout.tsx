"use client";

import React from "react";
import Sidebar from "@/components/driver/Sidebar";              // container (below)
import Topbar from "@/components/driver/Topbar";
import ProfilePanel from "@/components/driver/ProfilePanel";
import MiniCalendar from "@/components/driver/MiniCalendar";
import PageTitle from "@/components/common/PageTitle";
import "@/app/styles/driver/driver.css";

const TOPBAR_H = 64; // adjust if your Topbar is not h-16

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTitle title="TraviLink | Driver" />
      <div data-role="driver" className="min-h-screen bg-[var(--bg)]">
      {/* keep the topbar visible while center scrolls */}
      <div className="sticky top-0 z-40">
        <Topbar title="Driver Transport Portal" />
      </div>

      {/* 3-col grid: [sidebar | main-scroll | right]  */}
      <div
        className="grid gap-0"
        style={{
          gridTemplateColumns: "260px 1fr 360px",
          height: `calc(100vh - ${TOPBAR_H}px)`, // lock height under the topbar
        }}
      >
        {/* LEFT: sidebar — fixed, no scroll */}
        <aside className="border-r border-neutral-200 bg-white">
          <Sidebar />
        </aside>

        {/* MIDDLE: the ONLY scrollable area */}
        <main className="overflow-y-auto p-5">
          <div className="min-w-0">{children}</div>
        </main>

        {/* RIGHT: profile + mini calendar — fixed, no scroll */}
        <aside className="hidden lg:block p-5">
          <div className="space-y-4">
            <div className="tl-profile">
              <ProfilePanel
                role="DRIVER"
                name="Jolo Rosales"
                code="D22-11451"
                faculty="Driver"
                campus="Lucena Campus"
                watermarkSrc="/euwhite.png"
              />
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
                <div className="text-[22px] font-semibold text-neutral-900 leading-none">5</div>
                <div className="mt-1 text-xs text-neutral-500">Active Requests</div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
                <div className="text-[22px] font-semibold text-neutral-900 leading-none">3</div>
                <div className="mt-1 text-xs text-neutral-500">Vehicles Online</div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
                <div className="text-[22px] font-semibold text-neutral-900 leading-none">4</div>
                <div className="mt-1 text-xs text-neutral-500">Pending Approvals</div>
              </div>
            </div>

            <MiniCalendar />
          </div>
        </aside>
      </div>
    </div>
    </>
  );
}
