import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/approvers?role=head&department_id=xxx
 * Fetch available approvers for a specific role
 */
export async function GET(req: NextRequest) {
  try {
    // CRITICAL: Use service role to bypass RLS
    const supabase = await createSupabaseServerClient(true);
    console.log(`[GET /api/approvers] ✅ Supabase client created with service role`);
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

          console.log(`[GET /api/approvers] 🎯 TARGET DEPARTMENT:`, {
            department_id: departmentId,
            department_name: dept?.name,
            department_code: dept?.code,
            found: !!dept
          });
          
          // STEP 1: First, try to get heads from CURRENT department
          // CRITICAL: Check BOTH is_head=true AND role='head'
          // IMPORTANT: Use .eq() to ensure department_id matches EXACTLY
          // FIX: Try multiple query patterns to ensure we find the head
          let currentHeads: any[] = [];
          let currentError: any = null;
          
          // Try query 1: is_head = true (explicit boolean)
          console.log(`[GET /api/approvers] 🔍 Starting Query 1 for department_id=${departmentId}`);
          console.log(`[GET /api/approvers] 🔍 Supabase client type:`, supabase ? 'created' : 'null');
          console.log(`[GET /api/approvers] 🔍 Department ID type:`, typeof departmentId, departmentId);
          
          let { data: headsByFlag, error: errorByFlag } = await supabase
            .from("users")
            .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department, is_head")
            .eq("department_id", departmentId)
            .eq("is_head", true);
          
          console.log(`[GET /api/approvers] 🔍 Query 1 (is_head=true) RESULT:`, {
            found: headsByFlag?.length || 0,
            error: errorByFlag,
            error_message: errorByFlag?.message,
            error_details: errorByFlag?.details,
            error_hint: errorByFlag?.hint,
            heads: headsByFlag?.map((h: any) => ({ 
              id: h.id,
              name: h.name, 
              email: h.email, 
              is_head: h.is_head, 
              role: h.role, 
              status: h.status,
              department_id: h.department_id
            })) || []
          });
          
          if (!errorByFlag && headsByFlag && headsByFlag.length > 0) {
            currentHeads = headsByFlag;
            currentError = null;
          } else {
            // Try query 2: role = 'head'
            let { data: headsByRole, error: errorByRole } = await supabase
              .from("users")
              .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department")
              .eq("department_id", departmentId)
              .eq("role", "head");
            
            console.log(`[GET /api/approvers] 🔍 Query 2 (role='head'):`, {
              found: headsByRole?.length || 0,
              error: errorByRole,
              heads: headsByRole?.map((h: any) => ({ name: h.name, email: h.email, is_head: h.is_head, role: h.role, status: h.status }))
            });
            
            if (!errorByRole && headsByRole && headsByRole.length > 0) {
              currentHeads = headsByRole;
              currentError = null;
            } else {
              // Try query 3: OR condition (fallback)
              let { data: headsByOr, error: errorByOr } = await supabase
                .from("users")
                .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department")
                .eq("department_id", departmentId)
                .or("is_head.eq.true,role.eq.head");
              
              console.log(`[GET /api/approvers] 🔍 Query 3 (OR condition):`, {
                found: headsByOr?.length || 0,
                error: errorByOr,
                heads: headsByOr?.map((h: any) => ({ name: h.name, email: h.email, is_head: h.is_head, role: h.role, status: h.status }))
              });
              
              if (!errorByOr && headsByOr && headsByOr.length > 0) {
                currentHeads = headsByOr;
                currentError = null;
              } else {
                currentError = errorByOr || errorByRole || errorByFlag;
              }
            }
          }
          
          // Filter by status in JavaScript (active or null)
          if (!currentError && currentHeads && currentHeads.length > 0) {
            const beforeStatusFilter = currentHeads.length;
            currentHeads = currentHeads.filter((h: any) => {
              const isActive = !h.status || h.status === 'active';
              if (!isActive) {
                console.log(`[GET /api/approvers] ⚠️ Filtering out ${h.name} - status: ${h.status}`);
              }
              return isActive;
            });
            console.log(`[GET /api/approvers] 🔍 Status filter: ${beforeStatusFilter} -> ${currentHeads.length} heads`);
          }
          
          console.log(`[GET /api/approvers] 🔍 INITIAL QUERY for department_id=${departmentId} (${dept?.code || dept?.name || 'unknown'}):`, {
            found: currentHeads?.length || 0,
            query_params: {
              department_id: departmentId,
              is_head_or_role: "is_head=true OR role='head'",
              status: "active OR null"
            },
            heads: currentHeads?.map((h: any) => ({ 
              name: h.name, 
              email: h.email,
              dept_id: h.department_id, 
              dept_text: h.department,
              is_head: h.is_head, 
              role: h.role,
              user_id: h.id,
              matches_target: h.department_id === departmentId
            }))
          });

          let heads: any[] = [];

          // Filter to only those with is_head=true OR role='head'
          // CRITICAL: Also verify department_id matches exactly
          if (!currentError && currentHeads && currentHeads.length > 0) {
            const beforeFilter = currentHeads.length;
            currentHeads = currentHeads.filter((h: any) => {
              const isHead = h.is_head === true || h.role === 'head';
              const deptMatches = h.department_id === departmentId;
              
              console.log(`[GET /api/approvers] 🔍 Filtering head:`, {
                name: h.name,
                email: h.email,
                is_head: h.is_head,
                role: h.role,
                department_id: h.department_id,
                target_department_id: departmentId,
                dept_matches: deptMatches,
                is_head_flag: isHead,
                will_include: isHead && deptMatches
              });
              
              return isHead && deptMatches;
            });
            
            if (currentHeads.length > 0) {
              console.log(`[GET /api/approvers] ✅ Found ${currentHeads.length} head(s) in current department (filtered from ${beforeFilter})`);
              currentHeads.forEach((h: any) => {
                console.log(`[GET /api/approvers]   - ${h.name} (${h.email}) - dept_id: ${h.department_id}`);
              });
            } else {
              console.warn(`[GET /api/approvers] ⚠️ No heads found after filtering (had ${beforeFilter} before filter)`);
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
                        // Keep actual department_id from users table, don't override
                        department_id: dh.users.department_id || departmentId
                      }));
                    currentError = null;
                  } else if (deptHeadsError) {
                    console.error(`[GET /api/approvers] department_heads query error:`, deptHeadsError);
                  } else {
                    // CRITICAL FIX: Check by department TEXT field ONLY if department_id is NULL
                    // IMPORTANT: Only use this fallback for the SPECIFIC department being queried, not all departments
                    console.log(`[GET /api/approvers] Trying department TEXT field search ONLY for department_id=${departmentId} (${dept?.code || dept?.name})...`);
                    // First, get all users with is_head=true or role='head'
                    const { data: allPotentialHeads, error: allPotentialHeadsError } = await supabase
                      .from("users")
                      .select("id, name, email, profile_picture, phone_number, position_title, department_id, status, role, department")
                      .or("is_head.eq.true,role.eq.head");
                    
                    // Then filter in JavaScript to find heads for THIS SPECIFIC department
                    let headsByDeptText: any[] = [];
                    if (!allPotentialHeadsError && allPotentialHeads) {
                      headsByDeptText = allPotentialHeads.filter((h: any) => {
                        // Only match if department_id is NULL or doesn't match (fallback case)
                        if (h.department_id && h.department_id === departmentId) {
                          // Already matched by department_id, skip text matching
                          return false;
                        }
                        
                        const deptText = (h.department || '').toLowerCase();
                        const deptCode = (dept?.code || '').toLowerCase();
                        const deptName = (dept?.name || '').toLowerCase();
                        
                        // Match by department code (e.g., "CENG", "CCMS")
                        if (deptCode && deptText.includes(deptCode)) {
                          return true;
                        }
                        
                        // Match by department name keywords
                        if (deptName) {
                          const keywords = deptName.split(' ').filter((w: string) => w.length > 3);
                          if (keywords.some((kw: string) => deptText.includes(kw.toLowerCase()))) {
                            return true;
                          }
                        }
                        
                        return false;
                      });
                    }
                    const deptTextError = allPotentialHeadsError;
                    
                    if (!deptTextError && headsByDeptText && headsByDeptText.length > 0) {
                      console.log(`[GET /api/approvers] ✅ Found ${headsByDeptText.length} head(s) by department TEXT field for ${dept?.code || dept?.name}:`, headsByDeptText.map((h: any) => h.name));
                      // CRITICAL: Keep the actual department_id from database, don't override it
                      // Only use these heads if their department_id is null/undefined OR matches
                      currentHeads = headsByDeptText.filter((h: any) => {
                        // Only include if department_id is null OR matches target
                        if (h.department_id && h.department_id !== departmentId) {
                          console.warn(`[GET /api/approvers] ❌ REJECTING ${h.name} from text match - has different department_id: ${h.department_id} !== ${departmentId}`);
                          return false;
                        }
                        return true;
                      }).map((h: any) => ({
                        ...h,
                        // Only set department_id if it was null/undefined
                        department_id: h.department_id || departmentId
                      }));
                      currentError = null;
                    }
                  }
                }
              }
            }
          }

          // Use deptInfo from dept (already fetched above)
          const deptInfo = dept ? { id: dept.id, name: dept.name, code: dept.code } : null;

          if (currentError) {
            console.error('[GET /api/approvers] Current department query error:', currentError);
          } else if (currentHeads && currentHeads.length > 0) {
            // CRITICAL: Verify each head's department_id matches exactly
            const verifiedHeads = currentHeads.filter((h: any) => {
              const matches = h.department_id === departmentId;
              if (!matches) {
                console.error(`[GET /api/approvers] ❌ REJECTING ${h.name} - department_id mismatch: ${h.department_id} !== ${departmentId}`);
              } else {
                console.log(`[GET /api/approvers] ✅ VERIFIED ${h.name} - department_id matches: ${h.department_id}`);
              }
              return matches;
            });
            
            if (verifiedHeads.length > 0) {
              console.log(`[GET /api/approvers] ✅ Found ${verifiedHeads.length} verified head(s) in current department (from ${currentHeads.length} total)`);
              heads = verifiedHeads.map((h: any) => ({
                ...h,
                department: deptInfo || null
              }));
            } else {
              console.warn(`[GET /api/approvers] ⚠️ No verified heads found (had ${currentHeads.length} before verification)`);
            }
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
                // NOTE: Parent heads are for parent department, not the requested one
                // Only use parent heads if we can't find any in the current department
                // But we should still verify they're valid heads
                console.log(`[GET /api/approvers] Found ${parentHeads.length} head(s) in parent department (will use as fallback)`);
                heads = parentHeads.map((h: any) => ({
                  ...h,
                  department: h.department || null,
                  department_id: dept?.parent_department_id || h.department_id // Set to parent dept ID
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
                // Filter by department text match - ONLY for the SPECIFIC department being queried
                const matchingHeads = allHeadsAnywhere.filter((h: any) => {
                  // CRITICAL: If head has department_id, it must match or be NULL
                  if (h.department_id && h.department_id !== departmentId) {
                    console.log(`[GET /api/approvers] ❌ REJECTING ${h.name} - has different department_id: ${h.department_id} !== ${departmentId}`);
                    return false;
                  }
                  
                  // Only use text matching if department_id is NULL
                  if (!h.department_id) {
                    const deptText = (h.department || '').toLowerCase();
                    const deptCode = (deptCheck?.code || '').toLowerCase();
                    const deptName = (deptCheck?.name || '').toLowerCase();
                    
                    // Match by department code (e.g., "CENG", "CCMS")
                    if (deptCode && deptText.includes(deptCode)) {
                      return true;
                    }
                    
                    // Match by department name keywords (first 3+ letter words)
                    if (deptName) {
                      const keywords = deptName.split(' ').filter((w: string) => w.length > 3);
                      if (keywords.some((kw: string) => deptText.includes(kw.toLowerCase()))) {
                        return true;
                      }
                    }
                  }
                  
                  return false;
                });
                
                if (matchingHeads.length > 0 && deptCheck) {
                  console.log(`[GET /api/approvers] ✅ Found ${matchingHeads.length} head(s) by department text match!`);
                  // CRITICAL: Keep actual department_id, only set if null/undefined
                  heads = matchingHeads.map((h: any) => ({
                    ...h,
                    department_id: h.department_id || departmentId, // Only set if was null/undefined
                    department: { id: deptCheck.id, name: deptCheck.name, code: deptCheck.code }
                  }));
                } else if (deptCheck?.head_name) {
                  // ONLY use head_name as absolute last resort if NO user found at all
                  // WARNING: This should rarely happen - it means no user in database has is_head=true for this department
                  console.warn(`[GET /api/approvers] ⚠️ Using hardcoded fallback from departments.head_name = "${deptCheck.head_name}" (NO USER FOUND IN DATABASE)`);
                  console.warn(`[GET /api/approvers]   - This is a data issue - there should be a user with is_head=true for department_id=${departmentId}`);
                  console.warn(`[GET /api/approvers]   - Please check the database and ensure the correct head is set in the users table`);
                  // Return empty array instead of using fallback - let the frontend handle the error
                  // This prevents showing incorrect/mock data
                  heads = [];
                  // If you really need to use the fallback, uncomment below:
                  /*
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
                  */
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
              console.log(`[GET /api/approvers] 🔍 DEBUG - Heads by department TEXT for ${deptCheck?.code || deptCheck?.name || 'department'}:`, headsByDeptText);
              
              // If we found heads by text but not by ID, use them!
              // CRITICAL: Only use if department_id is NULL or matches
              if (headsByDeptText && headsByDeptText.length > 0 && heads.length === 0) {
                console.log(`[GET /api/approvers] ✅ Found ${headsByDeptText.length} head(s) by department TEXT field!`);
                
                // Filter to only those that match THIS SPECIFIC department (not hardcoded CCMS)
                const validHeads = headsByDeptText.filter((h: any) => {
                  // CRITICAL: If head has department_id, it must match or be NULL
                  if (h.department_id && h.department_id !== departmentId) {
                    console.warn(`[GET /api/approvers] ❌ REJECTING ${h.name} - department_id mismatch: ${h.department_id} !== ${departmentId}`);
                    return false;
                  }
                  
                  // Match by department code or name for THIS department
                  const deptText = (h.department || '').toLowerCase();
                  const deptCode = (deptCheck?.code || '').toLowerCase();
                  const deptName = (deptCheck?.name || '').toLowerCase();
                  
                  if (deptCode && deptText.includes(deptCode)) {
                    return true;
                  }
                  
                  if (deptName) {
                    const keywords = deptName.split(' ').filter((w: string) => w.length > 3);
                    if (keywords.some((kw: string) => deptText.includes(kw.toLowerCase()))) {
                      return true;
                    }
                  }
                  
                  return false;
                });
                
                if (validHeads.length > 0 && deptCheck) {
                  console.log(`[GET /api/approvers] ✅ Filtered to ${validHeads.length} valid head(s) for ${deptCheck.code || deptCheck.name} (from ${headsByDeptText.length} total)`);
                  // CRITICAL: Keep actual department_id, only set if null/undefined
                  heads = validHeads.map((h: any) => ({
                    ...h,
                    department_id: h.department_id || departmentId, // Only set if was null/undefined
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
              // CRITICAL: Only use if department_id is NULL or matches
              if (headsByRoleText && headsByRoleText.length > 0 && heads.length === 0) {
                console.log(`[GET /api/approvers] ✅ Found ${headsByRoleText.length} head(s) by role='head' and department TEXT!`);
                
                // Filter to only those that match THIS SPECIFIC department (not hardcoded CCMS)
                const validHeadsByRole = headsByRoleText.filter((h: any) => {
                  // CRITICAL: If head has department_id, it must match or be NULL
                  if (h.department_id && h.department_id !== departmentId) {
                    console.warn(`[GET /api/approvers] ❌ REJECTING ${h.name} - department_id mismatch: ${h.department_id} !== ${departmentId}`);
                    return false;
                  }
                  
                  // Match by department code or name for THIS department
                  const deptText = (h.department || '').toLowerCase();
                  const deptCode = (deptCheck?.code || '').toLowerCase();
                  const deptName = (deptCheck?.name || '').toLowerCase();
                  
                  if (deptCode && deptText.includes(deptCode)) {
                    return true;
                  }
                  
                  if (deptName) {
                    const keywords = deptName.split(' ').filter((w: string) => w.length > 3);
                    if (keywords.some((kw: string) => deptText.includes(kw.toLowerCase()))) {
                      return true;
                    }
                  }
                  
                  return false;
                });
                
                if (validHeadsByRole.length > 0 && deptCheck) {
                  console.log(`[GET /api/approvers] ✅ Filtered to ${validHeadsByRole.length} valid head(s) for ${deptCheck.code || deptCheck.name} by role (from ${headsByRoleText.length} total)`);
                  // CRITICAL: Keep actual department_id, only set if null/undefined
                  heads = validHeadsByRole.map((h: any) => ({
                    ...h,
                    department_id: h.department_id || departmentId, // Only set if was null/undefined
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
              
              // Debug: Check if any users in the target department have is_head=true
              // (This helps verify the department_id is correct)
              const { data: debugHeadsInTargetDept } = await supabase
                .from("users")
                .select("id, name, email, is_head, status, department_id, role, department")
                .eq("department_id", departmentId)
                .eq("is_head", true)
                .limit(5);
              console.log(`[GET /api/approvers] 🔍 DEBUG - Users with is_head=true in target department (${departmentId}):`, debugHeadsInTargetDept);
            }
          }

          // CRITICAL: Filter heads to ONLY those that match the requested department_id
          // This prevents returning wrong heads from fallback logic
          console.log(`[GET /api/approvers] 🔍 FINAL FILTER - Before filtering:`, {
            totalHeads: heads?.length || 0,
            target_department_id: departmentId,
            heads: (heads || []).map((h: any) => ({
              name: h.name,
              email: h.email,
              department_id: h.department_id,
              department: h.department?.name || h.department,
              matches: h.department_id === departmentId
            }))
          });
          
          const filteredHeads = (heads || []).filter((h: any) => {
            // If head has department_id, it MUST match exactly
            if (h.department_id) {
              const matches = h.department_id === departmentId;
              if (!matches) {
                console.warn(`[GET /api/approvers] ❌ EXCLUDING ${h.name} - department_id mismatch: ${h.department_id} !== ${departmentId}`);
              }
              return matches;
            }
            // If no department_id, exclude it (we need exact match)
            console.warn(`[GET /api/approvers] ❌ EXCLUDING ${h.name} - no department_id`);
            return false;
          });
          
          console.log(`[GET /api/approvers] ✅ FINAL RESULT after filtering:`, {
            totalHeads: heads?.length || 0,
            filteredHeads: filteredHeads.length,
            heads: filteredHeads.map((h: any) => ({ 
              name: h.name, 
              email: h.email,
              dept_id: h.department_id,
              dept_name: h.department?.name || h.department
            }))
          });
          
          approvers = filteredHeads.map((h: any) => {
            // CRITICAL: Only use the head's ACTUAL department_id from the database
            // NEVER override it with the target departmentId - if it doesn't match, it should have been filtered
            const actualDeptId = h.department_id;
            
            // Final safety check - this should never happen if filtering worked correctly
            if (actualDeptId && actualDeptId !== departmentId) {
              console.error(`[GET /api/approvers] 🚨 CRITICAL ERROR: Head ${h.name} has department_id ${actualDeptId} but we're querying for ${departmentId} - this should have been filtered!`);
              console.error(`[GET /api/approvers]   - This head should NOT be in filteredHeads!`);
              // Still return it but with a warning - the frontend will catch it
            }
            
            if (!actualDeptId) {
              console.warn(`[GET /api/approvers] ⚠️ Head ${h.name} has no department_id - using target departmentId as fallback`);
            }
            
            return {
              id: h.id,
              name: h.name,
              email: h.email,
              phone: h.phone_number,
              profile_picture: h.profile_picture,
              position: h.position_title || "Department Head",
              department: h.department?.name || (actualDeptId ? "Department" : ""),
              department_id: actualDeptId || departmentId, // Use actual department_id, fallback to target only if null
              role: "head",
              roleLabel: "Department Head"
            };
          });

          console.log(`[GET /api/approvers] ✅ Final result: ${approvers.length} head(s) for department_id: ${departmentId}`);
          if (approvers.length > 0) {
            console.log(`[GET /api/approvers] Head details:`, approvers[0]);
          } else {
            console.warn(`[GET /api/approvers] ⚠️ No heads found for department_id: ${departmentId}`);
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
          position: a.position_title || "Transportation Manager",
          role: "admin",
          roleLabel: "Transportation Management"
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
    } else if (role === "head" && departmentId) {
      // CRITICAL: If no heads found, log detailed debug info
      console.error(`[GET /api/approvers] ❌ NO HEADS FOUND for department_id=${departmentId}`);
      console.error(`[GET /api/approvers]   - Check server terminal logs above for Query 1, 2, 3 results`);
      console.error(`[GET /api/approvers]   - Verify RLS policies are not blocking`);
      console.error(`[GET /api/approvers]   - Verify service role key is configured`);
    } else {
      console.warn(`[GET /api/approvers] No approvers found for role: ${role}`);
    }

    return NextResponse.json({ 
      ok: true, 
      data: approvers,
      count: approvers.length,
      debug: role === "head" && departmentId && approvers.length === 0 ? {
        department_id: departmentId,
        message: "No heads found - check server terminal logs for Query 1/2/3 results"
      } : undefined
    });
  } catch (err: any) {
    console.error("[GET /api/approvers] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

