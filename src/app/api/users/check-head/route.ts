// src/app/api/users/check-head/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/users/check-head
 * Check if a requesting person (by name) is a department head
 * Body: { requestingPersonName: string, departmentId?: string }
 */
export async function POST(request: Request) {
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

    const body = await request.json();
    const { requestingPersonName, departmentId } = body;

    if (!requestingPersonName) {
      return NextResponse.json(
        { ok: false, error: "Requesting person name is required" },
        { status: 400 }
      );
    }

    // Find user by name (exact match or similar)
    let query = supabase
      .from("users")
      .select("id, name, email, is_head, department_id, role")
      .ilike("name", `%${requestingPersonName}%`)
      .eq("status", "active")
      .limit(5);

    // If departmentId provided, filter by department
    if (departmentId) {
      query = query.eq("department_id", departmentId);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("[API /users/check-head] Error:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    // Find exact match first, then closest match
    const exactMatch = users?.find(u => 
      u.name?.toLowerCase().trim() === requestingPersonName.toLowerCase().trim()
    );
    const matchedUser = exactMatch || users?.[0];

    if (!matchedUser) {
      return NextResponse.json({
        ok: true,
        isHead: false,
        user: null,
        message: "User not found"
      });
    }

    const isHead = matchedUser.is_head === true || matchedUser.role === "head";

    return NextResponse.json({
      ok: true,
      isHead,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        department_id: matchedUser.department_id,
        role: matchedUser.role,
      }
    });
  } catch (err: any) {
    console.error("[API /users/check-head] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

