// src/app/api/participants/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/participants/status?request_id=xxx
 * Get current status of all participant invitations for a request
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("request_id");

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "Missing request_id parameter" },
        { status: 400 }
      );
    }

    // Get all invitations for this request with confirmed participant details
    const { data: invitations, error } = await supabase
      .from("participant_invitations")
      .select(`
        id,
        email,
        name,
        department,
        available_fdp,
        status,
        confirmed_at,
        declined_at,
        signature,
        user_id,
        user:users!participant_invitations_user_id_fkey(
          id,
          name,
          email,
          department_id,
          department:departments(
            id,
            name,
            code
          )
        )
      `)
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET /api/participants/status] Error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform data to include confirmed participant info
    const transformed = (invitations || []).map((inv: any) => ({
      id: inv.id,
      email: inv.email,
      status: inv.status,
      invited_at: inv.invited_at,
      confirmed_at: inv.confirmed_at,
      declined_at: inv.declined_at,
      // Use confirmed data if available, otherwise use linked user data
      name: inv.name || inv.user?.name || null,
      department: inv.department || inv.user?.department?.name || null,
      available_fdp: inv.available_fdp || null,
      signature: inv.signature || null,
      invitationId: inv.id, // For compatibility with frontend
    }));

    return NextResponse.json({
      ok: true,
      data: transformed,
    });
  } catch (err: any) {
    console.error("[GET /api/participants/status] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

