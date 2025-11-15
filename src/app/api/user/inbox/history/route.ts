import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/inbox/history
 * Fetch requests that user has signed (requester signature provided)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Get current authenticated user
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
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    console.log(`[User Inbox History] Fetching signed requests for user: ${profile.name} (${profile.id})`);

    // Get requests where user has signed (requester_signature is NOT null)
    // This includes:
    // 1. Requests where user is the requester (requester_id matches) AND signed
    // 2. Requests where user is the submitter (submitted_by_user_id matches) AND signed
    // 3. Requests where requester_name matches (for name-based matching) AND signed
    // 4. Status is NOT pending_requester_signature (already signed, moved forward)
    
    // Query 1: Requests where user is requester AND has signed
    const { data: requesterData, error: requesterError } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name, department_id),
        submitted_by:users!requests_submitted_by_user_id_fkey(id, email, name),
        department:departments!requests_department_id_fkey(id, name, code)
      `)
      .eq("requester_id", profile.id)
      .not("requester_signature", "is", null)
      .neq("status", "pending_requester_signature")
      .order("requester_signed_at", { ascending: false })
      .limit(100);

    // Query 2: Requests where user is submitter AND requester has signed (representative submissions)
    const { data: submitterData, error: submitterError } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name, department_id),
        submitted_by:users!requests_submitted_by_user_id_fkey(id, email, name),
        department:departments!requests_department_id_fkey(id, name, code)
      `)
      .eq("submitted_by_user_id", profile.id)
      .not("requester_signature", "is", null)
      .neq("status", "pending_requester_signature")
      .order("requester_signed_at", { ascending: false })
      .limit(100);

    // Combine results and deduplicate by ID
    let allRequests = [...(requesterData || []), ...(submitterData || [])];
    const uniqueRequests = Array.from(
      new Map(allRequests.map((r: any) => [r.id, r])).values()
    );

    // Sort by requester_signed_at descending
    uniqueRequests.sort((a: any, b: any) => {
      const dateA = new Date(a.requester_signed_at || 0).getTime();
      const dateB = new Date(b.requester_signed_at || 0).getTime();
      return dateB - dateA;
    });

    let data = uniqueRequests.slice(0, 100);
    let error = requesterError || submitterError;

    // If still no results, try matching by requester_name (case-insensitive)
    if (!data || data.length === 0) {
      console.log(`[User Inbox History] No requests found by ID, trying by name...`);
      const { data: nameData, error: nameError } = await supabase
        .from("requests")
        .select(`
          *,
          requester:users!requests_requester_id_fkey(id, email, name, department_id),
          submitted_by:users!requests_submitted_by_user_id_fkey(id, email, name),
          department:departments!requests_department_id_fkey(id, name, code)
        `)
        .ilike("requester_name", profile.name.trim())
        .not("requester_signature", "is", null)
        .neq("status", "pending_requester_signature")
        .order("requester_signed_at", { ascending: false })
        .limit(100);
      
      if (nameData && nameData.length > 0) {
        console.log(`[User Inbox History] Found ${nameData.length} requests by name matching`);
        data = nameData;
        error = nameError;
      }
    }

    // Debug: Log what we found
    if (data && data.length > 0) {
      console.log(`[User Inbox History] Found ${data.length} signed requests:`, data.map(r => ({
        id: r.id,
        request_number: r.request_number,
        requester_id: r.requester_id,
        requester_name: r.requester_name,
        status: r.status,
        requester_signed_at: r.requester_signed_at,
        is_representative: r.is_representative
      })));
    } else {
      // Debug: Check if there are any signed requests at all
      const { data: debugData } = await supabase
        .from("requests")
        .select("id, request_number, requester_id, requester_name, status, requester_signed_at, is_representative")
        .not("requester_signature", "is", null)
        .limit(10);
      console.log(`[User Inbox History] Debug - All signed requests (first 10):`, debugData);
    }

    if (error) {
      console.error("[User Inbox History] Query error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log(`[User Inbox History] Found ${data?.length || 0} signed requests`);

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    console.error("[User Inbox History] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

