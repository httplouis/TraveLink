"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LeftNav() {
  const pathname = usePathname();
  const items = [
    { label: "Dashboard", href: "/admin" },
    { label: "Requests", href: "/admin/requests" },
    { label: "Schedule", href: "/admin/schedule" },
    { label: "Profile", href: "/admin/profile" },
    { label: "Maintenance", href: "/admin/maintenance" },
    { label: "Track", href: "/admin/track" },
    { label: "History", href: "/admin/history" },
    { label: "Settings", href: "/admin/settings" },
  ];
  const isActive = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <aside className="hidden md:block md:col-span-2 xl:col-span-2 h-full">
      <div className="rounded-lg border border-neutral-200 bg-gradient-to-b from-white to-neutral-50 p-3 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-[#7A0010] text-white grid place-items-center text-sm font-bold">TL</div>
          <span className="font-semibold">TraviLink</span>
        </div>

        <nav className="text-sm space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-md px-2 py-2 transition-all will-change-transform ${
                isActive(item.href)
                  ? "bg-[#7A0010]/8 text-[#7A0010] ring-1 ring-[#7A0010]/15 shadow-sm"
                  : "hover:bg-neutral-50 hover:-translate-y-0.5 hover:shadow-sm text-neutral-800"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-neutral-300 group-hover:text-neutral-400">›</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
