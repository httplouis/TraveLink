// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);

    // Check if user is admin
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin, email")
      .eq("auth_user_id", authUser.id)
      .single();

    // Only super admins (users with is_admin=true AND role='admin') can manage users
    // This is more restrictive than regular admin access
    if (!profile || !profile.is_admin || profile.role !== "admin") {
      console.log(`[GET /api/admin/users] Access denied for user: ${profile?.email || 'unknown'}, role: ${profile?.role}, is_admin: ${profile?.is_admin}`);
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Get all users with department info
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        phone_number,
        position_title,
        role,
        is_head,
        is_admin,
        is_vp,
        is_president,
        is_hr,
        is_comptroller,
        status,
        department_id,
        department:departments!users_department_id_fkey(
          id,
          name,
          code
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/admin/users] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: users || [],
    });
  } catch (err: any) {
    console.error("[GET /api/admin/users] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

