// src/app/api/requests/[id]/resubmit/route.ts
/**
 * POST /api/requests/[id]/resubmit
 * Resubmit a returned request after editing
 * This preserves existing signatures and sends the request back to the stage it was returned from
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = resolvedParams.id;

    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      return NextResponse.json({ ok: false, error: "Invalid request ID" }, { status: 400 });
    }

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

    // Use anon client for auth
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
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

    // Get request details
    const { data: request, error: requestError } = await supabaseServiceRole
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Check if user is the requester
    // IMPORTANT: Use String() to ensure consistent comparison (UUIDs might be objects in some cases)
    const profileIdStr = String(profile.id);
    const requesterIdStr = request.requester_id ? String(request.requester_id) : null;
    const submittedByIdStr = request.submitted_by_user_id ? String(request.submitted_by_user_id) : null;
    
    if (profileIdStr !== requesterIdStr && profileIdStr !== submittedByIdStr) {
      console.log("[Resubmit Request] ❌ Permission denied:", {
        profileIdStr,
        requesterIdStr,
        submittedByIdStr,
      });
      return NextResponse.json({ ok: false, error: "Only the requester can resubmit" }, { status: 403 });
    }

    // Check if request is in returned status
    if (request.status !== "returned") {
      return NextResponse.json({ 
        ok: false, 
        error: "Only returned requests can be resubmitted" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Determine which stage to send back to based on the previous_status from request history
    // This is more reliable than checking the returner's role (which may have multiple roles)
    let nextStatus = "pending_head"; // Default to head
    let nextApproverRole = "head";

    // First, try to get the previous_status from request history (most reliable)
    const { data: returnHistory } = await supabaseServiceRole
      .from("request_history")
      .select("previous_status")
      .eq("request_id", requestId)
      .eq("action", "returned")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (returnHistory?.previous_status) {
      // Use the previous_status to determine where to send the request
      const prevStatus = returnHistory.previous_status;
      console.log("[Resubmit Request] Using previous_status from history:", prevStatus);
      
      if (prevStatus === "pending_comptroller") {
        nextStatus = "pending_comptroller";
        nextApproverRole = "comptroller";
      } else if (prevStatus === "pending_hr") {
        nextStatus = "pending_hr";
        nextApproverRole = "hr";
      } else if (prevStatus === "pending_admin") {
        nextStatus = "pending_admin";
        nextApproverRole = "admin";
      } else if (prevStatus === "pending_vp") {
        nextStatus = "pending_vp";
        nextApproverRole = "vp";
      } else if (prevStatus === "pending_president") {
        nextStatus = "pending_president";
        nextApproverRole = "president";
      } else if (prevStatus === "pending_exec") {
        nextStatus = "pending_exec";
        nextApproverRole = "executive";
      } else if (prevStatus === "pending_head") {
        nextStatus = "pending_head";
        nextApproverRole = "head";
      }
    } else if (request.returned_by) {
      // Fallback: check the returner's role
      console.log("[Resubmit Request] Fallback: checking returner's role");
      const { data: returner } = await supabaseServiceRole
        .from("users")
        .select("is_head, is_admin, is_comptroller, is_hr, is_vp, is_president, is_executive, role")
        .eq("id", request.returned_by)
        .maybeSingle();

      if (returner) {
        // Send back to the stage where it was returned from
        // Check in order of approval flow (comptroller before head since user might have both roles)
        if (returner.is_comptroller || returner.role === "comptroller") {
          nextStatus = "pending_comptroller";
          nextApproverRole = "comptroller";
        } else if (returner.is_hr || returner.role === "hr") {
          nextStatus = "pending_hr";
          nextApproverRole = "hr";
        } else if (returner.is_admin || returner.role === "admin") {
          nextStatus = "pending_admin";
          nextApproverRole = "admin";
        } else if (returner.is_vp) {
          nextStatus = "pending_vp";
          nextApproverRole = "vp";
        } else if (returner.is_president) {
          nextStatus = "pending_president";
          nextApproverRole = "president";
        } else if (returner.is_executive) {
          nextStatus = "pending_exec";
          nextApproverRole = "executive";
        } else if (returner.is_head) {
          nextStatus = "pending_head";
          nextApproverRole = "head";
        }
      }
    }
    
    console.log("[Resubmit Request] Determined next status:", { nextStatus, nextApproverRole });

    // IMPORTANT: Save returned_by BEFORE clearing it (for notifications)
    const originalReturnedBy = request.returned_by;
    
    // Update request status
    const updateData: any = {
      status: nextStatus,
      current_approver_role: nextApproverRole,
      updated_at: now,
      // Clear return fields
      return_reason: null,
      returned_at: null,
      returned_by: null,
    };

    const { error: updateError } = await supabaseServiceRole
      .from("requests")
      .update(updateData)
      .eq("id", requestId);

    if (updateError) {
      console.error("[Resubmit Request] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log to request_history
    await supabaseServiceRole.from("request_history").insert({
      request_id: requestId,
      action: "resubmitted",
      actor_id: profile.id,
      actor_role: "requester",
      previous_status: "returned",
      new_status: nextStatus,
      comments: `Request resubmitted after revision. Sent to ${nextApproverRole} for review.`,
      metadata: {
        resubmitted_at: now,
        resubmitted_by: profile.id,
        sent_to_role: nextApproverRole,
      },
    });

    // Create notifications
    try {
      const { createNotification } = await import("@/lib/notifications/helpers");

      // 1. Notify the person who returned the request (the returner)
      // Use originalReturnedBy since we cleared returned_by in the update
      if (originalReturnedBy) {
        // Get returner's role to determine correct inbox URL
        const { data: returner } = await supabaseServiceRole
          .from("users")
          .select("id, is_head, is_admin, is_comptroller, is_hr, is_vp, is_president, is_executive, role")
          .eq("id", originalReturnedBy)
          .maybeSingle();

        if (returner) {
          // Determine the correct inbox URL based on returner's role
          let inboxUrl = "/admin/inbox"; // Default
          if (returner.is_comptroller || returner.role === "comptroller") {
            inboxUrl = `/comptroller/inbox?view=${requestId}`;
          } else if (returner.is_hr || returner.role === "hr") {
            inboxUrl = `/hr/inbox?view=${requestId}`;
          } else if (returner.is_admin || returner.role === "admin") {
            inboxUrl = `/admin/inbox?view=${requestId}`;
          } else if (returner.is_vp) {
            inboxUrl = `/vp/inbox?view=${requestId}`;
          } else if (returner.is_president) {
            inboxUrl = `/president/inbox?view=${requestId}`;
          } else if (returner.is_executive) {
            inboxUrl = `/exec/inbox?view=${requestId}`;
          } else if (returner.is_head) {
            inboxUrl = `/head/inbox?view=${requestId}`;
          }

          await createNotification({
            user_id: returner.id,
            notification_type: "request_resubmitted",
            title: "Returned Request Resubmitted",
            message: `Request ${request.request_number || ""} that you returned has been revised and resubmitted for review.`,
            related_type: "request",
            related_id: requestId,
            action_url: inboxUrl,
            action_label: "Review Request",
            priority: "high",
          });
          console.log("[Resubmit Request] ✅ Notification sent to returner:", returner.id);
        }
      }

      // 2. Notify all users with the target role (next approvers)
      let roleFilter: any = {};
      if (nextApproverRole === "comptroller") {
        roleFilter = { is_comptroller: true };
      } else if (nextApproverRole === "hr") {
        roleFilter = { is_hr: true };
      } else if (nextApproverRole === "admin") {
        roleFilter = { is_admin: true };
      } else if (nextApproverRole === "vp") {
        roleFilter = { is_vp: true };
      } else if (nextApproverRole === "president") {
        roleFilter = { is_president: true };
      }

      if (Object.keys(roleFilter).length > 0) {
        const { data: approvers } = await supabaseServiceRole
          .from("users")
          .select("id")
          .match(roleFilter)
          .eq("status", "active");

        if (approvers && approvers.length > 0) {
          for (const approver of approvers) {
            // Skip if this approver is the same as the returner (already notified above)
            if (originalReturnedBy && approver.id === originalReturnedBy) {
              continue;
            }
            
            await createNotification({
              user_id: approver.id,
              notification_type: "request_resubmitted",
              title: "Request Resubmitted",
              message: `Request ${request.request_number || ""} has been revised and resubmitted for your review.`,
              related_type: "request",
              related_id: requestId,
              action_url: `/${nextApproverRole}/inbox?view=${requestId}`,
              action_label: "Review Request",
              priority: "high",
            });
          }
          console.log("[Resubmit Request] ✅ Notifications sent to", approvers.length, nextApproverRole, "approvers");
        }
      }
    } catch (notifError: any) {
      console.error("[Resubmit Request] Failed to create notification:", notifError);
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: requestId,
        status: nextStatus,
        message: `Request resubmitted and sent to ${nextApproverRole} for review.`,
      },
    });
  } catch (error: any) {
    console.error("[Resubmit Request] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to resubmit request" },
      { status: 500 }
    );
  }
}
