// src/app/api/auth/verify-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ ok: false, error: "Password is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';

    // Create server client with same pattern as /api/me
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ 
              name, 
              value, 
              ...options,
              secure: isProduction ? (options.secure !== false) : (options.secure ?? false),
              sameSite: (options.sameSite as 'lax' | 'strict' | 'none') || 'lax',
              path: options.path || '/',
            });
          } catch {
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
          } catch {
            // Handle cookie removal errors silently
          }
        },
      },
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("[verify-password] User not found:", userError?.message);
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    console.log("[verify-password] User found:", user.email);

    // Create a separate client for password verification (to avoid session issues)
    const verifyClient = createClient(supabaseUrl, supabaseAnonKey);

    // Verify password by attempting to sign in with the user's email
    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      console.log("[verify-password] Password verification failed:", signInError.message);
      return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, message: "Password verified" });
  } catch (error) {
    console.error("[verify-password] Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to verify password" }, { status: 500 });
  }
}
