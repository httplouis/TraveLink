// GET /api/comptroller/inbox
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Authenticate user
    const supabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check if they're a comptroller
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ ok: false, error: "Missing Supabase configuration" }, { status: 500 });
    }

    const supabaseServiceRole = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: profile, error: profileError } = await supabaseServiceRole
      .from("users")
      .select("id, is_comptroller, department_id, position_title")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    if (!profile.is_comptroller) {
      return NextResponse.json({ ok: false, error: "Forbidden: Not a comptroller" }, { status: 403 });
    }

    // Fetch pending comptroller requests
    const { data: allRequests, error: requestsError } = await supabaseServiceRole
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(id, name, email, profile_picture, department_id),
        department:departments!department_id(id, name, code)
      `)
      .eq("status", "pending_comptroller")
      .order("created_at", { ascending: false })
      .limit(limit * 2); // Fetch more to filter

    if (requestsError) {
      console.error("[Comptroller Inbox] Error fetching requests:", requestsError);
      return NextResponse.json({ ok: false, error: requestsError.message }, { status: 500 });
    }

    // Filter requests based on assignment logic (same as in /api/requests/list)
    const filteredRequests = (allRequests || []).filter((req: any) => {
      const workflowMetadata = req.workflow_metadata || {};
      const nextComptrollerId = workflowMetadata.next_comptroller_id;
      const nextApproverId = workflowMetadata.next_approver_id;
      const nextApproverRole = workflowMetadata.next_approver_role;

      const nextComptrollerIdStr = nextComptrollerId ? String(nextComptrollerId).trim() : null;
      const nextApproverIdStr = nextApproverId ? String(nextApproverId).trim() : null;
      const profileIdStr = String(profile.id).trim();
      const profileDeptId = profile.department_id;
      const isProfileFinancialAnalyst = profile.position_title?.toLowerCase().includes("financial analyst");

      // If request is explicitly assigned to a specific comptroller
      if (nextComptrollerIdStr) {
        if (nextComptrollerIdStr === profileIdStr) {
          return true; // Assigned to current user
        }
        // Also show to Financial Analysts in the same department as the assigned comptroller
        if (profileDeptId && isProfileFinancialAnalyst) {
          // For simplicity in this endpoint, we'll return true if assigned
          // The detailed filtering is done in /api/requests/list
          return false; // Only assigned comptroller gets it if explicitly assigned
        }
        return false;
      }

      // If next_approver_id is set and role is comptroller
      if (nextApproverIdStr && nextApproverRole === "comptroller") {
        if (nextApproverIdStr === profileIdStr) {
          return true; // Assigned to current user
        }
        return false;
      }

      return true; // No specific assignment - show to all comptrollers
    });

    // Limit results
    const limitedRequests = filteredRequests.slice(0, limit);

    return NextResponse.json({
      ok: true,
      data: limitedRequests,
      count: limitedRequests.length,
      total: filteredRequests.length
    });
  } catch (error: any) {
    console.error("[Comptroller Inbox] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

