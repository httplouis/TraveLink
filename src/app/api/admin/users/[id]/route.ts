// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/users/[id]
 * Update user role and permissions (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const userId = params.id;
    const body = await req.json();

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
    if (!profile || !profile.is_admin || profile.role !== "admin") {
      console.log(`[PATCH /api/admin/users/[id]] Access denied for user: ${profile?.email || 'unknown'}, role: ${profile?.role}, is_admin: ${profile?.is_admin}`);
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};

    if (body.role) {
      updateData.role = body.role;
    }

    // Update permission flags
    if (typeof body.is_head === "boolean") {
      updateData.is_head = body.is_head;
    }
    if (typeof body.is_admin === "boolean") {
      updateData.is_admin = body.is_admin;
    }
    if (typeof body.is_vp === "boolean") {
      updateData.is_vp = body.is_vp;
    }
    if (typeof body.is_president === "boolean") {
      updateData.is_president = body.is_president;
    }
    if (typeof body.is_hr === "boolean") {
      updateData.is_hr = body.is_hr;
    }
    if (typeof body.is_comptroller === "boolean") {
      updateData.is_comptroller = body.is_comptroller;
    }

    // Update user
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select(`
        id,
        name,
        email,
        role,
        is_head,
        is_admin,
        is_vp,
        is_president,
        is_hr,
        is_comptroller,
        status
      `)
      .single();

    if (error) {
      console.error("[PATCH /api/admin/users/[id]] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (err: any) {
    console.error("[PATCH /api/admin/users/[id]] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

