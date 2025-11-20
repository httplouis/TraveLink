"use client";

import React from "react";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Shield,
  DollarSign,
  Users,
  Globe,
  Building2,
  ArrowUp,
  ArrowDown,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { cardVariants, staggerContainer } from "@/lib/animations";

export default function PresidentDashboard() {
  const [stats, setStats] = React.useState({
    pending: 0,
    approved_this_week: 0,
    total_budget_ytd: 0,
    active_departments: 0,
    high_priority: 0,
    override_count: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/president/stats")
      .then(res => {
        if (!res.ok) {
          console.warn("President stats API not OK:", res.status);
          return null;
        }
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("President stats API returned non-JSON response");
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data) {
          setStats(mockStats);
          setLoading(false);
          return;
        }
        if (data.ok && data.data) {
          // Map stats data to the expected format
          setStats({
            pending: data.data.pendingApprovals || 0,
            approved_this_week: data.data.thisMonth || 0,
            total_budget_ytd: 0, // Not available in stats endpoint
            active_departments: 0, // Not available in stats endpoint
            high_priority: 0, // Not available in stats endpoint
            override_count: 0, // Not available in stats endpoint
          });
        } else {
          setStats(mockStats);
        }
        setLoading(false);
      })
      .catch(() => {
        setStats(mockStats);
        setLoading(false);
      });
  }, []);

  const mockStats = {
    pending: 5,
    approved_this_week: 42,
    total_budget_ytd: 2500000,
    active_departments: 12,
    high_priority: 3,
    override_count: 1,
  };

  const cards = [
    {
      title: "Final Review Pending",
      value: stats.pending,
      icon: Clock,
      color: "bg-gradient-to-br from-amber-50 to-amber-100",
      textColor: "text-amber-700",
      iconBg: "bg-amber-500",
      badge: stats.high_priority > 0 ? `${stats.high_priority} High Priority` : null,
      href: "/president/inbox",
    },
    {
      title: "Approved This Week",
      value: stats.approved_this_week,
      icon: CheckCircle,
      color: "bg-gradient-to-br from-green-50 to-green-100",
      textColor: "text-green-700",
      iconBg: "bg-green-500",
      change: 15,
      href: "/president/inbox",
    },
    {
      title: "Total Budget (YTD)",
      value: `₱${(stats.total_budget_ytd / 1000000).toFixed(2)}M`,
      icon: DollarSign,
      color: "bg-gradient-to-br from-blue-50 to-blue-100",
      textColor: "text-blue-700",
      iconBg: "bg-blue-500",
      href: "/president/analytics",
    },
    {
      title: "Active Departments",
      value: stats.active_departments,
      icon: Building2,
      color: "bg-gradient-to-br from-purple-50 to-purple-100",
      textColor: "text-purple-700",
      iconBg: "bg-purple-500",
      href: "/president/analytics",
    },
    {
      title: "System-Wide Requests",
      value: "124",
      icon: Globe,
      color: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      textColor: "text-indigo-700",
      iconBg: "bg-indigo-500",
      href: "/president/analytics",
    },
    {
      title: "Override Actions",
      value: stats.override_count,
      icon: Shield,
      color: "bg-gradient-to-br from-red-50 to-red-100",
      textColor: "text-red-700",
      iconBg: "bg-red-500",
      href: "/president/override",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">President Dashboard</h1>
          <p className="text-gray-600 mt-1">University-wide strategic overview</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#7a0019] text-white rounded-lg text-sm font-medium">
          <Shield className="h-4 w-4" />
          Final Authority
        </div>
      </div>

      {/* High Priority Alert */}
      {stats.high_priority > 0 && (
        <motion.div
          variants={cardVariants}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">
                {stats.high_priority} high-priority {stats.high_priority === 1 ? 'request requires' : 'requests require'} immediate attention
              </p>
              <a href="/president/inbox" className="text-sm text-amber-700 hover:underline">
                Review now →
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            variants={cardVariants}
            whileHover={{ scale: 1.02 }}
            className={`${card.color} rounded-xl p-6 border border-gray-200 cursor-pointer`}
            onClick={() => window.location.href = card.href}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.iconBg} p-3 rounded-lg shadow-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              {card.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  card.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {card.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(card.change)}%
                </div>
              )}
              {card.badge && (
                <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded-full">
                  {card.badge}
                </span>
              )}
            </div>
            <p className={`text-sm font-medium ${card.textColor} opacity-80`}>{card.title}</p>
            <p className={`text-3xl font-bold ${card.textColor} mt-2`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Strategic Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Presidential Actions */}
        <motion.div variants={cardVariants} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Presidential Actions</h2>
            <a href="/president/inbox" className="text-sm text-[#7a0019] hover:underline font-medium">
              View All →
            </a>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Final approval: TO-2025-100</p>
                <p className="text-sm text-gray-600">International conference • ₱85,000</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Policy update issued</p>
                <p className="text-sm text-gray-600">Travel budget guidelines revised</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Department Performance */}
        <motion.div variants={cardVariants} className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Department Activity</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">CNAHS</p>
                <p className="text-sm text-gray-600">College of Nursing</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">15</p>
                <p className="text-xs text-gray-500">requests</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">CBA</p>
                <p className="text-sm text-gray-600">College of Business</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">12</p>
                <p className="text-xs text-gray-500">requests</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">CCMS</p>
                <p className="text-sm text-gray-600">College of Computer Studies</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">9</p>
                <p className="text-xs text-gray-500">requests</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={cardVariants} className="bg-gradient-to-br from-[#7a0019] to-[#9a0020] rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Presidential Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/president/inbox'}
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-left transition-all"
          >
            <Clock className="h-6 w-6 mb-2" />
            <p className="font-medium">Final Review</p>
            <p className="text-sm opacity-80">{stats.pending} pending</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/president/override'}
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-left transition-all"
          >
            <Shield className="h-6 w-6 mb-2" />
            <p className="font-medium">Override</p>
            <p className="text-sm opacity-80">Final authority</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/president/policy'}
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-left transition-all"
          >
            <Users className="h-6 w-6 mb-2" />
            <p className="font-medium">Policy</p>
            <p className="text-sm opacity-80">Manage policies</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/president/analytics'}
            className="bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg p-4 text-left transition-all"
          >
            <TrendingUp className="h-6 w-6 mb-2" />
            <p className="font-medium">Analytics</p>
            <p className="text-sm opacity-80">Strategic insights</p>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
