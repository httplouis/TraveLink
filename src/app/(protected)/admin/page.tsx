import KpiRow from "@/components/admin/dashboard/containers/KpiRow";
import RequestsTable from "@/components/admin/dashboard/ui/RequestsTable";
import ChartCard from "@/components/admin/dashboard/ui/ChartCard";
import DashboardActions from "@/components/admin/dashboard/ui/DashboardActions";
import TripLogsTable from "@/components/admin/dashboard/ui/TripLogsTable";
import DeptUsageChart from "@/components/admin/dashboard/ui/DeptUsageChart";
import { getDashboardData } from "@/lib/admin/repo";

export default async function AdminDashboardPage() {
  const {
    kpis,
    requestsByDay,
    statusBreakdown,
    utilization,
    deptUsage,
    recentRequests,
    recentTrips,
  } = await getDashboardData();

  return (
    <section className="space-y-6">
      {/* KPI summary */}
      <KpiRow items={kpis} />

      {/* Analytics Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Requests (last 8 days)" type="line" data={requestsByDay} xKey="date" yKey="count" />
        <ChartCard title="Status Breakdown" type="bar" data={statusBreakdown} xKey="status" yKey="count" />
      </div>

      {/* Analytics Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Vehicle Utilization (%)" type="bar" data={utilization} xKey="label" yKey="percent" />
        <DeptUsageChart data={deptUsage} />
      </div>

      {/* Requests Table */}
      <div className="space-y-3">
        <DashboardActions rows={recentRequests} />
        <RequestsTable rows={recentRequests} />
      </div>

      {/* Recent Trips (3 rows only) */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Recent Trip Logs</div>
        <TripLogsTable rows={recentTrips.slice(0, 3)} />
      </div>
    </section>
  );
}
