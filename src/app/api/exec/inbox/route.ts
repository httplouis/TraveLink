import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/exec/inbox
 * Fetch requests awaiting Executive final approval (status = 'pending_exec')
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
    const { data, error} = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name),
        department:departments!requests_department_id_fkey(id, name, code)
      `)
      .eq("status", "pending_exec")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Exec inbox fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log("[Exec Inbox API] Total requests:", data?.length);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err) {
    console.error("Exec inbox error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch Executive inbox" },
      { status: 500 }
    );
  }
}
