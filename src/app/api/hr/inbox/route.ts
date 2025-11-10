import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/hr/inbox
 * Fetch requests awaiting HR approval (status = 'pending_hr')
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
    const { data, error} = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name),
        department:departments!requests_department_id_fkey(id, name, code),
        head_approver:users!requests_head_approved_by_fkey(id, email, name),
        admin_approver:users!requests_admin_processed_by_fkey(id, email, name)
      `)
      .eq("status", "pending_hr")
      .order("created_at", { ascending: false })
      .limit(50); // Limit to 50 most recent requests

    if (error) {
      console.error("HR inbox fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Debug logging
    console.log("[HR Inbox API] Total requests:", data?.length);
    if (data && data.length > 0) {
      console.log("[HR Inbox API] First request:", data[0]);
      console.log("[HR Inbox API] First request department:", data[0].department);
      console.log("[HR Inbox API] First request department_id:", data[0].department_id);
    }

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err) {
    console.error("HR inbox error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch HR inbox" },
      { status: 500 }
    );
  }
}
