// src/app/api/super-admin/stats/departments/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);

    // Check if user is super admin
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS completely)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        ok: false,
        error: "Missing Supabase configuration"
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_admin || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Get total departments count
    const { count: total } = await supabase
      .from("departments")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      ok: true,
      total: total || 0,
    });
  } catch (err: any) {
    console.error("[GET /api/super-admin/stats/departments] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

