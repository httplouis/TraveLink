import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/exec/history
 * Fetch requests that Executive has approved or rejected
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name),
        department:departments!requests_department_id_fkey(id, name, code)
      `)
      .in("status", ["approved", "rejected"])
      .not("exec_approved_at", "is", null)
      .order("exec_approved_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Exec history fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log("[Exec History API] Total requests:", data?.length);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err) {
    console.error("Exec history error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch Executive history" },
      { status: 500 }
    );
  }
}
