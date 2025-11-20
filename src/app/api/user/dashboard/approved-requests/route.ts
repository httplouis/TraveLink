// src/app/api/user/dashboard/approved-requests/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/user/dashboard/approved-requests
 * Get recently approved requests for the logged-in user
 */
export async function GET() {
  try {
    // Use anon client for auth
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role for queries
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

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, department_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const userId = profile.id;

    // Get recently approved requests (submitted by or requested by user)
    const { data: approvedRequests, error: requestsError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        file_code,
        status,
        destination,
        purpose,
        travel_start_date,
        travel_end_date,
        total_budget,
        president_approved_at,
        final_approved_at,
        created_at,
        updated_at,
        department:departments!department_id(code, name)
      `)
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .eq("status", "approved")
      .order("president_approved_at", { ascending: false, nullsFirst: false })
      .order("final_approved_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false })
      .limit(5);

    if (requestsError) {
      console.error("[GET /api/user/dashboard/approved-requests] Error:", requestsError);
      return NextResponse.json({ ok: false, error: requestsError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: approvedRequests || [],
    });
  } catch (err: any) {
    console.error("[GET /api/user/dashboard/approved-requests] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

