// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth Callback Handler
 * Called after Microsoft OAuth login
 * 1. Exchange code for session
 * 2. Get user's Microsoft Graph profile (name, department, position)
 * 3. Auto-create/update user in Supabase users table
 * 4. Redirect to appropriate dashboard
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");

  if (error) {
    console.error("[auth/callback] OAuth error:", error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    const cookieStore = await cookies();
    
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Exchange code for session
    // Supabase OAuth redirects here with a code after Microsoft authentication
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !session) {
      console.error("[auth/callback] Session error:", sessionError);
      console.error("[auth/callback] Error details:", JSON.stringify(sessionError, null, 2));
      return NextResponse.redirect(new URL("/login?error=session_failed", request.url));
    }

    const authUser = session.user;
    const userEmail = authUser.email;

    // Allow both institutional and student emails
    // For now, all users (including students) will have 'faculty' role/view
    // Super admin can change roles later
    if (!userEmail || (!userEmail.endsWith("@mseuf.edu.ph") && !userEmail.endsWith("@student.mseuf.edu.ph"))) {
      // Sign out if not institutional email
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=invalid_email", request.url));
    }
    
    // Log email type for debugging
    const isStudent = userEmail.endsWith("@student.mseuf.edu.ph");
    console.log(`[auth/callback] ✅ User authenticated: ${userEmail} (${isStudent ? 'Student' : 'Faculty/Staff'})`);
    console.log(`[auth/callback] ℹ️ Default role: 'faculty' (all users, including students, will see faculty view for now)`);

    // Get access token from session
    // Supabase stores provider token in different places depending on configuration
    let graphAccessToken = session.provider_token;
    
    if (!graphAccessToken) {
      // Check user metadata (Supabase might store it here)
      graphAccessToken = session.user?.user_metadata?.provider_token;
    }
    
    if (!graphAccessToken) {
      // Check app metadata
      graphAccessToken = session.user?.app_metadata?.provider_token;
    }
    
    // Log session structure for debugging
    console.log(`[auth/callback] Session structure:`, {
      hasProviderToken: !!session.provider_token,
      hasAccessToken: !!session.access_token,
      userMetadataKeys: Object.keys(session.user?.user_metadata || {}),
      appMetadataKeys: Object.keys(session.user?.app_metadata || {}),
    });

    // Fetch user profile from Microsoft Graph API
    let graphProfile: any = null;
    if (graphAccessToken) {
      try {
        console.log(`[auth/callback] 🔍 Fetching profile from Microsoft Graph...`);
        const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,department,jobTitle,officeLocation,companyName", {
          headers: {
            Authorization: `Bearer ${graphAccessToken}`,
          },
        });

        if (graphResponse.ok) {
          graphProfile = await graphResponse.json();
          console.log(`[auth/callback] ✅ Profile retrieved:`, {
            name: graphProfile.displayName,
            department: graphProfile.department,
            position: graphProfile.jobTitle,
          });
        } else {
          const errorData = await graphResponse.json().catch(() => ({}));
          console.warn(`[auth/callback] ⚠️ Graph API error:`, graphResponse.status, errorData);
        }
      } catch (graphError: any) {
        console.error(`[auth/callback] ⚠️ Graph API fetch error:`, graphError.message);
        // Continue anyway - we'll use email as fallback
      }
    } else {
      console.warn(`[auth/callback] ⚠️ No Microsoft Graph access token found in session.`);
      console.warn(`[auth/callback] 💡 Note: Supabase might not expose provider_token by default.`);
      console.warn(`[auth/callback] 💡 Trying email directory API as fallback...`);
      
      // Fallback: Use email directory API to fetch profile
      try {
        const emailDirResponse = await fetch(`${requestUrl.origin}/api/email-directory?email=${encodeURIComponent(userEmail)}`);
        if (emailDirResponse.ok) {
          const emailDirData = await emailDirResponse.json();
          if (emailDirData.ok && emailDirData.data) {
            graphProfile = {
              displayName: emailDirData.data.name,
              department: emailDirData.data.department,
              jobTitle: emailDirData.data.position,
            };
            console.log(`[auth/callback] ✅ Profile retrieved from email directory API:`, graphProfile);
          }
        }
      } catch (emailDirError: any) {
        console.warn(`[auth/callback] ⚠️ Email directory API also failed:`, emailDirError.message);
        // Will use email as fallback for name
      }
    }

    // Get or create user profile in Supabase
    const supabaseAdmin = await createSupabaseServerClient(true);
    
    // Check if user exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, role, department_id, name, department, position_title")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    const userName = graphProfile?.displayName || authUser.user_metadata?.full_name || authUser.user_metadata?.name || userEmail.split("@")[0];
    const userDepartment = graphProfile?.department || null;
    const userPosition = graphProfile?.jobTitle || null;
    
    console.log(`[auth/callback] 📝 User data to save:`, {
      name: userName,
      department: userDepartment,
      position: userPosition,
      email: userEmail,
    });

    if (existingUser) {
      // Update existing user with latest info from Graph API
      // Always update if we have data from Graph API (even if existing data exists)
      const updateData: any = {
        name: userName, // Always update name
        email: userEmail,
        // Note: Removed updated_at - column might not exist or schema cache issue
      };

      if (userDepartment) {
        // Try to find department by name
        const { data: dept } = await supabaseAdmin
          .from("departments")
          .select("id")
          .ilike("name", `%${userDepartment}%`)
          .limit(1)
          .single();

        if (dept) {
          updateData.department_id = dept.id;
          updateData.department = null; // Clear text field if we have ID
        } else {
          // Store as text if department not found
          updateData.department = userDepartment;
          updateData.department_id = null; // Clear ID if not found
        }
      }

      if (userPosition) {
        updateData.position_title = userPosition; // Always update if we have data
      }

      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update(updateData)
        .eq("id", existingUser.id);

      if (updateError) {
        console.error(`[auth/callback] ❌ Failed to update user:`, updateError);
      } else {
        console.log(`[auth/callback] ✅ User profile updated: ${existingUser.id}`, updateData);
      }
    } else {
      // Create new user
      // Default role is 'faculty' - super admin will assign other roles later
      // For now, set all users (including students) to 'faculty' role/view
      // Super admin can change roles later
      const insertData: any = {
        auth_user_id: authUser.id,
        name: userName,
        email: userEmail,
        role: "faculty", // Default - set to faculty view for now (even for students)
        status: "active",
        // Note: Removed created_at and updated_at - columns might not exist or have defaults
      };

      if (userDepartment) {
        // Try to find department by name
        const { data: dept } = await supabaseAdmin
          .from("departments")
          .select("id")
          .ilike("name", `%${userDepartment}%`)
          .limit(1)
          .single();

        if (dept) {
          insertData.department_id = dept.id;
        } else {
          insertData.department = userDepartment;
        }
      }

      if (userPosition) {
        insertData.position_title = userPosition;
      }

      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert(insertData);

      if (insertError) {
        console.error(`[auth/callback] ❌ Failed to create user:`, insertError);
        // Continue anyway - user can still login
      } else {
        console.log(`[auth/callback] ✅ New user created: ${userEmail}`);
      }
    }

    // Get user profile for redirect
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("id, role, is_head, is_hr, is_vp, is_president, is_admin, is_comptroller")
      .eq("auth_user_id", authUser.id)
      .single();

    // Determine redirect path based on role
    let redirectPath = "/user";
    if (profile) {
      const userRole = profile.role?.toLowerCase() || "faculty";
      
      if (profile.is_admin || userRole === "admin") {
        redirectPath = "/admin";
      } else if (profile.is_comptroller || userRole === "comptroller") {
        redirectPath = "/comptroller/inbox";
      } else if (profile.is_head || userRole === "head") {
        redirectPath = "/head/dashboard";
      } else if (profile.is_hr || userRole === "hr") {
        redirectPath = "/hr/dashboard";
      } else if (profile.is_vp || userRole === "vp") {
        redirectPath = "/vp/dashboard";
      } else if (profile.is_president || userRole === "president") {
        redirectPath = "/president/dashboard";
      } else {
        redirectPath = "/user";
      }
    }

    console.log(`[auth/callback] 🚀 Redirecting to: ${redirectPath}`);
    return NextResponse.redirect(new URL(redirectPath, request.url));

  } catch (error: any) {
    console.error("[auth/callback] Unexpected error:", error);
    return NextResponse.redirect(new URL("/login?error=unexpected", request.url));
  }
}

