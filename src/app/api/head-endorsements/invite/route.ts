// src/app/api/head-endorsements/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils/getBaseUrl";
import * as crypto from "crypto";

/**
 * POST /api/head-endorsements/invite
 * Send invitation to a department head to endorse a travel request
 * Used for multi-department scenarios where different heads need to endorse
 */
export async function POST(req: NextRequest) {
  console.log("\n" + "=".repeat(70));
  console.log("[POST /api/head-endorsements/invite] 🚀 API Route Called!");
  console.log("=".repeat(70));
  
  try {
    // Get authenticated user first (for authorization) - use anon key to read cookies
    const authSupabase = await createSupabaseServerClient(false);
    const body = await req.json();
    const { request_id, head_email, head_name, department_id, department_name } = body;
    
    console.log("[POST /api/head-endorsements/invite] 📥 Request body:", { 
      request_id, 
      head_email, 
      head_name, 
      department_id, 
      department_name 
    });

    if (!request_id || !head_email) {
      return NextResponse.json(
        { ok: false, error: "Missing request_id or head_email" },
        { status: 400 }
      );
    }

    // Get current user (requester)
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS)
    const supabase = await createSupabaseServerClient(true);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("auth_user_id", authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Get request details
    const { data: requestData, error: requestError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        title,
        purpose,
        travel_start_date,
        travel_end_date,
        destination,
        requester:users!requester_id(id, name, email, profile_picture)
      `)
      .eq("id", request_id)
      .single();

    if (requestError || !requestData) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Check if invitation already exists
    const { data: existing, error: existingError } = await supabase
      .from("head_endorsement_invitations")
      .select("id, status, token, expires_at")
      .eq("request_id", request_id)
      .eq("head_email", head_email.toLowerCase())
      .maybeSingle();

    let invitation: any;
    let token: string;
    let alreadyExists = false;

    if (existing && !existingError) {
      // Check if invitation is expired
      const isExpired = existing.status === 'expired' || (existing.expires_at && new Date(existing.expires_at) < new Date());
      
      if (isExpired) {
        // Regenerate token and expiration
        console.log(`[POST /api/head-endorsements/invite] 🔄 Invitation expired, regenerating token`);
        token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
        
        const { data: updatedInvitation, error: updateError } = await supabase
          .from("head_endorsement_invitations")
          .update({
            token,
            expires_at: expiresAt.toISOString(),
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        
        if (updateError) {
          console.error("[POST /api/head-endorsements/invite] ❌ Failed to regenerate expired invitation:", updateError);
          return NextResponse.json(
            { ok: false, error: `Failed to regenerate invitation: ${updateError.message}` },
            { status: 500 }
          );
        }
        
        invitation = updatedInvitation;
        alreadyExists = false;
      } else {
        // Use existing invitation but resend email
        console.log(`[POST /api/head-endorsements/invite] ✅ Invitation already exists, will resend email`);
        const { data: fullInvitation, error: fetchError } = await supabase
          .from("head_endorsement_invitations")
          .select("*")
          .eq("id", existing.id)
          .single();
        
        if (fetchError || !fullInvitation) {
          invitation = existing;
          token = existing.token;
        } else {
          invitation = fullInvitation;
          token = fullInvitation.token;
        }
        alreadyExists = true;
      }
    } else {
      // Create new invitation
      token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const { data: newInvitation, error: insertError } = await supabase
        .from("head_endorsement_invitations")
        .insert({
          request_id,
          head_email: head_email.toLowerCase(),
          head_name: head_name || null,
          department_id: department_id || null,
          department_name: department_name || null,
          invited_by: profile.id,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) {
        console.error("[POST /api/head-endorsements/invite] ❌ Failed to create invitation:", insertError);
        return NextResponse.json(
          { ok: false, error: `Failed to create invitation: ${insertError.message}` },
          { status: 500 }
        );
      }

      invitation = newInvitation;
      alreadyExists = false;
    }

    // Generate confirmation link
    const baseUrl = getBaseUrl(req);
    const confirmationLink = `${baseUrl}/head-endorsements/confirm/${token}`;

    // Generate email HTML
    const requester = Array.isArray(requestData.requester) ? requestData.requester[0] : requestData.requester;
    const requesterName = requester?.name || profile.name || "Requester";
    const requesterProfilePicture = requester?.profile_picture || null;
    const requestNumber = requestData.request_number || "Request";
    const title = requestData.title || "Travel Request";
    const destination = requestData.destination || "Destination";
    const travelStartDate = requestData.travel_start_date 
      ? new Date(requestData.travel_start_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : "TBD";
    const travelEndDate = requestData.travel_end_date 
      ? new Date(requestData.travel_end_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : "TBD";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Head Endorsement Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7a0019 0%, #5a0012 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Head Endorsement Request</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hello ${head_name || 'Department Head'},
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      You have been requested to endorse a travel request for ${department_name || 'your department'}.
    </p>
    
    <div style="background: #f9fafb; border-left: 4px solid #7a0019; padding: 20px; margin: 20px 0; border-radius: 4px;">
      <h2 style="margin-top: 0; color: #7a0019; font-size: 18px;">Request Details</h2>
      <p style="margin: 8px 0;"><strong>Request Number:</strong> ${requestNumber}</p>
      <p style="margin: 8px 0;"><strong>Title:</strong> ${title}</p>
      <p style="margin: 8px 0;"><strong>Destination:</strong> ${destination}</p>
      <p style="margin: 8px 0;"><strong>Travel Dates:</strong> ${travelStartDate} - ${travelEndDate}</p>
      <p style="margin: 8px 0;"><strong>Requester:</strong> ${requesterName}</p>
    </div>
    
    <p style="font-size: 16px; margin: 30px 0;">
      Please review and endorse this request by clicking the button below:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationLink}" 
         style="display: inline-block; background: #7a0019; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Review & Endorse Request
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      Or copy and paste this link into your browser:<br>
      <a href="${confirmationLink}" style="color: #7a0019; word-break: break-all;">${confirmationLink}</a>
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      This invitation will expire in 7 days.
    </p>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin-top: 20px; border-radius: 4px;">
      <p style="font-size: 12px; color: #856404; margin: 0;">
        <strong>📧 Email Not Received?</strong> Please check your <strong>Spam/Junk folder</strong>. 
        If you're using Outlook, the email might be filtered. You can also copy the confirmation link above.
      </p>
    </div>
  </div>
  
  <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
    <p>This is an automated message from TraviLink Travel Management System</p>
    <p>MSEUF - Manuel S. Enverga University Foundation</p>
  </div>
</body>
</html>
    `;

    // Send email
    console.log(`[POST /api/head-endorsements/invite] 📧 Attempting to send email to ${head_email}...`);
    console.log(`[POST /api/head-endorsements/invite] 📧 Confirmation link: ${confirmationLink}`);
    
    const emailResult = await sendEmail({
      to: head_email.toLowerCase(),
      subject: `Head Endorsement Request: ${requestNumber}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error(`[POST /api/head-endorsements/invite] ❌ Email sending failed:`, emailResult.error);
      return NextResponse.json({
        ok: true,
        data: invitation,
        message: alreadyExists ? "Invitation resent successfully" : "Invitation created successfully",
        warning: `Email could not be sent: ${emailResult.error}. Please check your RESEND_API_KEY configuration.`,
        confirmationLink: confirmationLink,
        alreadyExists: alreadyExists,
        emailSent: false,
        emailError: emailResult.error,
      });
    }

    console.log(`[POST /api/head-endorsements/invite] ✅ Email sent successfully to ${head_email}`);
    console.log(`[POST /api/head-endorsements/invite] 📧 Email ID: ${emailResult.emailId}`);
    console.log(`\n${"=".repeat(70)}`);
    console.log(`[POST /api/head-endorsements/invite] 🔗 CONFIRMATION LINK (for testing):`);
    console.log(`${confirmationLink}`);
    console.log(`${"=".repeat(70)}\n`);

    return NextResponse.json({
      ok: true,
      data: invitation,
      message: alreadyExists ? "Invitation resent successfully" : "Invitation sent successfully",
      alreadyExists: alreadyExists,
      emailSent: true,
      emailId: emailResult.emailId,
      confirmationLink: confirmationLink,
    });
  } catch (err: any) {
    console.error("[POST /api/head-endorsements/invite] ❌ Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

