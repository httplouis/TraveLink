import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/helpers";

/**
 * Approve or reject a head role request
 * Only superadmin can approve/reject
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const requestId = resolvedParams.id;

    // First, get authenticated user using regular client (has access to cookies/session)
    const supabase = await createSupabaseServerClient(false);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and check if superadmin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, role, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    const isSuperAdmin = profile.role === "admin" && profile.is_admin === true;
    if (!isSuperAdmin) {
      return NextResponse.json({ 
        ok: false, 
        error: "Forbidden: Superadmin only" 
      }, { status: 403 });
    }

    // Now use service role client for database operations that need elevated permissions
    const supabaseServiceRole = await createSupabaseServerClient(true);

    // Parse request body
    const body = await req.json();
    const { action, comments } = body; // action: "approve" | "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid action. Must be 'approve' or 'reject'" 
      }, { status: 400 });
    }

    // Get the request (using service role for RLS bypass)
    const { data: request, error: requestError } = await supabaseServiceRole
      .from("head_role_requests")
      .select(`
        *,
        user:users!head_role_requests_user_id_fkey(
          id,
          name,
          email,
          role,
          is_head,
          department_id
        ),
        department:departments(
          id,
          name,
          code
        )
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ 
        ok: false, 
        error: "Request not found" 
      }, { status: 404 });
    }

    // Check if already reviewed
    if (request.status !== "pending") {
      return NextResponse.json({ 
        ok: false, 
        error: `Request already ${request.status}` 
      }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Update request status (using service role for RLS bypass)
    const { error: updateError } = await supabaseServiceRole
      .from("head_role_requests")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile.id,
        review_comments: comments || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("[head-role-requests/approve] Error updating request:", updateError);
      return NextResponse.json({ 
        ok: false, 
        error: updateError.message || "Failed to update request" 
      }, { status: 500 });
    }

    // Create notification for the user
    try {
      const targetUserId = request.user_id;
      const userName = request.user?.name || request.user?.email || "User";
      const departmentName = request.department?.name || request.department?.code || "department";
      
      if (action === "approve") {
        await createNotification({
          user_id: targetUserId,
          notification_type: "head_role_approved",
          title: "Head Role Request Approved",
          message: `Your request to become a department head${request.department_id ? ` for ${departmentName}` : ""} has been approved. You now have head role privileges.`,
          related_type: "head_role_request",
          related_id: requestId,
          action_url: "/user/request-head-role",
          action_label: "View Request",
          priority: "high",
        });
      } else {
        // Rejected
        await createNotification({
          user_id: targetUserId,
          notification_type: "head_role_rejected",
          title: "Head Role Request Rejected",
          message: `Your request to become a department head${request.department_id ? ` for ${departmentName}` : ""} has been rejected.${comments ? ` Reason: ${comments}` : ""}`,
          related_type: "head_role_request",
          related_id: requestId,
          action_url: "/user/request-head-role",
          action_label: "View Request",
          priority: "high",
        });
      }
    } catch (notifError) {
      // Don't fail the request if notification fails
      console.error("[head-role-requests/approve] Failed to create notification:", notifError);
    }

    // If approved, update user role and create department_heads mapping
    if (action === "approve") {
      const targetUserId = request.user_id;
      const departmentId = request.department_id;
      const currentUserRole = request.user?.role || "faculty";
      const currentIsHead = request.user?.is_head || false;

      // Update user role to head
      const updateData: any = {
        role: "head",
        is_head: true,
      };

      // Update department_id if provided
      if (departmentId) {
        updateData.department_id = departmentId;
      }

      const { error: userUpdateError } = await supabaseServiceRole
        .from("users")
        .update(updateData)
        .eq("id", targetUserId);

      if (userUpdateError) {
        console.error("[head-role-requests/approve] Error updating user:", userUpdateError);
        return NextResponse.json({ 
          ok: false, 
          error: userUpdateError.message || "Failed to update user role" 
        }, { status: 500 });
      }

      // Revoke old role grant if exists
      if (currentUserRole && currentUserRole !== "head") {
        const roleMapping: Record<string, string> = {
          'head': 'head',
          'hr': 'hr',
          'vp': 'exec',
          'president': 'exec',
          'admin': 'admin',
          'comptroller': 'comptroller',
          'faculty': 'faculty',
          'staff': 'staff',
          'driver': 'driver',
        };
        
        const oldGrantRole = roleMapping[currentUserRole];
        if (oldGrantRole) {
          // Revoke existing old role grant if it's still active
          await supabaseServiceRole
            .from("role_grants")
            .update({
              revoked_at: new Date().toISOString(),
              revoked_by: profile.id,
              reason: `Role changed from ${currentUserRole} to head via request approval`,
            })
            .eq("user_id", targetUserId)
            .eq("role", oldGrantRole)
            .is("revoked_at", null);
        }
      }

      // Create new role grant for audit trail
      const { error: grantError } = await supabaseServiceRole
        .from("role_grants")
        .upsert({
          user_id: targetUserId,
          role: "head",
          granted_by: profile.id,
          granted_at: new Date().toISOString(),
          revoked_at: null,
          reason: `Head role granted via request approval (Request ID: ${requestId})`,
        }, {
          onConflict: "user_id,role"
        });

      if (grantError) {
        console.error("[head-role-requests/approve] Error creating role grant:", grantError);
        // Don't fail the request, but log the error
      }

      // Create department_heads mapping if department_id is provided
      if (departmentId) {
        // Check if mapping already exists
        const { data: existingMapping } = await supabaseServiceRole
          .from("department_heads")
          .select("id")
          .eq("department_id", departmentId)
          .eq("user_id", targetUserId)
          .is("valid_to", null)
          .maybeSingle();

        if (!existingMapping) {
          const { error: mappingError } = await supabaseServiceRole
            .from("department_heads")
            .insert({
              department_id: departmentId,
              user_id: targetUserId,
              is_primary: true,
              valid_from: new Date().toISOString(),
              created_by: profile.id,
            });

          if (mappingError) {
            console.error("[head-role-requests/approve] Error creating department_heads mapping:", mappingError);
            // Don't fail the request, but log the error
          }
        }
      }

      // Log to audit_logs
      await supabaseServiceRole.from("audit_logs").insert({
        action: "head_role_granted",
        user_id: targetUserId,
        entity_type: "head_role_request",
        entity_id: requestId,
        old_value: { role: currentUserRole, is_head: currentIsHead },
        new_value: { role: "head", is_head: true, department_id: departmentId, granted_by: profile.id },
      }).catch((err) => {
        // Don't fail the request if audit log fails
        console.error("[head-role-requests/approve] Audit log insert failed:", err);
      });
    }

    return NextResponse.json({
      ok: true,
      message: `Request ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error: any) {
    console.error("[head-role-requests/approve] Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}

