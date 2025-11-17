// src/app/api/requests/confirm-payment/route.ts
/**
 * POST /api/requests/confirm-payment
 * Requester confirms payment for a travel order request
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const body = await request.json();
    const { requestId, paymentNotes } = body;

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Request ID required" }, { status: 400 });
    }

    // Get request and verify requester
    const { data: req, error: reqError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqError || !req) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Verify user is the requester
    if (req.requester_id !== profile.id) {
      return NextResponse.json({ ok: false, error: "Not authorized to confirm payment for this request" }, { status: 403 });
    }

    // Verify request is in payment confirmation stage
    if (req.status !== "pending_comptroller" || !req.payment_required) {
      return NextResponse.json({ 
        ok: false, 
        error: "Request is not in payment confirmation stage" 
      }, { status: 400 });
    }

    const now = getPhilippineTimestamp();

    // Update request: mark payment as confirmed and send back to comptroller
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        payment_confirmed: true,
        payment_confirmed_at: now,
        payment_confirmation_notes: paymentNotes || null,
        updated_at: now,
        // Status stays as pending_comptroller, comptroller will move it to HR
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("[Confirm Payment] Update error:", updateError);
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // Log to request history
    await supabase.from("request_history").insert({
      request_id: requestId,
      action: "payment_confirmed",
      actor_id: profile.id,
      actor_role: "requester",
      previous_status: req.status,
      new_status: "pending_comptroller", // Still with comptroller
      comments: paymentNotes || "Payment confirmed by requester",
      metadata: {
        payment_confirmed_at: now,
        payment_confirmation_notes: paymentNotes || null,
        signature_time: null,
        receive_time: req.created_at || now,
        submission_time: req.created_at || null,
      }
    });

    // Notify comptroller
    try {
      const { createNotification } = await import("@/lib/notifications/helpers");
      
      // Get comptroller who processed this
      if (req.comptroller_approved_by) {
        await createNotification({
          user_id: req.comptroller_approved_by,
          notification_type: "payment_confirmed",
          title: "Payment Confirmed",
          message: `Requester has confirmed payment for request ${req.request_number || ''}. Please review and proceed to HR.`,
          related_type: "request",
          related_id: requestId,
          action_url: `/comptroller/inbox?view=${requestId}`,
          action_label: "Review Request",
          priority: "high",
        });
      }
    } catch (notifError: any) {
      console.error("[Confirm Payment] Failed to create notification:", notifError);
      // Don't fail if notification fails
    }

    console.log(`[Confirm Payment] ✅ Payment confirmed for request ${requestId} by ${profile.name}`);

    return NextResponse.json({
      ok: true,
      message: "Payment confirmed successfully",
      data: {
        requestId,
        paymentConfirmedAt: now
      }
    });

  } catch (error: any) {
    console.error("[Confirm Payment] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to confirm payment" },
      { status: 500 }
    );
  }
}

