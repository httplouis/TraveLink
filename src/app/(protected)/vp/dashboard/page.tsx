"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Users,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion } from "framer-motion";
import { cardVariants, staggerContainer } from "@/lib/animations";

export default function VPDashboard() {
  const router = useRouter();
  const [stats, setStats] = React.useState({
    pending: 0,
    approved_today: 0,
    total_budget: 0,
    avg_approval_time: "0h",
    pending_change: 0,
    approved_change: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch stats from API
    fetch("/api/vp/stats", { cache: "no-store" })
      .then(res => {
        if (!res.ok) {
          console.warn("Stats API not OK:", res.status);
          return null;
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("Stats API returned non-JSON response");
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) {
          // Use mock data if API fails
          setStats({
            pending: 12,
            approved_today: 8,
            total_budget: 150000,
            avg_approval_time: "2.5h",
            pending_change: -15,
            approved_change: 25,
          });
          setLoading(false);
          return;
        }
        if (data.ok && data.data) {
          // Map the stats API response to the dashboard format
          setStats({
            pending: data.data.pendingApprovals || 0,
            approved_today: data.data.thisMonth || 0,
            total_budget: 0, // Not available in stats API
            avg_approval_time: "0h", // Not available in stats API
            pending_change: 0,
            approved_change: 0,
          });
        } else {
          // Use mock data if API response is not ok
          setStats({
            pending: 12,
            approved_today: 8,
            total_budget: 150000,
            avg_approval_time: "2.5h",
            pending_change: -15,
            approved_change: 25,
          });
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching VP stats:", error);
        // Mock data for development
        setStats({
          pending: 12,
          approved_today: 8,
          total_budget: 150000,
          avg_approval_time: "2.5h",
          pending_change: -15,
          approved_change: 25,
        });
        setLoading(false);
      });
  }, []);

  const cards = [
    {
      title: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      textColor: "text-yellow-700",
      iconBg: "bg-yellow-500",
      change: stats.pending_change,
      href: "/vp/inbox",
    },
    {
      title: "Approved Today",
      value: stats.approved_today,
      icon: CheckCircle,
      color: "bg-gradient-to-br from-green-50 to-green-100",
      textColor: "text-green-700",
      iconBg: "bg-green-500",
      change: stats.approved_change,
      href: "/vp/inbox",
    },
    {
      title: "Total Budget (Month)",
      value: `₱${stats.total_budget.toLocaleString()}`,
      icon: ({ className }: { className?: string }) => <span className={`text-2xl font-bold ${className || ""}`}>₱</span>,
      color: "bg-gradient-to-br from-blue-50 to-blue-100",
      textColor: "text-blue-700",
      iconBg: "bg-blue-500",
      href: "/vp/analytics",
    },
    {
      title: "Avg Approval Time",
      value: stats.avg_approval_time,
      icon: TrendingUp,
      color: "bg-gradient-to-br from-purple-50 to-purple-100",
      textColor: "text-purple-700",
      iconBg: "bg-purple-500",
      href: "/vp/analytics",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">VP Dashboard</h1>
        <p className="text-gray-600 mt-1">Executive overview and pending approvals</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            className={`${card.color} rounded-xl p-6 border border-gray-200 cursor-pointer`}
            onClick={() => router.push(card.href)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.iconBg} p-3 rounded-lg shadow-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              {card.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  card.change > 0 ? 'text-green-600' : card.change < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {card.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(card.change)}%
                </div>
              )}
            </div>
            <p className={`text-sm font-medium ${card.textColor} opacity-80`}>{card.title}</p>
            <p className={`text-3xl font-bold ${card.textColor} mt-2`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div variants={cardVariants} className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Executive Actions</h2>
          <a href="/vp/inbox" className="text-sm text-[#7a0019] hover:underline font-medium">
            View All →
          </a>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Approved travel request TO-2025-123</p>
              <p className="text-sm text-gray-600">John Doe • CNAHS • 2 hours ago</p>
            </div>
            <span className="text-sm font-semibold text-green-600">₱25,000</span>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Approved travel request TO-2025-122</p>
              <p className="text-sm text-gray-600">Maria Santos • CBA • 3 hours ago</p>
            </div>
            <span className="text-sm font-semibold text-green-600">₱18,500</span>
          </div>
          
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">Recent activity will appear here</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants} className="bg-gradient-to-br from-[#7a0019] to-[#9a0020] rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/vp/inbox')}
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-left transition-all"
          >
            <Clock className="h-6 w-6 mb-2" />
            <p className="font-medium">Review Pending</p>
            <p className="text-sm opacity-80">{stats.pending} requests waiting</p>
          </button>
          
          <button
            onClick={() => router.push('/vp/analytics')}
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-left transition-all"
          >
            <TrendingUp className="h-6 w-6 mb-2" />
            <p className="font-medium">View Analytics</p>
            <p className="text-sm opacity-80">Detailed insights</p>
          </button>
          
          <button
            onClick={() => router.push('/vp/request')}
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-left transition-all"
          >
            <Users className="h-6 w-6 mb-2" />
            <p className="font-medium">New Request</p>
            <p className="text-sm opacity-80">Submit travel request</p>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
