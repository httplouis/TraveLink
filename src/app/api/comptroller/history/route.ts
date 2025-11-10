// src/app/api/comptroller/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      .or("comptroller_approved_at.not.is.null,comptroller_rejected_at.not.is.null")
      .order("comptroller_approved_at", { ascending: false, nullsFirst: false })
      .order("comptroller_rejected_at", { ascending: false, nullsFirst: false });

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

      return {
        id: req.id,
        request_number: req.request_number || req.id,
        requester: requesterName,
        department: deptCode,
        budget: req.total_budget || 0,
        edited_budget: req.comptroller_edited_budget,
        decision,
        decision_date: decisionDate,
        notes: notes || "",
      };
    }) || [];

    return NextResponse.json(history);

  } catch (error: any) {
    console.error("Error fetching comptroller history:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch history" },
      { status: 500 }
    );
  }
}
