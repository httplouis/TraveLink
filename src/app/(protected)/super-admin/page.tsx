// src/app/(protected)/super-admin/page.tsx
"use client";

import * as React from "react";
import { Shield, Users, Building2, FileText, TrendingUp, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";
import { SkeletonCard } from "@/components/common/ui/Skeleton";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDepartments: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchStats();

    // Real-time subscriptions for stats
    const supabase = createSupabaseClient();
    
    const usersChannel = supabase
      .channel("super-admin-dashboard-users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        () => fetchStats()
      )
      .subscribe();

    const deptsChannel = supabase
      .channel("super-admin-dashboard-departments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "departments" },
        () => fetchStats()
      )
      .subscribe();

    const requestsChannel = supabase
      .channel("super-admin-dashboard-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(deptsChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch stats from API
      const [usersRes, deptsRes, requestsRes] = await Promise.all([
        fetch("/api/super-admin/stats/users"),
        fetch("/api/super-admin/stats/departments"),
        fetch("/api/super-admin/stats/requests"),
      ]);

      const [usersData, deptsData, requestsData] = await Promise.all([
        usersRes.json(),
        deptsRes.json(),
        requestsRes.json(),
      ]);

      if (!usersRes.ok || !usersData.ok) {
        console.error("[SuperAdminDashboard] Users stats error:", usersData.error);
      }
      if (!deptsRes.ok || !deptsData.ok) {
        console.error("[SuperAdminDashboard] Departments stats error:", deptsData.error);
      }
      if (!requestsRes.ok || !requestsData.ok) {
        console.error("[SuperAdminDashboard] Requests stats error:", requestsData.error);
      }

      setStats({
        totalUsers: usersData.ok ? (usersData.total || 0) : 0,
        activeUsers: usersData.ok ? (usersData.active || 0) : 0,
        totalDepartments: deptsData.ok ? (deptsData.total || 0) : 0,
        pendingRequests: requestsData.ok ? (requestsData.pending || 0) : 0,
      });
    } catch (error: any) {
      console.error("[SuperAdminDashboard] Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      href: "/super-admin/users",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: Users,
      color: "from-green-500 to-green-600",
      href: "/super-admin/users",
    },
    {
      title: "Departments",
      value: stats.totalDepartments,
      icon: Building2,
      color: "from-purple-500 to-purple-600",
      href: "/super-admin/departments",
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: FileText,
      color: "from-orange-500 to-orange-600",
      href: "/admin/requests",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          System-wide administration and user management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => router.push(card.href)}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
              <div className="text-sm text-gray-600">{card.title}</div>
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-purple-600" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/super-admin/users")}
            className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
          >
            <div className="font-semibold text-gray-900 mb-1">Manage Users</div>
            <div className="text-sm text-gray-600">Assign roles and permissions</div>
          </button>
          <button
            onClick={() => router.push("/super-admin/departments")}
            className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
          >
            <div className="font-semibold text-gray-900 mb-1">Manage Departments</div>
            <div className="text-sm text-gray-600">Create and configure departments</div>
          </button>
          <button
            onClick={() => router.push("/super-admin/roles")}
            className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left"
          >
            <div className="font-semibold text-gray-900 mb-1">Role Assignments</div>
            <div className="text-sm text-gray-600">View and manage role grants</div>
          </button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-blue-900 mb-1">Super Admin Portal</div>
          <div className="text-sm text-blue-800">
            This portal is separate from the Transport Admin portal. Use this to manage system-wide settings,
            user roles, and departments. For vehicle and schedule management, use the{" "}
            <button
              onClick={() => router.push("/admin")}
              className="underline font-medium hover:text-blue-900"
            >
              Transport Admin portal
            </button>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

