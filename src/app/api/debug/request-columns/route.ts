import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Debug endpoint to check if request has VP/President columns
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("id");

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Missing request ID" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient(true);

    // Fetch the request
    const { data: req, error } = await supabase
      .from("requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Check which approval columns exist and have data
    const columns = {
      hr_approved_at: req?.hr_approved_at || null,
      hr_approved_by: req?.hr_approved_by || null,
      vp_approved_at: req?.vp_approved_at || null,
      vp_approved_by: req?.vp_approved_by || null,
      president_approved_at: req?.president_approved_at || null,
      president_approved_by: req?.president_approved_by || null,
      exec_approved_at: req?.exec_approved_at || null,
      exec_approved_by: req?.exec_approved_by || null,
      status: req?.status,
      current_approver_role: req?.current_approver_role,
      exec_level: req?.exec_level,
    };

    return NextResponse.json({
      ok: true,
      request_id: requestId,
      request_number: req?.request_number,
      columns: columns,
      has_vp_columns: req?.hasOwnProperty('vp_approved_at'),
      has_president_columns: req?.hasOwnProperty('president_approved_at'),
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
