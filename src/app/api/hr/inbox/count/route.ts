import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/hr/inbox/count
 * Lightweight count-only endpoint for badge polling (reduces egress)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
    const { count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_hr");

    if (error) {
      console.error("HR inbox count error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pending_count: count || 0 });
  } catch (err) {
    console.error("HR inbox count error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch count" },
      { status: 500 }
    );
  }
}
