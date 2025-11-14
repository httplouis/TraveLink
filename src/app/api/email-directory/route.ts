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

  // Debug: Log environment variable status
  console.log("[email-directory] 🔍 Checking Azure AD configuration...");
  console.log("[email-directory] AZURE_CLIENT_ID exists:", !!azureClientId);
  console.log("[email-directory] AZURE_CLIENT_ID length:", azureClientId?.length || 0);
  console.log("[email-directory] AZURE_TENANT_ID exists:", !!azureTenantId);
  console.log("[email-directory] AZURE_TENANT_ID value:", azureTenantId ? `${azureTenantId.substring(0, 8)}...` : "missing");
  console.log("[email-directory] AZURE_CLIENT_SECRET exists:", !!azureClientSecret);
  console.log("[email-directory] AZURE_CLIENT_SECRET length:", azureClientSecret?.length || 0);

  // If Azure credentials are not configured, return null (will use fallback)
  if (!azureClientId || !azureClientSecret || !azureTenantId) {
    console.log("[email-directory] ❌ Azure AD not configured, using fallback directory");
    console.log("[email-directory] Missing variables:", {
      clientId: !azureClientId,
      tenantId: !azureTenantId,
      clientSecret: !azureClientSecret,
    });
    return null;
  }

  console.log("[email-directory] ✅ Azure AD credentials found, attempting lookup...");

  try {
    // Get access token using client credentials flow
    // NOTE: This requires Application permissions (User.Read.All) to read OTHER users' data
    // If you only have User.Read (Delegated), it will fail with 403 when trying to read other users
    // User.Read (Delegated) can only read the signed-in user's own profile
    const tokenUrl = `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/token`;
    console.log(`[email-directory] 🔐 Requesting token from: ${tokenUrl}`);
    console.log(`[email-directory] ℹ️ Using client credentials flow (requires Application permissions)`);
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: azureClientId,
        client_secret: azureClientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error("[email-directory] ❌ Failed to get Azure AD token");
      console.error("[email-directory] Status:", tokenResponse.status);
      console.error("[email-directory] Error:", JSON.stringify(errorData, null, 2));
      
      // Provide helpful error messages
      if (tokenResponse.status === 401) {
        console.error("[email-directory] 💡 Check: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_TENANT_ID are correct");
      } else if (tokenResponse.status === 400) {
        console.error("[email-directory] 💡 Check: Client secret might be expired or incorrect");
      }
      return null;
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.error("[email-directory] ❌ No access token in response");
      return null;
    }
    
    console.log("[email-directory] ✅ Azure AD token acquired successfully");
    console.log(`[email-directory] Token type: ${tokenData.token_type || 'Bearer'}, Expires in: ${tokenData.expires_in || 'unknown'} seconds`);

    // Query Microsoft Graph API for user
    // Using $select to only get needed fields
    const graphUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(email)}?$select=id,displayName,mail,userPrincipalName,department,jobTitle,officeLocation,office,companyName`;
    console.log(`[email-directory] 🔍 Querying Graph API: ${graphUrl.replace(accessToken.substring(0, 20), '***')}`);
    
    const graphResponse = await fetch(graphUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!graphResponse.ok) {
      const errorData = await graphResponse.json().catch(() => ({}));
      console.log(`[email-directory] ⚠️ Graph API request failed for: ${email}`);
      console.log(`[email-directory] Graph API status:`, graphResponse.status);
      console.log(`[email-directory] Graph API error:`, JSON.stringify(errorData, null, 2));
      
      // Provide helpful error messages
      if (graphResponse.status === 403) {
        const errorCode = errorData?.error?.code || errorData?.code || "Unknown";
        console.error("[email-directory] 💡 403 Forbidden - Permission issue");
        console.error(`[email-directory] Error code: ${errorCode}`);
        
        if (errorCode === "Authorization_RequestDenied" || errorData?.error?.message?.includes("Insufficient privileges")) {
          console.error("[email-directory] ⚠️ You need 'User.Read.All' Application permission (not Delegated)");
          console.error("[email-directory] 💡 Why: Client credentials flow can only use Application permissions");
          console.error("[email-directory] 💡 Why: We need to read OTHER users' profiles (not just signed-in user)");
          console.error("[email-directory] 💡 Solution: Azure Portal → App registrations → API permissions → Add permission → Microsoft Graph → Application permissions → User.Read.All → Grant admin consent");
          console.error("[email-directory] 💡 Alternative: If you only have User.Read (Delegated), it only works for the signed-in user's own profile");
        } else {
          console.error("[email-directory] 💡 Check Azure Portal → API permissions → Grant admin consent");
        }
      } else if (graphResponse.status === 404) {
        console.log(`[email-directory] ℹ️ User not found in Azure AD: ${email}`);
      }
      return null;
    }

    const userData = await graphResponse.json();
    console.log(`[email-directory] ✅ User found in Azure AD: ${email}`);
    console.log(`[email-directory] Raw user data:`, JSON.stringify(userData, null, 2));

    // Transform Azure AD response to our format
    // Use userPrincipalName as fallback if mail is not available
    const userEmail = userData.mail || userData.userPrincipalName || email;
    const transformed = {
      email: userEmail,
      name: userData.displayName || "",
      department: userData.department || "",
      position: userData.jobTitle || "",
      officeLocation: userData.officeLocation || userData.office || "",
      companyName: userData.companyName || "",
    };
    
    console.log(`[email-directory] ✅ Transformed data:`, transformed);
    return transformed;
  } catch (error: any) {
    console.error("[email-directory] ❌ Azure AD lookup error:", error.message);
    console.error("[email-directory] Error stack:", error.stack);
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
