// src/app/api/participants/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail, generateParticipantInvitationEmail } from "@/lib/email";
import crypto from "crypto";

/**
 * POST /api/participants/invite
 * Send invitation to a participant
 */
export async function POST(req: NextRequest) {
  console.log("\n" + "=".repeat(70));
  console.log("[POST /api/participants/invite] 🚀 API Route Called!");
  console.log("=".repeat(70));
  
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await req.json();
    const { request_id, email } = body;
    
    console.log("[POST /api/participants/invite] 📥 Request body:", { request_id, email });

    if (!request_id || !email) {
      return NextResponse.json(
        { ok: false, error: "Missing request_id or email" },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Check if invitation already exists
    const { data: existing, error: existingError } = await supabase
      .from("participant_invitations")
      .select("id, status, token")
      .eq("request_id", request_id)
      .eq("email", email.toLowerCase())
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error if not found

    let invitation: any;
    let token: string;
    let alreadyExists = false;

    if (existing && !existingError) {
      // Use existing invitation but still send email (resend functionality)
      console.log(`[POST /api/participants/invite] ✅ Invitation already exists for ${email}, will resend email`);
      invitation = existing;
      token = existing.token;
      alreadyExists = true;
    } else {
      // Generate unique token for new invitation
      token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      // Create new invitation
      const { data: newInvitation, error: inviteError } = await supabase
        .from("participant_invitations")
        .insert({
          request_id,
          email: email.toLowerCase(),
          invited_by: profile.id,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (inviteError) {
        console.error("[POST /api/participants/invite] Error:", inviteError);
        return NextResponse.json(
          { ok: false, error: inviteError.message },
          { status: 500 }
        );
      }

      invitation = newInvitation;
    }

    // Get request details for email (including requester profile picture)
    const { data: requestData } = await supabase
      .from("requests")
      .select("id, reason, seminar_title, date_from, date_to, requester:users!requester_id(name, profile_picture)")
      .eq("id", request_id)
      .single();

    // Send email notification
    console.log(`[POST /api/participants/invite] 📧 Preparing to send email to ${email}...`);
    
    // Fix: Properly handle baseUrl with fallback
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      baseUrl = "http://localhost:3000";
    }
    const confirmationLink = `${baseUrl}/participants/confirm/${token}`;

    console.log(`[POST /api/participants/invite] 🔗 Base URL:`, baseUrl);
    console.log(`[POST /api/participants/invite] 🔗 Confirmation link:`, confirmationLink);

    const seminarTitle = requestData?.seminar_title || "Seminar/Training";
    const requesterName = (requestData?.requester as any)?.name || profile.name || "Requester";
    const dateFrom = requestData?.date_from || "";
    const dateTo = requestData?.date_to || "";

    console.log(`[POST /api/participants/invite] 📧 Email details:`, {
      to: email,
      seminarTitle,
      requesterName,
      confirmationLink: confirmationLink.substring(0, 50) + "..."
    });

    const requesterProfilePicture = (requestData?.requester as any)?.profile_picture || null;

    const emailHtml = generateParticipantInvitationEmail({
      participantName: undefined, // Will use "Participant" as fallback
      requesterName,
      requesterProfilePicture,
      seminarTitle,
      dateFrom,
      dateTo,
      confirmationLink,
    });

    console.log(`[POST /api/participants/invite] 📧 Calling sendEmail function...`);
    const emailResult = await sendEmail({
      to: email.toLowerCase(),
      subject: `Seminar Participation Invitation: ${seminarTitle}`,
      html: emailHtml,
    });

    console.log(`[POST /api/participants/invite] 📧 Email result:`, emailResult);

    if (!emailResult.success) {
      console.warn(`[POST /api/participants/invite] Email sending failed for ${email}:`, emailResult.error);
      // Don't fail the request - invitation is still created in DB
    } else {
      console.log(`[POST /api/participants/invite] ✅ Email sent successfully to ${email}`);
    }

    // Update request to mark invitations as sent
    await supabase
      .from("requests")
      .update({
        participant_invitations_sent: true,
        participant_invitations_sent_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    return NextResponse.json({
      ok: true,
      data: invitation,
      message: alreadyExists ? "Invitation resent successfully" : "Invitation sent successfully",
      alreadyExists: alreadyExists,
    });
  } catch (err: any) {
    console.error("[POST /api/participants/invite] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

