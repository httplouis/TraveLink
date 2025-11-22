// src/app/api/head-endorsements/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/head-endorsements/status
 * Get status of all head endorsement invitations for a request
 * Query params: request_id
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const request_id = searchParams.get("request_id");

    if (!request_id) {
      return NextResponse.json(
        { ok: false, error: "request_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient(true);

    // Get all invitations for this request
    const { data: invitations, error: invitationsError } = await supabase
      .from("head_endorsement_invitations")
      .select(`
        *,
        department:departments!department_id(id, name, code),
        head_user:users!head_user_id(id, name, email, profile_picture)
      `)
      .eq("request_id", request_id)
      .order("created_at", { ascending: true });

    if (invitationsError) {
      console.error("[GET /api/head-endorsements/status] Error:", invitationsError);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch invitations" },
        { status: 500 }
      );
    }

    // Calculate summary
    const total = invitations?.length || 0;
    const confirmed = invitations?.filter((inv: any) => inv.status === 'confirmed').length || 0;
    const pending = invitations?.filter((inv: any) => inv.status === 'pending').length || 0;
    const declined = invitations?.filter((inv: any) => inv.status === 'declined').length || 0;
    const expired = invitations?.filter((inv: any) => inv.status === 'expired').length || 0;
    const allConfirmed = total > 0 && confirmed === total;

    return NextResponse.json({
      ok: true,
      data: invitations || [],
      summary: {
        total,
        confirmed,
        pending,
        declined,
        expired,
        allConfirmed,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/head-endorsements/status] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

