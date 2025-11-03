// src/app/api/auth/bootstrap/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// NOTE: dito dati 4 lang laman. :contentReference[oaicite:5]{index=5}
const VALID_ROLES = [
  "admin",
  "head",
  "hr",
  "exec",
  "driver",
  "faculty",
  "staff",
];

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient(true);

  // 1) get current auth user
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: "No auth user" }, { status: 401 });
  }

  // 2) find row in public.users (or create if missing)
  const { data: rows } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .limit(1);

  let appUser = rows?.[0];

  if (!appUser) {
    // create default faculty user
    const insert = {
      auth_user_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? user.email,
      role: "faculty",
    };

    const { data: created, error: createErr } = await supabase
      .from("users")
      .insert(insert)
      .select()
      .single();

    if (createErr) {
      return NextResponse.json({ ok: false, error: createErr.message }, { status: 500 });
    }
    appUser = created;
  }

  // 3) normalize role from db
  let role = (appUser.role as string) || "faculty";
  if (!VALID_ROLES.includes(role)) {
    role = "faculty";
  }

  const department = appUser.department ?? null;

  // 4) set cookie
  const res = NextResponse.json({ ok: true, role, department });
  res.cookies.set("tl_role", role, {
    path: "/",
    httpOnly: false, // you can make this true later; for now we want to read in client
    sameSite: "lax",
  });
  if (department) {
    res.cookies.set("tl_department", department, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
    });
  }

  return res;
}
