import type { DashboardData, RequestRow, TripLogRow, StatusPoint, KPI, UtilizationPoint, DeptUsage } from "../types";
import type { ListRequestsQuery } from "../repo";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getDashboardData(): Promise<DashboardData> {
  try {
    const supabase = await createSupabaseServerClient(true);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const eightDaysAgo = new Date(now);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // KPIs
    const [totalTripsRes, activeVehiclesRes, pendingRequestsRes, totalKmRes] = await Promise.all([
      // Total trips this month
      supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .gte("created_at", startOfMonth.toISOString())
        .in("status", ["approved", "completed"]),
      
      // Active vehicles
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("status", "available"),
      
      // Pending requests - ADMIN CAN SEE ALL PENDING
      supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending_head", "pending_admin", "pending_comptroller", "pending_hr", "pending_exec", "pending_hr_ack"]),
      
      // Total KM (mock for now - would need trip logs)
      Promise.resolve({ count: 0 }),
    ]);

    const kpis: KPI[] = [
      { label: "Total Trips (Month)", value: totalTripsRes.count || 0 },
      { label: "Active Vehicles", value: activeVehiclesRes.count || 0 },
      { label: "Pending Requests", value: pendingRequestsRes.count || 0 },
      { label: "KM This Month", value: totalKmRes.count || 0 },
    ];

    // Requests by day (last 8 days)
    const requestsByDay: { date: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const { count } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .gte("created_at", `${dateStr}T00:00:00`)
        .lt("created_at", `${dateStr}T23:59:59`);
      
      requestsByDay.push({ date: dateStr, count: count || 0 });
    }

    // Status breakdown
    const [pendingCount, approvedCount, completedCount, rejectedCount] = await Promise.all([
      supabase.from("requests").select("id", { count: "exact", head: true }).in("status", ["pending_head", "pending_admin", "pending_comptroller", "pending_hr", "pending_exec"]),
      supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "completed"),
      supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    ]);

    const statusBreakdown: StatusPoint[] = [
      { status: "Pending", count: pendingCount.count || 0 },
      { status: "Approved", count: approvedCount.count || 0 },
      { status: "Completed", count: completedCount.count || 0 },
      { status: "Rejected", count: rejectedCount.count || 0 },
    ];

    // Vehicle utilization (mock for now)
    const utilization: UtilizationPoint[] = [
      { label: "Vans", percent: 75 },
      { label: "Buses", percent: 60 },
      { label: "Cars", percent: 45 },
    ];

    // Department usage
    const { data: deptData } = await supabase
      .from("requests")
      .select("department_id, departments!requests_department_id_fkey(name)")
      .gte("created_at", startOfMonth.toISOString());

    const deptMap = new Map<string, number>();
    deptData?.forEach((req: any) => {
      const deptName = req.departments?.name || "Unknown";
      deptMap.set(deptName, (deptMap.get(deptName) || 0) + 1);
    });

    const deptUsage: DeptUsage[] = Array.from(deptMap.entries())
      .map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent requests - ADMIN CAN SEE ALL REQUESTS
    const { data: recentRequestsData } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        purpose,
        travel_start_date,
        status,
        department_id,
        requester_id,
        departments!requests_department_id_fkey(name, code),
        users!requests_requester_id_fkey(name, email)
      `)
      // No status filter - admin can see all requests
      .order("created_at", { ascending: false })
      .limit(10);

    const recentRequests: RequestRow[] = (recentRequestsData || []).map((req: any) => ({
      id: req.id,
      dept: req.departments?.name || req.departments?.code || "Unknown",
      purpose: req.purpose || "No purpose",
      date: req.travel_start_date ? req.travel_start_date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: req.status === "pending_admin" || req.status === "head_approved" ? "Pending" : "Approved" as any,
      requester: req.users?.name || "Unknown",
      createdAt: req.created_at,
      updatedAt: req.updated_at,
    }));

    // Recent trips (mock for now)
    const recentTrips: TripLogRow[] = [];

    return {
      kpis,
      requestsByDay,
      statusBreakdown,
      utilization,
      deptUsage,
      recentRequests,
      recentTrips,
      receivedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("[Admin Dashboard] Error fetching data:", error);
    // Return empty data on error
    return {
      kpis: [],
      requestsByDay: [],
      statusBreakdown: [],
      utilization: [],
      deptUsage: [],
      recentRequests: [],
      recentTrips: [],
      receivedAt: new Date().toISOString(),
    };
  }
}

export async function listRequests(
  query: ListRequestsQuery
): Promise<{ rows: RequestRow[]; total: number }> {
  try {
    const supabase = await createSupabaseServerClient(true);
    let dbQuery = supabase
      .from("requests")
      .select(`
        id,
        request_number,
        purpose,
        travel_start_date,
        status,
        department_id,
        requester_id,
        departments!requests_department_id_fkey(name, code),
        users!requests_requester_id_fkey(name, email),
        created_at,
        updated_at
      `, { count: "exact" });

    if (query.status && query.status !== "All") {
      const statusMap: Record<string, string[]> = {
        "Pending": ["pending_head", "pending_admin", "pending_comptroller", "pending_hr", "pending_exec"],
        "Approved": ["approved"],
        "Completed": ["completed"],
        "Rejected": ["rejected"],
      };
      const dbStatuses = statusMap[query.status] || [query.status];
      dbQuery = dbQuery.in("status", dbStatuses);
    }

    if (query.dept && query.dept !== "All") {
      dbQuery = dbQuery.eq("departments.name", query.dept);
    }

    if (query.search) {
      dbQuery = dbQuery.or(`purpose.ilike.%${query.search}%,request_number.ilike.%${query.search}%`);
    }

    if (query.from) {
      dbQuery = dbQuery.gte("travel_start_date", query.from);
    }

    if (query.to) {
      dbQuery = dbQuery.lte("travel_start_date", query.to);
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    dbQuery = dbQuery.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await dbQuery;

    if (error) {
      console.error("[Admin Requests] Error:", error);
      return { rows: [], total: 0 };
    }

    const rows: RequestRow[] = (data || []).map((req: any) => ({
      id: req.id,
      dept: req.departments?.name || req.departments?.code || "Unknown",
      purpose: req.purpose || "No purpose",
      date: req.travel_start_date ? req.travel_start_date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: req.status === "pending_admin" || req.status === "head_approved" ? "Pending" : 
              req.status === "approved" ? "Approved" :
              req.status === "completed" ? "Completed" :
              req.status === "rejected" ? "Rejected" : "Pending" as any,
      requester: req.users?.name || "Unknown",
      createdAt: req.created_at,
      updatedAt: req.updated_at,
    }));

    return { rows, total: count || 0 };
  } catch (error: any) {
    console.error("[Admin Requests] Error:", error);
    return { rows: [], total: 0 };
  }
}

export async function getRequest(id: string): Promise<RequestRow> {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { data, error } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        purpose,
        travel_start_date,
        status,
        department_id,
        requester_id,
        departments!requests_department_id_fkey(name, code),
        users!requests_requester_id_fkey(name, email),
        created_at,
        updated_at
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new Error("Request not found");
    }

    return {
      id: data.id,
      dept: (data as any).departments?.name || (data as any).departments?.code || "Unknown",
      purpose: data.purpose || "No purpose",
      date: data.travel_start_date ? data.travel_start_date.split('T')[0] : new Date().toISOString().split('T')[0],
      status: data.status === "pending_admin" || data.status === "head_approved" ? "Pending" : 
              data.status === "approved" ? "Approved" :
              data.status === "completed" ? "Completed" :
              data.status === "rejected" ? "Rejected" : "Pending" as any,
      requester: (data as any).users?.name || "Unknown",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error: any) {
    console.error("[Admin Request] Error:", error);
    throw error;
  }
}

export async function updateRequest(
  id: string,
  patch: Partial<RequestRow>
): Promise<RequestRow> {
  // This would update the request in the database
  // For now, just return the updated request
  const req = await getRequest(id);
  return { ...req, ...patch };
}

export async function bulkUpdate(ids: string[], patch: Partial<RequestRow>): Promise<void> {
  // Bulk update implementation
  // For now, just log
  console.log("[Admin Bulk Update]", ids, patch);
}
