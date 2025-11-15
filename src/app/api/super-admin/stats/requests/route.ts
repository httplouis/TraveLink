// src/app/api/super-admin/stats/requests/route.ts
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

    // Get pending requests count (any status that's not completed/rejected)
    const { count: pending } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .in("status", [
        "pending_requester_signature",
        "pending_head",
        "pending_comptroller",
        "pending_hr",
        "pending_vp",
        "pending_president",
        "pending_exec",
      ]);

    return NextResponse.json({
      ok: true,
      pending: pending || 0,
    });
  } catch (err: any) {
    console.error("[GET /api/super-admin/stats/requests] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

