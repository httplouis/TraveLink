"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Users,
  Truck,
  Wrench,
  MapPin,
  History,
  FileBarChart,
  Settings,
  MessageSquare,
  UserCog,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<any>;
  section?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, section: "CORE" },
  { href: "/admin/requests", label: "Requests", Icon: FileText, section: "CORE" },
  
  { href: "/admin/schedule", label: "Schedule", Icon: CalendarDays, section: "MANAGEMENT" },
  { href: "/admin/drivers", label: "Drivers", Icon: Users, section: "MANAGEMENT" },
  { href: "/admin/vehicles", label: "Vehicles", Icon: Truck, section: "MANAGEMENT" },
  { href: "/admin/maintenance", label: "Maintenance", Icon: Wrench, section: "MANAGEMENT" },
  { href: "/admin/users", label: "User Management", Icon: UserCog, section: "MANAGEMENT" },
  
  { href: "/admin/track", label: "Track / Live", Icon: MapPin, section: "MONITORING" },
  { href: "/admin/history", label: "History", Icon: History, section: "MONITORING" },
  
  { href: "/admin/report", label: "Reports / Exports", Icon: FileBarChart, section: "ANALYTICS" },
  { href: "/admin/feedback", label: "Feedback", Icon: MessageSquare, section: "COMMUNICATION" },
  { href: "/admin/settings", label: "Settings", Icon: Settings, section: "SYSTEM" },
];

export default function AdminSimpleLeftNav() {
  const pathname = usePathname() || "";

  let currentSection: string | undefined = "";

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
        const showSection = item.section && item.section !== currentSection;
        
        if (showSection) {
          currentSection = item.section;
        }

        return (
          <div key={item.href}>
            {showSection && (
              <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                {item.section}
              </div>
            )}
            <Link
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
          </div>
        );
      })}
    </nav>
  );
}
