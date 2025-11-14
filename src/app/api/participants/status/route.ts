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
    // Note: We fetch user data separately to avoid foreign key relationship issues
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
        user_id
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

    // Fetch user data separately if user_id exists
    const userIds = (invitations || [])
      .map((inv: any) => inv.user_id)
      .filter((id: string | null) => id !== null) as string[];

    let usersMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select(`
          id,
          name,
          email,
          department_id
        `)
        .in("id", userIds);

      if (!usersError && users) {
        // Fetch departments separately
        const deptIds = users
          .map((u: any) => u.department_id)
          .filter((id: string | null) => id !== null) as string[];

        let departmentsMap: Record<string, any> = {};
        if (deptIds.length > 0) {
          const { data: departments, error: deptError } = await supabase
            .from("departments")
            .select("id, name, code")
            .in("id", deptIds);

          if (!deptError && departments) {
            departments.forEach((dept: any) => {
              departmentsMap[dept.id] = dept;
            });
          }
        }

        // Map users with their departments
        users.forEach((user: any) => {
          usersMap[user.id] = {
            ...user,
            department: user.department_id ? departmentsMap[user.department_id] : null,
          };
        });
      }
    }

    // Transform data to include confirmed participant info
    const transformed = (invitations || []).map((inv: any) => {
      const user = inv.user_id ? usersMap[inv.user_id] : null;
      return {
        id: inv.id,
        email: inv.email,
        status: inv.status,
        invited_at: inv.invited_at,
        confirmed_at: inv.confirmed_at,
        declined_at: inv.declined_at,
        // Use confirmed data if available, otherwise use linked user data
        name: inv.name || user?.name || null,
        department: inv.department || user?.department?.name || null,
        available_fdp: inv.available_fdp || null,
        signature: inv.signature || null,
        invitationId: inv.id, // For compatibility with frontend
      };
    });

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

