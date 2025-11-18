import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Create Supabase client directly
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Ignore cookie errors in API routes
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // Ignore cookie errors in API routes
            }
          },
        },
      }
    );

    console.log("[VP Inbox] Fetching VP inbox...");

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("[VP Inbox] Auth error:", authError);
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("[VP Inbox] User authenticated:", user.email);

    // Get user profile to check VP status
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("is_vp")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError) {
      console.error("[VP Inbox] Profile error:", profileError);
      return NextResponse.json(
        { ok: false, error: "Profile not found", details: profileError.message },
        { status: 404 }
      );
    }

    if (!profile?.is_vp) {
      console.error("[VP Inbox] Access denied - not VP");
      return NextResponse.json(
        { ok: false, error: "Access denied. VP role required." },
        { status: 403 }
      );
    }

    console.log("[VP Inbox] VP verified, fetching requests...");

    // Get requests requiring VP approval
    // VP reviews requests with status = pending_exec (executive approval needed)
    // Show requests where:
    // 1. No VP has approved yet (vp_approved_by is null)
    // 2. OR first VP has approved but second VP hasn't (vp_approved_by is not null, vp2_approved_by is null, and current VP is not the first VP)
    // IMPORTANT: Exclude requests where parent head (who is a VP) already signed - these should go directly to President
    const { data: allRequests, error: requestsError } = await supabase
      .from("requests")
      .select(`
        *,
        vp_approver:users!vp_approved_by(id, name, email, position_title),
        vp2_approver:users!vp2_approved_by(id, name, email, position_title),
        parent_head_approver:users!parent_head_approved_by(id, is_vp, exec_type, role)
      `)
      .eq("status", "pending_exec")
      .order("created_at", { ascending: false })
      .limit(100);

    if (requestsError) {
      console.error("[VP Inbox] Request fetch error:", requestsError);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch VP inbox", details: requestsError.message },
        { status: 500 }
      );
    }

    // Filter requests: 
    // 1. Exclude if parent head (who is a VP) already signed - these should go to President, not VP
    // 2. Show if no VP approved OR if first VP approved but second hasn't (and current VP is not the first)
    const requests = (allRequests || []).filter((req: any) => {
      // Skip if parent head VP already signed (should go to President, not VP)
      const parentHeadSigned = !!(req.parent_head_approved_at || req.parent_head_signature);
      const parentHeadApprover = req.parent_head_approver as any;
      const parentHeadIsVP = parentHeadApprover?.is_vp === true || 
                             parentHeadApprover?.exec_type === 'vp' || 
                             parentHeadApprover?.role === 'exec';
      
      if (parentHeadSigned && parentHeadIsVP) {
        console.log(`[VP Inbox] Skipping request ${req.id} - parent head VP already signed`);
        return false; // Skip this request - should go to President, not VP
      }
      
      const noVPApproved = !req.vp_approved_by;
      const firstVPApproved = req.vp_approved_by && !req.vp2_approved_by && req.vp_approved_by !== profile.id;
      return noVPApproved || firstVPApproved;
    }).slice(0, 50);

    console.log(`[VP Inbox] Found ${requests?.length || 0} requests`);

    // If no requests, return empty array
    if (!requests || requests.length === 0) {
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    // Get requester and department info separately for each request
    const enrichedRequests = await Promise.all(
      requests.map(async (req) => {
        try {
          const { data: requester } = await supabase
            .from("users")
            .select("name, profile_picture, position_title")
            .eq("id", req.requester_id)
            .single();

          const { data: department } = await supabase
            .from("departments")
            .select("name, code")
            .eq("id", req.department_id)
            .single();

          return {
            ...req,
            requester_name: requester?.name || "Unknown",
            requester,
            department,
          };
        } catch (enrichError) {
          console.error("[VP Inbox] Enrichment error for request:", req.id, enrichError);
          return {
            ...req,
            requester_name: "Unknown",
            requester: null,
            department: null,
          };
        }
      })
    );

    console.log("[VP Inbox] Requests enriched, returning data");

    return NextResponse.json({
      ok: true,
      data: enrichedRequests,
    });
  } catch (error: any) {
    console.error("[VP Inbox] Unexpected error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch VP inbox", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
