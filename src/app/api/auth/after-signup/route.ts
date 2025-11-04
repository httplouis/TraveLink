// src/app/api/auth/after-signup/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();

  // body: { user_id, email, meta }
  const supabase = await createSupabaseServerClient(true);

  // 1) check authorized_personnel
  const { data: authPerson } = await supabase
    .from("authorized_personnel")
    .select("*")
    .eq("email", body.email)
    .eq("is_active", true)
    .maybeSingle();

  if (authPerson) {
    // promote in app_users
    await supabase
      .from("app_users")
      .update({
        role: authPerson.forced_role,
        department: authPerson.department,
      })
      .eq("id", body.user_id);
    return NextResponse.json({ ok: true, autoPromoted: true });
  }

  // 2) if user said "i am head"
  if (body.meta?.wants_head) {
    await supabase.from("role_claims").insert({
      user_id: body.user_id,
      email: body.email,
      requested_role: "head",
      department: body.meta?.department ?? null,
    });
  }

  return NextResponse.json({ ok: true, autoPromoted: false });
}
