// src/app/api/requests/tracking/route.ts
/**
 * GET /api/requests/tracking?requestId=xxx
 * Get comprehensive tracking history for a request
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Request ID required" }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get request history
    const { data: history, error: historyError } = await supabase
      .from("request_history")
      .select(`
        *,
        actor:users!request_history_actor_id_fkey(id, name, email, role)
      `)
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (historyError) {
      console.error("[/api/requests/tracking] History error:", historyError);
      return NextResponse.json({ ok: false, error: historyError.message }, { status: 500 });
    }

    // Get request details for current state
    const { data: request, error: reqError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        status,
        created_at,
        updated_at,
        requester:users!requester_id(id, name, email),
        department:departments!requests_department_id_fkey(name)
      `)
      .eq("id", requestId)
      .single();

    if (reqError) {
      console.error("[/api/requests/tracking] Request error:", reqError);
      return NextResponse.json({ ok: false, error: reqError.message }, { status: 500 });
    }

    // Transform history with actor details
    const tracking = (history || []).map((h: any) => ({
      id: h.id,
      action: h.action,
      actor: h.actor ? {
        id: h.actor.id,
        name: h.actor.name,
        email: h.actor.email,
        role: h.actor.role,
      } : null,
      previousStatus: h.previous_status,
      newStatus: h.new_status,
      comments: h.comments,
      metadata: h.metadata,
      createdAt: h.created_at,
    }));

    return NextResponse.json({
      ok: true,
      data: {
        request: {
          id: request.id,
          request_number: request.request_number,
          status: request.status,
          requester: request.requester,
          department: request.department,
        },
        history: tracking,
      },
    });
  } catch (err: any) {
    console.error("[/api/requests/tracking] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

