// src/app/api/user/dashboard/ai-insights/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateAnalyticsInsights } from "@/lib/ai/gemini";

/**
 * GET /api/user/dashboard/ai-insights
 * Get AI-powered insights for user dashboard using Gemini
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for direct database access
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, department_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const userId = profile.id;

    // Fetch stats directly
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const { count: activeRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .not("status", "in", "(approved,rejected,cancelled)");

    const { count: pendingApprovals } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("requester_id", userId)
      .eq("status", "pending_requester_signature");

    const { count: thisMonthRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .gte("created_at", thisMonthStart.toISOString());

    const { count: lastMonthRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString());

    // Fetch monthly trends
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        start: new Date(date.getFullYear(), date.getMonth(), 1),
        end: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
      });
    }

    const monthlyTrends = await Promise.all(
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

        return {
          month: m.month,
          total: total || 0,
          approved: approved || 0,
          pending: (total || 0) - (approved || 0),
        };
      })
    );

    const stats = {
      activeRequests: activeRequests || 0,
      pendingApprovals: pendingApprovals || 0,
      thisMonthRequests: thisMonthRequests || 0,
      lastMonthRequests: lastMonthRequests || 0,
      requestTrend: lastMonthRequests && lastMonthRequests > 0
        ? ((thisMonthRequests || 0) - lastMonthRequests) / lastMonthRequests * 100
        : 0,
    };

    const analytics = {
      monthlyTrends,
      avgApprovalDays: 0, // Can be calculated if needed
    };

    // Generate AI insights
    const insights = await generateAnalyticsInsights({
      stats: stats,
      analytics: analytics,
      monthlyTrends: analytics.monthlyTrends || [],
    });

    if (!insights) {
      // Return fallback insights
      return NextResponse.json({
        ok: true,
        data: {
          summary: "Your travel request activity is being tracked. Keep submitting requests to see more insights.",
          trends: [],
          recommendations: [
            "Submit requests early to ensure timely approval",
            "Check your pending approvals regularly",
          ],
          keyMetrics: {},
          aiEnabled: false,
        }
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...insights,
        aiEnabled: true,
      }
    });
  } catch (err: any) {
    console.error("[GET /api/user/dashboard/ai-insights] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

