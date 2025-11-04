import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Get all active departments
 * Ground Truth: departments table is source of truth for department list
 */
export async function GET() {
  const supabase = await createSupabaseServerClient(true);

  const { data, error } = await supabase
    .from("departments")
    .select("id, code, name, is_active")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, departments: data });
}

/**
 * Create a new department (Admin only)
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { code, name } = await req.json();

  if (!code || !name) {
    return NextResponse.json({ ok: false, error: "code and name required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("departments")
    .insert({ code, name, is_active: true })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, department: data });
}
