// src/app/api/admin/completed-trips/route.ts
/**
 * GET /api/admin/completed-trips
 * Get all completed/approved trips for admin to generate feedback QR codes
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Only admin can access this
    if (!profile.is_admin) {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    // Get all approved requests (completed trips)
    // A trip is considered completed if:
    // 1. Status is "approved"
    // 2. travel_end_date has passed (trip is over)
    const now = new Date().toISOString();
    
    const { data: completedTrips, error } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        requester_name,
        destination,
        travel_start_date,
        travel_end_date,
        status,
        created_at,
        department:departments!department_id(id, code, name)
      `)
      .eq("status", "approved")
      .lte("travel_end_date", now) // Trip has ended
      .order("travel_end_date", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[GET /api/admin/completed-trips] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: completedTrips || [],
      count: completedTrips?.length || 0
    });

  } catch (error: any) {
    console.error("[GET /api/admin/completed-trips] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch completed trips" },
      { status: 500 }
    );
  }
}

