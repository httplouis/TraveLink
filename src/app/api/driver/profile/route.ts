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
      .select("id, name, email, employee_id, department, role")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !userProfile) {
      console.error("User profile not found:", userError);
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    // Get driver record using the users table ID
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("user_id, license_no, license_expiry, driver_rating, phone, address")
      .eq("user_id", userProfile.id)
      .single();

    if (driverError || !driver) {
      // If no driver record, return basic user info
      return NextResponse.json({
        ok: true,
        data: {
          full_name: userProfile.name || "Driver",
          email: userProfile.email || user.email,
          employee_id: userProfile.employee_id || "N/A",
          license_number: "N/A",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        full_name: userProfile.name || "Driver",
        email: userProfile.email || user.email,
        employee_id: userProfile.employee_id || "N/A",
        license_number: driver.license_no || "N/A",
        license_expiry: driver.license_expiry,
        phone: driver.phone,
        rating: driver.driver_rating,
      },
    });
  } catch (error) {
    console.error("Driver profile API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
