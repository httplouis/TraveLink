import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Get head role requests
 * - Regular users: Get their own requests
 * - Superadmin: Get all requests
 */
export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient(false);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    const isSuperAdmin = profile.role === "admin" && profile.is_admin === true;

    // Get status filter from query params
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    // Build query
    let query = supabase
      .from("head_role_requests")
      .select(`
        *,
        user:users!head_role_requests_user_id_fkey(
          id,
          name,
          email,
          department_id,
          department:departments(id, name, code)
        ),
        department:departments(id, name, code),
        reviewer:users!head_role_requests_reviewed_by_fkey(
          id,
          name,
          email
        )
      `)
      .order("requested_at", { ascending: false });

    // Filter by user if not superadmin
    if (!isSuperAdmin) {
      query = query.eq("user_id", profile.id);
    }

    // Filter by status if provided
    if (statusFilter && (statusFilter === "pending" || statusFilter === "approved" || statusFilter === "rejected")) {
      query = query.eq("status", statusFilter);
    }

    const { data: requests, error: fetchError } = await query;

    if (fetchError) {
      console.error("[head-role-requests] Error fetching requests:", fetchError);
      return NextResponse.json({ 
        ok: false, 
        error: fetchError.message || "Failed to fetch requests" 
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: requests || [],
    });
  } catch (error: any) {
    console.error("[head-role-requests] Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}

