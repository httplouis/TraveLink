import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("department")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
  }

  const { count: pendingCount } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("current_status", "pending_head")
    .eq("form_payload->>department", profile.department);

  const { count: activeCount } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("created_by", user.id)
    .in("current_status", ["pending_head", "head_approved", "admin_review", "comptroller_pending", "hr_pending", "executive_pending"]);

  return NextResponse.json({
    ok: true,
    pending_count: pendingCount || 0,
    active_count: activeCount || 0,
  });
}
