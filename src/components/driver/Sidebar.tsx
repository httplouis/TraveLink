"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutGrid, User2, Settings as Cog } from "lucide-react";
import SidebarView, { type NavItem, type NavLink } from "@/components/driver/SidebarView";

function scoreMatch(pathname: string, href: string) {
  const a = (pathname || "/").replace(/\/+$/, "");
  const b = href.replace(/\/+$/, "");
  if (a === b) return b.length;
  if (a.startsWith(b + "/")) return b.length;
  return -1;
}

export default function Sidebar() {
  const pathname = usePathname() || "/";

  const topLinks: NavLink[] = [
    { kind: "link", href: "/driver",          label: "Dashboard", icon: <LayoutGrid className="h-4 w-4" /> },
    { kind: "link", href: "/driver/schedule", label: "Schedule",  icon: <CalendarDays className="h-4 w-4" /> },
    { kind: "link", href: "/driver/profile",  label: "Profile",   icon: <User2 className="h-4 w-4" /> },
    { kind: "link", href: "/driver/settings", label: "Settings",  icon: <Cog className="h-4 w-4" /> },
  ];

  const activeHref = useMemo(
    () =>
      topLinks.reduce(
        (best, it) => {
          const s = scoreMatch(pathname, it.href);
          return s > best.score ? { href: it.href, score: s } : best;
        },
        { href: "", score: -1 }
      ).href,
    [pathname]
  );

  const items: NavItem[] = topLinks.map((l) => ({ ...l, active: l.href === activeHref }));

  return <SidebarView items={items} />;
}
