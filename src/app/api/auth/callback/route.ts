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

  // Get base URL for redirects - use environment variable if available
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
  
  if (error) {
    console.error("[auth/callback] OAuth error:", error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error)}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", baseUrl));
  }

  try {
    const cookieStore = await cookies();
    
    // Create Supabase client with proper cookie settings for production
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Don't override httpOnly - let Supabase handle it
            cookieStore.set({ 
              name, 
              value, 
              ...options,
              secure: isProduction ? (options.secure !== false) : (options.secure ?? false),
              sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              path: options.path || '/',
            });
          },
          remove(name: string, options: any) {
            cookieStore.set({ 
              name, 
              value: "", 
              ...options,
              secure: isProduction ? (options.secure !== false) : (options.secure ?? false),
              sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              path: options.path || '/',
            });
          },
        },
      }
    );

    // Exchange code for session
    // Supabase OAuth redirects here with a code after Microsoft authentication
    console.log("[auth/callback] 🔄 Exchanging code for session...");
    console.log("[auth/callback] Code received:", code ? `${code.substring(0, 10)}...` : "none");
    
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !session) {
      console.error("[auth/callback] ❌ Session exchange failed!");
      console.error("[auth/callback] Session error:", sessionError);
      console.error("[auth/callback] Error details:", JSON.stringify(sessionError, null, 2));
      console.error("[auth/callback] Request URL:", request.url);
      console.error("[auth/callback] Request origin:", requestUrl.origin);
      
      // Return more specific error
      const errorParam = sessionError?.message 
        ? encodeURIComponent(sessionError.message.substring(0, 100))
        : "session_failed";
      return NextResponse.redirect(new URL(`/login?error=${errorParam}`, baseUrl));
    }
    
    console.log("[auth/callback] ✅ Session created successfully");
    console.log("[auth/callback] User ID:", session.user.id);
    console.log("[auth/callback] User email:", session.user.email);
    
    // CRITICAL: Verify session is accessible and cookies are set
    const { data: { session: verifySession }, error: sessionVerifyError } = await supabase.auth.getSession();
    if (sessionVerifyError || !verifySession) {
      console.error("[auth/callback] ❌ Session verification failed after exchange!", sessionVerifyError);
      return NextResponse.redirect(new URL("/login?error=session_verification_failed", baseUrl));
    }
    console.log("[auth/callback] ✅ Session verified, cookies should be set");
    
    // Log cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log("[auth/callback] Cookies in store:", {
      count: allCookies.length,
      names: allCookies.map(c => c.name).join(', '),
      hasSupabaseCookies: allCookies.some(c => c.name.includes('supabase') || c.name.includes('sb-'))
    });

    const authUser = session.user;
    const userEmail = authUser.email;

    // Allow both institutional and student emails
    // For now, all users (including students) will have 'faculty' role/view
    // Super admin can change roles later
    if (!userEmail || (!userEmail.endsWith("@mseuf.edu.ph") && !userEmail.endsWith("@student.mseuf.edu.ph"))) {
      // Sign out if not institutional email
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login?error=invalid_email", baseUrl));
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

      // If user has department text but no department_id, try to resolve it
      if (!existingUser.department_id && existingUser.department && typeof existingUser.department === 'string') {
        const existingDeptName = existingUser.department.trim();
        console.log(`[auth/callback] 🔄 Existing user has department text but no ID, attempting to resolve: "${existingDeptName}"`);
        
        // Try exact match first
        let { data: deptData } = await supabaseAdmin
          .from("departments")
          .select("id, code, name")
          .eq("name", existingDeptName)
          .maybeSingle();
        
        // If not found, try matching by code
        if (!deptData && existingDeptName.length <= 10) {
          const { data: deptByCode } = await supabaseAdmin
            .from("departments")
            .select("id, code, name")
            .eq("code", existingDeptName.toUpperCase())
            .maybeSingle();
          
          if (deptByCode) {
            deptData = deptByCode;
            console.log(`[auth/callback] ✅ Resolved existing department by code: ${deptByCode.name}`);
          }
        }
        
        // If still not found, try partial match
        if (!deptData) {
          const { data: deptPartial } = await supabaseAdmin
            .from("departments")
            .select("id, code, name")
            .or(`name.ilike.%${existingDeptName}%,code.ilike.%${existingDeptName}%`)
            .limit(1)
            .maybeSingle();
          
          if (deptPartial) {
            deptData = deptPartial;
            console.log(`[auth/callback] ✅ Resolved existing department by partial match: ${deptPartial.name}`);
          }
        }
        
        if (deptData) {
          updateData.department_id = deptData.id;
          updateData.department = null; // Clear text field
          console.log(`[auth/callback] ✅ Backfilled department_id: ${deptData.id} for existing user`);
        }
      }

      if (userDepartment) {
        const departmentName = userDepartment.trim();
        console.log(`[auth/callback] 🔍 Looking up department_id for: "${departmentName}"`);
        
        // Try exact match first
        let { data: deptData } = await supabaseAdmin
          .from("departments")
          .select("id, code, name")
          .eq("name", departmentName)
          .maybeSingle();
        
        // If not found, try matching by code (e.g., "CCMS" might be the code)
        if (!deptData && departmentName.length <= 10) {
          console.log(`[auth/callback] 🔍 Trying to match by code: "${departmentName}"`);
          const { data: deptByCode } = await supabaseAdmin
            .from("departments")
            .select("id, code, name")
            .eq("code", departmentName.toUpperCase())
            .maybeSingle();
          
          if (deptByCode) {
            deptData = deptByCode;
            console.log(`[auth/callback] ✅ Found department by code: ${deptByCode.name}`);
          }
        }
        
        // If still not found, try partial match (e.g., "CCMS" in "College of Computing and Multimedia Studies (CCMS)")
        if (!deptData) {
          console.log(`[auth/callback] 🔍 Trying partial match for: "${departmentName}"`);
          const { data: deptPartial } = await supabaseAdmin
            .from("departments")
            .select("id, code, name")
            .or(`name.ilike.%${departmentName}%,code.ilike.%${departmentName}%`)
            .limit(1)
            .maybeSingle();
          
          if (deptPartial) {
            deptData = deptPartial;
            console.log(`[auth/callback] ✅ Found department by partial match: ${deptPartial.name}`);
          }
        }
        
        if (deptData) {
          updateData.department_id = deptData.id;
          updateData.department = null; // Clear text field if we have ID
          console.log(`[auth/callback] ✅ Resolved department_id: ${deptData.id} for "${deptData.name}"`);
        } else {
          // Store as text if department not found
          updateData.department = userDepartment;
          updateData.department_id = null; // Clear ID if not found
          console.warn(`[auth/callback] ⚠️ Could not find department_id for: "${departmentName}", storing as text`);
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
      
      // Log student account creation for debugging
      if (isStudent) {
        console.log(`[auth/callback] 🎓 Creating student account: ${userEmail}`);
        console.log(`[auth/callback] Student insert data:`, JSON.stringify(insertData, null, 2));
      }

      if (userDepartment) {
        const departmentName = userDepartment.trim();
        console.log(`[auth/callback] 🔍 Looking up department_id for new user: "${departmentName}"`);
        
        // Try exact match first
        let { data: deptData } = await supabaseAdmin
          .from("departments")
          .select("id, code, name")
          .eq("name", departmentName)
          .maybeSingle();
        
        // If not found, try matching by code (e.g., "CCMS" might be the code)
        if (!deptData && departmentName.length <= 10) {
          console.log(`[auth/callback] 🔍 Trying to match by code: "${departmentName}"`);
          const { data: deptByCode } = await supabaseAdmin
            .from("departments")
            .select("id, code, name")
            .eq("code", departmentName.toUpperCase())
            .maybeSingle();
          
          if (deptByCode) {
            deptData = deptByCode;
            console.log(`[auth/callback] ✅ Found department by code: ${deptByCode.name}`);
          }
        }
        
        // If still not found, try partial match
        if (!deptData) {
          console.log(`[auth/callback] 🔍 Trying partial match for: "${departmentName}"`);
          const { data: deptPartial } = await supabaseAdmin
            .from("departments")
            .select("id, code, name")
            .or(`name.ilike.%${departmentName}%,code.ilike.%${departmentName}%`)
            .limit(1)
            .maybeSingle();
          
          if (deptPartial) {
            deptData = deptPartial;
            console.log(`[auth/callback] ✅ Found department by partial match: ${deptPartial.name}`);
          }
        }
        
        if (deptData) {
          insertData.department_id = deptData.id;
          console.log(`[auth/callback] ✅ Resolved department_id: ${deptData.id} for "${deptData.name}"`);
        } else {
          insertData.department = userDepartment;
          console.warn(`[auth/callback] ⚠️ Could not find department_id for: "${departmentName}", storing as text`);
        }
      }

      if (userPosition) {
        insertData.position_title = userPosition;
      }

      const { data: insertedUser, error: insertError } = await supabaseAdmin
        .from("users")
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error(`[auth/callback] ❌ Failed to create user:`, insertError);
        console.error(`[auth/callback] Insert error details:`, JSON.stringify(insertError, null, 2));
        console.error(`[auth/callback] Insert data attempted:`, JSON.stringify(insertData, null, 2));
        
        // CRITICAL: Don't continue if user creation fails - user won't be able to access the app
        // Sign out and redirect to login with error
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL(`/login?error=user_creation_failed&details=${encodeURIComponent(insertError.message)}`, baseUrl));
      } else {
        console.log(`[auth/callback] ✅ New user created: ${userEmail}`, insertedUser?.id);
      }
    }

    // Get user profile for redirect - CRITICAL: Must exist or redirect will fail
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, role, is_head, is_hr, is_vp, is_president, is_admin, is_comptroller")
      .eq("auth_user_id", authUser.id)
      .single();
    
    if (profileError || !profile) {
      console.error(`[auth/callback] ❌ CRITICAL: User profile not found after create/update!`, profileError);
      console.error(`[auth/callback] Auth user ID:`, authUser.id);
      console.error(`[auth/callback] Email:`, userEmail);
      
      // Sign out and redirect to login - user creation/update failed
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL(`/login?error=profile_not_found`, baseUrl));
    }
    
    console.log(`[auth/callback] ✅ User profile found:`, {
      id: profile.id,
      role: profile.role,
      email: userEmail
    });

    // Determine redirect path based on role
    let redirectPath = "/user";
    if (profile) {
      const userRole = profile.role?.toLowerCase() || "faculty";
      
      // Super Admin: is_admin = true AND role = 'admin' → /super-admin
      if (profile.is_admin && userRole === "admin") {
        redirectPath = "/super-admin";
      } 
      // Transport Admin: role = 'admin' but not super admin → /admin
      else if (userRole === "admin") {
        redirectPath = "/admin";
      } 
      // Comptroller: check role, is_comptroller flag, or email
      else if (userRole === "comptroller" || profile.is_comptroller) {
        redirectPath = "/comptroller/inbox";
      } else if (profile.is_president || userRole === "president") {
        redirectPath = "/president/dashboard";
    } else if (profile.is_vp || userRole === "vp") {
      // VP takes priority over head (VP is higher role)
      redirectPath = "/vp/dashboard";
    } else if (profile.is_hr || userRole === "hr") {
      // HR takes priority over head (HR is a specialized role)
      redirectPath = "/hr/dashboard";
    } else if (profile.is_head || userRole === "head") {
      redirectPath = "/head/dashboard";
      } else {
        redirectPath = "/user";
      }
    }

    // Log login to audit_logs
    if (profile) {
      try {
        let clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
        // Handle comma-separated IPs (x-forwarded-for can have multiple)
        if (clientIp) {
          clientIp = clientIp.split(",")[0].trim();
        }
        // Validate IP format for INET type
        if (clientIp && !clientIp.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
          clientIp = null; // Set to null if invalid format
        }
        const userAgent = request.headers.get("user-agent") || null;
        
        const auditInsertData: any = {
          user_id: profile.id,
          action: "login",
          entity_type: "auth",
          entity_id: profile.id,
          new_value: {
            method: "microsoft_oauth",
            email: userEmail,
            role: profile.role,
            is_admin: profile.is_admin,
          },
          user_agent: userAgent,
        };
        
        // Only add ip_address if it's valid, otherwise set to null
        if (clientIp) {
          auditInsertData.ip_address = clientIp;
        }

        console.log('[auth/callback] 📝 Attempting to insert audit log:', {
          user_id: auditInsertData.user_id,
          action: auditInsertData.action,
          has_ip: !!auditInsertData.ip_address,
        });

        const { error: auditError, data: auditData } = await supabaseAdmin
          .from("audit_logs")
          .insert(auditInsertData)
          .select();

        if (auditError) {
          console.error('[auth/callback] ❌ Failed to log to audit_logs:', auditError);
          console.error('[auth/callback] Audit error code:', auditError.code);
          console.error('[auth/callback] Audit error message:', auditError.message);
          console.error('[auth/callback] Audit error details:', JSON.stringify(auditError, null, 2));
          console.error('[auth/callback] Profile ID:', profile.id);
          console.error('[auth/callback] Client IP:', clientIp);
          console.error('[auth/callback] Insert data:', JSON.stringify(auditInsertData, null, 2));
        } else {
          console.log('[auth/callback] ✅ Login logged to audit_logs successfully');
          console.log('[auth/callback] Audit log ID:', auditData?.[0]?.id);
          console.log('[auth/callback] Audit log created_at:', auditData?.[0]?.created_at);
        }
      } catch (auditErr: any) {
        console.error('[auth/callback] ❌ Exception logging to audit_logs:', auditErr);
        // Don't fail login if audit logging fails
      }
    }

    // Get the correct base URL for redirect
    // Use environment variable if available, otherwise use request origin
    // baseUrl is already declared at the top of the function
    const redirectUrl = new URL(redirectPath, baseUrl);
    
    console.log(`[auth/callback] 🚀 Redirecting to: ${redirectUrl.toString()}`);
    console.log(`[auth/callback] Base URL used: ${baseUrl}`);
    
    // Create redirect response
    const response = NextResponse.redirect(redirectUrl);
    
    // Log final cookie check
    const finalCookies = cookieStore.getAll();
    console.log("[auth/callback] Final cookies before redirect:", {
      count: finalCookies.length,
      names: finalCookies.map(c => c.name).join(', ')
    });
    
    return response;

  } catch (error: any) {
    console.error("[auth/callback] Unexpected error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin;
    return NextResponse.redirect(new URL("/login?error=unexpected", baseUrl));
  }
}

