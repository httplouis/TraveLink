import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/user/inbox
 * Fetch requests awaiting requester signature (representative submissions)
 * These are requests where someone submitted on behalf of the current user
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true); // Use service role
    
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

    console.log(`[User Inbox] Fetching requests for user: ${profile.name} (${profile.id})`);
    console.log(`[User Inbox] Auth user ID: ${user.id}`);

    // Get requests where:
    // 1. requester_id matches current user (they are the requesting person)
    //    OR requester_name matches (in case of name-based matching)
    // 2. status is "pending_requester_signature" (needs their signature)
    // 3. is_representative is true (someone submitted on their behalf)
    
    // First try by requester_id
    let { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        requester:users!requests_requester_id_fkey(id, email, name, department_id),
        submitted_by:users!requests_submitted_by_user_id_fkey(id, email, name),
        department:departments!requests_department_id_fkey(id, name, code),
        preferred_driver:users!preferred_driver_id(id, name, email),
        preferred_vehicle:vehicles!preferred_vehicle_id(id, vehicle_name, plate_number, type)
      `)
      .eq("requester_id", profile.id)
      .eq("status", "pending_requester_signature")
      .eq("is_representative", true)
      .order("created_at", { ascending: false })
      .limit(50);

    // If no results, also try matching by requester_name (case-insensitive)
    // This handles cases where there are multiple users with the same name
    if (!data || data.length === 0) {
      console.log(`[User Inbox] No requests found by requester_id, trying by name...`);
      console.log(`[User Inbox] Searching for requester_name matching: ${profile.name}`);
      
      // Try exact match first (case-insensitive)
      let { data: nameData, error: nameError } = await supabase
        .from("requests")
        .select(`
          *,
          requester:users!requests_requester_id_fkey(id, email, name, department_id),
          submitted_by:users!requests_submitted_by_user_id_fkey(id, email, name),
          department:departments!requests_department_id_fkey(id, name, code),
          preferred_driver:users!preferred_driver_id(id, name, email),
          preferred_vehicle:vehicles!preferred_vehicle_id(id, vehicle_name, plate_number, type)
        `)
        .ilike("requester_name", profile.name.trim())
        .eq("status", "pending_requester_signature")
        .eq("is_representative", true)
        .order("created_at", { ascending: false })
        .limit(50);
      
      // If still no results, try partial match
      if ((!nameData || nameData.length === 0) && profile.name.includes(' ')) {
        console.log(`[User Inbox] No exact match, trying partial match...`);
        const nameParts = profile.name.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          // Try matching with last name or first+last
          const lastName = nameParts[nameParts.length - 1];
          const firstName = nameParts[0];
          
          const { data: partialData } = await supabase
            .from("requests")
            .select(`
              *,
              requester:users!requests_requester_id_fkey(id, email, name, department_id),
              submitted_by:users!requests_submitted_by_user_id_fkey(id, email, name),
              department:departments!requests_department_id_fkey(id, name, code),
              preferred_driver:users!preferred_driver_id(id, name, email),
              preferred_vehicle:vehicles!preferred_vehicle_id(id, vehicle_name, plate_number, type)
            `)
            .or(`requester_name.ilike.%${lastName}%,requester_name.ilike.%${firstName}%${lastName}%`)
            .eq("status", "pending_requester_signature")
            .eq("is_representative", true)
            .order("created_at", { ascending: false })
            .limit(50);
          
          if (partialData && partialData.length > 0) {
            nameData = partialData;
            console.log(`[User Inbox] Found ${partialData.length} requests by partial name matching`);
          }
        }
      }
      
      if (nameData && nameData.length > 0) {
        console.log(`[User Inbox] Found ${nameData.length} requests by name matching`);
        data = nameData;
        error = nameError;
      }
    }

    if (error) {
      console.error("[User Inbox] Query error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log(`[User Inbox] Found ${data?.length || 0} pending signature requests`);
    
    // Debug: Log all found requests
    if (data && data.length > 0) {
      console.log(`[User Inbox] Requests found:`, data.map(r => ({
        id: r.id,
        request_number: r.request_number,
        requester_id: r.requester_id,
        requester_name: r.requester_name,
        submitted_by_name: r.submitted_by_name,
        status: r.status
      })));
    } else {
      // Debug: Check if there are any requests with this requester_name
      const { data: debugData } = await supabase
        .from("requests")
        .select("id, request_number, requester_id, requester_name, submitted_by_name, status, is_representative")
        .ilike("requester_name", `%${profile.name}%`)
        .eq("is_representative", true)
        .limit(5);
      console.log(`[User Inbox] Debug - All requests with requester_name like '${profile.name}':`, debugData);
    }

    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    console.error("[User Inbox] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

