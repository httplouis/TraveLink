// src/app/(protected)/comptroller/dashboard/page.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import ActivityHistory from "@/components/common/ActivityHistory";
import BudgetOverview from "@/components/common/BudgetOverview";
import PendingAgingIndicator from "@/components/common/PendingAgingIndicator";

type StatCard = {
  title: string;
  value: string | number;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
  color: string;
  bgColor: string;
};

type RecentActivity = {
  id: string;
  requester: string;
  budget: number;
  status: "pending" | "approved" | "rejected";
  time: string;
};

export default function ComptrollerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalBudget: 0,
    changes: {
      approved: "+0% from last month",
      rejected: "+0% from last month",
    }
  });
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([]);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch("/api/comptroller/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch recent activity
      const recentRes = await fetch("/api/comptroller/recent");
      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentActivity(recentData.slice(0, 4)); // Only show 4
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards: StatCard[] = [
    {
      title: "Pending Reviews",
      value: stats.pending,
      change: "+3 from yesterday",
      trend: "up",
      icon: <Clock className="h-6 w-6" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Approved This Month",
      value: stats.approved,
      change: stats.changes.approved,
      trend: stats.changes.approved.startsWith("+") ? "up" : "down",
      icon: <CheckCircle className="h-6 w-6" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Rejected This Month",
      value: stats.rejected,
      change: stats.changes.rejected,
      trend: stats.changes.rejected.startsWith("-") ? "down" : "up",
      icon: <XCircle className="h-6 w-6" />,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Total Budget Reviewed",
      value: `₱${stats.totalBudget.toLocaleString()}`,
      change: "+₱350k this month",
      trend: "up",
      icon: <span className="text-2xl font-bold">₱</span>,
      color: "text-[#7A0010]",
      bgColor: "bg-red-50",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900"
        >
          Dashboard Overview
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-gray-600 mt-2"
        >
          Budget review statistics and activity summary
        </motion.p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-3">{card.value}</p>
                <div className="flex items-center gap-1 text-sm">
                  {card.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={card.trend === "up" ? "text-green-600" : "text-red-600"}>
                    {card.change}
                  </span>
                </div>
              </div>
              <div className={`h-14 w-14 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}>
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Budget Overview & Pending Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <BudgetOverview />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45 }}
        >
          <PendingAgingIndicator role="comptroller" maxItems={5} />
        </motion.div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-[#7A0010] to-[#5A0010] rounded-2xl shadow-xl p-6 text-white"
        >
          <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/comptroller/inbox")}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl p-4 transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Review Budgets</div>
                  <div className="text-xs text-white/70">{stats.pending} pending reviews</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push("/comptroller/history")}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl p-4 transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5" />
                <div>
                  <div className="font-semibold">View History</div>
                  <div className="text-xs text-white/70">Past decisions</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => router.push("/comptroller/reports")}
              className="w-full bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl p-4 transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" />
                <div>
                  <div className="font-semibold">View Reports</div>
                  <div className="text-xs text-white/70">Analytics & exports</div>
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => router.push("/comptroller/inbox")}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-gray-900">{item.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.status === "approved" ? "bg-green-100 text-green-700" :
                      item.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {item.status === "approved" ? "Approved" : item.status === "rejected" ? "Rejected" : "Pending"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{item.requester}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.time}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#7A0010]">₱{item.budget.toLocaleString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* My Activity History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <ActivityHistory showFilters={true} limit={15} compact={false} />
      </motion.div>
    </div>
  );
}
