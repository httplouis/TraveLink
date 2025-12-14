import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // First get the user profile to get the users table ID
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    // Fetch completed trips for this driver
    const { data: trips, error: tripsError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        title,
        destination,
        departure_date,
        return_date,
        status,
        completed_date,
        vehicles!requests_assigned_vehicle_id_fkey (
          vehicle_name,
          plate_number
        ),
        users!requests_user_id_fkey (
          name,
          department
        ),
        feedback (
          rating,
          message
        )
      `)
      .eq("assigned_driver_id", userProfile.id)
      .eq("status", "completed")
      .order("completed_date", { ascending: false })
      .limit(50);

    if (tripsError) {
      console.error("Error fetching driver history:", tripsError);
      return NextResponse.json({ ok: false, error: "Failed to fetch history" }, { status: 500 });
    }

    // Transform data
    const formattedTrips = (trips || []).map((trip: any) => {
      // Get the first feedback if exists
      const feedback = Array.isArray(trip.feedback) ? trip.feedback[0] : trip.feedback;
      
      return {
        id: trip.id,
        request_number: trip.request_number || "N/A",
        title: trip.title || "Untitled Trip",
        destination: trip.destination || "N/A",
        departure_date: trip.departure_date,
        return_date: trip.return_date,
        status: trip.status,
        completed_at: trip.completed_date,
        vehicle_name: trip.vehicles?.vehicle_name || "N/A",
        plate_number: trip.vehicles?.plate_number || "N/A",
        requester_name: trip.users?.name || "N/A",
        department: trip.users?.department || "N/A",
        feedback_rating: feedback?.rating || null,
        feedback_comment: feedback?.message || null,
      };
    });

    return NextResponse.json({ ok: true, data: formattedTrips });
  } catch (error) {
    console.error("Driver history API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
