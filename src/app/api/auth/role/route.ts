// src/app/api/auth/role/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder";

export async function GET() {
  try {
    // ✅ await headers()
    const h = await headers();
    const auth = h.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (!token) return NextResponse.json({ error: "missing token" }, { status: 401 });

    const supabase = createClient(URL, KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: uErr } = await supabase.auth.getUser();
    if (uErr || !userData.user) {
      return NextResponse.json({ error: uErr?.message ?? "unauthenticated" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("auth_user_id", userData.user.id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ role: (data?.role ?? "faculty") as "admin"|"driver"|"faculty" });
  } catch (err: any) {
    console.error("GET /api/auth/role failed:", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
