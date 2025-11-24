// src/app/api/comptroller/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
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

    // Get all requests that comptroller has acted on
    const { data, error } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        total_budget,
        comptroller_edited_budget,
        comptroller_approved_at,
        comptroller_rejected_at,
        comptroller_comments,
        comptroller_rejection_reason,
        requester:requester_id (
          name
        ),
        department:department_id (
          code,
          name
        )
      `)
      .or("comptroller_approved_at.not.is.null,comptroller_rejected_at.not.is.null");

    if (error) throw error;

    // Transform data
    const history = data?.map((req) => {
      const decision: "approved" | "rejected" = req.comptroller_approved_at ? "approved" : "rejected";
      const decisionDate = req.comptroller_approved_at || req.comptroller_rejected_at;
      const notes = decision === "approved" 
        ? req.comptroller_comments 
        : req.comptroller_rejection_reason;

      const requesterName = req.requester && typeof req.requester === 'object' && 'name' in req.requester 
        ? (req.requester as any).name 
        : "Unknown";

      const deptCode = req.department && typeof req.department === 'object' && 'code' in req.department 
        ? (req.department as any).code 
        : "Unknown";
      
      const deptName = req.department && typeof req.department === 'object' && 'name' in req.department 
        ? (req.department as any).name 
        : null;

      return {
        id: req.id,
        request_number: req.request_number || req.id,
        requester: requesterName,
        requester_name: requesterName,
        department: deptCode,
        department_name: deptName || deptCode,
        budget: req.total_budget || 0,
        edited_budget: req.comptroller_edited_budget,
        decision,
        decision_date: decisionDate,
        notes: notes || "",
      };
    }) || [];

    // Sort by decision date (most recent first)
    history.sort((a, b) => {
      const dateA = new Date(a.decision_date || 0).getTime();
      const dateB = new Date(b.decision_date || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ ok: true, data: history });

  } catch (error: any) {
    console.error("Error fetching comptroller history:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to fetch history" },
      { status: 500 }
    );
  }
}
