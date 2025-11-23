import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    // Create Supabase client for auth (uses anon key) with production cookie settings
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[/api/auth/login] Sign in error:', error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.user) {
      console.error('[/api/auth/login] No user returned from sign in');
      return NextResponse.json({ error: "Sign in failed" }, { status: 401 });
    }

    console.log('[/api/auth/login] User signed in:', data.user.id, data.user.email);

    // Get user profile using service role to bypass RLS
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

    // Create response with JSON body
    const response = NextResponse.json({ 
      success: true, 
      redirectPath,
      user: data.user
    });
    
    // Ensure cookies are included in the response
    // Supabase SSR should have already set cookies via cookieStore, but we verify
    console.log('[/api/auth/login] ✅ Login successful, cookies should be set');
    console.log('[/api/auth/login] Response headers:', {
      hasSetCookie: response.headers.get('set-cookie') ? 'yes' : 'no',
      cookieCount: response.headers.get('set-cookie')?.split(',').length || 0
    });
    
    return response;

  } catch (error: any) {
    console.error('[/api/auth/login] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
