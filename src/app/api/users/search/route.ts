// src/app/api/users/search/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/users/search
 * Search all users for dropdown/select (for request forms)
 * Query params: q (optional search query)
 */
export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { ok: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    // Fetch all active users with department info
    let supabaseQuery = supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        position_title,
        department,
        department_id,
        profile_picture,
        role,
        status
      `)
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(100); // Limit to prevent too many results

    // If search query provided, filter by name or email
    if (query) {
      supabaseQuery = supabaseQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data: users, error } = await supabaseQuery;

    if (error) {
      console.error("[API /users/search] Error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Fetch departments separately for users with department_id
    const departmentIds = [...new Set((users || []).map((u: any) => u.department_id).filter(Boolean))];
    let departmentsMap: Record<string, any> = {};
    
    if (departmentIds.length > 0) {
      const { data: departments } = await supabase
        .from("departments")
        .select("id, name, code")
        .in("id", departmentIds);
      
      if (departments) {
        departments.forEach((dept: any) => {
          departmentsMap[dept.id] = dept;
        });
      }
    }

    // Transform users with department info
    const transformedUsers = (users || []).map((user: any) => ({
      id: user.id,
      name: user.name || user.email || "Unknown",
      email: user.email,
      position: user.position_title,
      department: user.department || departmentsMap[user.department_id]?.name || null,
      departmentCode: departmentsMap[user.department_id]?.code || null,
      profilePicture: user.profile_picture,
      role: user.role,
    }));

    return NextResponse.json({ ok: true, users: transformedUsers });
  } catch (err: any) {
    console.error("[API /users/search] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

