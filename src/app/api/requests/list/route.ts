import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(request.url);
    
    // Get filter params
    const status = searchParams.get("status");
    const role = searchParams.get("role"); // Filter by current approver role
    const departmentId = searchParams.get("department_id");
    const userId = searchParams.get("user_id"); // Get user's own requests
    
    let query = supabase
      .from("requests")
      .select(`
        *,
        requester:users!requester_id(id, name, email),
        department:departments(id, name, code)
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
      console.error("[/api/requests/list] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data, count: data?.length || 0 });
    
  } catch (error: any) {
    console.error("[/api/requests/list] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
