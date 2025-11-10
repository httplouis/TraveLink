// src/app/api/comptroller/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current month start and end
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 1. Get pending reviews count
    const { count: pendingCount, error: pendingError } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_comptroller");

    if (pendingError) throw pendingError;

    // 2. Get approved this month (comptroller_approved_at is not null and within month)
    const { count: approvedCount, error: approvedError } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .not("comptroller_approved_at", "is", null)
      .gte("comptroller_approved_at", monthStart.toISOString())
      .lte("comptroller_approved_at", monthEnd.toISOString());

    if (approvedError) throw approvedError;

    // 3. Get rejected this month (comptroller_rejected_at is not null and within month)
    const { count: rejectedCount, error: rejectedError } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .not("comptroller_rejected_at", "is", null)
      .gte("comptroller_rejected_at", monthStart.toISOString())
      .lte("comptroller_rejected_at", monthEnd.toISOString());

    if (rejectedError) throw rejectedError;

    // 4. Get total budget reviewed this month (both approved and rejected)
    const { data: budgetData, error: budgetError } = await supabase
      .from("requests")
      .select("total_budget, comptroller_edited_budget")
      .or(
        `comptroller_approved_at.gte.${monthStart.toISOString()},comptroller_rejected_at.gte.${monthStart.toISOString()}`
      );

    if (budgetError) throw budgetError;

    const totalBudget = budgetData?.reduce((sum, req) => {
      // Use edited budget if available, otherwise original
      const budget = req.comptroller_edited_budget || req.total_budget || 0;
      return sum + Number(budget);
    }, 0) || 0;

    // 5. Get previous month stats for comparison
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const { count: prevApprovedCount } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .not("comptroller_approved_at", "is", null)
      .gte("comptroller_approved_at", prevMonthStart.toISOString())
      .lte("comptroller_approved_at", prevMonthEnd.toISOString());

    const { count: prevRejectedCount } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .not("comptroller_rejected_at", "is", null)
      .gte("comptroller_rejected_at", prevMonthStart.toISOString())
      .lte("comptroller_rejected_at", prevMonthEnd.toISOString());

    // Calculate changes (handle null counts)
    const approvedChange = (prevApprovedCount || 0) > 0
      ? `${((((approvedCount || 0) - (prevApprovedCount || 0)) / (prevApprovedCount || 1)) * 100).toFixed(0)}% from last month`
      : "+0% from last month";

    const rejectedChange = (prevRejectedCount || 0) > 0
      ? `${((((rejectedCount || 0) - (prevRejectedCount || 0)) / (prevRejectedCount || 1)) * 100).toFixed(0)}% from last month`
      : "+0% from last month";

    return NextResponse.json({
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      totalBudget: totalBudget,
      changes: {
        approved: approvedChange,
        rejected: rejectedChange,
      }
    });

  } catch (error: any) {
    console.error("Error fetching comptroller stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
