import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/hr/history
 * Fetch requests that HR has approved or rejected
 */
export async function GET() {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS completely)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        ok: false,
        error: "Missing Supabase configuration"
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name),
        department:departments!requests_department_id_fkey(id, name, code),
        head_approver:users!requests_head_approved_by_fkey(id, email, name),
        admin_approver:users!requests_admin_processed_by_fkey(id, email, name),
        hr_approver:users!requests_hr_approved_by_fkey(id, email, name)
      `)
      .in("status", ["pending_vp", "pending_president", "pending_exec", "approved", "rejected"])
      .not("hr_approved_at", "is", null)
      .order("hr_approved_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("HR history fetch error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log("[HR History API] Total requests:", data?.length);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err) {
    console.error("HR history error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch HR history" },
      { status: 500 }
    );
  }
}
