// src/app/(protected)/super-admin/analytics/page.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  DollarSign,
  Building2,
  TrendingUp,
  CheckCircle,
  XCircle,
  Activity,
  Shield,
  BarChart3,
  Calendar,
  Clock,
} from "lucide-react";
import { cardVariants, staggerContainer } from "@/lib/animations";
import { Skeleton, SkeletonCard } from "@/components/common/ui/Skeleton";

type SystemStats = {
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  requests: {
    total: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: Record<string, number>;
    dailyTrends: Array<{ date: string; count: number }>;
  };
  budget: {
    totalYTD: number;
    thisMonth: number;
    averagePerRequest: number;
  };
  departments: {
    total: number;
  };
  approvals: {
    thisMonth: number;
    rejectionsThisMonth: number;
    approvalRate: number;
  };
  activity: {
    totalAuditLogs: number;
    auditLogsThisWeek: number;
  };
  roles: {
    totalGrants: number;
    activeGrants: number;
  };
};

export default function SuperAdminAnalyticsPage() {
  const [stats, setStats] = React.useState<SystemStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/super-admin/stats/system");
      const json = await res.json();
      if (json.ok) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch system stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-sm text-red-800">Failed to load system analytics</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats.users.total,
      subtitle: `${stats.users.active} active`,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      href: "/super-admin/users",
    },
    {
      title: "Total Requests",
      value: stats.requests.total,
      subtitle: `${stats.requests.thisMonth} this month`,
      icon: FileText,
      color: "from-purple-500 to-purple-600",
      href: "/admin/requests",
    },
    {
      title: "Budget (YTD)",
      value: `₱${(stats.budget.totalYTD / 1000000).toFixed(2)}M`,
      subtitle: `₱${(stats.budget.thisMonth / 1000).toFixed(0)}K this month`,
      icon: DollarSign,
      color: "from-green-500 to-green-600",
      href: "/super-admin/analytics",
    },
    {
      title: "Departments",
      value: stats.departments.total,
      subtitle: "Active departments",
      icon: Building2,
      color: "from-orange-500 to-orange-600",
      href: "/super-admin/departments",
    },
    {
      title: "Approval Rate",
      value: `${stats.approvals.approvalRate.toFixed(1)}%`,
      subtitle: `${stats.approvals.thisMonth} approved this month`,
      icon: CheckCircle,
      color: "from-emerald-500 to-emerald-600",
      href: "/super-admin/analytics",
    },
    {
      title: "Audit Logs",
      value: stats.activity.totalAuditLogs,
      subtitle: `${stats.activity.auditLogsThisWeek} this week`,
      icon: Activity,
      color: "from-indigo-500 to-indigo-600",
      href: "/super-admin/audit",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-purple-600" />
          System Analytics
        </h1>
        <p className="mt-2 text-gray-600">Comprehensive system-wide insights and statistics</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              variants={cardVariants}
              className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
              <div className="text-sm text-gray-600 mb-2">{card.title}</div>
              <div className="text-xs text-gray-500">{card.subtitle}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Role */}
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-xl p-6 border-2 border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            Users by Role
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.users.byRole).map(([role, count]) => (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">{role}</span>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Requests by Status */}
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-xl p-6 border-2 border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Requests by Status
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.requests.byStatus)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status.replace(/_/g, " ")}
                  </span>
                  <span className="text-lg font-bold text-gray-900">{count}</span>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Daily Request Trends */}
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-xl p-6 border-2 border-gray-200 lg:col-span-2"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Request Trends (Last 7 Days)
          </h2>
          <div className="flex items-end gap-2 h-48">
            {stats.requests.dailyTrends.map((day, index) => {
              const maxCount = Math.max(...stats.requests.dailyTrends.map((d) => d.count), 1);
              const height = (day.count / maxCount) * 100;
              const date = new Date(day.date);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full h-40 bg-gray-100 rounded-t-lg overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="absolute bottom-0 w-full bg-gradient-to-t from-purple-500 to-purple-600 rounded-t-lg"
                    />
                    <div className="absolute inset-0 flex items-end justify-center pb-2">
                      <span className="text-xs font-bold text-white">{day.count}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 text-center">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Approval Statistics */}
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-xl p-6 border-2 border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Approval Statistics
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Approved</span>
              </div>
              <span className="text-xl font-bold text-green-700">{stats.approvals.thisMonth}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Rejected</span>
              </div>
              <span className="text-xl font-bold text-red-700">{stats.approvals.rejectionsThisMonth}</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Approval Rate</span>
                <span className="text-2xl font-bold text-purple-600">
                  {stats.approvals.approvalRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Role Grants */}
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-xl p-6 border-2 border-gray-200"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Role Management
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Total Role Grants</span>
              <span className="text-xl font-bold text-purple-700">{stats.roles.totalGrants}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Active Grants</span>
              <span className="text-xl font-bold text-green-700">{stats.roles.activeGrants}</span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Revoked</span>
                <span className="text-lg font-bold text-gray-700">
                  {stats.roles.totalGrants - stats.roles.activeGrants}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}


