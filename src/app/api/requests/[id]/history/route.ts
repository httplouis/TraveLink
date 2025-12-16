// src/app/api/requests/[id]/history/route.ts
/**
 * GET /api/requests/[id]/history
 * Get approval timeline/history for a specific request
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const requestId = resolvedParams.id;

    if (!requestId || requestId === "undefined") {
      return NextResponse.json({ ok: false, error: "Invalid request ID" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient(true);

    // Get authenticated user
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get request history with actor details
    const { data: history, error: historyError } = await supabase
      .from("request_history")
      .select(`
        id,
        action,
        actor_id,
        actor_role,
        previous_status,
        new_status,
        comments,
        metadata,
        created_at,
        actor:users!request_history_actor_id_fkey(id, name, email)
      `)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false });

    if (historyError) {
      console.error("[GET /api/requests/[id]/history] Error:", historyError);
      return NextResponse.json({ ok: false, error: historyError.message }, { status: 500 });
    }

    // Transform data for timeline
    const timelineEvents = (history || []).map((h: any) => ({
      id: h.id,
      action: h.action,
      actor_name: h.actor?.name || "System",
      actor_role: h.actor_role,
      timestamp: h.created_at,
      comments: h.comments,
      status_from: h.previous_status,
      status_to: h.new_status,
      metadata: h.metadata,
    }));

    return NextResponse.json({
      ok: true,
      data: timelineEvents,
    });
  } catch (error: any) {
    console.error("[GET /api/requests/[id]/history] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
