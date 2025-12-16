// src/app/api/admin/feedback-with-trips/route.ts
/**
 * Admin API - Feedback with Trip Details
 * Fetches feedback with complete trip information
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    // Use regular client for auth check
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role for database operations
    const supabase = await createSupabaseServerClient(true);

    const { data: profile } = await supabase
      .from("users")
      .select("id, email, role, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph"];
    const isAdmin = profile.is_admin || profile.role === 'admin' || adminEmails.includes(profile.email || "");
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");
    
    // Fetch feedback
    let query = supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (status) {
      query = query.eq("status", status);
    }
    
    const { data: feedbackData, error: feedbackError } = await query;
    
    if (feedbackError) {
      console.error("[GET /api/admin/feedback-with-trips] Feedback error:", feedbackError);
      return NextResponse.json({ ok: false, error: feedbackError.message }, { status: 500 });
    }
    
    // Get unique trip IDs
    const tripIds = [...new Set(
      (feedbackData || [])
        .filter((f: any) => f.trip_id)
        .map((f: any) => f.trip_id)
    )];
    
    // Fetch trip details if there are any trip IDs
    let tripsMap: Record<string, any> = {};
    if (tripIds.length > 0) {
      const { data: tripsData, error: tripsError } = await supabase
        .from("requests")
        .select(`
          id,
          request_number,
          title,
          purpose,
          destination,
          travel_start_date,
          travel_end_date,
          requester_name,
          status,
          department:departments(id, name, code),
          assigned_driver:users!requests_assigned_driver_id_fkey(id, name, email),
          assigned_vehicle:vehicles(id, plate_number, vehicle_name, type)
        `)
        .in("id", tripIds);
      
      if (!tripsError && tripsData) {
        tripsData.forEach((trip: any) => {
          tripsMap[trip.id] = trip;
        });
      }
    }
    
    // Merge feedback with trip details
    const enrichedFeedback = (feedbackData || []).map((f: any) => ({
      ...f,
      trip: f.trip_id ? tripsMap[f.trip_id] || null : null,
    }));
    
    return NextResponse.json({ ok: true, data: enrichedFeedback });
  } catch (err: any) {
    console.error("[GET /api/admin/feedback-with-trips] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
