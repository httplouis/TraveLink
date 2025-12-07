// src/app/api/driver/dashboard/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/driver/dashboard
 * Get driver dashboard data including metrics, upcoming trips, and feedback summary
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get driver profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, is_driver, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || (!profile.is_driver && profile.role !== "driver")) {
      return NextResponse.json({ ok: false, error: "Driver profile not found" }, { status: 404 });
    }

    const driverId = profile.id;

    // Get assigned requests/trips
    const { data: assignedRequests } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        travel_start_date,
        travel_end_date,
        destination,
        status,
        assigned_vehicle:vehicles(id, vehicle_name, model, plate_number),
        requester:users!requester_id(name, email)
      `)
      .eq("assigned_driver_id", driverId)
      .in("status", ["approved", "pending_admin", "pending_comptroller", "pending_hr", "pending_vp", "pending_exec"])
      .order("travel_start_date", { ascending: true });

    // Calculate metrics
    const now = new Date();
    const upcomingTrips = (assignedRequests || []).filter((req: any) => {
      if (!req.travel_start_date) return false;
      const tripDate = new Date(req.travel_start_date);
      return tripDate >= now;
    });

    const completedTrips = (assignedRequests || []).filter((req: any) => {
      return req.status === "completed";
    });

    const metrics = {
      trips: assignedRequests?.length || 0,
      online: 1, // TODO: Get from driver status table if exists
      pending: upcomingTrips.length,
    };

    // Format upcoming trips
    const upcoming = upcomingTrips.slice(0, 5).map((req: any) => ({
      id: req.id,
      date: req.travel_start_date ? new Date(req.travel_start_date).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Manila'
      }) : "",
      location: req.destination || "Unknown",
      vehicle: req.assigned_vehicle 
        ? `${req.assigned_vehicle.vehicle_name || req.assigned_vehicle.model || 'Vehicle'} (${req.assigned_vehicle.plate_number || ''})`
        : "Not assigned",
      status: req.status === "approved" ? "Approved" as const : "Pending" as const,
    }));

    // Get feedback summary
    const { data: feedbackData } = await supabase
      .from("feedback")
      .select("rating, message, created_at, user_name")
      .eq("driver_id", driverId)
      .order("created_at", { ascending: false })
      .limit(10);

    const feedbackSummary = {
      total: feedbackData?.length || 0,
      averageRating: feedbackData && feedbackData.length > 0
        ? (feedbackData.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedbackData.filter((f: any) => f.rating).length).toFixed(1)
        : "0.0",
      recentFeedback: feedbackData?.slice(0, 3).map((f: any) => ({
        rating: f.rating,
        message: f.message,
        userName: f.user_name,
        date: f.created_at,
      })) || [],
    };

    return NextResponse.json({
      ok: true,
      data: {
        metrics,
        upcoming,
        feedbackSummary,
      }
    });
  } catch (err: any) {
    console.error("[GET /api/driver/dashboard] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

