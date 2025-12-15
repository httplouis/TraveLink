import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Use regular client for auth (NOT service role - it doesn't have session info)
    const supabase = await createSupabaseServerClient(false);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to find department
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("department_id, department:departments!users_department_id_fkey(id, name)")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    const departmentId = profile.department_id;
    if (!departmentId) {
      return NextResponse.json({ ok: false, error: "User has no department assigned" }, { status: 400 });
    }

    // Get current fiscal year (assuming academic year starts in June)
    const now = new Date();
    const currentYear = now.getFullYear();
    const fiscalYear = now.getMonth() >= 5 ? currentYear : currentYear - 1; // June = start of fiscal year

    // Get budget for current fiscal year
    const { data: budget, error: budgetError } = await supabase
      .from("department_budgets")
      .select("*")
      .eq("department_id", departmentId)
      .eq("fiscal_year", fiscalYear)
      .single();

    if (budgetError && budgetError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("[GET /api/user/budget] Error:", budgetError);
      return NextResponse.json({ ok: false, error: budgetError.message }, { status: 500 });
    }

    // If no budget exists, return null (frontend will show "not available")
    if (!budget) {
      return NextResponse.json({ 
        ok: true, 
        data: null,
        message: "No budget allocated for this fiscal year"
      });
    }

    // Calculate actual used and pending from requests
    const { data: usedRequests } = await supabase
      .from("requests")
      .select("total_budget")
      .eq("department_id", departmentId)
      .eq("status", "approved")
      .gte("created_at", `${fiscalYear}-06-01`)
      .lt("created_at", `${fiscalYear + 1}-06-01`);

    const { data: pendingRequests } = await supabase
      .from("requests")
      .select("total_budget")
      .eq("department_id", departmentId)
      .in("status", ["pending_head", "pending_admin", "pending_comptroller", "pending_hr", "pending_exec"])
      .gte("created_at", `${fiscalYear}-06-01`)
      .lt("created_at", `${fiscalYear + 1}-06-01`);

    const actualUsed = usedRequests?.reduce((sum, r) => sum + parseFloat(r.total_budget || 0), 0) || 0;
    const actualPending = pendingRequests?.reduce((sum, r) => sum + parseFloat(r.total_budget || 0), 0) || 0;
    const actualRemaining = parseFloat(budget.total_allocated) - actualUsed - actualPending;

    return NextResponse.json({
      ok: true,
      data: {
        department_id: departmentId,
        department_name: profile.department?.name || 'Unknown Department',
        fiscal_year: fiscalYear,
        total_allocated: parseFloat(budget.total_allocated),
        total_used: actualUsed,
        total_pending: actualPending,
        remaining: actualRemaining
      }
    });
  } catch (err: any) {
    console.error("[GET /api/user/budget] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

