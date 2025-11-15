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
      console.log(`[POST /api/participants/invite] 📝 Creating invitation with:`, {
        request_id,
        email: email.toLowerCase(),
        invited_by: profile.id,
        token_length: token.length,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      });

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
        console.error("[POST /api/participants/invite] ❌ Database Error:", inviteError);
        console.error("[POST /api/participants/invite] ❌ Error Code:", inviteError.code);
        console.error("[POST /api/participants/invite] ❌ Error Details:", inviteError.details);
        console.error("[POST /api/participants/invite] ❌ Error Hint:", inviteError.hint);
        return NextResponse.json(
          { 
            ok: false, 
            error: inviteError.message || "Failed to create invitation",
            details: inviteError.details,
            hint: inviteError.hint,
          },
          { status: 500 }
        );
      }

      console.log(`[POST /api/participants/invite] ✅ Invitation created:`, newInvitation?.id);

      invitation = newInvitation;
    }

    // Get request details for email (including requester profile picture and seminar data)
    const { data: requestData } = await supabase
      .from("requests")
      .select("id, reason, seminar_title, travel_start_date, travel_end_date, seminar_data, requester:users!requester_id(name, profile_picture)")
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

    // Extract title and dates from seminar_data JSONB
    let seminarTitle = "Seminar/Training";
    let dateFrom = "";
    let dateTo = "";
    
    if (requestData?.seminar_data) {
      const seminarData = typeof requestData.seminar_data === 'string' 
        ? JSON.parse(requestData.seminar_data) 
        : requestData.seminar_data;
      
      console.log(`[POST /api/participants/invite] 📅 Raw seminar_data:`, JSON.stringify(seminarData, null, 2));
      
      seminarTitle = seminarData?.title || requestData.title || "Seminar/Training";
      dateFrom = seminarData?.dateFrom || seminarData?.date_from || "";
      dateTo = seminarData?.dateTo || seminarData?.date_to || "";
      
      console.log(`[POST /api/participants/invite] 📅 Extracted from seminar_data:`, { 
        title: seminarTitle, 
        dateFrom, 
        dateTo 
      });
    } else {
      seminarTitle = requestData?.title || "Seminar/Training";
    }
    
    // Fallback to travel_start_date and travel_end_date if seminar_data doesn't have dates
    if (!dateFrom && requestData?.travel_start_date) {
      dateFrom = new Date(requestData.travel_start_date).toISOString().split('T')[0];
      console.log(`[POST /api/participants/invite] 📅 Using travel_start_date fallback:`, dateFrom);
    }
    if (!dateTo && requestData?.travel_end_date) {
      dateTo = new Date(requestData.travel_end_date).toISOString().split('T')[0];
      console.log(`[POST /api/participants/invite] 📅 Using travel_end_date fallback:`, dateTo);
    }
    
    const requesterName = (requestData?.requester as any)?.name || profile.name || "Requester";
    
    console.log(`[POST /api/participants/invite] 📅 Final dates for email:`, { 
      seminarTitle, 
      dateFrom, 
      dateTo,
      hasDateFrom: !!dateFrom,
      hasDateTo: !!dateTo
    });

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
      console.warn(`[POST /api/participants/invite] ⚠️ Email sending failed for ${email}:`, emailResult.error);
      // Don't fail the request - invitation is still created in DB
      // But return a warning message to the frontend WITH the confirmation link
      return NextResponse.json({
        ok: true,
        data: invitation,
        message: alreadyExists ? "Invitation resent successfully" : "Invitation created successfully",
        warning: `Email could not be sent: ${emailResult.error}. Please check your RESEND_API_KEY configuration or check the server logs for details.`,
        confirmationLink: confirmationLink, // Include link so user can manually share
        alreadyExists: alreadyExists,
      });
    } else {
      console.log(`[POST /api/participants/invite] ✅ Email sent successfully to ${email}`);
      if (emailResult.emailId) {
        console.log(`[POST /api/participants/invite] 📧 Email ID: ${emailResult.emailId}`);
        console.log(`[POST /api/participants/invite] 📧 Check delivery at: https://resend.com/emails/${emailResult.emailId}`);
      }
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
      data: {
        ...invitation,
        emailId: emailResult.emailId, // Include email ID for tracking
      },
      message: alreadyExists ? "Invitation resent successfully" : "Invitation sent successfully",
      alreadyExists: alreadyExists,
      emailId: emailResult.emailId, // Also include at top level for easy access
      resendUrl: emailResult.emailId ? `https://resend.com/emails/${emailResult.emailId}` : null,
    });
  } catch (err: any) {
    console.error("[POST /api/participants/invite] ❌ Unexpected error:", err);
    console.error("[POST /api/participants/invite] ❌ Error stack:", err.stack);
    return NextResponse.json(
      { 
        ok: false, 
        error: err.message || "Internal server error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

