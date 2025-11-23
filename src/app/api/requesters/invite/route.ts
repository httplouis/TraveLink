// src/app/api/requesters/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils/getBaseUrl";
import * as crypto from "crypto";

/**
 * POST /api/requesters/invite
 * Send invitation to a requester (for multiple requester feature)
 */
export async function POST(req: NextRequest) {
  console.log("\n" + "=".repeat(70));
  console.log("[POST /api/requesters/invite] 🚀 API Route Called!");
  console.log("=".repeat(70));
  
  try {
    // Get authenticated user first (for authorization) - use anon key to read cookies
    const authSupabase = await createSupabaseServerClient(false);
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

    // Check if invitation already exists (using requester_invitations table)
    const { data: existing, error: existingError } = await supabase
      .from("requester_invitations")
      .select("id, status, token, expires_at")
      .eq("request_id", request_id)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    let invitation: any;
    let token: string;
    let alreadyExists = false;

    if (existing && !existingError) {
      // Check if invitation is expired - if so, regenerate token and expiration
      const isExpired = existing.status === 'expired' || (existing.expires_at && new Date(existing.expires_at) < new Date());
      
      if (isExpired) {
        // Regenerate token and expiration for expired invitations
        console.log(`[POST /api/requesters/invite] 🔄 Invitation expired, regenerating token and expiration`);
        token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
        
        // Update expired invitation with new token and expiration
        const { data: updatedInvitation, error: updateError } = await supabase
          .from("requester_invitations")
          .update({
            token,
            expires_at: expiresAt.toISOString(),
            status: 'pending', // Reset to pending
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();
        
        if (updateError) {
          console.error("[POST /api/requesters/invite] ❌ Failed to regenerate expired invitation:", updateError);
          return NextResponse.json(
            { 
              ok: false, 
              error: `Failed to regenerate invitation: ${updateError.message}` 
            },
            { status: 500 }
          );
        }
        
        invitation = updatedInvitation;
        alreadyExists = false; // Treat as new invitation for email sending
      } else {
        // Use existing invitation but still send email (resend functionality)
        console.log(`[POST /api/requesters/invite] ✅ Invitation already exists for ${email}, will resend email`);
        console.log(`[POST /api/requesters/invite] 📋 Existing invitation details:`, {
          id: existing.id,
          tokenFirst8: existing.token?.substring(0, 8),
          tokenLength: existing.token?.length,
          status: existing.status,
          request_id: request_id,
        });
        
        // Fetch full invitation to ensure we have the latest data
        const { data: fullInvitation, error: fetchError } = await supabase
          .from("requester_invitations")
          .select("*")
          .eq("id", existing.id)
          .single();
        
        if (fetchError || !fullInvitation) {
          console.error(`[POST /api/requesters/invite] ❌ Failed to fetch full invitation:`, fetchError);
          // Fallback to existing data
          invitation = existing;
          token = existing.token;
        } else {
          invitation = fullInvitation;
          token = fullInvitation.token;
          console.log(`[POST /api/requesters/invite] ✅ Fetched full invitation with token:`, {
            tokenFirst8: token?.substring(0, 8),
            tokenLength: token?.length,
          });
        }
        alreadyExists = true;
      }
    } else {
      // Generate unique token for new invitation
      token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      // Fetch user's department if user_id is provided
      let department = null;
      let department_id = null;
      if (requester_id) {
        const { data: userData } = await supabase
          .from("users")
          .select("department, department_id")
          .eq("id", requester_id)
          .maybeSingle();
        
        if (userData) {
          // Get department name from user data
          if (typeof userData.department === 'string' && userData.department.trim()) {
            department = userData.department;
            department_id = userData.department_id;
          } else if (userData.department_id) {
            // Fetch department name from departments table
            const { data: deptData } = await supabase
              .from("departments")
              .select("id, name")
              .eq("id", userData.department_id)
              .maybeSingle();
            
            if (deptData) {
              department = deptData.name;
              department_id = deptData.id;
            }
          }
          
          console.log(`[POST /api/requesters/invite] ✅ Fetched user department:`, {
            department,
            department_id,
            userId: requester_id,
          });
        }
      }

      // Create new invitation
      const { data: newInvitation, error: inviteError } = await supabase
        .from("requester_invitations")
        .insert({
          request_id,
          email: email.toLowerCase(),
          name: name || null,
          user_id: requester_id || null,
          department: department || null,
          department_id: department_id || null,
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
      
      // Verify token was saved correctly
      console.log(`[POST /api/requesters/invite] ✅ New invitation created:`, {
        id: newInvitation.id,
        email: newInvitation.email,
        tokenFirst16: newInvitation.token?.substring(0, 16),
        tokenLast8: newInvitation.token?.substring(newInvitation.token?.length - 8),
        tokenLength: newInvitation.token?.length,
        request_id: newInvitation.request_id,
        status: newInvitation.status,
        expires_at: newInvitation.expires_at,
      });
    }

    // Generate confirmation link - use absolute URL
    // ALWAYS use production URL for email links (forceProduction = true)
    // This ensures email links work on mobile devices and in production
    const baseUrl = getBaseUrl(req, true);
    
    console.log(`[POST /api/requesters/invite] 🌐 Base URL resolved:`, {
      baseUrl,
      fromEnv: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      fromHeaders: req.headers.get('origin') || req.headers.get('host') || 'not available',
      fromVercel: process.env.VERCEL_URL || 'not set',
      nodeEnv: process.env.NODE_ENV || 'not set',
      isLocalhost: baseUrl.includes('localhost'),
      warning: baseUrl.includes('localhost') && process.env.NODE_ENV === 'production' ? '⚠️ LOCALHOST IN PRODUCTION!' : 'ok',
    });
    
    // Verify token exists and is valid
    if (!token || token.length < 32) {
      console.error(`[POST /api/requesters/invite] ❌ Invalid token:`, {
        tokenLength: token?.length,
        tokenFirst8: token?.substring(0, 8),
        invitationId: invitation?.id,
      });
      return NextResponse.json(
        { ok: false, error: "Invalid invitation token. Please try resending the invitation." },
        { status: 500 }
      );
    }
    
    // Verify token in database matches what we're sending (for existing invitations)
    let finalToken = token;
    if (invitation?.id && alreadyExists) {
      const { data: verifyInvitation, error: verifyError } = await supabase
        .from("requester_invitations")
        .select("id, token, email, request_id, status")
        .eq("id", invitation.id)
        .single();
      
      if (verifyError) {
        console.error(`[POST /api/requesters/invite] ❌ Failed to verify invitation:`, verifyError);
      } else if (verifyInvitation) {
        console.log(`[POST /api/requesters/invite] ✅ Verified invitation in database:`, {
          id: verifyInvitation.id,
          tokenMatches: verifyInvitation.token === token,
          tokenFirst8: verifyInvitation.token?.substring(0, 8),
          email: verifyInvitation.email,
          status: verifyInvitation.status,
        });
        
        if (verifyInvitation.token !== token) {
          console.error(`[POST /api/requesters/invite] ⚠️ WARNING: Token mismatch! Using database token.`, {
            databaseToken: verifyInvitation.token?.substring(0, 8),
            sendingToken: token.substring(0, 8),
          });
          // Use the token from database instead
          finalToken = verifyInvitation.token;
        }
      }
    }
    
    // Use absolute URL - token should be URL-safe (hex string), but encode just in case
    // Note: encodeURIComponent is safe for hex strings, but we'll use it to handle any edge cases
    const confirmationLink = `${baseUrl}/requesters/confirm/${encodeURIComponent(finalToken)}`;
    
    console.log(`[POST /api/requesters/invite] 🔗 Generated confirmation link:`, {
      fullLink: confirmationLink,
      baseUrl,
      tokenFirst8: finalToken.substring(0, 8),
      tokenLast8: finalToken.substring(finalToken.length - 8),
      tokenLength: finalToken.length,
      invitationId: invitation?.id,
      email: email,
      tokenChanged: finalToken !== token,
    });

    // Prepare email content
    const requesterName = name || "Requester";
    const requesterProfilePicture = (requestData?.requester as any)?.profile_picture || null;
    
    // Format travel date range properly
    let travelDate = "TBD";
    if (requestData.travel_start_date && requestData.travel_end_date) {
      const startDate = new Date(requestData.travel_start_date);
      const endDate = new Date(requestData.travel_end_date);
      const startFormatted = startDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const endFormatted = endDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (startDate.getTime() === endDate.getTime()) {
        travelDate = startFormatted;
      } else {
        travelDate = `${startFormatted} - ${endFormatted}`;
      }
    } else if (requestData.travel_start_date) {
      travelDate = new Date(requestData.travel_start_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
    
    // Format request number - hide draft prefix if present
    let displayRequestNumber = requestData.request_number || 'Draft';
    if (displayRequestNumber.startsWith('DRAFT-')) {
      displayRequestNumber = displayRequestNumber.replace('DRAFT-', '');
    }
    
    // Format destination - show "To be determined" if empty or "TBD"
    let displayDestination = requestData.destination || 'To be determined';
    if (displayDestination.trim().toUpperCase() === 'TBD' || displayDestination.trim() === '') {
      displayDestination = 'To be determined';
    }
    
    // Format purpose - use title if purpose is empty
    const displayPurpose = requestData.purpose || requestData.title || 'Travel Request';

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
            <a href="${confirmationLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #7A0010; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Confirm Participation
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${confirmationLink}" target="_blank" rel="noopener noreferrer" style="word-break: break-all; color: #7A0010; font-size: 12px; text-decoration: underline;">${confirmationLink}</a>
          </p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #7A0010;">Request Details:</h3>
            <p style="margin: 5px 0;"><strong>Request Number:</strong> ${displayRequestNumber}</p>
            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${displayPurpose}</p>
            <p style="margin: 5px 0;"><strong>Destination:</strong> ${displayDestination}</p>
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
    console.log(`[POST /api/requesters/invite] 📧 Attempting to send email to ${email}...`);
    console.log(`[POST /api/requesters/invite] 📧 Confirmation link in email: ${confirmationLink}`);
    
    const emailResult = await sendEmail({
      to: email.toLowerCase(),
      subject: `Travel Request Confirmation: ${requestData.request_number || 'Request'}`,
      html: emailHtml,
    });

    if (!emailResult.success) {
      console.error(`[POST /api/requesters/invite] ❌ Email sending failed for ${email}:`, emailResult.error);
      console.error(`[POST /api/requesters/invite] 📋 Confirmation link (for manual sharing): ${confirmationLink}`);
      
      // Still return success but with warning - invitation was created
      return NextResponse.json({
        ok: true,
        data: invitation,
        message: alreadyExists ? "Invitation resent successfully" : "Invitation created successfully",
        warning: `Email could not be sent: ${emailResult.error}. Please check your RESEND_API_KEY configuration. You can manually share this confirmation link.`,
        confirmationLink: confirmationLink,
        alreadyExists: alreadyExists,
        emailSent: false,
        emailError: emailResult.error,
      });
    }

    console.log(`[POST /api/requesters/invite] ✅ Email sent successfully to ${email}`);
    console.log(`[POST /api/requesters/invite] 📧 Email ID: ${emailResult.emailId}`);
    console.log(`[POST /api/requesters/invite] 📧 Check delivery: https://resend.com/emails/${emailResult.emailId}`);
    
    // Always log confirmation link for easy testing (especially in development)
    console.log(`\n${"=".repeat(70)}`);
    console.log(`[POST /api/requesters/invite] 🔗 CONFIRMATION LINK (for testing):`);
    console.log(`${confirmationLink}`);
    console.log(`${"=".repeat(70)}\n`);

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

