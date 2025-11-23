// src/app/api/requesters/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/requesters/status?request_id=xxx
 * Get current status of all requester invitations for a request
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

    // Get all invitations for this request
    // Use .order() before .select() to ensure fresh data
    const { data: invitations, error } = await supabase
      .from("requester_invitations")
      .select(`
        id,
        email,
        name,
        department,
        department_id,
        status,
        confirmed_at,
        declined_at,
        signature,
        user_id,
        declined_reason,
        updated_at
      `)
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    
    console.log("[GET /api/requesters/status] 📊 Fetched invitations:", {
      count: invitations?.length || 0,
      statuses: invitations?.map((inv: any) => ({ 
        id: inv.id, 
        email: inv.email, 
        status: inv.status,
        hasSignature: !!inv.signature,
        name: inv.name,
      })) || [],
    });

    if (error) {
      console.error("[GET /api/requesters/status] Error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Fetch user data separately if user_id exists
    const userIds = (invitations || [])
      .map((inv: any) => inv.user_id)
      .filter((id: string | null) => id !== null) as string[];

    let usersMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, email, department, department_id, profile_picture, position_title, role, is_head")
        .in("id", userIds);

      if (!usersError && users) {
        users.forEach((user: any) => {
          usersMap[user.id] = user;
        });
      }
    }

    // Merge user data with invitations
    const enrichedInvitations = (invitations || []).map((inv: any) => {
      const user = inv.user_id ? usersMap[inv.user_id] : null;
      return {
        id: inv.id,
        email: inv.email,
        name: inv.name || user?.name || null,
        department: inv.department || user?.department || null,
        department_id: inv.department_id || user?.department_id || null,
        status: inv.status,
        confirmed_at: inv.confirmed_at,
        declined_at: inv.declined_at,
        signature: inv.signature, // Include signature
        user_id: inv.user_id,
        declined_reason: inv.declined_reason,
        profile_picture: user?.profile_picture || null, // Include profile picture
        position_title: user?.position_title || null, // Include position
        role: user?.role || null, // Include role
        is_head: user?.is_head || false, // Include is_head flag
      };
    });

    return NextResponse.json({
      ok: true,
      data: enrichedInvitations,
    });
  } catch (err: any) {
    console.error("[GET /api/requesters/status] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

