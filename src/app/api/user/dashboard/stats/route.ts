// src/app/api/user/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/dashboard/stats
 * Get real-time dashboard statistics for the logged-in user
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
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. Active Requests (submitted by user OR requested by user, not in final states)
    const { count: activeRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .not("status", "in", "(approved,rejected,cancelled)");

    // 2. Pending Approvals (requests awaiting user's signature)
    const { count: pendingApprovals } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("requester_id", userId)
      .eq("status", "pending_requester_signature");

    // 3. Vehicles Online (available vehicles)
    const { count: vehiclesOnline } = await supabase
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("status", "available");

    // 4. This Month's Requests
    const { count: thisMonthRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .gte("created_at", thisMonthStart.toISOString());

    // 5. Last Month's Requests (for comparison)
    const { count: lastMonthRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString());

    // 6. Approved This Month
    const { count: approvedThisMonth } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .eq("status", "approved")
      .gte("created_at", thisMonthStart.toISOString());

    // 7. Calculate trends
    const requestTrend = lastMonthRequests && lastMonthRequests > 0
      ? ((thisMonthRequests || 0) - lastMonthRequests) / lastMonthRequests * 100
      : 0;

    return NextResponse.json({
      ok: true,
      data: {
        activeRequests: activeRequests || 0,
        pendingApprovals: pendingApprovals || 0,
        vehiclesOnline: vehiclesOnline || 0,
        thisMonthRequests: thisMonthRequests || 0,
        lastMonthRequests: lastMonthRequests || 0,
        approvedThisMonth: approvedThisMonth || 0,
        requestTrend: Math.round(requestTrend * 10) / 10, // Round to 1 decimal
      }
    });
  } catch (err: any) {
    console.error("[GET /api/user/dashboard/stats] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

