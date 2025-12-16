// src/app/api/admin/activity/route.ts
/**
 * GET /api/admin/activity
 * Get all activity history for admin view
 * Query params: action_type, search, limit, offset
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin access
    const supabase = await createSupabaseServerClient(true);
    const { data: profile } = await supabase
      .from("users")
      .select("id, email, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph"];
    const isAdmin = profile?.is_admin || adminEmails.includes(profile?.email || "");

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Admin access required" }, { status: 403 });
    }

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const action_type = searchParams.get("action_type") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Query request_history with actor and request details
    let query = supabase
      .from("request_history")
      .select(`
        id,
        request_id,
        action,
        actor_id,
        actor_role,
        previous_status,
        new_status,
        comments,
        metadata,
        created_at,
        requests!request_id(
          id,
          request_number,
          purpose
        ),
        users!actor_id(
          id,
          name,
          email
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (action_type) {
      query = query.eq("action", action_type);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[GET /api/admin/activity] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Transform data to expected format and filter by search
    let filteredData = (data || []).map((item: any) => ({
      ...item,
      request: item.requests,
      actor: item.users,
    }));
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter((item: any) => {
        const requestNumber = item.request?.request_number?.toLowerCase() || "";
        const actorName = item.actor?.name?.toLowerCase() || "";
        const comments = item.comments?.toLowerCase() || "";
        return requestNumber.includes(searchLower) || 
               actorName.includes(searchLower) || 
               comments.includes(searchLower);
      });
    }

    return NextResponse.json({
      ok: true,
      data: filteredData,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/activity] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
