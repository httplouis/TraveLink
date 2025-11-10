import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
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

    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, role, department, is_head, is_hr, is_exec")
      .eq("auth_user_id", data.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Determine redirect path
    const userRole = profile.role?.toLowerCase() || "faculty";
    const userEmail = data.user.email?.toLowerCase() || "";
    
    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph", "casinotrizzia@mseuf.edu.ph"];
    const comptrollerEmails = ["comptroller@mseuf.edu.ph"];
    
    const isAdmin = userRole === "admin" || adminEmails.includes(userEmail);
    const isComptroller = comptrollerEmails.includes(userEmail);
    const isHead = userRole === "head" || profile.is_head === true;
    const isHR = userRole === "hr" || profile.is_hr === true;
    const isExec = userRole === "exec" || profile.is_exec === true;
    const isDriver = userRole === "driver";

    let redirectPath = "/user";
    if (isAdmin) {
      redirectPath = "/admin";
    } else if (isComptroller) {
      redirectPath = "/comptroller/inbox";
    } else if (isHead) {
      redirectPath = "/head/dashboard";
    } else if (isHR) {
      redirectPath = "/hr/dashboard";
    } else if (isExec) {
      redirectPath = "/exec/dashboard";
    } else if (isDriver) {
      redirectPath = "/driver";
    }

    return NextResponse.json({ 
      success: true, 
      redirectPath,
      user: data.user
    });

  } catch (error: any) {
    console.error('[/api/auth/login] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
