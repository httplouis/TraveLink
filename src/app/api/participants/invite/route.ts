// src/app/api/participants/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
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
    const body = await req.json();
    const { request_id, email } = body;
    
    console.log("[POST /api/participants/invite] 📥 Request body:", { request_id, email });

    if (!request_id || !email) {
      return NextResponse.json(
        { ok: false, error: "Missing request_id or email" },
        { status: 400 }
      );
    }

    // Use regular client for auth checks (NOT service_role)
    const authSupabase = await createSupabaseServerClient(false);
    
    // Get current user - use regular client for auth
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !authUser) {
      console.error("[POST /api/participants/invite] ❌ Auth error:", authError);
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    console.log("[POST /api/participants/invite] ✅ Authenticated user:", authUser.id);

    // Create service role client for database operations (bypasses RLS)
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user profile - use service_role to bypass RLS if needed
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", authUser.id)
      .single();

    if (profileError || !profile) {
      console.error("[POST /api/participants/invite] ❌ Profile error:", profileError);
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    console.log("[POST /api/participants/invite] ✅ User profile found:", profile.id);

    // Check if invitation already exists (use service role to bypass RLS)
    const { data: existing, error: existingError } = await supabaseServiceRole
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

      // Use service role client to bypass RLS for insert
      const { data: newInvitation, error: inviteError } = await supabaseServiceRole
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
    // Use service role to bypass RLS
    const { data: requestData } = await supabaseServiceRole
      .from("requests")
      .select("id, reason, seminar_title, travel_start_date, travel_end_date, seminar_data, requester:users!requester_id(name, profile_picture)")
      .eq("id", request_id)
      .single();

    // Send email notification
    console.log(`[POST /api/participants/invite] 📧 Preparing to send email to ${email}...`);
    
    // Use shared utility function for consistent baseUrl resolution
    // ALWAYS use production URL for email links (forceProduction = true)
    // This ensures email links work on mobile devices and in production
    const { getBaseUrl } = await import("@/lib/utils/getBaseUrl");
    const baseUrl = getBaseUrl(req, true); // forceProduction = true for email links
    const confirmationLink = `${baseUrl}/participants/confirm/${token}`;
    
    console.log(`[POST /api/participants/invite] 🌐 Base URL resolved:`, {
      baseUrl,
      fromEnv: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      fromHeaders: req.headers.get('origin') || req.headers.get('host') || 'not available',
      isProduction: !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')
    });

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
      
      seminarTitle = seminarData?.title || requestData?.seminar_title || "Seminar/Training";
      dateFrom = seminarData?.dateFrom || seminarData?.date_from || "";
      dateTo = seminarData?.dateTo || seminarData?.date_to || "";
      
      console.log(`[POST /api/participants/invite] 📅 Extracted from seminar_data:`, { 
        title: seminarTitle, 
        dateFrom, 
        dateTo 
      });
    } else {
      seminarTitle = requestData?.seminar_title || "Seminar/Training";
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

    // Send email for participant invitations (seminar application)
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
      await supabaseServiceRole
        .from("requests")
        .update({
          participant_invitations_sent: false, // Mark as not sent via email
          participant_invitations_sent_at: null, // No email sent timestamp
        })
        .eq("id", request_id);

      return NextResponse.json({
        ok: true,
        data: invitation,
        message: alreadyExists ? "Invitation resent successfully" : "Invitation created successfully",
        warning: `Email could not be sent: ${emailResult.error}. Please check your RESEND_API_KEY configuration or check the server logs for details.`,
        confirmationLink: confirmationLink, // Include link so user can manually share
        alreadyExists: alreadyExists,
        emailSent: false,
        emailError: emailResult.error,
      });
    } else {
      console.log(`[POST /api/participants/invite] ✅ Email sent successfully to ${email}`);
      if (emailResult.emailId) {
        console.log(`[POST /api/participants/invite] 📧 Email ID: ${emailResult.emailId}`);
        console.log(`[POST /api/participants/invite] 📧 Check delivery at: https://resend.com/emails/${emailResult.emailId}`);
      }
    }

    // Update request to mark invitations as sent (use service role to bypass RLS)
    await supabaseServiceRole
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
      emailSent: true,
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

