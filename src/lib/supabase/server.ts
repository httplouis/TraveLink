// src/lib/supabase/server.ts
"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function createSupabaseServerClient(useServiceRole = false) {

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    console.warn("NEXT_PUBLIC_SUPABASE_URL is missing - using placeholder for build");
  }

  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    console.warn("Supabase key is missing - using placeholder for build");
  }

  // Log what key type we're using for debugging
  if (useServiceRole) {
    console.log("[createSupabaseServerClient] Using SERVICE ROLE key");
    console.log("[createSupabaseServerClient] Service role key present:", !!key);
    console.log("[createSupabaseServerClient] Service role key length:", key?.length || 0);
  }

  // Use placeholders during build, real values at runtime
  const finalUrl = url || "https://placeholder.supabase.co";
  const finalKey = key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder";

  // CRITICAL FIX: For service role, use createClient directly (bypasses RLS completely)
  // createServerClient is for authenticated requests with cookies, which doesn't work well with service role
  if (useServiceRole) {
    console.log("[createSupabaseServerClient] Creating direct client with service role (bypasses RLS)");
    return createClient(finalUrl, finalKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // For authenticated requests, use createServerClient with cookies
  const cookieStore = await cookies();
  return createServerClient(finalUrl, finalKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Cookie setting might fail in middleware/server components
          // This is expected in some contexts
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch (error) {
          // Cookie removal might fail in middleware/server components
        }
      },
    },
  });
}
