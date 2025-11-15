// src/app/api/test-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, generateParticipantInvitationEmail } from "@/lib/email";

/**
 * POST /api/test-email
 * Test endpoint to send a test email invitation
 * Useful for testing email configuration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, request_id } = body;

    if (!to) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing 'to' email address" 
      }, { status: 400 });
    }

    console.log("\n" + "=".repeat(70));
    console.log("[TEST EMAIL] 🧪 Testing email sending...");
    console.log("=".repeat(70));
    console.log("To:", to);
    console.log("Request ID:", request_id || "N/A");

    // Generate test confirmation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const testToken = "test-token-" + Date.now();
    const confirmationLink = `${baseUrl}/participants/confirm/${testToken}`;

    // Generate test email
    const emailHtml = generateParticipantInvitationEmail({
      participantName: "Test Participant",
      requesterName: "Test Requester",
      requesterProfilePicture: null,
      seminarTitle: "Test Seminar - Email Testing",
      dateFrom: new Date().toISOString().split('T')[0],
      dateTo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      confirmationLink,
    });

    console.log("[TEST EMAIL] 📧 Sending test email...");
    const result = await sendEmail({
      to: to.toLowerCase(),
      subject: "🧪 TEST: Seminar Participation Invitation",
      html: emailHtml,
    });

    console.log("[TEST EMAIL] 📧 Result:", result);

    if (result.success) {
      console.log("[TEST EMAIL] ✅ Email sent successfully!");
      if (result.emailId) {
        console.log("[TEST EMAIL] 📧 Email ID:", result.emailId);
        console.log("[TEST EMAIL] 🔗 Check delivery at: https://resend.com/emails/" + result.emailId);
      }
      
      return NextResponse.json({
        ok: true,
        message: "Test email sent successfully!",
        emailId: result.emailId,
        resendUrl: result.emailId ? `https://resend.com/emails/${result.emailId}` : null,
        confirmationLink,
      });
    } else {
      console.error("[TEST EMAIL] ❌ Email failed:", result.error);
      return NextResponse.json({
        ok: false,
        error: result.error || "Failed to send email",
        confirmationLink, // Still return link for manual testing
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[TEST EMAIL] ❌ Error:", err);
    return NextResponse.json({
      ok: false,
      error: err.message || "Internal server error",
    }, { status: 500 });
  }
}

