// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder";

export async function POST() {
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

    const uid = userData.user.id;
    const email = userData.user.email;

    const { data: existing, error: e1 } = await supabase
      .from("users")
      .select("id, email, role, status, auth_user_id")
      .eq("auth_user_id", uid)
      .maybeSingle();
    if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
    if (existing) return NextResponse.json(existing);

    const { data: inserted, error: e2 } = await supabase
      .from("users")
      .insert({ auth_user_id: uid, email, status: "active", role: "faculty" })
      .select()
      .single();
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

    return NextResponse.json(inserted);
  } catch (err: any) {
    console.error("POST /api/users failed:", err);
    return NextResponse.json({ error: String(err?.message ?? err) }, { status: 500 });
  }
}
