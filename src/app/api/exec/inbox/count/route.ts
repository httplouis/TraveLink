import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/exec/inbox/count
 * Count requests awaiting Executive approval
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_exec");

    if (error) {
      console.error("Exec inbox count error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pending_count: count || 0 });
  } catch (err) {
    console.error("Exec inbox count error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch count" },
      { status: 500 }
    );
  }
}
