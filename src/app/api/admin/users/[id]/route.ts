// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * PATCH /api/admin/users/[id]
 * Update user role and permissions (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { id } = await params;
    const userId = id;
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

    // Update department_id if provided
    if (body.department_id !== undefined) {
      updateData.department_id = body.department_id || null;
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

    // If making user admin, ensure they have entry in admins table
    if (updateData.is_admin === true && updateData.role === "admin") {
      const { error: adminError } = await supabase
        .from("admins")
        .upsert({
          user_id: userId,
          super_admin: true,
        }, {
          onConflict: "user_id"
        });
      
      if (adminError) {
        console.error("[PATCH /api/admin/users/[id]] Error creating admin entry:", adminError);
      }
    }

    // If making user a head and department_id is provided, create department_heads mapping
    if (updateData.is_head === true && body.department_id) {
      const { error: headError } = await supabase
        .from("department_heads")
        .upsert({
          user_id: userId,
          department_id: body.department_id,
          valid_from: new Date().toISOString(),
          valid_to: null,
        }, {
          onConflict: "user_id,department_id"
        });
      
      if (headError) {
        console.error("[PATCH /api/admin/users/[id]] Error creating head mapping:", headError);
        // Don't fail the whole update if this fails
      }
    } else if (updateData.is_head === false) {
      // If removing head role, invalidate all department_heads mappings
      const { error: headError } = await supabase
        .from("department_heads")
        .update({ valid_to: new Date().toISOString() })
        .eq("user_id", userId)
        .is("valid_to", null);
      
      if (headError) {
        console.error("[PATCH /api/admin/users/[id]] Error removing head mappings:", headError);
      }
    }

    // Get current user data before update for role_grants logging
    const { data: currentUser } = await supabase
      .from("users")
      .select("role, is_head, is_hr, is_vp, is_president, is_admin")
      .eq("id", userId)
      .single();

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
        status,
        department_id
      `)
      .single();

    if (error) {
      console.error("[PATCH /api/admin/users/[id]] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Fetch department separately to avoid relationship query issues
    let department = null;
    if (updatedUser.department_id) {
      const { data: deptData } = await supabase
        .from("departments")
        .select("id, name, code")
        .eq("id", updatedUser.department_id)
        .maybeSingle();
      
      if (deptData) {
        department = {
          id: deptData.id,
          name: deptData.name,
          code: deptData.code,
        };
      }
    }

    // Add department to response
    const responseData = {
      ...updatedUser,
      department,
    };

    // Log role changes to role_grants table for audit
    const roleMapping: Record<string, string> = {
      'head': 'head',
      'hr': 'hr',
      'vp': 'vp',
      'president': 'exec', // president maps to exec in role_grants
      'admin': 'admin',
    };

    // Grant new roles
    if (updateData.role && updateData.role !== currentUser?.role) {
      const grantRole = roleMapping[updateData.role];
      if (grantRole) {
        await supabase
          .from("role_grants")
          .upsert({
            user_id: userId,
            role: grantRole,
            granted_by: profile.id,
            granted_at: new Date().toISOString(),
            revoked_at: null,
            reason: `Role changed to ${updateData.role} by super admin`,
          }, {
            onConflict: "user_id,role"
          });
      }
    }

    // Grant permission flags as roles
    const permissionRoles = [
      { flag: 'is_head', role: 'head' },
      { flag: 'is_hr', role: 'hr' },
      { flag: 'is_vp', role: 'vp' },
      { flag: 'is_president', role: 'exec' },
    ];

    for (const { flag, role } of permissionRoles) {
      const currentValue = currentUser?.[flag as keyof typeof currentUser] as boolean | undefined;
      const newValue = updateData[flag] as boolean | undefined;
      
      const wasGranted = currentValue === false && newValue === true;
      const wasRevoked = currentValue === true && newValue === false;

      if (wasGranted) {
        // Grant role
        await supabase
          .from("role_grants")
          .upsert({
            user_id: userId,
            role: role,
            granted_by: profile.id,
            granted_at: new Date().toISOString(),
            revoked_at: null,
            reason: `${flag} permission granted by super admin`,
          }, {
            onConflict: "user_id,role"
          });
      } else if (wasRevoked) {
        // Revoke role
        await supabase
          .from("role_grants")
          .update({
            revoked_at: new Date().toISOString(),
            revoked_by: profile.id,
            reason: `${flag} permission revoked by super admin`,
          })
          .eq("user_id", userId)
          .eq("role", role)
          .is("revoked_at", null);
      }
    }

    console.log("[PATCH /api/admin/users/[id]] User updated successfully:", userId);

    return NextResponse.json({
      ok: true,
      data: responseData,
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

