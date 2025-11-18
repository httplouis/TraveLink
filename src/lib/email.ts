// src/lib/email.ts
/**
 * Email sending utility
 * Supports Resend API (recommended) or console logging for development
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions): Promise<{ success: boolean; error?: string; emailId?: string }> {
  console.log(`[sendEmail] 🚀 Function called with:`, { to, subject: subject.substring(0, 50) + "..." });
  
  // Support multiple API keys for testing (3 accounts)
  // Check if recipient matches specific email patterns and use corresponding API key
  let apiKey = process.env.RESEND_API_KEY;
  
  // For testing: Use different API keys for different email patterns
  // Account 1: a22-34976@student.mseuf.edu.ph -> re_BzA9Y47y_5r42BxxaJW17b6vbxJUQxuC1
  if (to.toLowerCase().includes('a22-34976@student.mseuf.edu.ph')) {
    apiKey = process.env.RESEND_API_KEY_1 || 're_BzA9Y47y_5r42BxxaJW17b6vbxJUQxuC1';
    console.log(`[sendEmail] 🔑 Using API key 1 for a22-34976@student.mseuf.edu.ph`);
  } 
  // Account 2: a22-33538@student.mseuf.edu.ph -> re_eyeNuzSw_GpBEeL6gQHk9jepC7W4pEjPX
  else if (to.toLowerCase().includes('a22-33538@student.mseuf.edu.ph')) {
    apiKey = process.env.RESEND_API_KEY_2 || 're_eyeNuzSw_GpBEeL6gQHk9jepC7W4pEjPX';
    console.log(`[sendEmail] 🔑 Using API key 2 for a22-33538@student.mseuf.edu.ph`);
  }
  // Account 3: a22-34939@student.mseuf.edu.ph -> re_643gMPn1_HWKhe1qgnkrcmpnydmiKD9P8
  else if (to.toLowerCase().includes('a22-34939@student.mseuf.edu.ph')) {
    apiKey = process.env.RESEND_API_KEY_3 || 're_643gMPn1_HWKhe1qgnkrcmpnydmiKD9P8';
    console.log(`[sendEmail] 🔑 Using API key 3 for a22-34939@student.mseuf.edu.ph`);
  }
  
  // Fallback to default if no specific key found
  if (!apiKey) {
    apiKey = process.env.RESEND_API_KEY;
  }
  // Use custom domain if verified, otherwise fallback to Resend's test domain
  let fromEmail = from || process.env.EMAIL_FROM || "onboarding@resend.dev";
  
  // TEMPORARY: If using custom domain (@mseuf.edu.ph), fallback to test domain
  // This prevents 403 errors when domain is not yet verified
  // TODO: Remove this fallback once mseuf.edu.ph domain is verified in Resend
  if (fromEmail.includes("@mseuf.edu.ph")) {
    console.log(`[sendEmail] ⚠️ Custom domain (@mseuf.edu.ph) detected but not verified yet, using test domain for now`);
    console.log(`[sendEmail] 💡 Once domain is verified in Resend, update EMAIL_FROM to use @mseuf.edu.ph`);
    fromEmail = "onboarding@resend.dev";
  }

  // Debug: Check environment variables
  console.log(`[sendEmail] 🔍 Environment check:`);
  console.log(`  - RESEND_API_KEY exists:`, !!apiKey);
  console.log(`  - RESEND_API_KEY length:`, apiKey?.length || 0);
  console.log(`  - RESEND_API_KEY starts with 're_':`, apiKey?.startsWith('re_') || false);
  console.log(`  - EMAIL_FROM:`, process.env.EMAIL_FROM || "not set");
  console.log(`[sendEmail] 🔑 API Key check:`, apiKey ? "✅ Found" : "❌ Not found (will use console logging)");

  // If no API key, just log to console (for development)
  if (!apiKey) {
    console.log(`[sendEmail] 📝 No API key - logging to console instead...`);
    console.log("\n" + "=".repeat(70));
    console.log("📧 EMAIL WOULD BE SENT (No RESEND_API_KEY configured)");
    console.log("=".repeat(70));
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("From:", fromEmail);
    
    // Extract confirmation link from HTML
    const linkMatch = html.match(/href="([^"]+)"/);
    const confirmationLink = linkMatch ? linkMatch[1] : "Link not found";
    
    console.log("\n🔗 CONFIRMATION LINK:");
    console.log(confirmationLink);
    console.log("\n📄 HTML Content (first 300 chars):");
    console.log(html.substring(0, 300) + "...");
    console.log("=".repeat(70) + "\n");
    // Return error so user knows email wasn't actually sent
    return { 
      success: false, 
      error: "RESEND_API_KEY not configured. Email was not sent. Check server console for confirmation link." 
    };
  }

  try {
    // Use Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[sendEmail] Resend API error:", data);
      console.error("[sendEmail] Response status:", response.status);
      console.error("[sendEmail] Full error:", JSON.stringify(data, null, 2));
      
      // Handle Resend domain verification error (403 error)
      if (response.status === 403) {
        if (data.message?.includes("domain is not verified")) {
          console.warn("[sendEmail] ⚠️ Domain not verified - retrying with test domain");
          // Try again with test domain
          const testFromEmail = "onboarding@resend.dev";
          console.log(`[sendEmail] 🔄 Retrying with test domain: ${testFromEmail}`);
          
          const retryResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              from: testFromEmail,
              to: [to],
              subject,
              html,
            }),
          });
          
          const retryData = await retryResponse.json();
          if (retryResponse.ok) {
            console.log(`[sendEmail] ✅ Email sent successfully using test domain`);
            return { success: true, emailId: retryData.id };
          } else {
            console.error("[sendEmail] ❌ Retry with test domain also failed:", retryData);
            // Check if it's a recipient restriction
            if (retryData.message?.includes("only send testing emails") || 
                retryData.message?.includes("can only send") ||
                retryData.message?.includes("verified email")) {
              return { 
                success: false, 
                error: `Resend account restriction: Can only send to verified email addresses. The email "${to}" is not verified. To send to any email, verify a domain at resend.com/domains or add this email as a verified recipient.` 
              };
            }
            return { success: false, error: retryData.message || "Failed to send email even with test domain" };
          }
        } else if (data.message?.includes("only send testing emails") || 
                   data.message?.includes("can only send") ||
                   data.message?.includes("verified email") ||
                   data.message?.includes("your own email") ||
                   data.message?.includes("verify a domain")) {
          console.warn("[sendEmail] ⚠️ Resend test account restriction detected");
          console.warn("[sendEmail] 💡 Recipient email:", to);
          console.warn("[sendEmail] 💡 Resend message:", data.message);
          console.warn("[sendEmail] 💡 For production, verify a domain at resend.com/domains");
          
          // Extract the allowed email from Resend's message if available
          const ownEmailMatch = data.message?.match(/\(([^)]+)\)/);
          const allowedEmail = ownEmailMatch ? ownEmailMatch[1] : "your verified email";
          
          return { 
            success: false, 
            error: `Resend account restriction: Can only send to ${allowedEmail}. The email "${to}" is not verified. To send to any email address, verify a domain at resend.com/domains and update the EMAIL_FROM environment variable.` 
          };
        }
      }
      
      // Check for other common restriction messages (for non-403 errors)
      if (data.message?.includes("only send testing emails") || 
          data.message?.includes("can only send") ||
          data.message?.includes("verified email") ||
          data.message?.includes("your own email") ||
          data.message?.includes("verify a domain")) {
        console.warn("[sendEmail] ⚠️ Resend account restriction detected");
        console.warn("[sendEmail] 💡 Resend message:", data.message);
        
        // Extract the allowed email from Resend's message if available
        const ownEmailMatch = data.message?.match(/\(([^)]+)\)/);
        const allowedEmail = ownEmailMatch ? ownEmailMatch[1] : "your verified email";
        
        return { 
          success: false, 
          error: `Resend account restriction: Can only send to ${allowedEmail}. The email "${to}" is not verified. To send to any email address, verify a domain at resend.com/domains and update the EMAIL_FROM environment variable.` 
        };
      }
      
      return { success: false, error: data.message || "Failed to send email" };
    }

    console.log(`[sendEmail] ✅ Email sent to ${to}`);
    console.log(`[sendEmail] 📧 Resend Email ID: ${data.id}`);
    console.log(`[sendEmail] 📧 Check delivery status at: https://resend.com/emails/${data.id}`);
    console.log(`[sendEmail] 📧 Full response:`, JSON.stringify(data, null, 2));
    return { success: true, emailId: data.id };
  } catch (err: any) {
    console.error("[sendEmail] Error:", err);
    return { success: false, error: err.message || "Failed to send email" };
  }
}

/**
 * Generate HTML email template for participant invitation
 */
