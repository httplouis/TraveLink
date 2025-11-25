// src/app/api/approvers/list/route.ts
/**
 * GET /api/approvers/list
 * Get list of available approvers for choice-based sending
 * Returns approvers by role (admin, comptroller, hr, vp, president)
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

    // Use direct createClient for service role to truly bypass RLS for queries
    // createServerClient with cookies might still apply RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
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

    // Get current user profile for context
    const { data: currentProfile } = await supabase
      .from("users")
      .select("id, role, is_admin, is_hr, is_vp, is_president, is_head")
      .eq("auth_user_id", user.id)
      .single();

    if (!currentProfile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role"); // 'admin', 'comptroller', 'hr', 'vp', 'president', 'head'

    let approvers: any[] = [];

    if (role === "admin" || !role) {
      // Get all admins (Ma'am TM, etc.)
      // Strategy 1: Query admins table and join with users - EXCLUDE super admins
      let { data: adminsFromTable, error: adminsTableError } = await supabase
        .from("admins")
        .select(`
          user_id,
          super_admin,
          users!inner (
            id, name, email, profile_picture, phone_number, position_title, department_id, role, is_admin, status
          )
        `)
        .or("super_admin.is.null,super_admin.eq.false"); // Only get regular admins, not super admins

      console.log("[GET /api/approvers/list] Admins table query:", {
        count: adminsFromTable?.length || 0,
        error: adminsTableError?.message,
        hasError: !!adminsTableError,
        sample: adminsFromTable?.[0]
      });

      let admins: any[] = [];

      // Extract users from admins table join - EXCLUDE super admins (only regular admins)
      if (adminsFromTable && adminsFromTable.length > 0) {
        admins = adminsFromTable
          .map((adminRow: any) => {
            // Handle both array and single object formats from Supabase join
            const user = Array.isArray(adminRow.users) 
              ? (adminRow.users.length > 0 ? adminRow.users[0] : null)
              : adminRow.users;
            
            if (!user) {
              console.log(`[GET /api/approvers/list] ⚠️ No user data for admin row:`, adminRow);
              return null;
            }
            
            // Double-check super_admin flag (should already be filtered, but just in case)
            const isSuperAdmin = adminRow.super_admin === true;
            if (isSuperAdmin) {
              console.log(`[GET /api/approvers/list] ⏭️ Skipping super admin: ${user.name}`);
              return null;
            }
            
            // Include active or null status
            if (user.status && user.status !== "active") {
              console.log(`[GET /api/approvers/list] ⏭️ Skipping inactive admin: ${user.name} (status: ${user.status})`);
              return null;
            }
            
            return {
              ...user,
              id: user.id || adminRow.user_id
            };
          })
          .filter((u: any) => u !== null);
        console.log("[GET /api/approvers/list] ✅ Found regular admins (excluding super admins) from admins table:", admins.length);
        if (admins.length > 0) {
          console.log("[GET /api/approvers/list] Admin names:", admins.map(a => a.name));
        }
      }

      // Strategy 2: If no admins from table, try users table directly
      let adminError: any = null; // Declare at higher scope
      if (admins.length === 0) {
        console.log("[GET /api/approvers/list] No admins from table, trying users table...");
        
        // First, get all admins from users table (including super admins)
        // Use service_role client (already using it) - should bypass RLS
        // Try querying with is_admin = true first (more reliable)
        let allUsersAdminsFinal: any[] = [];
        
        // Test query: Get ALL users first to verify RLS is bypassed
        const { data: testUsers, error: testError } = await supabase
          .from("users")
          .select("id, name, role, is_admin, status")
          .limit(10);
        
        console.log("[GET /api/approvers/list] 🔍 Test query (all users, limit 10):", {
          count: testUsers?.length || 0,
          error: testError?.message,
          errorCode: testError?.code,
          errorDetails: testError?.details,
          hasAdmins: testUsers?.some((u: any) => u.is_admin || u.role === 'admin'),
          sampleUsers: testUsers?.slice(0, 3).map((u: any) => ({ name: u.name, role: u.role, is_admin: u.is_admin }))
        });
        
        // Also test direct admin query
        const { data: directAdmins, error: directError } = await supabase
          .from("users")
          .select("id, name, email, role, is_admin, status")
          .eq("is_admin", true)
          .limit(10);
        
        console.log("[GET /api/approvers/list] 🔍 Direct admin query (is_admin=true):", {
          count: directAdmins?.length || 0,
          error: directError?.message,
          errorCode: directError?.code,
          names: directAdmins?.map((a: any) => a.name)
        });
        
        // Strategy A: Query by is_admin flag (with limit to reduce IO)
        const { data: adminsByFlag, error: flagError } = await supabase
          .from("users")
          .select("id, name, email, profile_picture, phone_number, position_title, department_id, role, is_admin, status")
          .eq("is_admin", true)
          .limit(50); // Limit to reduce IO on Nano instance
        
        console.log("[GET /api/approvers/list] Strategy A (is_admin=true):", {
          count: adminsByFlag?.length || 0,
          error: flagError?.message,
          sample: adminsByFlag?.[0]?.name
        });
        
        if (!flagError && adminsByFlag && adminsByFlag.length > 0) {
          allUsersAdminsFinal = adminsByFlag;
          console.log("[GET /api/approvers/list] ✅ Using Strategy A - Found admins by is_admin flag:", adminsByFlag.length);
        } else {
          // Strategy B: Query by role
          const { data: adminsByRole, error: roleError } = await supabase
            .from("users")
            .select("id, name, email, profile_picture, phone_number, position_title, department_id, role, is_admin, status")
            .eq("role", "admin");
          
          console.log("[GET /api/approvers/list] Strategy B (role=admin):", {
            count: adminsByRole?.length || 0,
            error: roleError?.message,
            sample: adminsByRole?.[0]?.name
          });
          
          if (!roleError && adminsByRole && adminsByRole.length > 0) {
            allUsersAdminsFinal = adminsByRole;
            console.log("[GET /api/approvers/list] ✅ Using Strategy B - Found admins by role:", adminsByRole.length);
          } else {
            // Strategy C: Try OR query as fallback
            const { data: adminsByOr, error: orError } = await supabase
              .from("users")
              .select("id, name, email, profile_picture, phone_number, position_title, department_id, role, is_admin, status")
              .or("role.eq.admin,is_admin.eq.true");
            
            console.log("[GET /api/approvers/list] Strategy C (OR query):", {
              count: adminsByOr?.length || 0,
              error: orError?.message,
              sample: adminsByOr?.[0]?.name
            });
            
            if (!orError && adminsByOr) {
              allUsersAdminsFinal = adminsByOr;
              console.log("[GET /api/approvers/list] ✅ Using Strategy C - Found admins by OR query:", adminsByOr.length);
            } else {
              console.error("[GET /api/approvers/list] ❌ All admin queries failed:", { 
                flagError: flagError?.message, 
                roleError: roleError?.message, 
                orError: orError?.message 
              });
            }
          }
        }
        
        // Filter by active status if needed
        if (allUsersAdminsFinal.length > 0) {
          allUsersAdminsFinal = allUsersAdminsFinal.filter((a: any) => !a.status || a.status === "active");
          console.log("[GET /api/approvers/list] After filtering by active status:", allUsersAdminsFinal.length);
        }
        
        console.log("[GET /api/approvers/list] All users with admin role:", {
          count: allUsersAdminsFinal?.length || 0,
          names: allUsersAdminsFinal?.map((u: any) => u.name)
        });
        
        if (allUsersAdminsFinal && allUsersAdminsFinal.length > 0) {
          // Get super admin IDs from admins table to exclude them
          const adminIds = allUsersAdminsFinal.map((a: any) => a.id);
          const { data: adminsCheck, error: adminsCheckError } = await supabase
            .from("admins")
            .select("user_id, super_admin")
            .in("user_id", adminIds);
          
          if (adminsCheckError) {
            console.error("[GET /api/approvers/list] Error checking admins table:", adminsCheckError);
            adminError = adminsCheckError;
          }
          
          // Create set of super admin IDs
          const superAdminIds = new Set(
            (adminsCheck || [])
              .filter(a => a.super_admin === true)
              .map(a => a.user_id)
          );
          
          console.log("[GET /api/approvers/list] Super admin IDs to exclude:", Array.from(superAdminIds));
          
          // Filter out super admins and inactive users
          admins = allUsersAdminsFinal.filter((a: any) => {
            const isSuperAdmin = superAdminIds.has(a.id);
            const isActive = !a.status || a.status === "active";
            
            if (isSuperAdmin) {
              console.log(`[GET /api/approvers/list] ⏭️ Excluding super admin: ${a.name}`);
              return false;
            }
            if (!isActive) {
              console.log(`[GET /api/approvers/list] ⏭️ Excluding inactive admin: ${a.name} (status: ${a.status})`);
              return false;
            }
            return true;
          });
          
          console.log("[GET /api/approvers/list] ✅ Found regular admins from users table (excluding super admins):", admins.length);
          if (admins.length > 0) {
            console.log("[GET /api/approvers/list] Regular admin names:", admins.map(a => a.name));
          }
        }
      }

      if (admins && admins.length > 0) {
        // Fetch department info for admins
        const departmentIds = [...new Set(admins.map(a => a.department_id).filter(Boolean))];
        let deptMap = new Map();
        
        if (departmentIds.length > 0) {
          const { data: departments } = await supabase
            .from("departments")
            .select("id, name, code")
            .in("id", departmentIds);
          
          if (departments) {
            deptMap = new Map(departments.map(d => [d.id, d]));
          }
        }

        approvers.push(...admins.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email,
          profile_picture: a.profile_picture,
          phone: a.phone_number,
          position: a.position_title || "Administrator",
          department: a.department_id ? deptMap.get(a.department_id)?.name : null,
          role: "admin",
          roleLabel: "Administrator"
        })));
        
        console.log(`[GET /api/approvers/list] ✅ Found ${admins.length} admin(s):`, admins.map(a => a.name));
      } else {
        console.warn("[GET /api/approvers/list] ⚠️ No admins found in database after all attempts");
        if (adminError) {
          console.error("[GET /api/approvers/list] Error details:", adminError);
        }
      }
    }

    if (role === "comptroller" || !role) {
      // Get comptroller
      const { data: comptrollers } = await supabase
        .from("users")
        .select("id, name, email, profile_picture, phone_number, position_title, department_id, role")
        .eq("role", "comptroller")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (comptrollers) {
        approvers.push(...comptrollers.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          profile_picture: c.profile_picture,
          phone: c.phone_number,
          position: c.position_title || "Comptroller",
          department: null,
          role: "comptroller",
          roleLabel: "Comptroller"
        })));
      }
    }

    if (role === "hr" || !role) {
      // Get HR staff
      const { data: hrStaff } = await supabase
        .from("users")
        .select("id, name, email, profile_picture, phone_number, position_title, department_id, role, is_hr")
        .or("role.eq.hr,is_hr.eq.true")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (hrStaff) {
        approvers.push(...hrStaff.map(h => ({
          id: h.id,
          name: h.name,
          email: h.email,
          profile_picture: h.profile_picture,
          phone: h.phone_number,
          position: h.position_title || "HR Staff",
          department: null,
          role: "hr",
          roleLabel: "Human Resources"
        })));
      }
    }

    if (role === "vp" || !role) {
      // Get all VPs (SVP, VP Admin, VP External, VP Finance, etc.)
      // VPs have exec_type like "svp_academics", "vp_admin", "vp_external", "vp_finance", or just "vp"
      const { data: vps } = await supabase
        .from("users")
        .select("id, name, email, profile_picture, phone_number, position_title, department_id, role, is_vp, exec_type")
        .or("role.eq.exec,is_vp.eq.true")
        .eq("status", "active")
        .order("name", { ascending: true });
      
      // Filter to only include VPs with specific exec_type (exclude President and generic "vp")
      // Only show VPs with exec_type like: vp_admin, vp_finance, vp_external, svp_academics
      // Exclude generic "vp" exec_type (those are duplicates)
      const filteredVps = (vps || []).filter((vp: any) => {
        // Exclude President
        if (vp.exec_type === 'president') {
          return false;
        }
        
        // Only include VPs with specific exec_type (not just "vp")
        // Valid exec_types: vp_admin, vp_finance, vp_external, svp_academics
        if (vp.exec_type && vp.exec_type !== 'vp') {
          return vp.exec_type.startsWith('vp_') || vp.exec_type.startsWith('svp_');
        }
        
        // If no exec_type or just "vp", exclude (these are duplicates)
        return false;
      });

      if (filteredVps && filteredVps.length > 0) {
        // Fetch department info for VPs
        const vpDepartmentIds = [...new Set(filteredVps.map(v => v.department_id).filter(Boolean))];
        let vpDeptMap = new Map();
        
        if (vpDepartmentIds.length > 0) {
          const { data: vpDepartments } = await supabase
            .from("departments")
            .select("id, name, code")
            .in("id", vpDepartmentIds);
          
          if (vpDepartments) {
            vpDeptMap = new Map(vpDepartments.map(d => [d.id, d]));
          }
        }
        
        approvers.push(...filteredVps.map((v: any) => {
          // Determine role label based on exec_type
          let roleLabel = "Vice President";
          if (v.exec_type === "svp_academics") {
            roleLabel = "Senior Vice President (Academics)";
          } else if (v.exec_type === "vp_admin") {
            roleLabel = "Vice President (Administration)";
          } else if (v.exec_type === "vp_external") {
            roleLabel = "Vice President (External Relations)";
          } else if (v.exec_type === "vp_finance") {
            roleLabel = "Vice President (Finance)";
          }
          
          return {
            id: v.id,
            name: v.name,
            email: v.email,
            profile_picture: v.profile_picture,
            phone: v.phone_number,
            position: v.position_title || "Vice President",
            department: v.department_id ? vpDeptMap.get(v.department_id)?.name : null,
            department_id: v.department_id, // Include department_id for filtering
            role: "vp",
            roleLabel: roleLabel
          };
        }));
        
        console.log(`[GET /api/approvers/list] ✅ Found ${filteredVps.length} VP(s):`, filteredVps.map((v: any) => v.name));
      }
    }

    if (role === "president" || !role) {
      // Get President/COO
      const { data: presidents } = await supabase
        .from("users")
        .select("id, name, email, profile_picture, phone_number, position_title, department_id, role, is_president, exec_type")
        .or("role.eq.exec,is_president.eq.true")
        .eq("exec_type", "president")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (presidents) {
        approvers.push(...presidents.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          profile_picture: p.profile_picture,
          phone: p.phone_number,
          position: p.position_title || "President/COO",
          department: null,
          role: "president",
          roleLabel: "President / COO"
        })));
      }
    }

    if (role === "head" || !role) {
      // Get parent department heads (for office hierarchy)
      // Try with status filter first
      let { data: heads, error: headError } = await supabase
        .from("users")
        .select("id, name, email, profile_picture, phone_number, position_title, department_id, role, is_head, status")
        .or("role.eq.head,is_head.eq.true")
        .eq("status", "active")
        .order("name", { ascending: true });

      // If no results with status filter, try without status filter
      if ((!heads || heads.length === 0) && headError) {
        console.log("[GET /api/approvers/list] No heads with status filter, trying without...");
        const { data: allHeads } = await supabase
          .from("users")
          .select("id, name, email, profile_picture, phone_number, position_title, department_id, role, is_head, status")
          .or("role.eq.head,is_head.eq.true")
          .order("name", { ascending: true });
        
        heads = allHeads;
        headError = null;
      }

      if (heads && heads.length > 0) {
        // Fetch department info for heads
        const departmentIds = [...new Set(heads.map(h => h.department_id).filter(Boolean))];
        let deptMap = new Map();
        
        if (departmentIds.length > 0) {
          const { data: departments } = await supabase
            .from("departments")
            .select("id, name, code")
            .in("id", departmentIds);

          if (departments) {
            deptMap = new Map(departments.map(d => [d.id, d]));
          }
        }

        approvers.push(...heads.map(h => ({
          id: h.id,
          name: h.name,
          email: h.email,
          profile_picture: h.profile_picture,
          phone: h.phone_number,
          position: h.position_title || "Department Head",
          department: h.department_id ? deptMap.get(h.department_id)?.name : null,
          department_id: h.department_id, // Include department_id for filtering
          role: "head",
          roleLabel: "Department Head"
        })));
        
        console.log(`[GET /api/approvers/list] Found ${heads.length} head(s)`);
      } else {
        console.log("[GET /api/approvers/list] No heads found in database");
      }
    }

    // Remove duplicates (in case user has multiple roles)
    const uniqueApprovers = approvers.filter((a, index, self) =>
      index === self.findIndex(b => b.id === a.id)
    );

    return NextResponse.json({
      ok: true,
      data: uniqueApprovers,
      count: uniqueApprovers.length
    });
  } catch (err: any) {
    console.error("[GET /api/approvers/list] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

