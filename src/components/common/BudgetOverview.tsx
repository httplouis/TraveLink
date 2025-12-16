"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, PieChart, ArrowUpRight, AlertTriangle } from "lucide-react";

interface BudgetData {
  total_budget: number;
  used_budget: number;
  pending_budget: number;
  available_budget: number;
  monthly_trend?: number;
  categories?: { name: string; amount: number; color: string }[];
}

interface BudgetOverviewProps {
  departmentId?: string;
  showTrend?: boolean;
  compact?: boolean;
}

export default function BudgetOverview({ departmentId, showTrend = true, compact = false }: BudgetOverviewProps) {
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetData();
  }, [departmentId]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const params = departmentId ? `?department_id=${departmentId}` : "";
      const res = await fetch(`/api/budget/overview${params}`, {
        credentials: "include",
      });
      if (res.ok) {
        const result = await res.json();
        if (result.ok) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to load budget data:", error);
      // Set mock data for demo
      setData({
        total_budget: 500000,
        used_budget: 320000,
        pending_budget: 45000,
        available_budget: 135000,
        monthly_trend: 12,
        categories: [
          { name: "Transportation", amount: 180000, color: "#3B82F6" },
          { name: "Accommodation", amount: 85000, color: "#10B981" },
          { name: "Per Diem", amount: 55000, color: "#F59E0B" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getUsagePercentage = () => {
    if (!data) return 0;
    return Math.round((data.used_budget / data.total_budget) * 100);
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-amber-600";
    return "text-green-600";
  };

  const getProgressColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-green-500";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="h-4 w-full bg-gray-100 rounded mb-2" />
        <div className="h-8 w-24 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gray-600" />
            <span className="font-medium text-gray-900">Budget</span>
          </div>
          <span className={`text-sm font-bold ${getUsageColor()}`}>{getUsagePercentage()}% used</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getUsagePercentage()}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full ${getProgressColor()}`}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Used: {formatCurrency(data.used_budget)}</span>
          <span>Available: {formatCurrency(data.available_budget)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#7A0010] to-[#9A0020] text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Budget Overview</h3>
              <p className="text-white/70 text-sm">Current fiscal period</p>
            </div>
          </div>
          {showTrend && data.monthly_trend !== undefined && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/20">
              {data.monthly_trend >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {data.monthly_trend >= 0 ? "+" : ""}
                {data.monthly_trend}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats */}
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-4 rounded-xl bg-gray-50"
          >
            <p className="text-xs text-gray-500 mb-1">Total Budget</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(data.total_budget)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-4 rounded-xl bg-green-50"
          >
            <p className="text-xs text-green-600 mb-1">Available</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(data.available_budget)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-4 rounded-xl bg-blue-50"
          >
            <p className="text-xs text-blue-600 mb-1">Used</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(data.used_budget)}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-4 rounded-xl bg-amber-50"
          >
            <p className="text-xs text-amber-600 mb-1">Pending</p>
            <p className="text-xl font-bold text-amber-700">{formatCurrency(data.pending_budget)}</p>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Budget Utilization</span>
            <span className={`text-sm font-bold ${getUsageColor()}`}>{getUsagePercentage()}%</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${getUsagePercentage()}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full ${getProgressColor()} relative`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </motion.div>
          </div>
          {getUsagePercentage() >= 75 && (
            <div className="flex items-center gap-2 mt-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">Budget utilization is high</span>
            </div>
          )}
        </div>

        {/* Categories */}
        {data.categories && data.categories.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">By Category</span>
            </div>
            <div className="space-y-2">
              {data.categories.map((cat, index) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(cat.amount)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
