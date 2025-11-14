// src/app/api/drivers/assignments/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/drivers/assignments
 * Fetch driver assignments for calendar display
 * Query params: startDate, endDate (optional, defaults to current month)
 */
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Default to current month if not provided
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: assignments, error } = await supabase
      .from("requests")
      .select(`
        id,
        assigned_driver_id,
        travel_start_date,
        travel_end_date,
        destination,
        purpose,
        status,
        driver:users!assigned_driver_id(id, name)
      `)
      .not("assigned_driver_id", "is", null)
      .gte("travel_start_date", startDate || defaultStart)
      .lte("travel_end_date", endDate || defaultEnd)
      .in("status", ["approved", "pending", "pending_comptroller", "pending_hr", "pending_exec"]);

    if (error) {
      console.error("[API /drivers/assignments] Error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform to calendar-friendly format
    const calendarAssignments = (assignments || []).map((assignment: any) => {
      const start = new Date(assignment.travel_start_date);
      const end = new Date(assignment.travel_end_date);
      const dates: string[] = [];
      
      // Generate all dates in the range
      const current = new Date(start);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }

      return {
        id: assignment.id,
        driverId: assignment.assigned_driver_id,
        driverName: assignment.driver?.name || 'Unknown Driver',
        dates,
        destination: assignment.destination,
        purpose: assignment.purpose,
        status: assignment.status,
      };
    });

    return NextResponse.json({ ok: true, data: calendarAssignments });
  } catch (err: any) {
    console.error("[API /drivers/assignments] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

