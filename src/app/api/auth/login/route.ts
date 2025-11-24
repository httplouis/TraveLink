import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password, clearSession } = await request.json();
    
    // If clearSession is true, clear any existing invalid session first
    if (clearSession) {
      const cookieStore = await cookies();
      const tempSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set() {},
            remove(name: string) {
              cookieStore.delete(name);
            },
          },
        }
      );
      await tempSupabase.auth.signOut();
      console.log('[/api/auth/login] 🧹 Cleared existing session');
    }
    
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[/api/auth/login] ❌ Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
      });
      return NextResponse.json({ 
        error: "Server configuration error: Missing Supabase credentials. Please check environment variables." 
      }, { status: 500 });
    }
    
    // Validate URL format
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      console.error('[/api/auth/login] ❌ Invalid Supabase URL format:', supabaseUrl);
      return NextResponse.json({ 
        error: "Server configuration error: Invalid Supabase URL format." 
      }, { status: 500 });
    }
    
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    console.log('[/api/auth/login] 🔧 Creating Supabase client with:', {
      url: supabaseUrl.substring(0, 30) + '...',
      hasAnonKey: !!supabaseAnonKey,
      anonKeyLength: supabaseAnonKey?.length || 0,
      isProduction
    });
    
    // Create Supabase client for auth (uses anon key) with production cookie settings
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Don't override httpOnly - let Supabase handle it
            // Supabase needs some cookies to be httpOnly and some to be accessible
            cookieStore.set({ 
              name, 
              value, 
              ...options,
              // Only override secure and sameSite for production
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
              maxAge: 0,
            });
          },
        },
      }
    );

    // Sign in
    console.log('[/api/auth/login] 🔐 Attempting sign in for:', email);
    
    // First, test if Supabase auth endpoint is accessible
    try {
      const testUrl = `${supabaseUrl}/auth/v1/health`;
      console.log('[/api/auth/login] 🏥 Testing Supabase auth endpoint health...');
      const healthCheck = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        }
      });
      
      const contentType = healthCheck.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await healthCheck.text();
        console.error('[/api/auth/login] ❌ Auth endpoint returned non-JSON:', {
          status: healthCheck.status,
          contentType,
          preview: responseText.substring(0, 200)
        });
        return NextResponse.json({ 
          error: "Supabase authentication service is not responding correctly. Please check your Supabase project status in the dashboard." 
        }, { status: 503 });
      }
      console.log('[/api/auth/login] ✅ Auth endpoint is accessible');
    } catch (healthErr: any) {
      console.error('[/api/auth/login] ❌ Health check failed:', healthErr.message);
      // Continue anyway - might be a network issue
    }
    
    // Try to sign in with better error handling
    let data, error;
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      data = result.data;
      error = result.error;
    } catch (signInErr: any) {
      console.error('[/api/auth/login] ❌ Exception during sign in:', {
        message: signInErr?.message,
        name: signInErr?.name,
        stack: signInErr?.stack?.substring(0, 500)
      });
      
      // If it's a JSON parse error, Supabase returned HTML
      if (signInErr?.message?.includes('not valid JSON') || signInErr?.name === 'SyntaxError' || 
          (signInErr as any).originalError?.message?.includes('not valid JSON')) {
        console.error('[/api/auth/login] ❌ CRITICAL: Supabase auth endpoint returned HTML!');
        console.error('[/api/auth/login] This usually means:');
        console.error('[/api/auth/login] 1. Supabase project is paused (check dashboard)');
        console.error('[/api/auth/login] 2. Auth service is temporarily down');
        console.error('[/api/auth/login] 3. Network/firewall blocking the request');
        console.error('[/api/auth/login] 4. Invalid anon key or URL');
        return NextResponse.json({ 
          error: "Authentication service unavailable. Please check your Supabase project status in the dashboard and ensure it's not paused." 
        }, { status: 503 });
      }
      
      // Re-throw other errors
      throw signInErr;
    }

    if (error) {
      console.error('[/api/auth/login] ❌ Sign in error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        originalError: (error as any).originalError?.message
      });
      
      // Check if it's a JSON parsing error (Supabase returning HTML)
      if (error.message.includes('not valid JSON') || (error as any).originalError?.message?.includes('not valid JSON')) {
        console.error('[/api/auth/login] ❌ CRITICAL: Supabase is returning HTML instead of JSON!');
        console.error('[/api/auth/login] This usually means:');
        console.error('[/api/auth/login] 1. Supabase URL is incorrect');
        console.error('[/api/auth/login] 2. Supabase project is paused/deleted');
        console.error('[/api/auth/login] 3. Network/firewall issue');
        return NextResponse.json({ 
          error: "Authentication service error: Unable to connect to Supabase. Please check server configuration." 
        }, { status: 503 });
      }
      
      return NextResponse.json({ 
        error: error.message || "Invalid email or password" 
      }, { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    if (!data.user) {
      console.error('[/api/auth/login] No user returned from sign in');
      return NextResponse.json({ error: "Sign in failed" }, { status: 401 });
    }

    console.log('[/api/auth/login] User signed in:', data.user.id, data.user.email);
    
    // CRITICAL: Verify session was created and cookies are set
    const { data: { session: verifySession }, error: sessionVerifyError } = await supabase.auth.getSession();
    if (sessionVerifyError || !verifySession) {
      console.error('[/api/auth/login] ❌ Session verification failed after sign in!', sessionVerifyError);
      return NextResponse.json({ error: "Session creation failed" }, { status: 500 });
    }
    console.log('[/api/auth/login] ✅ Session verified, cookies should be set');

    // Get user profile using service role to bypass RLS
    // Performance: Use specific columns only (not *) and use index on auth_user_id
    const supabaseAdmin = await createSupabaseServerClient(true);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("id, role, department, is_head, is_hr, is_vp, is_president, is_admin, is_comptroller")
      .eq("auth_user_id", data.user.id)
      .single();

    if (profileError) {
      console.error('[/api/auth/login] Profile query error:', profileError);
      console.error('[/api/auth/login] Auth user ID:', data.user.id);
      console.error('[/api/auth/login] Email:', email);
      return NextResponse.json({ 
        error: "Profile not found", 
        details: profileError.message 
      }, { status: 404 });
    }

    if (!profile) {
      console.error('[/api/auth/login] Profile is null for user:', data.user.id);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    console.log('[/api/auth/login] Profile found:', profile.id, profile.role, profile.is_admin);

    // Log login to audit_logs
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
          method: "email_password",
          email: email,
          role: profile.role,
          is_admin: profile.is_admin,
        },
        user_agent: userAgent,
      };
      
      // Only add ip_address if it's valid, otherwise set to null
      if (clientIp) {
        auditInsertData.ip_address = clientIp;
      }

      console.log('[/api/auth/login] 📝 Attempting to insert audit log:', {
        user_id: auditInsertData.user_id,
        action: auditInsertData.action,
        has_ip: !!auditInsertData.ip_address,
      });

      const { error: auditError, data: auditData } = await supabaseAdmin
        .from("audit_logs")
        .insert(auditInsertData)
        .select();

      if (auditError) {
        console.error('[/api/auth/login] ❌ Failed to log to audit_logs:', auditError);
        console.error('[/api/auth/login] Audit error code:', auditError.code);
        console.error('[/api/auth/login] Audit error message:', auditError.message);
        console.error('[/api/auth/login] Audit error details:', JSON.stringify(auditError, null, 2));
        console.error('[/api/auth/login] Profile ID:', profile.id);
        console.error('[/api/auth/login] Client IP:', clientIp);
        console.error('[/api/auth/login] Insert data:', JSON.stringify(auditInsertData, null, 2));
      } else {
        console.log('[/api/auth/login] ✅ Login logged to audit_logs successfully');
        console.log('[/api/auth/login] Audit log ID:', auditData?.[0]?.id);
        console.log('[/api/auth/login] Audit log created_at:', auditData?.[0]?.created_at);
      }
    } catch (auditErr: any) {
      console.error('[/api/auth/login] ❌ Exception logging to audit_logs:', auditErr);
      // Don't fail login if audit logging fails
    }

    // Determine redirect path based on role
    const userRole = profile.role?.toLowerCase() || "faculty";
    
    // Super Admin: is_admin = true AND role = 'admin' → /super-admin
    let redirectPath = "/user";
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
    } else if (userRole === "exec") {
      redirectPath = "/exec/dashboard";
    } else if (userRole === "driver") {
      redirectPath = "/driver";
    }

    // Log cookie information for debugging BEFORE creating response
    const allCookies = cookieStore.getAll();
    console.log('[/api/auth/login] ✅ Login successful');
    console.log('[/api/auth/login] Cookies in store:', {
      count: allCookies.length,
      names: allCookies.map(c => c.name).join(', '),
      hasSupabaseCookies: allCookies.some(c => c.name.includes('supabase') || c.name.includes('sb-'))
    });
    
    // Verify session one more time to ensure it's accessible
    const { data: { session: finalSession } } = await supabase.auth.getSession();
    if (!finalSession) {
      console.error('[/api/auth/login] ❌ WARNING: Session not found in final check!');
      return NextResponse.json({ error: "Session creation failed" }, { status: 500 });
    } else {
      console.log('[/api/auth/login] ✅ Final session check passed');
    }
    
    // Create response with JSON body
    // IMPORTANT: In Next.js 15, cookies set via cookieStore.set() are automatically
    // included in the response, but we need to ensure the response is created AFTER
    // all cookie operations are complete
    const response = NextResponse.json({ 
      success: true, 
      redirectPath,
      user: {
        id: data.user.id,
        email: data.user.email
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    return response;

  } catch (error: any) {
    console.error('[/api/auth/login] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
