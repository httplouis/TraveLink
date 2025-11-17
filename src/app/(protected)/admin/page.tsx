"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  BusFront,
  AlertCircle,
  ArrowUpRight
} from "lucide-react";
import KpiRow from "@/components/admin/dashboard/containers/KpiRow";
import RequestsTable from "@/components/admin/dashboard/ui/RequestsTable";
import ChartCard from "@/components/admin/dashboard/ui/ChartCard";
import DashboardActions from "@/components/admin/dashboard/ui/DashboardActions";
import TripLogsTable from "@/components/admin/dashboard/ui/TripLogsTable";
import DeptUsageChart from "@/components/admin/dashboard/ui/DeptUsageChart";
import { getDashboardData } from "@/lib/admin/repo";
import { cardVariants, staggerContainer } from "@/lib/animations";

export default function AdminDashboardPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const {
    kpis = [],
    requestsByDay = [],
    statusBreakdown = [],
    utilization = [],
    deptUsage = [],
    recentRequests = [],
    recentTrips = [],
  } = data || {};

  return (
    <motion.section 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Enhanced Header */}
      <motion.div variants={cardVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Transport management overview and analytics</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#7a0019] to-[#9a0020] text-white rounded-lg text-sm font-medium shadow-lg">
          <Users className="h-4 w-4" />
          Admin Portal
        </div>
      </motion.div>

      {/* Enhanced KPI Cards */}
      <motion.div variants={cardVariants}>
        <KpiRow items={kpis.map(kpi => ({ ...kpi, value: String(kpi.value) }))} />
      </motion.div>

      {/* Analytics Row 1 with enhanced cards */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow p-6">
          <ChartCard title="Requests (last 8 days)" type="line" data={requestsByDay} xKey="date" yKey="count" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow p-6">
          <ChartCard title="Status Breakdown" type="bar" data={statusBreakdown} xKey="status" yKey="count" />
        </div>
      </motion.div>

      {/* Analytics Row 2 with enhanced cards */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow p-6">
          <ChartCard title="Vehicle Utilization (%)" type="bar" data={utilization} xKey="label" yKey="percent" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow p-6">
          <DeptUsageChart data={deptUsage} />
        </div>
      </motion.div>

      {/* Enhanced Requests Section */}
      <motion.div variants={cardVariants} className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Requests</h2>
          <a href="/admin/requests" className="text-sm text-[#7a0019] hover:underline font-medium flex items-center gap-1">
            View All <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <DashboardActions rows={recentRequests} />
        <div className="mt-4">
          <RequestsTable rows={recentRequests} />
        </div>
      </motion.div>

      {/* Enhanced Recent Trips */}
      <motion.div variants={cardVariants} className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Trip Logs</h2>
          <a href="/admin/schedule" className="text-sm text-[#7a0019] hover:underline font-medium flex items-center gap-1">
            View Schedule <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <TripLogsTable rows={recentTrips.slice(0, 5)} />
      </motion.div>
    </motion.section>
  );
}
