// src/components/super-admin/nav/SuperAdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Shield,
  FileText,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/users", label: "User Management", icon: Users },
  { href: "/super-admin/departments", label: "Departments", icon: Building2 },
  { href: "/super-admin/roles", label: "Role Assignments", icon: Shield },
  { href: "/super-admin/audit", label: "Audit Logs", icon: FileText },
  { href: "/super-admin/analytics", label: "System Analytics", icon: BarChart3 },
  { href: "/super-admin/settings", label: "System Settings", icon: Settings },
];

export default function SuperAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        // Fix: Only highlight exact match for dashboard, otherwise check if pathname starts with href
        const isActive = item.href === "/super-admin" 
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }
            `}
          >
            <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

