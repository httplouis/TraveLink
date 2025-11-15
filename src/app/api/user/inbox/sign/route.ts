import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/helpers";

/**
 * POST /api/user/inbox/sign
 * Sign a request and forward it to department head
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, department_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const { requestId, signature } = body;

    if (!requestId || !signature) {
      return NextResponse.json({ ok: false, error: "Request ID and signature are required" }, { status: 400 });
    }

    // Verify this request belongs to the current user and is pending their signature
    // For representative submissions, check both requester_id (person being requested for) 
    // and submitted_by_user_id (person who submitted on their behalf)
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .eq("status", "pending_requester_signature")
      .or(`requester_id.eq.${profile.id},submitted_by_user_id.eq.${profile.id}`)
      .single();

    if (requestError || !request) {
      console.error("[User Inbox Sign] Request not found:", requestError);
      console.error("[User Inbox Sign] Profile ID:", profile.id);
      return NextResponse.json({ 
        ok: false, 
        error: "Request not found or not pending your signature" 
      }, { status: 404 });
    }

    // Additional check: verify the current user is either the requester OR the submitter
    const isRequester = request.requester_id === profile.id;
    const isSubmitter = request.submitted_by_user_id === profile.id;
    
    if (!isRequester && !isSubmitter) {
      console.error("[User Inbox Sign] User is neither requester nor submitter");
      console.error("[User Inbox Sign] Requester ID:", request.requester_id);
      console.error("[User Inbox Sign] Submitter ID:", request.submitted_by_user_id);
      console.error("[User Inbox Sign] Current User ID:", profile.id);
      return NextResponse.json({ 
        ok: false, 
        error: "You are not authorized to sign this request" 
      }, { status: 403 });
    }

    // Update request: add signature and change status to pending_head
    const { data: updatedRequest, error: updateError } = await supabase
      .from("requests")
      .update({
        requester_signature: signature,
        requester_signed_at: new Date().toISOString(),
        status: "pending_head", // Forward to department head
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      console.error("[User Inbox Sign] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log to request_history
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: "requester_signed",
      actor_id: profile.id,
      actor_role: "requester",
      previous_status: "pending_requester_signature",
      new_status: "pending_head",
      comments: "Requester signed the request",
      metadata: { 
        signature: "provided",
        is_representative: request.is_representative,
        submitted_by_user_id: request.submitted_by_user_id
      }
    });

    console.log(`[User Inbox Sign] Request ${requestId} signed by ${profile.name} and forwarded to department head`);

    // Create notifications
    try {
      // Notify submitter (if different from requester) that request was signed
      if (request.submitted_by_user_id && request.submitted_by_user_id !== profile.id) {
        await createNotification({
          user_id: request.submitted_by_user_id,
          notification_type: "request_signed",
          title: "Request Signed",
          message: `${profile.name} has signed the travel order request ${request.request_number || ''} and it has been forwarded to the department head.`,
          related_type: "request",
          related_id: requestId,
          action_url: `/user/submissions?view=${requestId}`,
          action_label: "View Request",
          priority: "normal",
        });
      }

      // Notify requester (if different from signer) that their request is moving forward
      if (request.requester_id && request.requester_id !== profile.id) {
        await createNotification({
          user_id: request.requester_id,
          notification_type: "request_status_change",
          title: "Request Forwarded",
          message: `Your travel order request ${request.request_number || ''} has been signed and forwarded to the department head for approval.`,
          related_type: "request",
          related_id: requestId,
          action_url: `/user/submissions?view=${requestId}`,
          action_label: "View Request",
          priority: "normal",
        });
      }
    } catch (notifError: any) {
      console.error("[User Inbox Sign] Failed to create notifications:", notifError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Request signed and forwarded to department head" 
    });
  } catch (err: any) {
    console.error("[User Inbox Sign] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

