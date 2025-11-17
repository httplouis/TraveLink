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

    // Try to get users with department relationship and admins table (to check super_admin)
    let { data: users, error: usersError } = await supabase
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
        department_id,
        departments (
          id,
          name,
          code
        ),
        admins (
          user_id,
          super_admin
        )
      `)
      .order("created_at", { ascending: false });

    // If join fails, fallback to separate queries
    if (usersError || !users) {
      console.warn("[GET /api/admin/users] Join query failed, using fallback method:", usersError?.message);
      
      // Fallback: Get users without join
      const { data: usersData, error: usersErr } = await supabase
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

      // Get admins table data separately for fallback
      const adminUserIds = usersData?.filter(u => u.role === 'admin' || u.is_admin).map(u => u.id) || [];
      let adminsMap: Record<string, { super_admin: boolean }> = {};
      
      if (adminUserIds.length > 0) {
        const { data: adminsData } = await supabase
          .from("admins")
          .select("user_id, super_admin")
          .in("user_id", adminUserIds);
        
        if (adminsData) {
          adminsMap = adminsData.reduce((acc, a) => {
            acc[a.user_id] = { super_admin: a.super_admin || false };
            return acc;
          }, {} as Record<string, { super_admin: boolean }>);
        }
      }

      if (usersErr) {
        console.error("[GET /api/admin/users] Error fetching users:", usersErr);
        return NextResponse.json({ ok: false, error: usersErr.message }, { status: 500 });
      }

      users = usersData || [];

      // Get departments separately
      const departmentIds = users.filter(u => u.department_id).map(u => u.department_id) as string[];
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
          console.log("[GET /api/admin/users] Fetched", departments.length, "departments");
        } else if (deptError) {
          console.error("[GET /api/admin/users] Error fetching departments:", deptError);
        }
      }

      // Map users with departments and super_admin flag
      const usersWithDepts = users.map(user => {
        const adminInfo = adminsMap[user.id];
        return {
          ...user,
          department: user.department_id ? departmentsMap[user.department_id] || null : null,
          is_super_admin: adminInfo?.super_admin || false, // Add super_admin flag
        };
      });

      return NextResponse.json({
        ok: true,
        data: usersWithDepts,
      });
    }

    // Map users with their departments and super_admin flag (handle the relationship data structure)
    const usersWithDepartments = users?.map(user => {
      // Supabase returns relationship as an object (one-to-one) or array (one-to-many)
      // For department_id -> departments, it's one-to-one, so it should be an object
      const deptData = (user as any).departments;
      const department = Array.isArray(deptData) 
        ? (deptData.length > 0 ? deptData[0] : null)
        : (deptData || null);
      
      // Get super_admin from admins table relationship
      const adminsData = (user as any).admins;
      const adminInfo = Array.isArray(adminsData) 
        ? (adminsData.length > 0 ? adminsData[0] : null)
        : (adminsData || null);
      const isSuperAdmin = adminInfo?.super_admin || false;
      
      // Remove the departments and admins properties from user object and add department object
      const { departments, admins, ...userWithoutDept } = user as any;
      
      return {
        ...userWithoutDept,
        department: department,
        is_super_admin: isSuperAdmin, // Add super_admin flag
      };
    }) || [];
    
    console.log("[GET /api/admin/users] Returning", usersWithDepartments.length, "users with departments");

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

