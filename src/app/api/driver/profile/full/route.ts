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
      .select("id, name, email, employee_id, department, phone")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    // Get driver record using the users table ID
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("user_id, license_no, license_expiry, driver_rating, phone, address")
      .eq("user_id", userProfile.id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ ok: false, error: "Driver record not found" }, { status: 404 });
    }

    // Get assigned vehicles from fully approved upcoming trips only
    const { data: assignedVehicles } = await supabase
      .from("requests")
      .select(`
        vehicles!requests_assigned_vehicle_id_fkey (
          id,
          vehicle_name,
          plate_number,
          type
        )
      `)
      .eq("assigned_driver_id", userProfile.id)
      .eq("status", "approved")
      .not("assigned_vehicle_id", "is", null);

    // Get unique vehicles
    const vehicleMap = new Map();
    (assignedVehicles || []).forEach((r: any) => {
      const vehicle = r.vehicles;
      if (vehicle && !vehicleMap.has(vehicle.id)) {
        vehicleMap.set(vehicle.id, {
          vehicle_name: vehicle.vehicle_name,
          plate_number: vehicle.plate_number,
          type: vehicle.type,
        });
      }
    });

    // Get stats
    const { count: totalTrips } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("assigned_driver_id", userProfile.id);

    const { count: completedTrips } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("assigned_driver_id", userProfile.id)
      .eq("status", "completed");

    // Use driver_rating from drivers table
    const avgRating = driver.driver_rating 
      ? parseFloat(driver.driver_rating).toFixed(1) 
      : "N/A";

    return NextResponse.json({
      ok: true,
      data: {
        full_name: userProfile.name || "Driver",
        email: userProfile.email || user.email,
        employee_id: userProfile.employee_id || "N/A",
        phone: driver.phone || userProfile.phone || "N/A",
        license_number: driver.license_no || "N/A",
        license_expiry: driver.license_expiry,
        status: "active",
        department: userProfile.department || "Transport Services",
        assigned_vehicles: Array.from(vehicleMap.values()),
        stats: {
          total_trips: totalTrips || 0,
          completed_trips: completedTrips || 0,
          avg_rating: avgRating,
        },
      },
    });
  } catch (error) {
    console.error("Driver full profile API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
