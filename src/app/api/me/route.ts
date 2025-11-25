import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    // Create Supabase client with proper cookie handling for production
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
        },
        global: {
          fetch: (url, options = {}) => {
            // Add timeout to prevent long waits
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            return fetch(url, {
              ...options,
              signal: controller.signal,
            }).finally(() => {
              clearTimeout(timeoutId);
            });
          },
        },
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              // Don't override httpOnly - let Supabase handle it
              cookieStore.set({ 
                name, 
                value, 
                ...options,
                secure: isProduction ? (options.secure !== false) : (options.secure ?? false),
                sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
                path: options.path || '/',
              });
            } catch (error) {
              // Handle cookie setting errors silently
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ 
                name, 
                value: '', 
                ...options,
                secure: isProduction ? (options.secure !== false) : (options.secure ?? false),
                sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
                path: options.path || '/',
                maxAge: 0,
              });
            } catch (error) {
              // Handle cookie removal errors silently
            }
          },
        },
      }
    );

    // Add timeout wrapper for getUser
    let user, authError;
    try {
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth request timeout')), 10000)
      );
      
      const result = await Promise.race([getUserPromise, timeoutPromise]) as any;
      user = result?.data?.user;
      authError = result?.error;
    } catch (timeoutError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[/api/me] Auth timeout:', timeoutError);
      }
      return NextResponse.json({ 
        ok: false, 
        error: "Authentication service timeout. Please try again." 
      }, { status: 504 });
    }
    
    if (authError) {
      // Check if it's a timeout/504 error
      if (authError.status === 504 || authError.message?.includes('timeout') || authError.message?.includes('504')) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[/api/me] Supabase auth timeout (504):', authError);
        }
        return NextResponse.json({ 
          ok: false, 
          error: "Authentication service is temporarily unavailable. Please try again in a moment." 
        }, { status: 503 }); // Service Unavailable
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.error('[/api/me] Auth error:', authError);
      }
      return NextResponse.json({ ok: false, error: "Auth error: " + authError.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('[/api/me] No user found');
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with admins relationship to check super_admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        department,
        role,
        is_head,
        is_hr,
        is_exec,
        is_vp,
        is_president,
        is_admin,
        is_comptroller,
        admins (
          user_id,
          super_admin
        )
      `)
      .eq("auth_user_id", user.id)
      .single();

    if (profileError) {
      console.error('[/api/me] Profile query error:', profileError);
      return NextResponse.json({ ok: false, error: "Profile error: " + profileError.message }, { status: 500 });
    }

    if (!profile) {
      console.error('[/api/me] Profile not found for user:', user.id);
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

  // Parse role from profile - check both role column and boolean flags
  const userRole = profile.role?.toLowerCase() || 'faculty';
  const userEmail = profile.email?.toLowerCase() || '';
  
  // Check admin by email (since role might be 'faculty' due to trigger restrictions)
  const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph"];
  const isAdmin = userRole === 'admin' || adminEmails.includes(userEmail);
  
  // Check super_admin from admins table relationship
  const adminsData = (profile as any).admins;
  const adminInfo = Array.isArray(adminsData) 
    ? (adminsData.length > 0 ? adminsData[0] : null)
    : (adminsData || null);
  const isSuperAdminFromTable = adminInfo?.super_admin === true;
  
  // Super admin: is_admin = true AND role = 'admin' AND admins.super_admin = true
  const isSuperAdmin = profile.is_admin === true && userRole === 'admin' && isSuperAdminFromTable;
  const isHead = userRole === 'head' || profile.is_head === true;
  const isHr = userRole === 'hr' || profile.is_hr === true;
  const isExec = userRole === 'exec' || profile.is_exec === true;
  const isVp = profile.is_vp === true;
  const isPresident = profile.is_president === true;
  const isDriver = userRole === 'driver';
  const isComptroller = userRole === 'comptroller' || profile.is_comptroller === true;

  return NextResponse.json({
    id: profile.id,
    email: profile.email,
    department: profile.department,
    role: userRole,
    is_head: isHead,
    is_hr: isHr,
    is_exec: isExec,
    is_vp: isVp,
    is_president: isPresident,
    is_admin: isSuperAdmin,
    is_driver: isDriver,
    is_comptroller: isComptroller,
  });
  } catch (error) {
    console.error('[/api/me] Unexpected error:', error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
