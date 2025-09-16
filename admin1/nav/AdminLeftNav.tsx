// src/components/nav/AdminLeftNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, ClipboardList, CalendarDays, Users, BusFront,
  Wrench, MapPin, History, PieChart, Settings,
} from "lucide-react";

type Item = { label: string; href: string; icon: React.ElementType; badge?: number | string };

const ITEMS: Item[] = [
  { label: "Dashboard", href: "/admin", icon: Home },
  { label: "Requests", href: "/admin/requests", icon: ClipboardList, badge: 3 },
  { label: "Schedule", href: "/admin/schedule", icon: CalendarDays },
  { label: "Drivers", href: "/admin/profile?tab=drivers", icon: Users },
  { label: "Vehicles", href: "/admin/profile?tab=vehicles", icon: BusFront },
  { label: "Maintenance", href: "/admin/maintenance", icon: Wrench },
  { label: "Track", href: "/admin/track", icon: MapPin },
  { label: "History", href: "/admin/history", icon: History },
  { label: "Reports", href: "/admin/profile?tab=reports", icon: PieChart },
  { label: "Settings", href: "/admin/profile?tab=settings", icon: Settings },
];

export default function AdminLeftNav() {
  const pathname = usePathname();

  return (
    <nav className="p-3">
      <div className="px-2 pb-2 text-xs font-medium uppercase text-neutral-500">TraviLink</div>
      <ul className="space-y-1">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={[
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  active ? "bg-rose-50 text-rose-800 font-medium" : "text-neutral-700 hover:bg-neutral-50",
                ].join(" ")}
              >
                <Icon className={["h-4 w-4", active ? "text-rose-700" : "text-neutral-500 group-hover:text-neutral-700"].join(" ")} />
                <span className="flex-1 truncate">{it.label}</span>
                {it.badge ? (
                  <span className={["ml-auto rounded-full px-2 py-0.5 text-[10px]", active ? "bg-rose-100 text-rose-800" : "bg-neutral-100 text-neutral-700"].join(" ")}>
                    {it.badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 border-t px-2 pt-3 text-xs text-neutral-500">v1.0 · © MSEUF</div>
    </nav>
  );
}