export function generateParticipantInvitationEmail({
  participantName,
  requesterName,
  requesterProfilePicture,
  seminarTitle,
  dateFrom,
  dateTo,
  confirmationLink,
}: {
  participantName?: string;
  requesterName: string;
  requesterProfilePicture?: string | null;
  seminarTitle: string;
  dateFrom: string;
  dateTo: string;
  confirmationLink: string;
}): string {
  const name = participantName || "Participant";
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBA";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "TBA";
      return date.toLocaleDateString("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "TBA";
    }
  };

  // Format date range
  const formattedDateFrom = formatDate(dateFrom);
  const formattedDateTo = formatDate(dateTo);
  const dateRange = dateFrom && dateTo
    ? (formattedDateFrom === formattedDateTo 
        ? formattedDateFrom 
        : `${formattedDateFrom} - ${formattedDateTo}`)
    : (dateFrom ? formattedDateFrom : "TBA");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seminar Participation Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7A0010 0%, #5A0010 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">Seminar Participation Invitation</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${name}</strong>,
              </p>
              
              ${requesterProfilePicture ? `
              <div style="margin: 0 0 20px 0; display: flex; align-items: center; gap: 12px;">
                <img src="${requesterProfilePicture}" alt="${requesterName}" style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #7A0010; object-fit: cover;" />
                <div>
                  <p style="margin: 0; color: #333333; font-size: 14px; font-weight: 600;">Invited by</p>
                  <p style="margin: 0; color: #7A0010; font-size: 16px; font-weight: bold;">${requesterName}</p>
                </div>
              </div>
              ` : `
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                You have been invited by <strong>${requesterName}</strong> to participate in the following seminar/training:
              </p>
              `}
              
              <div style="background-color: #f9f9f9; border-left: 4px solid #7A0010; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <h2 style="margin: 0 0 15px 0; color: #7A0010; font-size: 20px; font-weight: bold;">
                  ${seminarTitle}
                </h2>
                <p style="margin: 5px 0; color: #666666; font-size: 14px;">
                  <strong>Date:</strong> ${dateRange}
                </p>
              </div>
              
              <p style="margin: 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Please confirm your participation by clicking the button below:
              </p>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmationLink}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7A0010 0%, #5A0010 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(122, 0, 16, 0.3);">
                      Confirm Participation
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 5px 0 20px 0; color: #7A0010; font-size: 12px; word-break: break-all;">
                ${confirmationLink}
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">
                  This invitation link will expire in 7 days. If you did not expect this invitation, please ignore this email.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                TraviLink - Travel Request Management System<br>
                Manuel S. Enverga University Foundation
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

