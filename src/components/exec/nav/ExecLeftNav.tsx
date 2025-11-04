"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, Settings } from "lucide-react";

type NavItem = { href: string; label: string; Icon: React.ComponentType<any> };

const NAV_ITEMS: NavItem[] = [
  { href: "/exec/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/exec/inbox", label: "Executive review", Icon: FileText },
  { href: "/exec/profile", label: "Profile", Icon: Users },
  { href: "/exec/settings", label: "Settings", Icon: Settings },
];

export default function ExecLeftNav() {
  const pathname = usePathname() || "";

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/exec/dashboard" && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? "bg-[#7a0019] text-white" : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <item.Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
