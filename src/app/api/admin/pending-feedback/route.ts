// src/app/api/admin/pending-feedback/route.ts
/**
 * Admin API - Get completed trips that don't have feedback yet
 * Shows who hasn't submitted feedback
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Use regular client for auth check
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role for database operations
    const supabase = await createSupabaseServerClient(true);

    const { data: profile } = await supabase
      .from("users")
      .select("id, email, role, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph"];
    const isAdmin = profile.is_admin || profile.role === "admin" || adminEmails.includes(profile.email || "");
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    // Get all completed/approved requests
    const { data: completedRequests, error: reqError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        requester_id,
        requester_name,
        destination,
        purpose,
        travel_start_date,
        travel_end_date,
        status,
        final_approved_at,
        department:departments(id, name, code)
      `)
      .in("status", ["approved", "completed"])
      .order("final_approved_at", { ascending: false })
      .limit(200);

    if (reqError) {
      console.error("[GET /api/admin/pending-feedback] Error fetching requests:", reqError);
      return NextResponse.json({ ok: false, error: reqError.message }, { status: 500 });
    }

    // Get all feedback entries
    const { data: feedbackEntries, error: fbError } = await supabase
      .from("feedback")
      .select("trip_id, user_id");

    if (fbError) {
      console.error("[GET /api/admin/pending-feedback] Error fetching feedback:", fbError);
      return NextResponse.json({ ok: false, error: fbError.message }, { status: 500 });
    }

    // Create a set of trip IDs that have feedback
    const tripsWithFeedback = new Set(
      (feedbackEntries || []).map((f: any) => f.trip_id).filter(Boolean)
    );

    // Filter to only requests without feedback
    const pendingFeedback = (completedRequests || []).filter(
      (req: any) => !tripsWithFeedback.has(req.id)
    );

    // Get requester details
    const requesterIds = [...new Set(pendingFeedback.map((r: any) => r.requester_id).filter(Boolean))];
    
    let requesterMap: Record<string, any> = {};
    if (requesterIds.length > 0) {
      const { data: requesters } = await supabase
        .from("users")
        .select("id, name, email, phone")
        .in("id", requesterIds);
      
      if (requesters) {
        requesters.forEach((u: any) => {
          requesterMap[u.id] = u;
        });
      }
    }

    // Enrich with requester details
    const enrichedData = pendingFeedback.map((req: any) => ({
      ...req,
      requester: req.requester_id ? requesterMap[req.requester_id] : null,
      days_since_completion: req.final_approved_at 
        ? Math.floor((Date.now() - new Date(req.final_approved_at).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));

    return NextResponse.json({ 
      ok: true, 
      data: enrichedData,
      total: enrichedData.length,
      totalCompleted: completedRequests?.length || 0,
      totalWithFeedback: tripsWithFeedback.size,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/pending-feedback] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
