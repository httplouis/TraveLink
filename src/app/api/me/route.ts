import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Create Supabase client with proper cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Handle cookie setting errors silently
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Handle cookie removal errors silently
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('[/api/me] Auth error:', authError);
      return NextResponse.json({ ok: false, error: "Auth error: " + authError.message }, { status: 401 });
    }
    
    if (!user) {
      console.error('[/api/me] No user found');
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, email, department, role, is_head, is_hr, is_exec")
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
  const isHead = userRole === 'head' || profile.is_head === true;
  const isHr = userRole === 'hr' || profile.is_hr === true;
  const isExec = userRole === 'exec' || profile.is_exec === true;
  const isDriver = userRole === 'driver';

  return NextResponse.json({
    id: profile.id,
    email: profile.email,
    department: profile.department,
    role: userRole,
    is_head: isHead,
    is_hr: isHr,
    is_exec: isExec,
    is_driver: isDriver,
  });
  } catch (error) {
    console.error('[/api/me] Unexpected error:', error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
