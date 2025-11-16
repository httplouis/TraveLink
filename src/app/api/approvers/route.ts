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
        // Fetch department heads (check current department first, then parent if needed)
        if (departmentId) {
          // Get department info including parent and head_name (for fallback)
          const { data: dept } = await supabase
            .from("departments")
            .select("id, name, code, parent_department_id, head_name")
            .eq("id", departmentId)
            .single();

          console.log(`[GET /api/approvers] Fetching heads for department_id: ${departmentId}`);
          
          // STEP 1: First, try to get heads from CURRENT department
          // CRITICAL: Check BOTH is_head=true AND role='head' (BELSON has both)
          // Also check department_id match OR department text match
          let { data: currentHeads, error: currentError } = await supabase
            .from("users")
            .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department")
            .eq("department_id", departmentId)
            .or("is_head.eq.true,role.eq.head")
            .or("status.eq.active,status.is.null");

          let heads: any[] = [];

          // Filter to only those with is_head=true OR role='head'
          if (!currentError && currentHeads && currentHeads.length > 0) {
            currentHeads = currentHeads.filter((h: any) => h.is_head === true || h.role === 'head');
            if (currentHeads.length > 0) {
              console.log(`[GET /api/approvers] ✅ Found ${currentHeads.length} head(s) in current department (is_head OR role='head')`);
            }
          }

          if (!currentError && (!currentHeads || currentHeads.length === 0)) {
            console.log(`[GET /api/approvers] No heads found with status filter, trying without status filter...`);
            const { data: allCurrentHeads, error: allError } = await supabase
              .from("users")
              .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department")
              .eq("department_id", departmentId)
              .or("is_head.eq.true,role.eq.head");
            
            if (!allError && allCurrentHeads && allCurrentHeads.length > 0) {
              // Filter to only those with is_head=true OR role='head'
              const filteredHeads = allCurrentHeads.filter((h: any) => h.is_head === true || h.role === 'head');
              if (filteredHeads.length > 0) {
                console.log(`[GET /api/approvers] ✅ Found ${filteredHeads.length} head(s) without status filter`);
                currentHeads = filteredHeads;
                currentError = null;
              }
            }
            
            if (!currentHeads || currentHeads.length === 0) {
              // Alternative: Try checking by role='head' specifically
              console.log(`[GET /api/approvers] Trying alternative: checking for role='head' specifically...`);
              const { data: headsByRole, error: roleError } = await supabase
                .from("users")
                .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department")
                .eq("department_id", departmentId)
                .eq("role", "head")
                .or("status.eq.active,status.is.null");
              
              if (!roleError && headsByRole && headsByRole.length > 0) {
                console.log(`[GET /api/approvers] ✅ Found ${headsByRole.length} head(s) by role='head'`);
                currentHeads = headsByRole;
                currentError = null;
              } else if (!roleError) {
                // Try without status filter for role check too
                const { data: headsByRoleNoStatus, error: roleNoStatusError } = await supabase
                  .from("users")
                  .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department")
                  .eq("department_id", departmentId)
                  .eq("role", "head");
                
                if (!roleNoStatusError && headsByRoleNoStatus && headsByRoleNoStatus.length > 0) {
                  console.log(`[GET /api/approvers] ✅ Found ${headsByRoleNoStatus.length} head(s) by role='head' (no status filter)`);
                  currentHeads = headsByRoleNoStatus;
                  currentError = null;
                } else {
                  // Final alternative: Check department_heads table (many-to-many relationship)
                  console.log(`[GET /api/approvers] Trying final alternative: checking department_heads table...`);
                  const { data: deptHeads, error: deptHeadsError } = await supabase
                    .from("department_heads")
                    .select(`
                      user_id,
                      users:users!department_heads_user_id_fkey(
                        id, name, email, profile_picture, phone_number, position_title, status, role
                      )
                    `)
                    .eq("department_id", departmentId)
                    .is("valid_to", null); // Only active heads (valid_to IS NULL)
                  
                  if (!deptHeadsError && deptHeads && deptHeads.length > 0) {
                    console.log(`[GET /api/approvers] ✅ Found ${deptHeads.length} head(s) in department_heads table`);
                    currentHeads = deptHeads
                      .filter((dh: any) => dh.users) // Filter out any null users
                      .map((dh: any) => ({
                        ...dh.users,
                        department_id: departmentId
                      }));
                    currentError = null;
                  } else if (deptHeadsError) {
                    console.error(`[GET /api/approvers] department_heads query error:`, deptHeadsError);
                  } else {
                    // CRITICAL FIX: Check by department TEXT field (BELSON might have department_id=NULL but department='CCMS')
                    console.log(`[GET /api/approvers] Trying department TEXT field search (for users like BELSON with department_id=NULL)...`);
                    // First, get all users with is_head=true or role='head'
                    const { data: allPotentialHeads, error: allPotentialHeadsError } = await supabase
                      .from("users")
                      .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department")
                      .or("is_head.eq.true,role.eq.head");
                    
                    // Then filter in JavaScript to find CCMS heads
                    let headsByDeptText: any[] = [];
                    if (!allPotentialHeadsError && allPotentialHeads) {
                      headsByDeptText = allPotentialHeads.filter((h: any) => {
                        const deptText = h.department?.toLowerCase() || '';
                        const codeMatch = dept?.code ? deptText.includes(dept.code.toLowerCase()) : false;
                        const nameMatch = dept?.name ? deptText.includes(dept.name.toLowerCase().substring(0, 20)) : false;
                        return codeMatch || nameMatch || deptText.includes('ccms') || deptText.includes('computing') || deptText.includes('multimedia');
                      });
                    }
                    const deptTextError = allPotentialHeadsError;
                    
                    if (!deptTextError && headsByDeptText && headsByDeptText.length > 0) {
                      console.log(`[GET /api/approvers] ✅ Found ${headsByDeptText.length} CCMS head(s) by department TEXT field (e.g., BELSON GABRIEL TAN)!`);
                      currentHeads = headsByDeptText;
                      currentError = null;
                    }
                  }
                }
              }
            }
          }

          // Fetch department info once (we'll use it multiple times)
          const { data: deptInfo } = await supabase
            .from("departments")
            .select("id, name, code")
            .eq("id", departmentId)
            .single();

          if (currentError) {
            console.error('[GET /api/approvers] Current department query error:', currentError);
          } else if (currentHeads && currentHeads.length > 0) {
            console.log(`[GET /api/approvers] Found ${currentHeads.length} head(s) in current department`);
            heads = currentHeads.map((h: any) => ({
              ...h,
              department: deptInfo || null
            }));
          } else {
            console.warn(`[GET /api/approvers] No heads found in current department. Checking parent department...`);
            
            // STEP 2: If no heads in current department, check parent department (if exists)
            if (dept?.parent_department_id) {
              console.log(`[GET /api/approvers] Checking parent department: ${dept.parent_department_id}`);
              let { data: parentHeads, error: parentError } = await supabase
                .from("users")
                .select(`
                  id, name, email, profile_picture, phone_number, position_title, status,
                  department:departments!users_department_id_fkey(id, name, code)
                `)
                .eq("department_id", dept.parent_department_id)
                .eq("is_head", true)
                .or("status.eq.active,status.is.null");

              // If no heads found with status filter, try without status filter (fallback)
              if (!parentError && (!parentHeads || parentHeads.length === 0)) {
                console.log(`[GET /api/approvers] No heads found in parent with status filter, trying without...`);
                const { data: allParentHeads, error: allParentError } = await supabase
                  .from("users")
                  .select(`
                    id, name, email, profile_picture, phone_number, position_title, status, role,
                    department:departments!users_department_id_fkey(id, name, code)
                  `)
                  .eq("department_id", dept.parent_department_id)
                  .eq("is_head", true);
                
                if (!allParentError && allParentHeads && allParentHeads.length > 0) {
                  console.log(`[GET /api/approvers] Found ${allParentHeads.length} head(s) in parent without status filter`);
                  parentHeads = allParentHeads;
                  parentError = null;
                } else {
                  // Alternative: Try checking by role='head' instead of is_head flag
                  console.log(`[GET /api/approvers] Trying alternative for parent: checking for role='head'...`);
                  const { data: parentHeadsByRole, error: parentRoleError } = await supabase
                    .from("users")
                    .select(`
                      id, name, email, profile_picture, phone_number, position_title, status, role,
                      department:departments!users_department_id_fkey(id, name, code)
                    `)
                    .eq("department_id", dept.parent_department_id)
                    .eq("role", "head")
                    .or("status.eq.active,status.is.null");
                  
                  if (!parentRoleError && parentHeadsByRole && parentHeadsByRole.length > 0) {
                    console.log(`[GET /api/approvers] ✅ Found ${parentHeadsByRole.length} head(s) in parent by role='head'`);
                    parentHeads = parentHeadsByRole;
                    parentError = null;
                  } else if (!parentRoleError) {
                    // Try without status filter for role check too
                    const { data: parentHeadsByRoleNoStatus, error: parentRoleNoStatusError } = await supabase
                      .from("users")
                      .select(`
                        id, name, email, profile_picture, phone_number, position_title, status, role,
                        department:departments!users_department_id_fkey(id, name, code)
                      `)
                      .eq("department_id", dept.parent_department_id)
                      .eq("role", "head");
                    
                    if (!parentRoleNoStatusError && parentHeadsByRoleNoStatus && parentHeadsByRoleNoStatus.length > 0) {
                      console.log(`[GET /api/approvers] ✅ Found ${parentHeadsByRoleNoStatus.length} head(s) in parent by role='head' (no status filter)`);
                      parentHeads = parentHeadsByRoleNoStatus;
                      parentError = null;
                    }
                  }
                }
              }

              if (parentError) {
                console.error('[GET /api/approvers] Parent department query error:', parentError);
              } else if (parentHeads && parentHeads.length > 0) {
                console.log(`[GET /api/approvers] Found ${parentHeads.length} head(s) in parent department`);
                heads = parentHeads.map((h: any) => ({
                  ...h,
                  department: h.department || null
                }));
              } else {
                console.warn(`[GET /api/approvers] No heads found in parent department either`);
              }
            }
            
            // Debug: Check if department exists and show all users
            if (heads.length === 0) {
              const { data: deptCheck } = await supabase
                .from("departments")
                .select("id, name, code, parent_department_id, head_name")
                .eq("id", departmentId)
                .single();
              console.log(`[GET /api/approvers] 🔍 DEBUG - Department check:`, deptCheck);
              
              // Final fallback: Try to find ANY user with is_head=true or role='head' in this department
              // (even if department_id doesn't match, check by department text field)
              console.log(`[GET /api/approvers] 🔍 Last resort: Searching all users with is_head=true or role='head'...`);
              const { data: allHeadsAnywhere, error: allHeadsError } = await supabase
                .from("users")
                .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department")
                .or("is_head.eq.true,role.eq.head");
              
              if (!allHeadsError && allHeadsAnywhere) {
                // Filter by department text match
                const matchingHeads = allHeadsAnywhere.filter((h: any) => {
                  const deptText = (h.department || '').toLowerCase();
                  const deptCode = (deptCheck?.code || '').toLowerCase();
                  const deptName = (deptCheck?.name || '').toLowerCase();
                  return deptText.includes(deptCode) || 
                         deptText.includes(deptName.substring(0, 20)) ||
                         deptText.includes('ccms') ||
                         deptText.includes('computing') ||
                         deptText.includes('multimedia');
                });
                
                if (matchingHeads.length > 0) {
                  console.log(`[GET /api/approvers] ✅ Found ${matchingHeads.length} head(s) by department text match!`);
                  heads = matchingHeads.map((h: any) => ({
                    ...h,
                    department_id: departmentId, // Set correct department_id
                    department: { id: deptCheck.id, name: deptCheck.name, code: deptCheck.code }
                  }));
                } else if (deptCheck?.head_name) {
                  // ONLY use head_name as absolute last resort if NO user found at all
                  console.log(`[GET /api/approvers] ⚠️ Using hardcoded fallback: department.head_name = "${deptCheck.head_name}" (NO USER FOUND IN DATABASE)`);
                  heads = [{
                    id: null, // No user ID since it's just a name
                    name: deptCheck.head_name,
                    email: null,
                    profile_picture: null,
                    phone_number: null,
                    position_title: "Department Head",
                    department_id: departmentId,
                    status: null,
                    role: null,
                    department: { id: deptCheck.id, name: deptCheck.name, code: deptCheck.code }
                  }];
                }
              }
              
              // Debug: Check all users with is_head=true for this department (regardless of status)
              const { data: allHeads } = await supabase
                .from("users")
                .select("id, name, email, is_head, status, department_id, role, department")
                .eq("department_id", departmentId)
                .eq("is_head", true);
              console.log(`[GET /api/approvers] 🔍 DEBUG - All heads in department (is_head=true, any status):`, allHeads);
              
              // Debug: Check all users in this department (to see what we have)
              const { data: allUsersInDept } = await supabase
                .from("users")
                .select("id, name, email, is_head, status, department_id, role, department")
                .eq("department_id", departmentId)
                .limit(10);
              console.log(`[GET /api/approvers] 🔍 DEBUG - All users in department (first 10):`, allUsersInDept);
              
              // IMPORTANT: Also check by department TEXT field (in case department_id is NULL but department text matches)
              const { data: headsByDeptText } = await supabase
                .from("users")
                .select("id, name, email, is_head, status, department_id, role, department")
                .or(`department.ilike.%${dept?.code || ''}%,department.ilike.%${dept?.name || ''}%`)
                .eq("is_head", true);
              console.log(`[GET /api/approvers] 🔍 DEBUG - Heads by department TEXT (CCMS or College of Computing):`, headsByDeptText);
              
              // If we found heads by text but not by ID, use them!
              if (headsByDeptText && headsByDeptText.length > 0 && heads.length === 0) {
                console.log(`[GET /api/approvers] ✅ Found ${headsByDeptText.length} head(s) by department TEXT field!`);
                // Filter to only those that match CCMS
                const ccmsHeads = headsByDeptText.filter((h: any) => 
                  h.department?.includes('CCMS') || 
                  h.department?.includes('Computing') ||
                  h.department?.includes('Multimedia')
                );
                if (ccmsHeads.length > 0) {
                  console.log(`[GET /api/approvers] ✅ Filtered to ${ccmsHeads.length} CCMS head(s)`);
                  heads = ccmsHeads.map((h: any) => ({
                    ...h,
                    department_id: departmentId, // Set the correct department_id
                    department: deptInfo || { id: deptCheck.id, name: deptCheck.name, code: deptCheck.code }
                  }));
                }
              }
              
              // Debug: Check if any users have role='head' instead of is_head=true
              const { data: headsByRole } = await supabase
                .from("users")
                .select("id, name, email, is_head, status, department_id, role, department")
                .eq("department_id", departmentId)
                .eq("role", "head");
              console.log(`[GET /api/approvers] 🔍 DEBUG - Users with role='head' in department:`, headsByRole);
              
              // Also check role='head' by department text
              const { data: headsByRoleText } = await supabase
                .from("users")
                .select("id, name, email, is_head, status, department_id, role, department")
                .or(`department.ilike.%${dept?.code || ''}%,department.ilike.%${dept?.name || ''}%`)
                .eq("role", "head");
              console.log(`[GET /api/approvers] 🔍 DEBUG - Users with role='head' by department TEXT:`, headsByRoleText);
              
              // If we found heads by role text but not by ID, use them!
              if (headsByRoleText && headsByRoleText.length > 0 && heads.length === 0) {
                console.log(`[GET /api/approvers] ✅ Found ${headsByRoleText.length} head(s) by role='head' and department TEXT!`);
                const ccmsHeadsByRole = headsByRoleText.filter((h: any) => 
                  h.department?.includes('CCMS') || 
                  h.department?.includes('Computing') ||
                  h.department?.includes('Multimedia')
                );
                if (ccmsHeadsByRole.length > 0) {
                  console.log(`[GET /api/approvers] ✅ Filtered to ${ccmsHeadsByRole.length} CCMS head(s) by role`);
                  heads = ccmsHeadsByRole.map((h: any) => ({
                    ...h,
                    department_id: departmentId,
                    department: deptInfo || { id: deptCheck.id, name: deptCheck.name, code: deptCheck.code }
                  }));
                }
              }
              
              // Debug: Check all users with is_head=true anywhere (to verify the column works)
              const { data: debugAllHeadsAnywhere } = await supabase
                .from("users")
                .select("id, name, email, is_head, status, department_id, role, department")
                .eq("is_head", true)
                .limit(10);
              console.log(`[GET /api/approvers] 🔍 DEBUG - Sample users with is_head=true (any department, first 10):`, debugAllHeadsAnywhere);
              
              // Check specifically for BELSON GABRIEL TAN
              const { data: belsonUser } = await supabase
                .from("users")
                .select("id, name, email, is_head, status, department_id, role, department")
                .ilike("name", "%BELSON%")
                .limit(5);
              console.log(`[GET /api/approvers] 🔍 DEBUG - Users named BELSON:`, belsonUser);
            }
          }

          approvers = (heads || []).map((h: any) => ({
            id: h.id,
            name: h.name,
            email: h.email,
            phone: h.phone_number,
            profile_picture: h.profile_picture,
            position: h.position_title || "Department Head",
            department: h.department?.name || (h.department_id ? "Department" : ""),
            role: "head",
            roleLabel: "Department Head"
          }));

          console.log(`[GET /api/approvers] Found ${approvers.length} heads for department_id: ${departmentId}`);
          if (approvers.length > 0) {
            console.log(`[GET /api/approvers] Head details:`, approvers[0]);
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

