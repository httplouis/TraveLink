// src/app/api/requesters/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPhilippineTimestamp } from "@/lib/datetime";

/**
 * GET /api/requesters/confirm?token=...
 * Fetch invitation details for confirmation
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ ok: false, error: "Token is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient(true);

    // Fetch invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("requester_invitations")
      .select(`
        *,
        request:requests(
          id,
          request_number,
          title,
          purpose,
          destination,
          travel_start_date,
          travel_end_date,
          requester:users!requester_id(id, name, email, profile_picture)
        )
      `)
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ ok: false, error: "Invalid or expired invitation" }, { status: 404 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Update status to expired
      await supabase
        .from("requester_invitations")
        .update({ status: 'expired' })
        .eq("id", invitation.id);

      return NextResponse.json({ 
        ok: false, 
        error: "This invitation has expired",
        data: { ...invitation, status: 'expired' }
      }, { status: 400 });
    }

    // Check if user exists in system (by email or user_id)
    let userProfile: any = null;
    if (invitation.email) {
      const { data: user } = await supabase
        .from("users")
        .select("id, name, email, department, department_id, profile_picture, signature")
        .eq("email", invitation.email.toLowerCase())
        .eq("status", "active")
        .maybeSingle();

      if (user) {
        userProfile = {
          isUser: true,
          hasSignature: !!user.signature,
          ...user
        };
      }
    } else if (invitation.user_id) {
      const { data: user } = await supabase
        .from("users")
        .select("id, name, email, department, department_id, profile_picture, signature")
        .eq("id", invitation.user_id)
        .eq("status", "active")
        .maybeSingle();

      if (user) {
        userProfile = {
          isUser: true,
          hasSignature: !!user.signature,
          ...user
        };
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...invitation,
        request: invitation.request,
        userProfile: userProfile || { isUser: false }
      }
    });
  } catch (err: any) {
    console.error("[GET /api/requesters/confirm] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/requesters/confirm
 * Confirm or decline requester invitation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action, name, department, department_id, signature, declined_reason } = body;

    if (!token || !action) {
      return NextResponse.json({ ok: false, error: "Token and action are required" }, { status: 400 });
    }

    if (action !== "confirm" && action !== "decline") {
      return NextResponse.json({ ok: false, error: "Action must be 'confirm' or 'decline'" }, { status: 400 });
    }

    if (action === "confirm" && !name?.trim()) {
      return NextResponse.json({ ok: false, error: "Name is required for confirmation" }, { status: 400 });
    }

    if (action === "decline" && !declined_reason?.trim()) {
      return NextResponse.json({ ok: false, error: "Reason is required for declining" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient(true);

    // Fetch invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("requester_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ ok: false, error: "Invalid invitation" }, { status: 404 });
    }

    // Check if already confirmed/declined
    if (invitation.status !== "pending") {
      return NextResponse.json({ 
        ok: false, 
        error: `Invitation has already been ${invitation.status}` 
      }, { status: 400 });
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from("requester_invitations")
        .update({ status: 'expired' })
        .eq("id", invitation.id);

      return NextResponse.json({ ok: false, error: "This invitation has expired" }, { status: 400 });
    }

    const now = getPhilippineTimestamp();

    if (action === "confirm") {
      // Update invitation to confirmed
      const { error: updateError } = await supabase
        .from("requester_invitations")
        .update({
          status: 'confirmed',
          name: name.trim(),
          department: department?.trim() || null,
          department_id: department_id || null,
          signature: signature || null,
          confirmed_at: now,
          updated_at: now,
        })
        .eq("id", invitation.id);

      if (updateError) {
        console.error("[POST /api/requesters/confirm] Update error:", updateError);
        return NextResponse.json({ ok: false, error: "Failed to confirm invitation" }, { status: 500 });
      }

      // Update user_id if user exists in system
      if (invitation.email) {
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("email", invitation.email.toLowerCase())
          .eq("status", "active")
          .maybeSingle();

        if (user) {
          await supabase
            .from("requester_invitations")
            .update({ user_id: user.id })
            .eq("id", invitation.id);
        }
      }

      return NextResponse.json({
        ok: true,
        message: "Successfully confirmed participation",
        data: { ...invitation, status: 'confirmed' }
      });
    } else {
      // Decline
      const { error: updateError } = await supabase
        .from("requester_invitations")
        .update({
          status: 'declined',
          declined_reason: declined_reason.trim(),
          declined_at: now,
          updated_at: now,
        })
        .eq("id", invitation.id);

      if (updateError) {
        console.error("[POST /api/requesters/confirm] Update error:", updateError);
        return NextResponse.json({ ok: false, error: "Failed to decline invitation" }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Invitation declined",
        data: { ...invitation, status: 'declined' }
      });
    }
  } catch (err: any) {
    console.error("[POST /api/requesters/confirm] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

