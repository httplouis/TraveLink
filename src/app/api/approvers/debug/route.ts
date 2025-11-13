import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/approvers/debug
 * Debug endpoint to check what users exist in the database
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    // Get all users with their role information (don't select is_admin if it doesn't exist)
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select(`
        id, name, email, role, is_head, is_vp, is_comptroller, is_president, 
        is_hr, status, position_title
      `)
      .limit(50);

    // Get admins specifically - only use role column since is_admin doesn't exist
    const { data: adminsByRole, error: roleError } = await supabase
      .from("users")
      .select(`id, name, email, role, status`)
      .eq("role", "admin");
    
    // Try is_admin flag only if column exists (will fail gracefully)
    let adminsByFlag: any = null;
    let flagError: any = null;
    try {
      const result = await supabase
        .from("users")
        .select(`id, name, email, role, status`)
        .eq("is_admin", true);
      adminsByFlag = result.data;
      flagError = result.error;
    } catch (e) {
      flagError = { message: "Column is_admin does not exist" };
    }

    // Get VPs
    const { data: vpsByFlag, error: vpFlagError } = await supabase
      .from("users")
      .select(`id, name, email, role, is_vp, status`)
      .eq("is_vp", true);

    const { data: vpsByRole, error: vpRoleError } = await supabase
      .from("users")
      .select(`id, name, email, role, is_vp, status`)
      .eq("role", "vp");

    return NextResponse.json({
      ok: true,
      debug: {
        totalUsers: allUsers?.length || 0,
        allUsersError: allUsersError?.message,
        sampleUsers: allUsers?.slice(0, 5) || [],
        
        admins: {
          byFlag: {
            count: adminsByFlag?.length || 0,
            error: flagError?.message || null,
            users: adminsByFlag || []
          },
          byRole: {
            count: adminsByRole?.length || 0,
            error: roleError?.message || null,
            users: adminsByRole || []
          }
        },
        
        vps: {
          byFlag: {
            count: vpsByFlag?.length || 0,
            error: vpFlagError?.message,
            users: vpsByFlag || []
          },
          byRole: {
            count: vpsByRole?.length || 0,
            error: vpRoleError?.message,
            users: vpsByRole || []
          }
        }
      }
    });
  } catch (err: any) {
    console.error("[GET /api/approvers/debug] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

