// src/app/api/super-admin/role-grants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/super-admin/role-grants
 * Get all role grants with user information (Super Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);

    // Check if user is super admin
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS completely)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        ok: false,
        error: "Missing Supabase configuration"
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin, email")
      .eq("auth_user_id", authUser.id)
      .single();

    if (!profile || !profile.is_admin || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Get all role grants with user info
    const { data: grants, error: grantsError } = await supabase
      .from("role_grants")
      .select(`
        id,
        user_id,
        role,
        granted_by,
        granted_at,
        revoked_at,
        revoked_by,
        reason
      `)
      .order("granted_at", { ascending: false });

    if (grantsError) {
      console.error("[GET /api/super-admin/role-grants] Error:", grantsError);
      return NextResponse.json({ ok: false, error: grantsError.message }, { status: 500 });
    }

    // Get unique user IDs and granted_by/revoked_by IDs
    const userIds = new Set<string>();
    grants?.forEach((grant) => {
      if (grant.user_id) userIds.add(grant.user_id);
      if (grant.granted_by) userIds.add(grant.granted_by);
      if (grant.revoked_by) userIds.add(grant.revoked_by);
    });

    // Fetch all users
    let usersMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", Array.from(userIds));

      if (!usersError && users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Map grants with user info
    const grantsWithUsers = grants?.map((grant) => ({
      ...grant,
      user: usersMap[grant.user_id] || null,
      granted_by_user: grant.granted_by ? usersMap[grant.granted_by] || null : null,
      revoked_by_user: grant.revoked_by ? usersMap[grant.revoked_by] || null : null,
    })) || [];

    return NextResponse.json({
      ok: true,
      data: grantsWithUsers,
    });
  } catch (err: any) {
    console.error("[GET /api/super-admin/role-grants] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

