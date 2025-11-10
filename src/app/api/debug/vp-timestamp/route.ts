import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Debug endpoint to check VP approval timestamps
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestNumber = searchParams.get("request") || "TO-2025-075";

    const supabase = await createSupabaseServerClient(true);

    const { data: req, error } = await supabase
      .from("requests")
      .select("id, request_number, vp_approved_at, exec_approved_at, status")
      .eq("request_number", requestNumber)
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Get current server time
    const nowUtc = new Date().toISOString();
    const nowPhilippine = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    return NextResponse.json({
      ok: true,
      request_number: requestNumber,
      status: req?.status,
      vp_approved_at_raw: req?.vp_approved_at,
      exec_approved_at_raw: req?.exec_approved_at,
      vp_approved_at_formatted: req?.vp_approved_at 
        ? new Date(req.vp_approved_at).toLocaleString("en-US", {
            timeZone: "Asia/Manila",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })
        : null,
      server_time_utc: nowUtc,
      server_time_philippine: nowPhilippine,
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
