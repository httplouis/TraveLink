// src/app/api/requests/[id]/return/route.ts
/**
 * POST /api/requests/[id]/return
 * Return request to sender (requester) for editing
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = resolvedParams.id;

    // Validate request ID
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      console.error("[POST /api/requests/[id]/return] Invalid request ID:", requestId);
      return NextResponse.json({ ok: false, error: "Invalid or missing request ID" }, { status: 400 });
    }

    // Use service role for database operations
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Use anon client for auth (to read session cookies)
    const authSupabase = await createSupabaseServerClient(false);

    // Get current user from session
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    console.log("[Return Request] Auth check:", {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabaseServiceRole
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { return_reason, comments } = body;

    if (!return_reason) {
      return NextResponse.json(
        { ok: false, error: "Return reason is required" },
        { status: 400 }
      );
    }

    // Get request details
    const { data: request, error: requestError } = await supabaseServiceRole
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to return this request
    // Allow: head, admin, comptroller, hr, vp, president
    const canReturn =
      profile.is_head ||
      profile.is_admin ||
      profile.is_comptroller ||
      profile.is_hr ||
      profile.is_vp ||
      profile.is_president ||
      profile.is_executive ||
      profile.role === "admin" ||
      profile.role === "comptroller" ||
      profile.role === "hr";

    console.log("[Return Request] Permission check:", {
      user_id: profile.id,
      is_head: profile.is_head,
      is_admin: profile.is_admin,
      is_comptroller: profile.is_comptroller,
      is_hr: profile.is_hr,
      is_vp: profile.is_vp,
      is_president: profile.is_president,
      is_executive: profile.is_executive,
      role: profile.role,
      canReturn,
    });

    if (!canReturn) {
      return NextResponse.json(
        { ok: false, error: "You do not have permission to return requests" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // Update request: set status to "returned" (preserve all signatures)
    // DO NOT clear any signature fields - they should be preserved
    const updateData: any = {
      status: "returned",
      returned_at: now,
      returned_by: profile.id,
      return_reason: return_reason,
      updated_at: now,
      // Note: We do NOT set rejected_at or rejected_by to preserve the request state
      // All signatures remain intact for when requester edits and resubmits
    };

    // Store return comments in appropriate field based on role
    if (comments) {
      if (profile.is_head) {
        updateData.head_comments = comments;
      } else if (profile.is_admin || profile.role === "admin") {
        updateData.admin_comments = comments;
      } else if (profile.is_comptroller || profile.role === "comptroller") {
        updateData.comptroller_comments = comments;
      } else if (profile.is_hr || profile.role === "hr") {
        updateData.hr_comments = comments;
      } else if (profile.is_vp) {
        updateData.vp_comments = comments;
      } else if (profile.is_president) {
        updateData.president_comments = comments;
      } else if (profile.is_executive) {
        updateData.exec_comments = comments;
      }
    }

    // Update request
    const { error: updateError } = await supabaseServiceRole
      .from("requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("[Return Request] Update error:", updateError);
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Log to request_history
    await supabaseServiceRole.from("request_history").insert({
      request_id: requestId,
      action: "returned",
      actor_id: profile.id,
      actor_role: profile.is_head
        ? "head"
        : profile.is_admin
        ? "admin"
        : profile.is_comptroller
        ? "comptroller"
        : profile.is_hr
        ? "hr"
        : "executive",
      previous_status: request.status,
      new_status: "returned",
      comments: `Request returned to requester for revision. Reason: ${return_reason}${comments ? ` - ${comments}` : ""}`,
      metadata: {
        return_reason,
        returned_at: now,
        returned_by: profile.id,
      },
    });

    // Create notification for requester - clickable, goes to drafts for editing
    try {
      const { createNotification } = await import("@/lib/notifications/helpers");

      if (request.requester_id) {
        // Check if requester is a head to determine the correct drafts URL
        const { data: requesterProfile } = await supabaseServiceRole
          .from("users")
          .select("is_head, role")
          .eq("id", request.requester_id)
          .maybeSingle();
        
        const isRequesterHead = requesterProfile?.is_head || requesterProfile?.role === "head";
        // Point to drafts page for editing, not submissions
        const draftsUrl = isRequesterHead 
          ? `/head/drafts?requestId=${requestId}` 
          : `/user/drafts?requestId=${requestId}`;
        
        // Determine the approver role label for the message
        const approverRoleLabel = profile.is_head
          ? "Head"
          : profile.is_admin || profile.role === "admin"
          ? "Transportation Management"
          : profile.is_comptroller || profile.role === "comptroller"
          ? "Comptroller"
          : profile.is_hr || profile.role === "hr"
          ? "HR"
          : profile.is_vp
          ? "VP"
          : profile.is_president
          ? "President"
          : "Approver";
        
        await createNotification({
          user_id: request.requester_id,
          notification_type: "request_returned",
          title: "Request Returned for Revision",
          message: `Your request ${request.request_number || ""} has been returned for revision by ${approverRoleLabel}. Reason: ${return_reason}${comments ? ` - ${comments}` : ""}. Please edit and resubmit.`,
          related_type: "request",
          related_id: requestId,
          action_url: draftsUrl,
          action_label: "Edit & Resubmit",
          priority: "high",
        });
        console.log("[Return Request] ✅ Notification created for requester:", request.requester_id, "URL:", draftsUrl);
      }
    } catch (notifError: any) {
      console.error("[Return Request] Failed to create notification:", notifError);
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: requestId,
        status: "returned",
        message: "Request returned to requester for revision. Requester has been notified.",
      },
    });
  } catch (error: any) {
    console.error("[Return Request] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to return request" },
      { status: 500 }
    );
  }
}

