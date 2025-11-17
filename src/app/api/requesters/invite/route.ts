// src/app/api/requesters/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

/**
 * POST /api/requesters/invite
 * Send invitation to a requester (for multiple requester feature)
 */
export async function POST(req: NextRequest) {
  console.log("\n" + "=".repeat(70));
  console.log("[POST /api/requesters/invite] 🚀 API Route Called!");
  console.log("=".repeat(70));
  
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await req.json();
    const { request_id, email, requester_id, name } = body;
    
    console.log("[POST /api/requesters/invite] 📥 Request body:", { request_id, email, requester_id, name });

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

    // Check if invitation already exists (using requester_invitations table)
    const { data: existing, error: existingError } = await supabase
      .from("requester_invitations")
      .select("id, status, token")
      .eq("request_id", request_id)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    let invitation: any;
    let token: string;
    let alreadyExists = false;

    if (existing && !existingError) {
      // Use existing invitation but still send email (resend functionality)
      console.log(`[POST /api/requesters/invite] ✅ Invitation already exists for ${email}, will resend email`);
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
        .from("requester_invitations")
        .insert({
          request_id,
          email: email.toLowerCase(),
          name: name || null,
          user_id: requester_id || null,
          invited_by: profile.id,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (inviteError) {
        console.error("[POST /api/requesters/invite] ❌ Database Error:", inviteError);
        return NextResponse.json(
          { 
            ok: false, 
            error: `Failed to create invitation: ${inviteError.message}` 
          },
          { status: 500 }
        );
      }

      invitation = newInvitation;
    }

    // Generate confirmation link
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl && process.env.VERCEL_URL) {
      baseUrl = `https://${process.env.VERCEL_URL}`;
    }
    if (!baseUrl) {
      baseUrl = "http://localhost:3000";
    }
    const confirmationLink = `${baseUrl}/requesters/confirm/${token}`;

    // Prepare email content
    const requesterName = name || "Requester";
    const requesterProfilePicture = (requestData?.requester as any)?.profile_picture || null;
    const travelDate = requestData.travel_start_date 
      ? new Date(requestData.travel_start_date).toLocaleDateString('en-PH', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : "TBD";

    // Generate email HTML (similar to participant invitation but for requesters)
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Travel Request Confirmation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7A0010 0%, #5e000d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Travel Request Confirmation</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hello ${requesterName},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            You have been added as a requester for a travel request. Please confirm your participation by clicking the button below:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" style="display: inline-block; background: #7A0010; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Confirm Participation
            </a>
          </div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #7A0010;">Request Details:</h3>
            <p style="margin: 5px 0;"><strong>Request Number:</strong> ${requestData.request_number || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${requestData.purpose || requestData.title || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Destination:</strong> ${requestData.destination || 'N/A'}</p>
            <p style="margin: 5px 0;"><strong>Travel Date:</strong> ${travelDate}</p>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
          <p style="font-size: 14px; color: #6b7280;">
            This link will expire in 7 days.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>Manuel S. Enverga University Foundation</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    const emailResult = await sendEmail({
      to: email.toLowerCase(),
      subject: `Travel Request Confirmation: ${requestData.request_number || 'Request'}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.warn(`[POST /api/requesters/invite] ⚠️ Email sending failed for ${email}:`, emailResult.error);
      return NextResponse.json({
        ok: true,
        data: invitation,
        message: alreadyExists ? "Invitation resent successfully" : "Invitation created successfully",
        warning: `Email could not be sent: ${emailResult.error}. Please check your RESEND_API_KEY configuration.`,
        confirmationLink: confirmationLink,
        alreadyExists: alreadyExists,
      });
    }

    console.log(`[POST /api/requesters/invite] ✅ Email sent successfully to ${email}`);

    return NextResponse.json({
      ok: true,
      data: invitation,
      message: alreadyExists ? "Invitation resent successfully" : "Invitation created successfully",
      confirmationLink: confirmationLink,
      alreadyExists: alreadyExists,
      emailId: emailResult.emailId,
      resendUrl: emailResult.emailId ? `https://resend.com/emails/${emailResult.emailId}` : null,
    });
  } catch (err: any) {
    console.error("[POST /api/requesters/invite] ❌ Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

