import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

/**
 * GET /api/comptroller/inbox/count
 * Lightweight count-only endpoint for badge polling
 */
export async function GET() {
  try {
    const { count, error } = await supabase
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_comptroller");
      // Note: both_vps_approved is just an acknowledgment - requests still go through comptroller

    if (error) {
      console.error("Comptroller inbox count error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, count: count || 0 });
  } catch (err) {
    console.error("Comptroller inbox count error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch count" },
      { status: 500 }
    );
  }
}
