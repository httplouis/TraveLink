import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get driver record for current user
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ ok: false, error: "Driver not found" }, { status: 404 });
    }

    // Fetch assigned trips for this driver (upcoming and ongoing)
    const { data: trips, error: tripsError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        title,
        destination,
        departure_date,
        return_date,
        departure_time,
        status,
        purpose,
        passenger_count,
        requester_name,
        vehicles!requests_assigned_vehicle_id_fkey (
          vehicle_name,
          plate_number
        ),
        users!requests_user_id_fkey (
          full_name,
          department
        )
      `)
      .eq("assigned_driver_id", driver.id)
      .in("status", ["approved", "in_progress", "ongoing", "pending_completion"])
      .gte("departure_date", new Date().toISOString().split("T")[0])
      .order("departure_date", { ascending: true });

    if (tripsError) {
      console.error("Error fetching driver schedule:", tripsError);
      return NextResponse.json({ ok: false, error: "Failed to fetch schedule" }, { status: 500 });
    }

    // Transform data
    const formattedTrips = (trips || []).map((trip: any) => ({
      id: trip.id,
      request_number: trip.request_number || "N/A",
      title: trip.title || "Untitled Trip",
      destination: trip.destination || "N/A",
      departure_date: trip.departure_date,
      return_date: trip.return_date,
      departure_time: trip.departure_time || "",
      status: trip.status,
      purpose: trip.purpose || "",
      passenger_count: trip.passenger_count || 0,
      vehicle_name: trip.vehicles?.vehicle_name || "N/A",
      plate_number: trip.vehicles?.plate_number || "N/A",
      requester_name: trip.users?.full_name || trip.requester_name || "N/A",
      department: trip.users?.department || "N/A",
    }));

    return NextResponse.json({ ok: true, data: formattedTrips });
  } catch (error) {
    console.error("Driver schedule API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
