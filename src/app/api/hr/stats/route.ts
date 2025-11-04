import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { count: pendingCount } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("current_status", "hr_pending");

  const { count: activeCount } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("created_by", user.id)
    .in("current_status", ["pending_head", "head_approved", "admin_review", "comptroller_pending", "hr_pending", "executive_pending"]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: processedToday } = await supabase
    .from("approvals")
    .select("*", { count: "exact", head: true })
    .eq("approver_id", user.id)
    .gte("approved_at", today.toISOString());

  return NextResponse.json({
    ok: true,
    pending_count: pendingCount || 0,
    active_count: activeCount || 0,
    processed_today: processedToday || 0,
  });
}
