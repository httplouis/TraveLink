// src/lib/supabase/server.ts
"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient(useServiceRole = false) {
  // sa Next 15 minsan nagti-type ito na Promise<...>, so i-await na lang natin
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  }

  const key = useServiceRole
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      useServiceRole
        ? "SUPABASE_SERVICE_ROLE_KEY is missing"
        : "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"
    );
  }

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // para sa SSR token refresh
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options });
      },
    },
  });
}
