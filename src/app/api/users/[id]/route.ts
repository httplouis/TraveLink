// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/users/[id]
 * Get user by ID (for routing information display)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ ok: false, error: "User ID is required" }, { status: 400 });
    }
    
    // Use direct createClient with service_role to truly bypass RLS
    // createServerClient from @supabase/ssr might still apply RLS even with service_role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[GET /api/users/[id]] Missing Supabase configuration");
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    // Service role client for queries (bypasses RLS completely)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    console.log("[GET /api/users/[id]] Fetching user with ID:", id);
    
    // Fetch user by ID
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, position_title, role, is_vp, is_admin, department_id")
      .eq("id", id)
      .maybeSingle();
    
    if (error) {
      console.error("[GET /api/users/[id]] Error:", error);
      console.error("[GET /api/users/[id]] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    if (!data) {
      console.log("[GET /api/users/[id]] User not found. ID:", id);
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }
    
    console.log("[GET /api/users/[id]] Found user:", data.name);
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("[GET /api/users/[id]] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

