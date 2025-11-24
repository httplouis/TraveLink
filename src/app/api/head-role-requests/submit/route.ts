import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/helpers";

/**
 * Submit a head role request
 * Any authenticated user can request to become a head
 */
export async function POST(req: Request) {
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
      .select("id, role, is_head")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    // Check if user is already a head
    if (profile.is_head === true || profile.role === "head") {
      return NextResponse.json({ 
        ok: false, 
        error: "You are already a department head" 
      }, { status: 400 });
    }

    // Check if user already has a pending request
    const { data: existingRequest, error: checkError } = await supabase
      .from("head_role_requests")
      .select("id, status")
      .eq("user_id", profile.id)
      .eq("status", "pending")
      .single();

    if (existingRequest) {
      return NextResponse.json({ 
        ok: false, 
        error: "You already have a pending head role request" 
      }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const { department_id, reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ 
        ok: false, 
        error: "Reason is required" 
      }, { status: 400 });
    }

    // Validate department_id if provided
    if (department_id) {
      const { data: dept, error: deptError } = await supabase
        .from("departments")
        .select("id")
        .eq("id", department_id)
        .single();

      if (deptError || !dept) {
        return NextResponse.json({ 
          ok: false, 
          error: "Invalid department" 
        }, { status: 400 });
      }
    }

    // Create head role request
    const { data: request, error: insertError } = await supabase
      .from("head_role_requests")
      .insert({
        user_id: profile.id,
        department_id: department_id || null,
        reason: reason.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[head-role-requests/submit] Error creating request:", insertError);
      return NextResponse.json({ 
        ok: false, 
        error: insertError.message || "Failed to submit request" 
      }, { status: 500 });
    }

    // Notify superadmins about the new request
    try {
      const supabaseServiceRole = await createSupabaseServerClient(true);
      const { data: superadmins } = await supabaseServiceRole
        .from("users")
        .select("id")
        .eq("role", "admin")
        .eq("is_admin", true)
        .eq("is_active", true);

      if (superadmins && superadmins.length > 0) {
        const requesterName = profile.name || profile.email || "User";
        let departmentName: string | null = null;
        
        if (request.department_id) {
          const { data: dept } = await supabaseServiceRole
            .from("departments")
            .select("name, code")
            .eq("id", request.department_id)
            .single();
          departmentName = dept?.name || dept?.code || null;
        }

        const notifications = superadmins.map((admin: any) =>
          createNotification({
            user_id: admin.id,
            notification_type: "head_role_request_submitted",
            title: "New Head Role Request",
            message: `${requesterName} has submitted a request to become a department head${departmentName ? ` for ${departmentName}` : ""}.`,
            related_type: "head_role_request",
            related_id: request.id,
            action_url: "/super-admin/head-requests",
            action_label: "Review Request",
            priority: "high",
          })
        );

        await Promise.allSettled(notifications);
      }
    } catch (notifError) {
      // Don't fail the request if notification fails
      console.error("[head-role-requests/submit] Failed to notify superadmins:", notifError);
    }

    return NextResponse.json({
      ok: true,
      data: request,
      message: "Head role request submitted successfully. Superadmin will review your request."
    });
  } catch (error: any) {
    console.error("[head-role-requests/submit] Unexpected error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}

