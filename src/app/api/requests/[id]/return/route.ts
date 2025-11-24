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

    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
      profile.is_executive;

    if (!canReturn) {
      return NextResponse.json(
        { ok: false, error: "You do not have permission to return requests" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    // Update request: set status to "draft" (rejected, goes back to drafts)
    const updateData: any = {
      status: "draft",
      returned_at: now,
      returned_by: profile.id,
      return_reason: return_reason,
      rejected_at: now,
      rejected_by: profile.id,
      updated_at: now,
    };

    // Store return comments in appropriate field based on role
    if (comments) {
      if (profile.is_head) {
        updateData.head_comments = comments;
      } else if (profile.is_admin) {
        updateData.admin_comments = comments;
      } else if (profile.is_comptroller) {
        updateData.comptroller_comments = comments;
      } else if (profile.is_hr) {
        updateData.hr_comments = comments;
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
      action: "rejected",
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
      new_status: "draft",
      comments: `Request rejected and returned to drafts. Reason: ${return_reason}${comments ? ` - ${comments}` : ""}`,
      metadata: {
        return_reason,
        rejected_at: now,
        rejected_by: profile.id,
      },
    });

    // Create notification for requester - clickable, goes to drafts
    try {
      const { createNotification } = await import("@/lib/notifications/helpers");

      if (request.requester_id) {
        await createNotification({
          user_id: request.requester_id,
          notification_type: "request_rejected",
          title: "Request Rejected",
          message: `Your request ${request.request_number || ""} has been rejected and returned to your drafts. Reason: ${return_reason}${comments ? ` - ${comments}` : ""}`,
          related_type: "request",
          related_id: requestId,
          action_url: `/user/drafts?requestId=${requestId}`,
          action_label: "View in Drafts",
          priority: "high",
        });
      }
    } catch (notifError: any) {
      console.error("[Reject Request] Failed to create notification:", notifError);
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: requestId,
        status: "draft",
        message: "Request rejected and returned to drafts. Requester has been notified.",
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

