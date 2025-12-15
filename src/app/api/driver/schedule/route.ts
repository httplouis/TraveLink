import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Use regular client for auth
    const authSupabase = await createSupabaseServerClient(false);

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client to bypass RLS for fetching schedule
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ ok: false, error: "Missing Supabase configuration" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // First get the user profile to get the users table ID
    const { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !userProfile) {
      console.error("[Driver Schedule] User profile not found:", userError);
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    console.log(`[Driver Schedule] Fetching schedule for driver: ${userProfile.name} (${userProfile.id})`);

    // Fetch assigned trips for this driver (upcoming and ongoing)
    // Use service role to bypass RLS
    const today = new Date().toISOString().split("T")[0];
    const { data: trips, error: tripsError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        destination,
        travel_start_date,
        travel_end_date,
        status,
        purpose,
        requester_name,
        requester_id,
        assigned_vehicle_id,
        department_id,
        pickup_location,
        pickup_time,
        pickup_contact_number,
        pickup_special_instructions,
        transportation_type,
        requester_contact_number
      `)
      .eq("assigned_driver_id", userProfile.id)
      .eq("status", "approved")
      .gte("travel_start_date", today)
      .order("travel_start_date", { ascending: true });

    if (tripsError) {
      console.error("[Driver Schedule] Error fetching trips:", tripsError);
      return NextResponse.json({ ok: false, error: "Failed to fetch schedule" }, { status: 500 });
    }

    console.log(`[Driver Schedule] Found ${trips?.length || 0} trips for driver ${userProfile.id}`);

    // Fetch vehicle, department, and requester info separately
    const vehicleIds = [...new Set((trips || []).map((t: any) => t.assigned_vehicle_id).filter(Boolean))];
    const departmentIds = [...new Set((trips || []).map((t: any) => t.department_id).filter(Boolean))];
    const requesterIds = [...new Set((trips || []).map((t: any) => t.requester_id).filter(Boolean))];

    const [vehiclesResult, departmentsResult, requestersResult] = await Promise.all([
      vehicleIds.length > 0
        ? supabase.from("vehicles").select("id, vehicle_name, plate_number").in("id", vehicleIds)
        : Promise.resolve({ data: [], error: null }),
      departmentIds.length > 0
        ? supabase.from("departments").select("id, name").in("id", departmentIds)
        : Promise.resolve({ data: [], error: null }),
      requesterIds.length > 0
        ? supabase.from("users").select("id, name, email, phone_number").in("id", requesterIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const vehicleMap = new Map((vehiclesResult.data || []).map((v: any) => [v.id, v]));
    const departmentMap = new Map((departmentsResult.data || []).map((d: any) => [d.id, d]));
    const requesterMap = new Map((requestersResult.data || []).map((r: any) => [r.id, r]));

    // Transform data with all important details for drivers
    const formattedTrips = (trips || []).map((trip: any) => {
      const vehicle = vehicleMap.get(trip.assigned_vehicle_id);
      const department = departmentMap.get(trip.department_id);
      const requester = requesterMap.get(trip.requester_id);
      
      // Format pickup time (convert from HH:MM:SS to readable format)
      let formattedPickupTime = "";
      if (trip.pickup_time) {
        try {
          const [hours, minutes] = trip.pickup_time.split(":");
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? "PM" : "AM";
          const hour12 = hour % 12 || 12;
          formattedPickupTime = `${hour12}:${minutes} ${ampm}`;
        } catch {
          formattedPickupTime = trip.pickup_time;
        }
      }
      
      return {
        id: trip.id,
        request_number: trip.request_number || "N/A",
        title: trip.purpose || "Travel Order",
        destination: trip.destination || "N/A",
        departure_date: trip.travel_start_date,
        return_date: trip.travel_end_date,
        departure_time: formattedPickupTime || "TBD",
        status: trip.status,
        purpose: trip.purpose || "",
        passenger_count: 0,
        vehicle_name: vehicle?.vehicle_name || "N/A",
        plate_number: vehicle?.plate_number || "N/A",
        requester_name: trip.requester_name || "N/A",
        department: department?.name || "N/A",
        // Additional important details for drivers
        pickup_location: trip.pickup_location || null,
        pickup_time: formattedPickupTime || null,
        pickup_contact_number: trip.pickup_contact_number || trip.requester_contact_number || requester?.phone_number || null,
        pickup_special_instructions: trip.pickup_special_instructions || null,
        transportation_type: trip.transportation_type || null,
        requester_email: requester?.email || null,
        requester_phone: trip.requester_contact_number || requester?.phone_number || null,
      };
    });

    console.log(`[Driver Schedule] Returning ${formattedTrips.length} formatted trips`);

    return NextResponse.json({ ok: true, data: formattedTrips });
  } catch (error) {
    console.error("[Driver Schedule] API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
