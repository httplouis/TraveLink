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

    // Get all users first
    const { data: users, error: usersError } = await supabase
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
        status,
        department_id
      `)
      .order("created_at", { ascending: false });

    if (usersError) {
      console.error("[GET /api/admin/users] Error fetching users:", usersError);
      return NextResponse.json({ ok: false, error: usersError.message }, { status: 500 });
    }

    // Get departments separately and map them
    const departmentIds = users?.filter(u => u.department_id).map(u => u.department_id) || [];
    let departmentsMap: Record<string, any> = {};
    
    if (departmentIds.length > 0) {
      const { data: departments, error: deptError } = await supabase
        .from("departments")
        .select("id, name, code")
        .in("id", departmentIds);
      
      if (!deptError && departments) {
        departmentsMap = departments.reduce((acc, dept) => {
          acc[dept.id] = dept;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Map users with their departments
    const usersWithDepartments = users?.map(user => ({
      ...user,
      department: user.department_id ? departmentsMap[user.department_id] || null : null,
    })) || [];

    return NextResponse.json({
      ok: true,
      data: usersWithDepartments,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/users] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

