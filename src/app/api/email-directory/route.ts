import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Email Directory API
 * Supports Azure AD / Microsoft Graph API integration
 * Falls back to simulated directory for development
 */

// Simulated external email directory (for development/testing)
// In production, this would call Azure AD / Microsoft Graph API
const EMAIL_DIRECTORY = [
  {
    email: "head.nursing@mseuf.edu.ph",
    name: "Dr. Maria Santos",
    department: "College of Nursing and Allied Health Sciences (CNAHS)",
    position: "Department Head",
  },
  {
    email: "head.engineering@mseuf.edu.ph",
    name: "Eng. Juan Dela Cruz",
    department: "College of Engineering",
    position: "Department Head",
  },
  {
    email: "hr.admin@mseuf.edu.ph",
    name: "Ms. Ana Reyes",
    department: "Human Resources",
    position: "HR Officer",
  },
  {
    email: "exec.office@mseuf.edu.ph",
    name: "Dr. Roberto Garcia",
    department: "Executive Office",
    position: "Executive Director",
  },
];

/**
 * Fetch user info from Azure AD / Microsoft Graph API
 * @param email - User's institutional email
 * @returns User data or null if not found
 */
async function fetchFromAzureAD(email: string): Promise<any | null> {
  const azureClientId = process.env.AZURE_CLIENT_ID;
  const azureClientSecret = process.env.AZURE_CLIENT_SECRET;
  const azureTenantId = process.env.AZURE_TENANT_ID;

  // If Azure credentials are not configured, return null (will use fallback)
  if (!azureClientId || !azureClientSecret || !azureTenantId) {
    console.log("[email-directory] Azure AD not configured, using fallback directory");
    return null;
  }

  try {
    // Get access token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: azureClientId,
          client_secret: azureClientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      }
    );

    if (!tokenResponse.ok) {
      console.error("[email-directory] Failed to get Azure AD token");
      return null;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Query Microsoft Graph API for user
    const graphResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}?$select=displayName,mail,department,jobTitle,officeLocation`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!graphResponse.ok) {
      console.log(`[email-directory] User not found in Azure AD: ${email}`);
      return null;
    }

    const userData = await graphResponse.json();

    // Transform Azure AD response to our format
    return {
      email: userData.mail || email,
      name: userData.displayName || "",
      department: userData.department || "",
      position: userData.jobTitle || "",
      officeLocation: userData.officeLocation || "",
    };
  } catch (error: any) {
    console.error("[email-directory] Azure AD lookup error:", error.message);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  // Check if it's an institutional email
  const isInstitutional = email.toLowerCase().endsWith("@mseuf.edu.ph") || 
                         email.toLowerCase().endsWith("@student.mseuf.edu.ph");

  if (!isInstitutional) {
    return NextResponse.json({ 
      ok: false, 
      error: "Only institutional emails (@mseuf.edu.ph) are supported" 
    }, { status: 400 });
  }

  // Try Azure AD first (if configured)
  const azureData = await fetchFromAzureAD(email);
  if (azureData) {
    return NextResponse.json({
      ok: true,
      data: azureData,
      source: "azure_ad",
      note: "Data retrieved from Azure Active Directory"
    });
  }

  // Fallback to simulated directory
  const entry = EMAIL_DIRECTORY.find(e => e.email.toLowerCase() === email.toLowerCase());

  if (!entry) {
    // For institutional emails not in directory, return basic structure
    // This allows registration to proceed even if not in directory
    return NextResponse.json({ 
      ok: false, 
      error: "Email not found in directory",
      note: "You can still register. Your role will be set to faculty/staff by default."
    }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    data: entry,
    source: "simulated_directory",
    note: "Department and position may be outdated; use as provisional data only. Actual roles are assigned by administrators."
  });
}
