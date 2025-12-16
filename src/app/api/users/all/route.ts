// src/app/api/users/all/route.ts
/**
 * GET /api/users/all
 * Get all active users for flexible approver selection
 * Allows sending requests to anyone in the system, not just specific roles
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user first (for authorization)
    const authSupabase = await createSupabaseServerClient(false);
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use direct createClient for service role to truly bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase configuration" 
      }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search"); // Optional search query
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Reduced default from 100 to 50, max 100

    // Fetch all active users with their department info
    let query = supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        profile_picture,
        phone_number,
        position_title,
        department_id,
        role,
        is_head,
        is_admin,
        is_hr,
        is_vp,
        is_president,
        exec_type,
        status,
        department:departments(id, name, code)
      `)
      .eq("status", "active")
      .order("name", { ascending: true })
      .limit(limit);

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      query = query.or(
        `name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,position_title.ilike.%${searchLower}%`
      );
    }

    const { data: users, error } = await query;

    if (error) {
      console.error("[GET /api/users/all] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Format users for approver selection
    const formattedUsers = (users || []).map((u: any) => {
      // Determine role label based on user's roles
      let roleLabel = "User";
      const roles: string[] = [];
      
      if (u.is_president || u.exec_type === "president") {
        roles.push("President/COO");
      } else if (u.is_vp || u.exec_type?.startsWith("vp_") || u.exec_type?.startsWith("svp_")) {
        if (u.exec_type === "svp_academics") {
          roles.push("SVP Academics");
        } else if (u.exec_type === "vp_admin") {
          roles.push("VP Administration");
        } else if (u.exec_type === "vp_external") {
          roles.push("VP External");
        } else if (u.exec_type === "vp_finance") {
          roles.push("VP Finance");
        } else {
          roles.push("Vice President");
        }
      }
      
      if (u.is_admin) {
        roles.push("Transportation Management");
      }
      if (u.is_hr) {
        roles.push("HR");
      }
      if (u.is_head) {
        roles.push("Department Head");
      }
      if (u.role === "comptroller") {
        roles.push("Comptroller");
      }
      if (u.role === "faculty" || u.role === "staff") {
        roles.push(u.role === "faculty" ? "Faculty" : "Staff");
      }
      
      roleLabel = roles.length > 0 ? roles.join(", ") : u.role || "User";

      // Determine primary role code for routing
      // Priority: president > vp > admin > hr > comptroller > head > faculty/staff
      let primaryRole = u.role || "user";
      if (u.is_president || u.exec_type === "president") {
        primaryRole = "president";
      } else if (u.is_vp || u.exec_type?.startsWith("vp_") || u.exec_type?.startsWith("svp_")) {
        primaryRole = "vp";
      } else if (u.is_admin) {
        primaryRole = "admin";
      } else if (u.is_hr) {
        primaryRole = "hr";
      } else if (u.role === "comptroller") {
        primaryRole = "comptroller";
      } else if (u.is_head) {
        primaryRole = "head";
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        profile_picture: u.profile_picture,
        phone: u.phone_number,
        position: u.position_title || roleLabel,
        department: u.department?.name || null,
        department_id: u.department_id,
        role: primaryRole, // Use primary role code for routing
        roleLabel: roleLabel, // Display label for UI
        is_head: u.is_head || false,
        is_admin: u.is_admin || false,
        is_hr: u.is_hr || false,
        is_vp: u.is_vp || false,
        is_president: u.is_president || false,
      };
    });

    return NextResponse.json({
      ok: true,
      data: formattedUsers,
      count: formattedUsers.length
    });
  } catch (err: any) {
    console.error("[GET /api/users/all] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

