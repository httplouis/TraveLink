// src/app/api/user/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Force dynamic rendering (uses cookies - must be dynamic)
export const dynamic = 'force-dynamic';
// Note: Use Cache-Control headers for runtime caching (revalidate doesn't work with force-dynamic)

/**
 * GET /api/user/dashboard/stats
 * Get real-time dashboard statistics for the logged-in user
 */
export async function GET() {
  try {
    // Use service role client to bypass RLS for stats queries
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Use regular client for auth check only
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
    // Use service role client to bypass RLS
    const { count: activeRequests, error: activeError } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .not("status", "in", "(approved,rejected,cancelled,completed)");
    
    if (activeError) {
      console.error("[GET /api/user/dashboard/stats] Active requests error:", activeError);
    }

    // 2. Pending Approvals (requests awaiting user's approval/action)
    // Count requests where user is a requester and status is pending_requester_signature
    // Also count requests where user needs to sign as a participant
    const { count: pendingApprovals, error: pendingError } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("requester_id", userId)
      .eq("status", "pending_requester_signature");
    
    if (pendingError) {
      console.error("[GET /api/user/dashboard/stats] Pending approvals error:", pendingError);
    }

    // 3. Vehicles Online (available vehicles)
    // Use service role client to bypass RLS
    const { count: vehiclesOnline, error: vehiclesError } = await supabaseServiceRole
      .from("vehicles")
      .select("*", { count: "exact", head: true })
      .eq("status", "available");
    
    if (vehiclesError) {
      console.error("[GET /api/user/dashboard/stats] Vehicles online error:", vehiclesError);
    }

    // 4. This Month's Requests
    // Use service role client to bypass RLS
    const { count: thisMonthRequests } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .gte("created_at", thisMonthStart.toISOString());

    // 5. Last Month's Requests (for comparison)
    // Use service role client to bypass RLS
    const { count: lastMonthRequests } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString());

    // 6. Approved This Month
    // Use service role client to bypass RLS
    const { count: approvedThisMonth } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .eq("status", "approved")
      .gte("created_at", thisMonthStart.toISOString());

    // 7. Calculate trends
    const requestTrend = lastMonthRequests && lastMonthRequests > 0
      ? ((thisMonthRequests || 0) - lastMonthRequests) / lastMonthRequests * 100
      : 0;

    const response = NextResponse.json({
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
    
    // Performance: Add cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    
    return response;
  } catch (err: any) {
    console.error("[GET /api/user/dashboard/stats] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

