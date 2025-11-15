import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Get all active departments
 * Ground Truth: departments table is source of truth for department list
 * Query params: ?id=<uuid> to get specific department, ?name=<name> to search by name
 */
export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient(true);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const name = searchParams.get("name");

  // If ID provided, get specific department
  if (id) {
    const { data, error } = await supabase
      .from("departments")
      .select("id, code, name, type, parent_department_id")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[API /departments] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, departments: data ? [data] : [] });
  }

  // If name provided, search by name
  if (name) {
    const { data, error } = await supabase
      .from("departments")
      .select("id, code, name, type, parent_department_id")
      .ilike("name", `%${name}%`)
      .order("name");

    if (error) {
      console.error("[API /departments] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, departments: data || [] });
  }

  // Get all departments with parent info
  const { data, error } = await supabase
    .from("departments")
    .select("id, code, name, type, parent_department_id")
    .order("name");

  if (error) {
    console.error("[API /departments] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  console.log("[API /departments] Returning", data?.length || 0, "departments");
  return NextResponse.json({ ok: true, departments: data || [] });
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

  // Check if user is super admin
  const { data: profile } = await supabase
    .from("users")
    .select("role, is_admin")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || !profile.is_admin || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
  }

  const { code, name, type, parent_department_id } = await req.json();

  if (!code || !name) {
    return NextResponse.json({ ok: false, error: "code and name required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("departments")
    .insert({ 
      code: code.toUpperCase(), 
      name, 
      type: type || "academic",
      parent_department_id: parent_department_id || null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, department: data });
}
