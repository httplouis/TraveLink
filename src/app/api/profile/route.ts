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
    // Log incoming request headers for debugging
    const cookieHeader = request.headers.get('cookie');
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const allCookies = cookieStore.getAll();
    
    console.log('[GET /api/profile] 📥 Request received:', {
      hasCookieHeader: !!cookieHeader,
      cookieCount: cookieHeader ? cookieHeader.split(';').length : 0,
      cookieStoreCount: allCookies.length,
      cookieNames: allCookies.map(c => c.name).join(', '),
      hasSupabaseCookies: allCookies.some(c => c.name.includes('supabase') || c.name.includes('sb-')),
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')?.substring(0, 50)
    });
    
    const supabase = await createSupabaseServerClient(false); // Use user auth
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("[GET /api/profile] Auth error:", authError.message, authError.status);
      return NextResponse.json({ ok: false, error: `Not authenticated: ${authError.message}` }, { status: 401 });
    }
    
    if (!user) {
      console.error("[GET /api/profile] No user found after auth check");
      return NextResponse.json({ ok: false, error: "Not authenticated: No user found" }, { status: 401 });
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
    
    // Fetch department separately to avoid schema cache issues
    let departmentName = data.department || null; // Use text field first
    if (data.department_id && !departmentName) {
      // If we have department_id but no text, fetch from departments table
      const { data: deptData } = await supabase
        .from("departments")
        .select("name")
        .eq("id", data.department_id)
        .single();
      
      if (deptData) {
        departmentName = deptData.name;
      }
    }
    
    // Log raw data for debugging
    console.log('[GET /api/profile] Raw user data:', {
      id: data.id,
      name: data.name,
      email: data.email,
      department: data.department,
      department_id: data.department_id,
      position_title: data.position_title,
    });
    
    // Transform to frontend format
    const profile = {
      id: data.id,
      name: data.name || `${data.email?.split("@")[0] || "User"}`,
      firstName: data.name?.split(' ')[0] || '',
      lastName: data.name?.split(' ').slice(1).join(' ') || '',
      email: data.email || user.email,
      role: data.role || 'faculty',
      department: departmentName, // Return department name, not just ID
      department_id: data.department_id,
      position_title: data.position_title || null, // Include position title
      employeeId: data.employee_id || data.id, // Use employee_id field if exists, fallback to id
      phone: data.phone || null,
      avatarUrl: data.avatar_url || null,
      bio: data.bio || null,
      joinedAt: data.created_at,
      prefs: data.preferences || { theme: 'system', emailNotifications: true },
      is_head: data.is_head || false,
      is_admin: data.is_admin || false,
      is_comptroller: data.is_comptroller || false,
      is_hr: data.is_hr || false,
      is_executive: (data.role === 'exec' || data.is_vp || data.is_president) || false,
      is_vp: data.is_vp || false,
      is_president: data.is_president || false,
      exec_type: data.exec_type || null,
    };
    
    console.log('[GET /api/profile] Returning profile:', {
      name: profile.name,
      department: profile.department,
      position_title: profile.position_title,
    });
    
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
    
    // Update profile - handle all fields
    const updates: any = {};
    
    // Name handling
    if (body.firstName || body.lastName) {
      updates.name = `${body.firstName || ''} ${body.lastName || ''}`.trim();
    } else if (body.name) {
      updates.name = body.name;
    }
    
    // Phone handling (support both phone and phone_number)
    if (body.phone !== undefined) {
      updates.phone = body.phone || null;
    } else if (body.phone_number !== undefined) {
      updates.phone = body.phone_number || null;
    }
    
    // Avatar/Profile picture
    if (body.avatarUrl !== undefined) {
      updates.avatar_url = body.avatarUrl;
    } else if (body.profile_picture !== undefined) {
      updates.avatar_url = body.profile_picture;
    }
    
    // Department (as text, not ID - for display)
    if (body.department !== undefined) {
      updates.department = body.department || null;
    }
    
    // Position title
    if (body.position_title !== undefined) {
      updates.position_title = body.position_title || null;
    }
    
    // Employee ID
    if (body.employee_id !== undefined) {
      updates.employee_id = body.employee_id || null;
    } else if (body.employeeId !== undefined) {
      updates.employee_id = body.employeeId || null;
    }
    
    // Bio
    if (body.bio !== undefined) {
      updates.bio = body.bio || null;
    }
    
    // Preferences
    if (body.prefs) {
      updates.preferences = body.prefs;
    }
    
    // Note: Removed updated_at - column might not exist
    
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
