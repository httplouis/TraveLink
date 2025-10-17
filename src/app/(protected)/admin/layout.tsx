import "@/app/globals.css";
import "@/app/styles/admin/admin.css";

import type { Metadata } from "next";
import Topbar from "@/components/admin/nav/TopBar";
import AdminLeftNav from "@/components/admin/nav/AdminLeftNav";
import Breadcrumbs from "@/components/admin/nav/Breadcrumbs";

export const metadata: Metadata = {
  title: "TraviLink · Admin",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-role="admin"
      className="flex h-dvh w-full flex-col bg-neutral-50 text-neutral-900"
      style={{ ["--topbar-h" as any]: "56px" }}
    >
      {/* Sticky top bar */}
      <div className="tl-topbar sticky top-0 z-40 h-[var(--topbar-h)] bg-white/95 shadow-sm backdrop-blur">
        <Topbar />
      </div>

      {/* 2-column shell: LeftNav • Main */}
      <div className="tl-shell flex flex-1 overflow-hidden">
        {/* LeftNav rail */}
        <aside className="tl-leftnav shrink-0 overflow-y-auto bg-transparent">
          <AdminLeftNav />
        </aside>

        {/* Main – the only scroller */}
        <main className="tl-main min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <Breadcrumbs className="mb-4" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
