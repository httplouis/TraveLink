import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

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
      .select("id, is_executive")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_executive) {
      return NextResponse.json({
        ok: true,
        data: {
          pending_count: 0,
          active_count: 0,
          approved_month: 0
        }
      });
    }

    const userId = profile.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Pending Approvals: Requests awaiting executive approval
    const { count: pendingCount } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_exec")
      .is("president_approved_at", null);

    // 2. Active Requests: Requests submitted by this executive user
    const { count: activeCount } = await supabaseServiceRole
      .from("requests")
      .select("*", { count: "exact", head: true })
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .not("status", "in", "(approved,rejected,cancelled,completed)");

    // 3. Approved This Month: Requests approved by this executive this month
    const { count: approvedMonth } = await supabaseServiceRole
      .from("request_history")
      .select("*", { count: "exact", head: true })
      .eq("actor_id", userId)
      .eq("action", "approved")
      .gte("created_at", monthStart.toISOString());

    return NextResponse.json({
      ok: true,
      data: {
        pending_count: pendingCount || 0,
        active_count: activeCount || 0,
        approved_month: approvedMonth || 0,
      }
    });
  } catch (err: any) {
    console.error("[GET /api/exec/stats] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
