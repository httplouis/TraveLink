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
      return NextResponse.json({
        ok: true,
        data: { upcoming: 0, completed: 0, avgRating: "N/A" },
      });
    }

    // Count upcoming trips - only fully approved requests
    const { count: upcomingCount } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("assigned_driver_id", userProfile.id)
      .eq("status", "approved")
      .gte("departure_date", new Date().toISOString().split("T")[0]);

    // Count completed trips
    const { count: completedCount } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("assigned_driver_id", userProfile.id)
      .eq("status", "completed");

    // Get average rating from drivers table
    const { data: driverData } = await supabase
      .from("drivers")
      .select("driver_rating")
      .eq("user_id", userProfile.id)
      .single();

    const avgRating = driverData?.driver_rating 
      ? parseFloat(driverData.driver_rating).toFixed(1) 
      : "N/A";

    return NextResponse.json({
      ok: true,
      data: {
        upcoming: upcomingCount || 0,
        completed: completedCount || 0,
        avgRating,
      },
    });
  } catch (error) {
    console.error("Driver stats API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
