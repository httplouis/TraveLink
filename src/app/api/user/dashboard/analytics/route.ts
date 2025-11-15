// src/app/api/user/dashboard/analytics/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/dashboard/analytics
 * Get detailed analytics for user dashboard (charts data, trends, etc.)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, department_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const userId = profile.id;

    // Get last 6 months of data
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
      });
    }

    // Monthly request trends
    const monthlyData = await Promise.all(
      months.map(async (m) => {
        const { count: total } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
          .gte("created_at", m.start.toISOString())
          .lte("created_at", m.end.toISOString());

        const { count: approved } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
          .eq("status", "approved")
          .gte("created_at", m.start.toISOString())
          .lte("created_at", m.end.toISOString());

        const { count: pending } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
          .in("status", ["pending_head", "pending_admin", "pending_hr", "pending_vp", "pending_president", "pending_requester_signature"])
          .gte("created_at", m.start.toISOString())
          .lte("created_at", m.end.toISOString());

        return {
          month: m.month,
          total: total || 0,
          approved: approved || 0,
          pending: pending || 0,
        };
      })
    );

    // Status breakdown
    const { data: statusBreakdown } = await supabase
      .from("requests")
      .select("status")
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .not("status", "in", "(draft)");

    const statusCounts: Record<string, number> = {};
    statusBreakdown?.forEach((r: any) => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    // Average approval time (for approved requests)
    const { data: approvedRequests } = await supabase
      .from("requests")
      .select("created_at, head_approved_at, admin_processed_at, hr_approved_at, vp_approved_at, president_approved_at, exec_approved_at")
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .eq("status", "approved")
      .limit(100);

    let totalApprovalTime = 0;
    let countWithApproval = 0;

    approvedRequests?.forEach((req: any) => {
      const created = new Date(req.created_at).getTime();
      let approvedAt: Date | null = null;

      // Find the last approval timestamp
      if (req.exec_approved_at) approvedAt = new Date(req.exec_approved_at);
      else if (req.president_approved_at) approvedAt = new Date(req.president_approved_at);
      else if (req.vp_approved_at) approvedAt = new Date(req.vp_approved_at);
      else if (req.hr_approved_at) approvedAt = new Date(req.hr_approved_at);
      else if (req.admin_processed_at) approvedAt = new Date(req.admin_processed_at);
      else if (req.head_approved_at) approvedAt = new Date(req.head_approved_at);

      if (approvedAt) {
        const days = (approvedAt.getTime() - created) / (1000 * 60 * 60 * 24);
        totalApprovalTime += days;
        countWithApproval++;
      }
    });

    const avgApprovalDays = countWithApproval > 0
      ? Math.round((totalApprovalTime / countWithApproval) * 10) / 10
      : 0;

    return NextResponse.json({
      ok: true,
      data: {
        monthlyTrends: monthlyData,
        statusBreakdown: statusCounts,
        avgApprovalDays,
        totalRequests: statusBreakdown?.length || 0,
      }
    });
  } catch (err: any) {
    console.error("[GET /api/user/dashboard/analytics] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

