// src/app/api/participants/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/participants/confirm
 * Confirm or decline participant invitation
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await req.json();
    const { token, action, name, department, available_fdp, signature, declined_reason } = body;

    if (!token || !action) {
      return NextResponse.json(
        { ok: false, error: "Missing token or action" },
        { status: 400 }
      );
    }

    if (!['confirm', 'decline'].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid action. Must be 'confirm' or 'decline'" },
        { status: 400 }
      );
    }

    // Find invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from("participant_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired invitation link" },
        { status: 404 }
      );
    }

    // Check if already responded
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: `Invitation already ${invitation.status}` },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from("participant_invitations")
        .update({ status: 'expired' })
        .eq("id", invitation.id);

      return NextResponse.json(
        { ok: false, error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Update invitation based on action
    const updateData: any = {
      status: action === 'confirm' ? 'confirmed' : 'declined',
      updated_at: new Date().toISOString(),
    };

    if (action === 'confirm') {
      updateData.confirmed_at = new Date().toISOString();
      if (name) updateData.name = name;
      if (department) updateData.department = department;
      if (available_fdp !== undefined) updateData.available_fdp = available_fdp;
      if (signature) updateData.signature = signature;

      // Try to find user by email and link them
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", invitation.email)
        .single();

      if (user) {
        updateData.user_id = user.id;
      }
    } else {
      updateData.declined_at = new Date().toISOString();
      if (declined_reason) updateData.declined_reason = declined_reason;
    }

    const { error: updateError } = await supabase
      .from("participant_invitations")
      .update(updateData)
      .eq("id", invitation.id);

    if (updateError) {
      console.error("[POST /api/participants/confirm] Update error:", updateError);
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    // Get request details for notification
    const { data: request } = await supabase
      .from("requests")
      .select("id, request_number, title")
      .eq("id", invitation.request_id)
      .single();

    // TODO: Send notification to requester about confirmation/decline

    return NextResponse.json({
      ok: true,
      data: {
        invitation_id: invitation.id,
        status: updateData.status,
        request: request,
      },
      message: action === 'confirm' 
        ? "Thank you for confirming your participation!" 
        : "Your response has been recorded.",
    });
  } catch (err: any) {
    console.error("[POST /api/participants/confirm] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/participants/confirm?token=xxx
 * Get invitation details by token
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing token parameter" },
        { status: 400 }
      );
    }

    // Get invitation with request details
    const { data: invitation, error: inviteError } = await supabase
      .from("participant_invitations")
      .select(`
        *,
        request:requests!inner(
          id,
          request_number,
          title,
          request_type,
          seminar_title,
          date_from,
          date_to,
          travel_start_date,
          travel_end_date,
          destination,
          seminar_venue,
          requester:users!requests_requester_id_fkey(
            id,
            name,
            email
          )
        )
      `)
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired invitation link" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date() && invitation.status === 'pending') {
      await supabase
        .from("participant_invitations")
        .update({ status: 'expired' })
        .eq("id", invitation.id);

      return NextResponse.json(
        { ok: false, error: "Invitation has expired", expired: true },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: invitation,
    });
  } catch (err: any) {
    console.error("[GET /api/participants/confirm] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

