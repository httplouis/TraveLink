// src/app/api/super-admin/stats/system/route.ts
/**
 * GET /api/super-admin/stats/system
 * Get comprehensive system-wide analytics
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);

    // Check if user is super admin
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS completely)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        ok: false,
        error: "Missing Supabase configuration"
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Get current date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // 1. User Statistics
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    const { data: usersByRole } = await supabase
      .from("users")
      .select("role")
      .eq("status", "active");

    const roleCounts: Record<string, number> = {};
    usersByRole?.forEach((u) => {
      const role = u.role || "staff";
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    // 2. Request Statistics
    const { count: totalRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true });

    const { count: requestsThisWeek } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    const { count: requestsThisMonth } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthAgo.toISOString());

    const { data: requestsByStatus } = await supabase
      .from("requests")
      .select("status");

    const statusCounts: Record<string, number> = {};
    requestsByStatus?.forEach((r) => {
      const status = r.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // 3. Budget Statistics
    const { data: budgetData } = await supabase
      .from("requests")
      .select("total_budget, status, created_at")
      .not("total_budget", "is", null)
      .gt("total_budget", 0);

    const totalBudgetYTD = budgetData?.reduce((sum, r) => {
      const createdAt = new Date(r.created_at);
      if (createdAt >= yearStart && r.status === "approved") {
        return sum + (parseFloat(r.total_budget?.toString() || "0") || 0);
      }
      return sum;
    }, 0) || 0;

    const budgetThisMonth = budgetData?.reduce((sum, r) => {
      const createdAt = new Date(r.created_at);
      if (createdAt >= monthAgo && r.status === "approved") {
        return sum + (parseFloat(r.total_budget?.toString() || "0") || 0);
      }
      return sum;
    }, 0) || 0;

    // 4. Department Statistics
    const { count: totalDepartments } = await supabase
      .from("departments")
      .select("*", { count: "exact", head: true });

    // 5. Approval Statistics
    const { data: approvalData } = await supabase
      .from("request_history")
      .select("action, created_at")
      .gte("created_at", monthAgo.toISOString());

    const approvalsThisMonth = approvalData?.filter((a) => a.action === "approved").length || 0;
    const rejectionsThisMonth = approvalData?.filter((a) => a.action === "rejected").length || 0;

    // 6. Activity Statistics (from audit_logs)
    const { count: totalAuditLogs } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true });

    const { count: auditLogsThisWeek } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo.toISOString());

    // 7. Role Grant Statistics
    const { count: totalRoleGrants } = await supabase
      .from("role_grants")
      .select("*", { count: "exact", head: true });

    const { count: activeRoleGrants } = await supabase
      .from("role_grants")
      .select("*", { count: "exact", head: true })
      .is("revoked_at", null);

    // 8. Request Trends (last 7 days)
    const dailyRequestCounts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      dailyRequestCounts[dateStr] = 0;
    }

    const { data: recentRequests } = await supabase
      .from("requests")
      .select("created_at")
      .gte("created_at", weekAgo.toISOString());

    recentRequests?.forEach((r) => {
      const dateStr = new Date(r.created_at).toISOString().split("T")[0];
      if (dailyRequestCounts[dateStr] !== undefined) {
        dailyRequestCounts[dateStr]++;
      }
    });

    return NextResponse.json({
      ok: true,
      data: {
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          byRole: roleCounts,
        },
        requests: {
          total: totalRequests || 0,
          thisWeek: requestsThisWeek || 0,
          thisMonth: requestsThisMonth || 0,
          byStatus: statusCounts,
          dailyTrends: Object.entries(dailyRequestCounts).map(([date, count]) => ({
            date,
            count,
          })),
        },
        budget: {
          totalYTD: totalBudgetYTD,
          thisMonth: budgetThisMonth,
          averagePerRequest: requestsThisMonth > 0 ? budgetThisMonth / requestsThisMonth : 0,
        },
        departments: {
          total: totalDepartments || 0,
        },
        approvals: {
          thisMonth: approvalsThisMonth,
          rejectionsThisMonth: rejectionsThisMonth,
          approvalRate: approvalsThisMonth + rejectionsThisMonth > 0
            ? (approvalsThisMonth / (approvalsThisMonth + rejectionsThisMonth)) * 100
            : 0,
        },
        activity: {
          totalAuditLogs: totalAuditLogs || 0,
          auditLogsThisWeek: auditLogsThisWeek || 0,
        },
        roles: {
          totalGrants: totalRoleGrants || 0,
          activeGrants: activeRoleGrants || 0,
        },
      },
    });
  } catch (error: any) {
    console.error("[GET /api/super-admin/stats/system] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch system analytics" },
      { status: 500 }
    );
  }
}

