// src/app/(protected)/comptroller/reports/page.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Calendar,
  FileSpreadsheet,
  FileText
} from "lucide-react";

type MonthlyData = {
  month: string;
  approved: number;
  rejected: number;
  totalBudget: number;
};

type DepartmentStat = {
  dept: string;
  approved: number;
  rejected: number;
  budget: number;
};

export default function ComptrollerReports() {
  const [loading, setLoading] = React.useState(true);
  const [selectedPeriod, setSelectedPeriod] = React.useState<"week" | "month" | "year">("month");
  const [monthlyData, setMonthlyData] = React.useState<MonthlyData[]>([]);
  const [departmentStats, setDepartmentStats] = React.useState<DepartmentStat[]>([]);

  React.useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await fetch("/api/comptroller/reports");
      if (res.ok) {
        const data = await res.json();
        setMonthlyData(data.monthlyData || []);
        setDepartmentStats(data.departmentStats || []);
      }
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalApproved = monthlyData.reduce((sum, m) => sum + m.approved, 0);
  const totalRejected = monthlyData.reduce((sum, m) => sum + m.rejected, 0);
  const approvalRate = ((totalApproved / (totalApproved + totalRejected)) * 100).toFixed(1);
  const totalBudgetReviewed = monthlyData.reduce((sum, m) => sum + m.totalBudget, 0);

  const maxApproved = Math.max(...monthlyData.map(m => m.approved));
  const maxRejected = Math.max(...monthlyData.map(m => m.rejected));
  const chartMax = Math.max(maxApproved, maxRejected) + 10;

  const handleExport = (format: "excel" | "pdf") => {
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Budget review statistics and trends</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport("excel")}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="h-5 w-5" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-2 px-4 py-2 bg-[#7A0010] text-white rounded-lg hover:bg-[#5A0010] transition-colors"
          >
            <FileText className="h-5 w-5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(["week", "month", "year"] as const).map((period) => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              selectedPeriod === period
                ? "bg-[#7A0010] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-6 w-6" />
            <span className="text-sm font-medium opacity-90">Total Approved</span>
          </div>
          <div className="text-4xl font-bold mb-1">{totalApproved}</div>
          <div className="text-sm opacity-80">Approval Rate: {approvalRate}%</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-6 w-6" />
            <span className="text-sm font-medium opacity-90">Total Rejected</span>
          </div>
          <div className="text-4xl font-bold mb-1">{totalRejected}</div>
          <div className="text-sm opacity-80">Rejection Rate: {(100 - parseFloat(approvalRate)).toFixed(1)}%</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[#7A0010] to-[#5A0010] rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl font-bold">₱</span>
            <span className="text-sm font-medium opacity-90">Total Budget</span>
          </div>
          <div className="text-3xl font-bold mb-1">₱{(totalBudgetReviewed / 1000000).toFixed(2)}M</div>
          <div className="text-sm opacity-80">Reviewed this period</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-6 w-6" />
            <span className="text-sm font-medium opacity-90">Avg. Budget</span>
          </div>
          <div className="text-3xl font-bold mb-1">₱{(totalBudgetReviewed / (totalApproved + totalRejected)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="text-sm opacity-80">Per request</div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Trends</h3>
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={data.month} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{data.month}</span>
                  <div className="flex gap-4">
                    <span className="text-green-600">{data.approved} approved</span>
                    <span className="text-red-600">{data.rejected} rejected</span>
                  </div>
                </div>
                <div className="flex gap-1 h-8">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.approved / chartMax) * 100}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-end pr-2"
                  >
                    {data.approved > 5 && <span className="text-xs font-bold text-white">{data.approved}</span>}
                  </motion.div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.rejected / chartMax) * 100}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="bg-gradient-to-r from-red-400 to-red-600 rounded-lg flex items-center justify-end pr-2"
                  >
                    {data.rejected > 5 && <span className="text-xs font-bold text-white">{data.rejected}</span>}
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Department Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Department Breakdown</h3>
          <div className="space-y-4">
            {departmentStats.map((dept, index) => (
              <motion.div
                key={dept.dept}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900">{dept.dept}</span>
                  <span className="text-sm font-medium text-[#7A0010]">
                    ₱{(dept.budget / 1000).toLocaleString()}k
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{dept.approved} approved</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>{dept.rejected} rejected</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
