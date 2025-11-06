import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Use service role to bypass RLS for admin queries
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    
    // Get filter params
    const status = searchParams.get("status");
    const role = searchParams.get("role"); // Filter by current approver role
    const departmentId = searchParams.get("department_id");
    const userId = searchParams.get("user_id"); // Get user's own requests
    
    // Fetch requests with related data
    // Use proper foreign key relationship syntax
    let query = supabase
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(id, name, email),
        department:departments!department_id(id, name, code),
        head_approver:users!head_approved_by(id, name, email)
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (status && status !== "All") {
      query = query.eq("status", status);
    }

    if (role) {
      query = query.eq("current_approver_role", role);
    }

    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }

    if (userId) {
      query = query.eq("requester_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[/api/requests/list] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log sample data for debugging
    if (data && data.length > 0) {
      console.log("[/api/requests/list] Sample request data:", 
        JSON.stringify(data[0], null, 2)
      );
      console.log("[/api/requests/list] Requester:", data[0].requester);
      console.log("[/api/requests/list] Head approver:", data[0].head_approver);
    }

    // If relations are null, manually fetch user data
    if (data && data.length > 0 && !data[0].requester) {
      console.log("[/api/requests/list] Relations are null, checking requester_id:", data[0].requester_id);
      
      // Try direct user fetch
      const { data: userData } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", data[0].requester_id)
        .single();
      
      console.log("[/api/requests/list] Direct user fetch result:", userData);
    }

    // Log sample data for debugging
    if (data && data.length > 0) {
      console.log("📊 Sample request data from DB:");
      console.log("  - ID:", data[0].id);
      console.log("  - Requester:", data[0].requester?.name || data[0].requester?.email);
      console.log("  - Head:", data[0].head_approver?.name || data[0].head_approver?.email);
      console.log("  - Total budget:", data[0].total_budget);
      console.log("  - Expense breakdown items:", data[0].expense_breakdown?.length || 0);
    }

    // Return just the data array
    return NextResponse.json(data || []);
    
  } catch (error: any) {
    console.error("[/api/requests/list] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
