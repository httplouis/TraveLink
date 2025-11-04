"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Users,
  Settings,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<any>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/head/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/head/inbox", label: "Inbox (for approval)", Icon: FileText },
  { href: "/head/schedule", label: "Schedule", Icon: CalendarDays },
  { href: "/head/request", label: "New request", Icon: FileText },
  { href: "/head/request/submissions", label: "Submissions", Icon: Users },
  { href: "/head/settings", label: "Settings", Icon: Settings },
];

export default function HeadLeftNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/head/dashboard" && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
              ${
                isActive
                  ? "bg-[#7a0019] text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }
            `}
          >
            <item.Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
