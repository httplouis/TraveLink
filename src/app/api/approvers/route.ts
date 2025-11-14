import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/approvers?role=head&department_id=xxx
 * Fetch available approvers for a specific role
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const { searchParams } = new URL(req.url);
    
    const role = searchParams.get("role");
    const departmentId = searchParams.get("department_id");
    const requestId = searchParams.get("request_id"); // For context (e.g., requester info)

    if (!role) {
      return NextResponse.json({ ok: false, error: "Role parameter required" }, { status: 400 });
    }

    let approvers: any[] = [];

    switch (role) {
      case "head":
        // Fetch department heads (can be parent department head if needed)
        if (departmentId) {
          // Get parent department if exists
          const { data: dept } = await supabase
            .from("departments")
            .select("id, name, code, parent_department_id")
            .eq("id", departmentId)
            .single();

          if (dept?.parent_department_id) {
            // Get parent department head
            const { data: parentHeads } = await supabase
              .from("users")
              .select(`
                id, name, email, profile_picture, phone_number, position_title,
                department:departments!users_department_id_fkey(id, name, code)
              `)
              .eq("department_id", dept.parent_department_id)
              .eq("is_head", true)
              .eq("status", "active");

            approvers = (parentHeads || []).map((h: any) => ({
              id: h.id,
              name: h.name,
              email: h.email,
              phone: h.phone_number,
              profile_picture: h.profile_picture,
              position: h.position_title || "Department Head",
              department: h.department?.name,
              role: "head",
              roleLabel: "Department Head"
            }));
          } else {
            // Get current department head
            const { data: heads } = await supabase
              .from("users")
              .select(`
                id, name, email, profile_picture, phone_number, position_title,
                department:departments!users_department_id_fkey(id, name, code)
              `)
              .eq("department_id", departmentId)
              .eq("is_head", true)
              .eq("status", "active");

            approvers = (heads || []).map((h: any) => ({
              id: h.id,
              name: h.name,
              email: h.email,
              phone: h.phone_number,
              profile_picture: h.profile_picture,
              position: h.position_title || "Department Head",
              department: h.department?.name,
              role: "head",
              roleLabel: "Department Head"
            }));
          }
        }
        break;

      case "admin":
        // Fetch all admins - use role column only since is_admin column doesn't exist
        let allAdmins: any[] = [];
        
        // Strategy 1: Query by role column (primary method)
        const { data: adminsByRole, error: adminRoleError } = await supabase
          .from("users")
          .select(`id, name, email, profile_picture, phone_number, position_title, role, status`)
          .eq("role", "admin");

        if (!adminRoleError && adminsByRole) {
          allAdmins = adminsByRole;
          console.log(`[GET /api/approvers] Found ${allAdmins.length} admins via role query`);
        } else {
          console.error(`[GET /api/approvers] Role query error:`, adminRoleError);
          
          // Strategy 2: Fallback - get all users and filter in code
          console.log(`[GET /api/approvers] Trying to fetch all users and filter...`);
          const { data: allUsers, error: allUsersError } = await supabase
            .from("users")
            .select(`id, name, email, profile_picture, phone_number, position_title, role, status`)
            .limit(100);
          
          if (!allUsersError && allUsers) {
            allAdmins = allUsers.filter((u: any) => u.role === 'admin');
            console.log(`[GET /api/approvers] Filtered ${allAdmins.length} admins from all users`);
          }
        }

        // Don't filter by status - include all admins
        approvers = allAdmins.map((a: any) => ({
          id: a.id,
          name: a.name || a.email || "Unknown",
          email: a.email,
          phone: a.phone_number,
          profile_picture: a.profile_picture,
          position: a.position_title || "Administrator",
          role: "admin",
          roleLabel: "Administrator"
        }));

        console.log(`[GET /api/approvers] Final admin count: ${approvers.length}`);
        if (approvers.length > 0) {
          console.log(`[GET /api/approvers] Sample admin:`, approvers[0]);
        } else {
          console.warn(`[GET /api/approvers] No admins found. Make sure you have users with role='admin' in the database.`);
        }
        break;

      case "comptroller":
        // Fetch comptroller - use role column primarily
        let allComptrollers: any[] = [];
        
        // Try by role first (most reliable)
        const { data: comptrollersByRole, error: comptrollerRoleError } = await supabase
          .from("users")
          .select(`id, name, email, profile_picture, phone_number, position_title, role, status`)
          .eq("role", "comptroller");

        if (!comptrollerRoleError && comptrollersByRole) {
          allComptrollers = comptrollersByRole;
        } else {
          // Try by flag if role query fails
          const { data: comptrollersByFlag, error: flagError } = await supabase
            .from("users")
            .select(`id, name, email, profile_picture, phone_number, position_title, role, status`)
            .eq("is_comptroller", true);
          
          if (!flagError && comptrollersByFlag) {
            allComptrollers = comptrollersByFlag;
          }
        }

        approvers = allComptrollers
          .filter((c: any) => !c.status || c.status === "active" || c.status === null)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone_number,
            profile_picture: c.profile_picture,
            position: c.position_title || "Comptroller",
            role: "comptroller",
            roleLabel: "Comptroller"
          }));
        break;

      case "vp":
        // Fetch all VPs - check both is_vp flag and role column
        const { data: vps, error: vpError } = await supabase
          .from("users")
          .select(`
            id, name, email, profile_picture, phone_number, position_title, role, is_vp, status
          `)
          .or("is_vp.eq.true,role.eq.vp");

        if (vpError) {
          console.error("[GET /api/approvers] VP fetch error:", vpError);
        }

        // Filter active users only
        approvers = (vps || [])
          .filter((vp: any) => !vp.status || vp.status === "active")
          .map((vp: any) => ({
            id: vp.id,
            name: vp.name,
            email: vp.email,
            phone: vp.phone_number,
            profile_picture: vp.profile_picture,
            position: vp.position_title || "Vice President",
            role: "vp",
            roleLabel: vp.position_title || "Vice President"
          }));
        break;

      case "president":
        // Fetch president - use role column primarily
        let allPresidents: any[] = [];
        
        // Try by role first (most reliable) - using unique variable name to avoid conflicts
        const { data: presidentsByRole, error: presidentRoleError } = await supabase
          .from("users")
          .select(`id, name, email, profile_picture, phone_number, position_title, role, status`)
          .eq("role", "president");

        if (!presidentRoleError && presidentsByRole) {
          allPresidents = presidentsByRole;
        } else {
          // Try by flag if role query fails
          const { data: presidentsByFlag, error: flagError } = await supabase
            .from("users")
            .select(`id, name, email, profile_picture, phone_number, position_title, role, status`)
            .eq("is_president", true);
          
          if (!flagError && presidentsByFlag) {
            allPresidents = presidentsByFlag;
          }
        }

        approvers = allPresidents
          .filter((p: any) => !p.status || p.status === "active" || p.status === null)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            phone: p.phone_number,
            profile_picture: p.profile_picture,
            position: p.position_title || "President",
            role: "president",
            roleLabel: "President"
          }));
        break;

      default:
        return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
    }

    console.log(`[GET /api/approvers] Role: ${role}, Found: ${approvers.length} approvers`);
    
    // Log sample approver for debugging
    if (approvers.length > 0) {
      console.log(`[GET /api/approvers] Sample approver:`, approvers[0]);
    } else {
      console.warn(`[GET /api/approvers] No approvers found for role: ${role}`);
    }

    return NextResponse.json({ ok: true, data: approvers });
  } catch (err: any) {
    console.error("[GET /api/approvers] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

