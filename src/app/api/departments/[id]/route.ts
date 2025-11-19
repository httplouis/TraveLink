// src/app/api/departments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/departments/[id]
 * Get a single department by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const deptId = params.id;

    const { data, error } = await supabase
      .from("departments")
      .select("id, code, name, type, parent_department_id")
      .eq("id", deptId)
      .single();

    if (error) {
      console.error("[GET /api/departments/[id]] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Department not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, department: data });
  } catch (err: any) {
    console.error("[GET /api/departments/[id]] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/departments/[id]
 * Update a department (Super Admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const deptId = params.id;
    const body = await req.json();

    // Check if user is super admin
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role, is_admin")
      .eq("auth_user_id", authUser.id)
      .single();

    if (!profile || !profile.is_admin || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};

    if (body.name) {
      updateData.name = body.name;
    }
    if (body.code) {
      updateData.code = body.code.toUpperCase();
    }
    if (body.type) {
      updateData.type = body.type;
    }
    if (body.parent_department_id !== undefined) {
      updateData.parent_department_id = body.parent_department_id || null;
    }

    // Get current department data before update
    const { data: currentDept } = await supabase
      .from("departments")
      .select("id, code, name, type, parent_department_id")
      .eq("id", deptId)
      .single();

    // Update department
    const { data: updatedDept, error } = await supabase
      .from("departments")
      .update(updateData)
      .eq("id", deptId)
      .select("id, code, name, type, parent_department_id")
      .single();

    if (error) {
      console.error("[PATCH /api/departments/[id]] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Log to audit_logs
    try {
      const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                       req.headers.get("x-real-ip") || null;
      const userAgent = req.headers.get("user-agent") || null;

      const auditData: any = {
        user_id: profile.id,
        action: "update",
        entity_type: "department",
        entity_id: deptId,
        old_value: currentDept,
        new_value: updatedDept,
        user_agent: userAgent,
      };

      if (ipAddress && ipAddress.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        auditData.ip_address = ipAddress;
      }

      await supabase.from("audit_logs").insert(auditData);
    } catch (auditErr: any) {
      console.error("[PATCH /api/departments/[id]] Failed to log to audit_logs:", auditErr);
      // Don't fail the operation if audit logging fails
    }

    return NextResponse.json({
      ok: true,
      department: updatedDept,
      message: "Department updated successfully",
    });
  } catch (err: any) {
    console.error("[PATCH /api/departments/[id]] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/departments/[id]
 * Delete a department (Super Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const deptId = params.id;

    // Check if user is super admin
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role, is_admin")
      .eq("auth_user_id", authUser.id)
      .single();

    if (!profile || !profile.is_admin || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Check if department has children
    const { data: children } = await supabase
      .from("departments")
      .select("id")
      .eq("parent_department_id", deptId)
      .limit(1);

    if (children && children.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Cannot delete department with child departments. Please remove or reassign child departments first." },
        { status: 400 }
      );
    }

    // Get department data before deletion for audit log
    const { data: deptToDelete } = await supabase
      .from("departments")
      .select("id, code, name, type, parent_department_id")
      .eq("id", deptId)
      .single();

    // Check if department has users
    const { data: users } = await supabase
      .from("users")
      .select("id")
      .eq("department_id", deptId)
      .limit(1);

    if (users && users.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Cannot delete department with assigned users. Please reassign users first." },
        { status: 400 }
      );
    }

    // Delete department
    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", deptId);

    if (error) {
      console.error("[DELETE /api/departments/[id]] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Log to audit_logs
    try {
      const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                       req.headers.get("x-real-ip") || null;
      const userAgent = req.headers.get("user-agent") || null;

      const auditData: any = {
        user_id: profile.id,
        action: "delete",
        entity_type: "department",
        entity_id: deptId,
        old_value: deptToDelete,
        user_agent: userAgent,
      };

      if (ipAddress && ipAddress.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        auditData.ip_address = ipAddress;
      }

      await supabase.from("audit_logs").insert(auditData);
    } catch (auditErr: any) {
      console.error("[DELETE /api/departments/[id]] Failed to log to audit_logs:", auditErr);
      // Don't fail the operation if audit logging fails
    }

    return NextResponse.json({
      ok: true,
      message: "Department deleted successfully",
    });
  } catch (err: any) {
    console.error("[DELETE /api/departments/[id]] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

