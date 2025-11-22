// src/app/api/head-endorsements/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getPhilippineTimestamp(): string {
  const now = new Date();
  const phTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  return phTime.toISOString();
}

/**
 * GET /api/head-endorsements/confirm/[token]
 * Get invitation details by token (for confirmation page)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ ok: false, error: "Token is required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Decode token in case it was double-encoded
    const decodedToken = decodeURIComponent(token);
    
    // Fetch invitation
    let { data: invitation, error: inviteError } = await supabase
      .from("head_endorsement_invitations")
      .select(`
        *,
        request:requests!request_id(
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

    // If not found, try decoded token
    if (inviteError && inviteError.code === 'PGRST116' && decodedToken !== token) {
      const { data: decodedData, error: decodedError } = await supabase
        .from("head_endorsement_invitations")
        .select(`
          *,
          request:requests!request_id(
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
        .eq("token", decodedToken)
        .single();
      
      if (!decodedError && decodedData) {
        invitation = decodedData;
        inviteError = null;
      }
    }

    if (inviteError || !invitation) {
      return NextResponse.json({ ok: false, error: "Invalid invitation" }, { status: 404 });
    }

    // Check if expired
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    const bufferMs = 60 * 1000; // 1 minute buffer
    
    if (expiresAt.getTime() < (now.getTime() - bufferMs)) {
      if (invitation.status === 'pending') {
        await supabase
          .from("head_endorsement_invitations")
          .update({ status: 'expired' })
          .eq("id", invitation.id);
      }
      return NextResponse.json({ ok: false, error: "This invitation has expired" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      data: invitation,
    });
  } catch (err: any) {
    console.error("[GET /api/head-endorsements/confirm] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/head-endorsements/confirm
 * Confirm or decline head endorsement invitation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, action, head_name, endorsement_date, signature, comments, declined_reason } = body;

    if (!token || !action) {
      return NextResponse.json({ ok: false, error: "Token and action are required" }, { status: 400 });
    }

    if (action !== "confirm" && action !== "decline") {
      return NextResponse.json({ ok: false, error: "Action must be 'confirm' or 'decline'" }, { status: 400 });
    }

    if (action === "confirm" && !head_name?.trim()) {
      return NextResponse.json({ ok: false, error: "Head name is required for confirmation" }, { status: 400 });
    }

    if (action === "decline" && !declined_reason?.trim()) {
      return NextResponse.json({ ok: false, error: "Reason is required for declining" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Decode token
    const decodedToken = decodeURIComponent(token);
    
    // Fetch invitation
    let { data: invitation, error: inviteError } = await supabase
      .from("head_endorsement_invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (inviteError && inviteError.code === 'PGRST116' && decodedToken !== token) {
      const { data: decodedData, error: decodedError } = await supabase
        .from("head_endorsement_invitations")
        .select("*")
        .eq("token", decodedToken)
        .single();
      
      if (!decodedError && decodedData) {
        invitation = decodedData;
        inviteError = null;
      }
    }

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
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();
    const bufferMs = 60 * 1000;
    
    if (expiresAt.getTime() < (now.getTime() - bufferMs)) {
      if (invitation.status === 'pending') {
        await supabase
          .from("head_endorsement_invitations")
          .update({ status: 'expired' })
          .eq("id", invitation.id);
      }
      return NextResponse.json({ ok: false, error: "This invitation has expired" }, { status: 400 });
    }

    const phNow = getPhilippineTimestamp();

    if (action === "confirm") {
      // Check if user exists and has saved signature
      let finalSignature = signature || null;
      let userProfile: any = null;
      
      if (invitation.head_email) {
        const { data: user } = await supabase
          .from("users")
          .select("id, signature")
          .eq("email", invitation.head_email.toLowerCase())
          .eq("status", "active")
          .maybeSingle();

        if (user) {
          userProfile = user;
          if (!finalSignature && user.signature) {
            finalSignature = user.signature;
            console.log("[POST /api/head-endorsements/confirm] ✅ Using saved signature from user profile");
          }
        }
      }

      // Update invitation to confirmed
      const { data: updatedInvitation, error: updateError } = await supabase
        .from("head_endorsement_invitations")
        .update({
          status: 'confirmed',
          head_name: head_name.trim(),
          endorsement_date: endorsement_date || new Date().toISOString().split('T')[0],
          signature: finalSignature,
          comments: comments?.trim() || null,
          confirmed_at: phNow,
          updated_at: phNow,
        })
        .eq("id", invitation.id)
        .select()
        .single();

      if (updateError) {
        console.error("[POST /api/head-endorsements/confirm] Update error:", updateError);
        return NextResponse.json({ ok: false, error: "Failed to confirm invitation" }, { status: 500 });
      }

      // Update head_user_id if user exists
      if (userProfile && userProfile.id) {
        await supabase
          .from("head_endorsement_invitations")
          .update({ head_user_id: userProfile.id })
          .eq("id", invitation.id);
      }

      // Update request workflow_metadata with endorsement info
      const { data: requestData } = await supabase
        .from("requests")
        .select("workflow_metadata")
        .eq("id", invitation.request_id)
        .single();

      const metadata = requestData?.workflow_metadata || {};
      metadata.department_head_endorsed_by = head_name.trim();
      metadata.department_head_endorsement_date = endorsement_date || new Date().toISOString().split('T')[0];
      metadata.head_endorsement_signature = finalSignature;

      await supabase
        .from("requests")
        .update({ workflow_metadata: metadata })
        .eq("id", invitation.request_id);

      console.log("[POST /api/head-endorsements/confirm] ✅ Confirmation successful:", {
        invitationId: updatedInvitation?.id,
        status: updatedInvitation?.status,
        hasSignature: !!updatedInvitation?.signature,
        headName: updatedInvitation?.head_name,
      });

      return NextResponse.json({
        ok: true,
        message: "Successfully confirmed endorsement",
        data: updatedInvitation
      });
    } else {
      // Decline
      const { error: updateError } = await supabase
        .from("head_endorsement_invitations")
        .update({
          status: 'declined',
          declined_reason: declined_reason.trim(),
          declined_at: phNow,
          updated_at: phNow,
        })
        .eq("id", invitation.id);

      if (updateError) {
        console.error("[POST /api/head-endorsements/confirm] Update error:", updateError);
        return NextResponse.json({ ok: false, error: "Failed to decline invitation" }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        message: "Endorsement declined",
        data: { ...invitation, status: 'declined' }
      });
    }
  } catch (err: any) {
    console.error("[POST /api/head-endorsements/confirm] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

