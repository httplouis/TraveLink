// src/app/api/admin/history/stats/route.ts
/**
 * GET /api/admin/history/stats
 * Get statistics for history page
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Count completed requests
    const { count: totalRequests } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["completed", "approved"]);

    // Count completed maintenance
    const { count: totalMaintenance } = await supabase
      .from("maintenance_records")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // Calculate total maintenance cost
    const { data: maintenanceData } = await supabase
      .from("maintenance_records")
      .select("cost")
      .eq("status", "completed");

    const totalCost = (maintenanceData || []).reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0);

    // Count completed this month
    const { count: completedThisMonth } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["completed", "approved"])
      .gte("travel_end_date", monthStart);

    return NextResponse.json({
      ok: true,
      data: {
        totalRequests: totalRequests || 0,
        totalMaintenance: totalMaintenance || 0,
        totalCost,
        completedThisMonth: completedThisMonth || 0,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/admin/history/stats] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

