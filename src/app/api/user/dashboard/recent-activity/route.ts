// src/app/api/user/dashboard/recent-activity/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/dashboard/recent-activity
 * Get recent activity for the logged-in user (recent request updates, approvals, etc.)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, department_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const userId = profile.id;

    // Get recent requests (submitted by or requested by user)
    const { data: recentRequests, error: requestsError } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        status,
        destination,
        department_id,
        requester_id,
        submitted_by_user_id,
        created_at,
        head_approved_at,
        admin_processed_at,
        hr_approved_at,
        vp_approved_at,
        president_approved_at,
        exec_approved_at,
        department:departments!department_id(code, name)
      `)
      .or(`submitted_by_user_id.eq.${userId},requester_id.eq.${userId}`)
      .not("status", "eq", "draft")
      .order("updated_at", { ascending: false })
      .limit(10);

    if (requestsError) {
      console.error("[GET /api/user/dashboard/recent-activity] Error:", requestsError);
      return NextResponse.json({ ok: false, error: requestsError.message }, { status: 500 });
    }

    // Format activity items
    const activities: Array<{
      id: string;
      title: string;
      meta: string;
      when: string;
    }> = [];

    recentRequests?.forEach((req: any) => {
      const deptCode = req.department?.code || "Unknown";
      const destination = req.destination || "Unknown";
      
      // Determine the most recent action
      let action = "";
      let timestamp: Date | null = null;
      let meta = `${destination} • ${deptCode}`;

      // Check approval timestamps (most recent first)
      if (req.exec_approved_at) {
        action = "Request approved";
        timestamp = new Date(req.exec_approved_at);
      } else if (req.president_approved_at) {
        action = "Request approved";
        timestamp = new Date(req.president_approved_at);
      } else if (req.vp_approved_at) {
        action = "Request approved by VP";
        timestamp = new Date(req.vp_approved_at);
      } else if (req.hr_approved_at) {
        action = "Request approved by HR";
        timestamp = new Date(req.hr_approved_at);
      } else if (req.admin_processed_at) {
        action = "Vehicle assigned";
        timestamp = new Date(req.admin_processed_at);
        // Try to get vehicle info if available
        meta = `${destination} • ${deptCode}`;
      } else if (req.head_approved_at) {
        action = "Request approved by Head";
        timestamp = new Date(req.head_approved_at);
      } else {
        // Default to creation
        action = "Request submitted";
        timestamp = new Date(req.created_at);
      }

      if (timestamp) {
        const now = new Date();
        const diffMs = now.getTime() - timestamp.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        let when = "";
        if (diffMins < 60) {
          when = diffMins <= 1 ? "just now" : `${diffMins}m ago`;
        } else if (diffHours < 24) {
          when = diffHours === 1 ? "1h ago" : `${diffHours}h ago`;
        } else if (diffDays === 1) {
          when = "yesterday";
        } else if (diffDays < 7) {
          when = `${diffDays} days ago`;
        } else {
          when = timestamp.toLocaleDateString();
        }

        activities.push({
          id: req.id,
          title: action,
          meta,
          when,
        });
      }
    });

    // Sort by timestamp (most recent first) and limit to 5
    return NextResponse.json({
      ok: true,
      data: activities.slice(0, 5),
    });
  } catch (err: any) {
    console.error("[GET /api/user/dashboard/recent-activity] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

