"use client";

import Link from "next/link";
import * as React from "react";

export type NavLink = {
  kind: "link";
  href: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
};

export type NavItem = NavLink;

export default function SidebarView({ items }: { items: NavItem[] }) {
  return (
    <aside className="w-full h-full p-3">
      <nav className="space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={[
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
              it.active
                ? "bg-[var(--brand,#7a0019)]/10 text-[var(--brand,#7a0019)] ring-1 ring-[var(--brand,#7a0019)]/20"
                : "text-neutral-700 hover:bg-neutral-100",
            ].join(" ")}
          >
            {it.icon && <span className="shrink-0">{it.icon}</span>}
            <span className="truncate">{it.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
