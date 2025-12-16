// src/app/api/budget/overview/route.ts
/**
 * GET /api/budget/overview
 * Get budget overview statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Get authenticated user
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, department_id, is_comptroller, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Get department filter from query
    const searchParams = req.nextUrl.searchParams;
    const departmentId = searchParams.get("department_id") || profile.department_id;

    // Get current month's date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    // Get last month's date range for trend calculation
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

    // Build query for approved requests this month
    let currentMonthQuery = supabase
      .from("requests")
      .select("total_estimated_cost, status")
      .gte("created_at", startOfMonth)
      .lte("created_at", endOfMonth);

    if (departmentId && !profile.is_comptroller && !profile.is_admin) {
      currentMonthQuery = currentMonthQuery.eq("department_id", departmentId);
    }

    const { data: currentMonthRequests } = await currentMonthQuery;

    // Calculate budget stats
    let totalBudget = 500000; // Default budget - should come from department settings
    let usedBudget = 0;
    let pendingBudget = 0;

    if (currentMonthRequests) {
      currentMonthRequests.forEach((req: any) => {
        const cost = Number(req.total_estimated_cost) || 0;
        if (req.status === "completed" || req.status === "approved" || req.status === "assigned") {
          usedBudget += cost;
        } else if (req.status !== "rejected" && req.status !== "cancelled" && req.status !== "draft") {
          pendingBudget += cost;
        }
      });
    }

    // Get last month's data for trend
    let lastMonthQuery = supabase
      .from("requests")
      .select("total_estimated_cost")
      .gte("created_at", startOfLastMonth)
      .lte("created_at", endOfLastMonth)
      .in("status", ["completed", "approved", "assigned"]);

    if (departmentId && !profile.is_comptroller && !profile.is_admin) {
      lastMonthQuery = lastMonthQuery.eq("department_id", departmentId);
    }

    const { data: lastMonthRequests } = await lastMonthQuery;
    
    let lastMonthTotal = 0;
    if (lastMonthRequests) {
      lastMonthRequests.forEach((req: any) => {
        lastMonthTotal += Number(req.total_estimated_cost) || 0;
      });
    }

    // Calculate trend
    const monthlyTrend = lastMonthTotal > 0 
      ? Math.round(((usedBudget - lastMonthTotal) / lastMonthTotal) * 100)
      : 0;

    // Get category breakdown (simplified)
    const categories = [
      { name: "Transportation", amount: Math.round(usedBudget * 0.55), color: "#3B82F6" },
      { name: "Accommodation", amount: Math.round(usedBudget * 0.25), color: "#10B981" },
      { name: "Per Diem", amount: Math.round(usedBudget * 0.20), color: "#F59E0B" },
    ];

    return NextResponse.json({
      ok: true,
      data: {
        total_budget: totalBudget,
        used_budget: usedBudget,
        pending_budget: pendingBudget,
        available_budget: Math.max(0, totalBudget - usedBudget - pendingBudget),
        monthly_trend: monthlyTrend,
        categories,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/budget/overview] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
