import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/inbox/count
 * Lightweight endpoint to get the count of pending requests for Admin
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
    const { count, error } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending_admin", "head_approved"]);

    if (error) {
      console.error("[Admin Inbox Count] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: count || 0 });
  } catch (err) {
    console.error("[Admin Inbox Count] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch admin inbox count" },
      { status: 500 }
    );
  }
}

