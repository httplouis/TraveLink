// src/app/api/profile/route.ts
/**
 * User Profile API - Get/Update current user's profile
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/profile
 * Get current user's profile
 */
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(false); // Use user auth
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }
    
    // Fetch user profile from database
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();
    
    if (error) {
      console.error("[GET /api/profile] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    // Transform to frontend format
    const profile = {
      id: data.id,
      firstName: data.name?.split(' ')[0] || '',
      lastName: data.name?.split(' ').slice(1).join(' ') || '',
      email: data.email || user.email,
      role: data.role || 'faculty',
      department: data.department_id,
      employeeId: data.id,
      phone: data.phone,
      avatarUrl: data.avatar_url,
      joinedAt: data.created_at,
      prefs: data.preferences || { theme: 'system', emailNotifications: true },
    };
    
    return NextResponse.json({ ok: true, data: profile });
  } catch (err: any) {
    console.error("[GET /api/profile] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/profile
 * Update current user's profile
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(false);
    const body = await request.json();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }
    
    // Update profile
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.firstName || body.lastName) {
      updates.name = `${body.firstName || ''} ${body.lastName || ''}`.trim();
    }
    if (body.phone) updates.phone = body.phone;
    if (body.avatarUrl !== undefined) updates.avatar_url = body.avatarUrl;
    if (body.prefs) updates.preferences = body.prefs;
    
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("auth_user_id", user.id)
      .select()
      .single();
    
    if (error) {
      console.error("[PATCH /api/profile] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("[PATCH /api/profile] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
