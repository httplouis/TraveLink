// src/app/api/super-admin/stats/users/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    // Check if user is super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_admin || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Get total users count
    const { count: total } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Get active users count
    const { count: active } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    return NextResponse.json({
      ok: true,
      total: total || 0,
      active: active || 0,
    });
  } catch (err: any) {
    console.error("[GET /api/super-admin/stats/users] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

