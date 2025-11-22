// Get user's submitted requests with history
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Get authenticated user first (for authorization) - use anon key to read cookies
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS)
    const supabase = await createSupabaseServerClient(true);

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Get all requests submitted by this user (either as requester OR as submitter)
    // This includes:
    // 1. Requests where user submitted (submitted_by_user_id = profile.id) - ALWAYS include these
    // 2. Requests where user is the requester AND they've signed it (for representative submissions)
    //    This ensures representative submissions only appear for requester AFTER they sign
    
    // Query 1: Requests submitted by this user
    let submittedRequests: any[] = [];
    let submittedError: any = null;
    
    try {
      const result = await supabase
        .from("requests")
        .select(`
          *,
          department:departments!department_id(id, code, name)
        `)
        .eq("submitted_by_user_id", profile.id)
        .neq("status", "draft") // Exclude drafts from submissions view
        .order("created_at", { ascending: false })
        .limit(100);
      
      submittedRequests = result.data || [];
      submittedError = result.error;
    } catch (err: any) {
      console.error("[GET /api/requests/my-submissions] Exception in submitted requests query:", err);
      submittedError = err;
    }

    if (submittedError) {
      console.error("[GET /api/requests/my-submissions] Submitted requests error:", submittedError);
      // Don't fail completely - try to continue with empty array
      submittedRequests = [];
    }

    // Query 2: Requests where user is requester AND has signed (representative submissions)
    // IMPORTANT: Exclude drafts from submissions view
    let signedRequests: any[] = [];
    let signedError: any = null;
    
    try {
      const result = await supabase
        .from("requests")
        .select(`
          *,
          department:departments!department_id(id, code, name)
        `)
        .eq("requester_id", profile.id)
        .not("requester_signature", "is", null)
        .neq("status", "draft") // Exclude drafts from submissions view
        .order("created_at", { ascending: false })
        .limit(100);
      
      signedRequests = result.data || [];
      signedError = result.error;
    } catch (err: any) {
      console.error("[GET /api/requests/my-submissions] Exception in signed requests query:", err);
      signedError = err;
    }

    if (signedError) {
      console.error("[GET /api/requests/my-submissions] Signed requests error:", signedError);
      // Don't fail completely - continue with what we have
      signedRequests = [];
    }
    
    // If both queries failed, return error
    if (submittedError && signedError) {
      return NextResponse.json({ 
        ok: false, 
        error: `Failed to fetch requests: ${submittedError.message || signedError.message}` 
      }, { status: 500 });
    }

    // Combine and deduplicate by ID (in case a request matches both conditions)
    const allRequests = [...(submittedRequests || []), ...(signedRequests || [])];
    const uniqueRequests = Array.from(
      new Map(allRequests.map((r: any) => [r.id, r])).values()
    );

    // Sort by created_at descending
    uniqueRequests.sort((a: any, b: any) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    // Parse seminar_data for each request if it exists
    const parsedRequests = uniqueRequests.map((req: any) => {
      if (req.seminar_data && typeof req.seminar_data === 'string') {
        try {
          req.seminar_data = JSON.parse(req.seminar_data);
        } catch (e) {
          console.warn(`[GET /api/requests/my-submissions] Failed to parse seminar_data for request ${req.id}:`, e);
        }
      }
      return req;
    });

    return NextResponse.json({ ok: true, data: parsedRequests.slice(0, 100) });
  } catch (err: any) {
    console.error("[GET /api/requests/my-submissions] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
