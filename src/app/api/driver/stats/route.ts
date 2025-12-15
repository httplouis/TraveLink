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

    // Use service role client to bypass RLS
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
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json({
        ok: true,
        data: { upcoming: 0, completed: 0, avgRating: "N/A" },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Count upcoming trips - only fully approved requests
    // Use travel_start_date instead of departure_date
    const { count: upcomingCount } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("assigned_driver_id", userProfile.id)
      .eq("status", "approved")
      .gte("travel_start_date", today);

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

    console.log(`[Driver Stats] Driver ${userProfile.id}: upcoming=${upcomingCount}, completed=${completedCount}, rating=${avgRating}`);

    return NextResponse.json({
      ok: true,
      data: {
        upcoming: upcomingCount || 0,
        completed: completedCount || 0,
        avgRating,
      },
    });
  } catch (error) {
    console.error("[Driver Stats] API error:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
