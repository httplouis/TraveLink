import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  // Use regular client for auth (NOT service role - it doesn't have session info)
  const supabase = await createSupabaseServerClient(false);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, trips: [] });
  }

  const { data: requests } = await supabase
    .from("requests")
    .select("id, form_payload, current_status, created_at")
    .eq("created_by", user.id)
    .in("current_status", ["approved", "in_progress", "completed"])
    .order("created_at", { ascending: false })
    .limit(20);

  const trips = (requests || []).map((req) => {
    const payload = req.form_payload || {};
    const travelOrder = payload.travelOrder || {};
    
    return {
      id: req.id,
      title: travelOrder.purposeOfTravel || payload.purpose || "Trip",
      start: travelOrder.departureDate || req.created_at,
      end: travelOrder.returnDate || req.created_at,
      description: travelOrder.destination || "",
      status: req.current_status,
    };
  });

  return NextResponse.json({ ok: true, trips });
}
