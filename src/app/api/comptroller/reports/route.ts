// src/app/api/comptroller/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get last 5 months data
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 4; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
      
      // Get approved count
      const { count: approved } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .not("comptroller_approved_at", "is", null)
        .gte("comptroller_approved_at", monthStart.toISOString())
        .lte("comptroller_approved_at", monthEnd.toISOString());

      // Get rejected count
      const { count: rejected } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .not("comptroller_rejected_at", "is", null)
        .gte("comptroller_rejected_at", monthStart.toISOString())
        .lte("comptroller_rejected_at", monthEnd.toISOString());

      // Get total budget
      const { data: budgetData } = await supabase
        .from("requests")
        .select("total_budget, comptroller_edited_budget")
        .or(
          `comptroller_approved_at.gte.${monthStart.toISOString()},comptroller_rejected_at.gte.${monthStart.toISOString()}`
        )
        .or(
          `comptroller_approved_at.lte.${monthEnd.toISOString()},comptroller_rejected_at.lte.${monthEnd.toISOString()}`
        );

      const totalBudget = budgetData?.reduce((sum, req) => {
        const budget = req.comptroller_edited_budget || req.total_budget || 0;
        return sum + Number(budget);
      }, 0) || 0;

      monthlyData.push({
        month: monthDate.toLocaleString('default', { month: 'short' }),
        approved: approved || 0,
        rejected: rejected || 0,
        totalBudget,
      });
    }

    // Get department stats
    const { data: deptData } = await supabase
      .from("requests")
      .select(`
        department:department_id (
          code,
          name
        ),
        total_budget,
        comptroller_edited_budget,
        comptroller_approved_at,
        comptroller_rejected_at
      `)
      .or("comptroller_approved_at.not.is.null,comptroller_rejected_at.not.is.null");

    // Group by department
    const deptMap = new Map<string, { approved: number; rejected: number; budget: number }>();
    
    deptData?.forEach((req) => {
      const deptCode = req.department && typeof req.department === 'object' && 'code' in req.department 
        ? (req.department as any).code 
        : "Unknown";
      
      if (!deptMap.has(deptCode)) {
        deptMap.set(deptCode, { approved: 0, rejected: 0, budget: 0 });
      }
      
      const stats = deptMap.get(deptCode)!;
      const budget = req.comptroller_edited_budget || req.total_budget || 0;
      
      if (req.comptroller_approved_at) {
        stats.approved++;
      } else if (req.comptroller_rejected_at) {
        stats.rejected++;
      }
      
      stats.budget += Number(budget);
    });

    // Convert to array and sort by budget
    const departmentStats = Array.from(deptMap.entries())
      .map(([dept, stats]) => ({
        dept,
        approved: stats.approved,
        rejected: stats.rejected,
        budget: stats.budget,
      }))
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 10); // Top 10 departments

    return NextResponse.json({
      monthlyData,
      departmentStats,
    });

  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
