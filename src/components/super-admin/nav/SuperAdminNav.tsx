// src/components/super-admin/nav/SuperAdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Shield,
  FileText,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/users", label: "User Management", icon: Users },
  { href: "/super-admin/departments", label: "Departments", icon: Building2 },
  { href: "/super-admin/roles", label: "Role Assignments", icon: Shield },
  { href: "/super-admin/head-requests", label: "Head Requests", icon: UserCheck, showBadge: true },
  { href: "/super-admin/audit", label: "Audit Logs", icon: FileText },
  { href: "/super-admin/analytics", label: "System Analytics", icon: BarChart3 },
  { href: "/super-admin/settings", label: "System Settings", icon: Settings },
];

export default function SuperAdminNav() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Fetch pending count
    const fetchPendingCount = async () => {
      try {
        const response = await fetch("/api/head-role-requests?status=pending");
        const result = await response.json();
        if (result.ok && Array.isArray(result.data)) {
          setPendingCount(result.data.length);
        }
      } catch (error) {
        console.error("Failed to fetch pending count:", error);
      }
    };

    fetchPendingCount();

    // Set up real-time subscription
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel("head-role-requests-nav-count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "head_role_requests",
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        // Fix: Only highlight exact match for dashboard, otherwise check if pathname starts with href
        const isActive = item.href === "/super-admin" 
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        const Icon = item.icon;
        const showBadge = item.showBadge && pendingCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative group
              ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }
            `}
          >
            <div className="relative flex-shrink-0">
              <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-gray-500"}`} />
              {showBadge && (
                <span className={`
                  absolute -right-0.5 -top-0.5
                  min-w-[16px] h-4 px-1 rounded-full
                  flex items-center justify-center
                  text-[10px] font-semibold leading-none
                  transition-all duration-200
                  ${isActive 
                    ? "bg-white/95 text-purple-600 ring-1 ring-purple-700/30 shadow-sm" 
                    : "bg-gradient-to-br from-red-500 to-red-600 text-white ring-2 ring-white shadow-sm"
                  }
                `}>
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </div>
            <span className="font-medium flex-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

