// src/app/api/requests/submit/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "@/lib/workflow/engine";
import { sendEmail, generateParticipantInvitationEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications/helpers";
import { getPhilippineTimestamp } from "@/lib/datetime";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[/api/requests/submit] ========== REQUEST RECEIVED ==========");
    console.log("[/api/requests/submit] Body keys:", Object.keys(body));
    console.log("[/api/requests/submit] Status:", body.status);
    console.log("[/api/requests/submit] Reason:", body.reason);
    console.log("[/api/requests/submit] Seminar data present:", !!body.seminar);
    console.log("[/api/requests/submit] Seminar data type:", typeof body.seminar);
    if (body.seminar) {
      console.log("[/api/requests/submit] Seminar keys:", Object.keys(body.seminar || {}));
    }
    console.log("[/api/requests/submit] ======================================");
    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile - try with department join first
    let profile: any = null;
    let profileError: any = null;

    // Try to fetch with department join
    const profileResult = await supabase
      .from("users")
      .select(`
        id, 
        email,
        name,
        department,
        department_id, 
        is_head, 
        is_hr, 
        is_exec,
        department:departments(id, code, name, parent_department_id)
      `)
      .eq("auth_user_id", user.id)
      .single();

    profile = profileResult.data;
    profileError = profileResult.error;

    console.log("[/api/requests/submit] 📋 Initial profile fetch:", {
      hasProfile: !!profile,
      hasError: !!profileError,
      department_id: profile?.department_id,
      department_text: profile?.department,
      email: profile?.email,
      name: profile?.name
    });

    // If join failed, try without join (fallback)
    if (profileError || !profile) {
      console.warn("[/api/requests/submit] Department join failed, trying without join");
      const simpleResult = await supabase
        .from("users")
        .select("id, email, name, department, department_id, is_head, is_hr, is_exec")
        .eq("auth_user_id", user.id)
        .single();
      
      profile = simpleResult.data;
      profileError = simpleResult.error;
      
      console.log("[/api/requests/submit] 📋 Fallback profile fetch:", {
        hasProfile: !!profile,
        hasError: !!profileError,
        department_id: profile?.department_id,
        department_text: profile?.department,
        email: profile?.email
      });
      
      // If we got profile without join, manually fetch department
      if (profile && profile.department_id) {
        const { data: dept } = await supabase
          .from("departments")
          .select("id, code, name, parent_department_id")
          .eq("id", profile.department_id)
          .single();
        
        if (dept) {
          profile.department = dept;
          console.log("[/api/requests/submit] ✅ Manually fetched department:", dept.name);
        }
      }
    } else if (profile && profile.department_id) {
      console.log("[/api/requests/submit] ✅ Profile has department_id:", profile.department_id);
      console.log("[/api/requests/submit] ✅ Department info:", profile.department ? {
        id: profile.department.id,
        name: profile.department.name,
        code: profile.department.code
      } : "null");
    }

    if (profileError) {
      console.error("[/api/requests/submit] Profile fetch error:", profileError);
      const errorMessage = profileError.message || profileError.code || "Unknown error";
      
      // Check if it's a network/gateway error
      if (errorMessage.includes("Network connection lost") || 
          errorMessage.includes("gateway error") ||
          profileError.code === "PGRST301" ||
          profileError.code === "PGRST302") {
        console.warn("[/api/requests/submit] ⚠️ Network error detected, retrying profile fetch...");
        
        // Retry once with a simple query
        try {
          const retryResult = await supabase
            .from("users")
            .select("id, email, name, department, department_id, is_head, is_hr, is_exec")
            .eq("auth_user_id", user.id)
            .single();
          
          if (retryResult.data && !retryResult.error) {
            profile = retryResult.data;
            profileError = null;
            console.log("[/api/requests/submit] ✅ Retry successful, profile fetched");
            
            // Manually fetch department if needed
            if (profile && profile.department_id) {
              const { data: dept } = await supabase
                .from("departments")
                .select("id, code, name, parent_department_id")
                .eq("id", profile.department_id)
                .single();
              
              if (dept) {
                profile.department = dept;
                console.log("[/api/requests/submit] ✅ Manually fetched department:", dept.name);
              }
            }
          } else {
            return NextResponse.json({ 
              ok: false, 
              error: "Failed to fetch profile. Please try again. Error: " + (retryResult.error?.message || errorMessage)
            }, { status: 500 });
          }
        } catch (retryError: any) {
          console.error("[/api/requests/submit] Retry also failed:", retryError);
          return NextResponse.json({ 
            ok: false, 
            error: "Network error. Please check your connection and try again."
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({ 
          ok: false, 
          error: "Profile not found: " + errorMessage
        }, { status: 404 });
      }
    }

    if (!profile) {
      console.error("[/api/requests/submit] No profile data returned for user:", user.id);
      return NextResponse.json({ 
        ok: false, 
        error: "Profile not found. Please ensure your account is properly set up." 
      }, { status: 404 });
    }

    // Extract request data early to check if representative submission
    const travelOrder = body.travelOrder ?? body.payload?.travelOrder ?? {};
    const reason = body.reason ?? "visit";
    const isSeminar = reason === "seminar";
    const requestedStatus = body.status; // Extract early to use in validation checks
    
    // Quick check: might this be a representative submission?
    // For travel orders, check if requesting person is different from submitter
    // Handle multiple requesters (for faculty/head role)
    const hasMultipleRequesters = !isSeminar && Array.isArray(travelOrder.requesters) && travelOrder.requesters.length > 0;
    const primaryRequester = hasMultipleRequesters 
      ? travelOrder.requesters[0] 
      : null;
    
    const requestingPersonName = isSeminar
      ? (profile.name || profile.email || "Unknown")
      : hasMultipleRequesters
        ? (primaryRequester?.name || travelOrder.requestingPerson || profile.name || profile.email || "Unknown")
        : (travelOrder.requestingPerson || profile.name || profile.email || "Unknown");
    const submitterName = profile.name || profile.email || "Unknown";
    const mightBeRepresentative = !isSeminar && 
      requestingPersonName.trim().toLowerCase() !== submitterName.trim().toLowerCase();

    // If might be representative, try to fetch requesting person's info
    let requestingPersonUser: any = null;
    if (mightBeRepresentative && travelOrder.requestingPerson) {
      try {
        const exactName = travelOrder.requestingPerson.trim();
        console.log("[/api/requests/submit] 🔍 Looking up requesting person:", exactName);
        
        // Use the same search method as /api/users/check-head which successfully finds users
        // Create a direct client with service role key (same as check-head endpoint)
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (supabaseUrl && supabaseServiceKey) {
          const directSupabase = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          });
          
          // Use the same search method as /api/users/check-head
          let query = directSupabase
            .from("users")
            .select("id, name, email, is_head, role, department_id, status")
            .ilike("name", `%${exactName}%`)
            .eq("status", "active")
            .limit(5);
          
          const { data: users, error: searchError } = await query;
          
          if (searchError) {
            console.error("[/api/requests/submit] Search error with direct client:", searchError);
          } else {
            console.log("[/api/requests/submit] Direct client search found", users?.length || 0, "users");
            if (users && users.length > 0) {
              console.log("[/api/requests/submit] Users found:", users.map((u: any) => `${u.name} (ID: ${u.id}, status: ${u.status})`));
            }
          }
          
          // Find exact match first (case-insensitive, normalized), then closest match
          const normalizedName = exactName.replace(/\s+/g, ' ').trim().toLowerCase();
          const exactMatch = users?.find(u => 
            u.name?.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedName
          );
          const matchedUser = exactMatch || users?.[0];
          
          if (matchedUser) {
            requestingPersonUser = {
              id: matchedUser.id,
              name: matchedUser.name,
              is_head: matchedUser.is_head,
              role: matchedUser.role,
              department_id: matchedUser.department_id,
            };
            console.log("[/api/requests/submit] ✅ Found requesting person using direct client:", matchedUser.name, "ID:", matchedUser.id, "Dept ID:", matchedUser.department_id || "NULL");
          } else {
            console.error("[/api/requests/submit] ❌ Direct client search found no users for:", exactName);
          }
        } else {
          console.error("[/api/requests/submit] ❌ Missing Supabase credentials for direct client");
        }
        
        // Fallback to original search method if direct client didn't work
        if (!requestingPersonUser) {
          console.log("[/api/requests/submit] Direct client didn't find user, trying original search method...");
          const normalizedName = exactName.replace(/\s+/g, ' ').trim();
          
          // Try with the server client as fallback
          let { data: userData, error: exactError } = await supabase
            .from("users")
            .select("id, name, is_head, role, department_id")
            .ilike("name", `%${normalizedName}%`)
            .eq("status", "active")
            .limit(5);
          
          if (exactError) {
            console.warn("[/api/requests/submit] Fallback search error:", exactError);
          }
          
          if (userData && userData.length > 0) {
            // Find exact match
            const exactMatch = userData.find(u => 
              u.name?.replace(/\s+/g, ' ').trim().toLowerCase() === normalizedName.toLowerCase()
            );
            const match = exactMatch || userData[0];
            requestingPersonUser = match;
            console.log("[/api/requests/submit] ✅ Found using fallback search:", match.name, "ID:", match.id);
          }
        }
      } catch (error) {
        console.error("[/api/requests/submit] ❌ Error fetching requesting person:", error);
      }
    }

    // Validate department exists
    // For seminar applications: user IS the requester, so use their department
    // For representative submissions: use requesting person's department (requester's department), not submitter's
    // For regular submissions: require submitter to have department
    
    // CRITICAL: For representative submissions, we should use the REQUESTER's department, not the submitter's
    // The requester is the one who needs the travel, so their department determines the approval path
    let finalDepartmentId = profile.department_id;
    let finalDepartment: any = profile.department;
    
    // If this is a representative submission and we found the requesting person, use their department
    if (mightBeRepresentative && !isSeminar && requestingPersonUser?.department_id) {
      console.log("[/api/requests/submit] ✅ Representative submission: Using REQUESTER's department, not submitter's");
      console.log("[/api/requests/submit]   - Requester department_id:", requestingPersonUser.department_id);
      console.log("[/api/requests/submit]   - Submitter department_id:", profile.department_id || "none");
      
      // Fetch requester's department info
      const { data: requesterDept } = await supabase
        .from("departments")
        .select("id, code, name, parent_department_id")
        .eq("id", requestingPersonUser.department_id)
        .maybeSingle();
      
      if (requesterDept) {
        finalDepartmentId = requesterDept.id;
        finalDepartment = requesterDept;
        console.log("[/api/requests/submit] ✅ Using requester's department:", requesterDept.name);
      } else {
        console.warn("[/api/requests/submit] ⚠️ Could not fetch requester's department, will use form department");
      }
    }
    
    // If still no department_id, try to resolve it
    if (!finalDepartmentId) {
      if (isSeminar) {
        // For seminar applications, the user is the requester
        // Try to fetch department from profile API or check if it exists in the database
        console.log("[/api/requests/submit] ⚠️ Seminar application: User has no department_id, attempting to fetch...");
        console.log("[/api/requests/submit] 📋 Profile department (text):", profile.department);
        
        // If user has department name but no department_id, look it up from departments table
        if (profile.department && typeof profile.department === 'string') {
          const departmentName = profile.department.trim();
          console.log("[/api/requests/submit] 🔍 Looking up department_id for:", departmentName);
          
          // Try exact match first
          let { data: deptData } = await supabase
            .from("departments")
            .select("id, code, name, parent_department_id")
            .eq("name", departmentName)
            .maybeSingle();
          
          // If not found, try matching by code (e.g., "CCMS" might be the code)
          if (!deptData && departmentName.length <= 10) {
            console.log("[/api/requests/submit] 🔍 Trying to match by code:", departmentName);
            const { data: deptByCode } = await supabase
              .from("departments")
              .select("id, code, name, parent_department_id")
              .eq("code", departmentName)
              .maybeSingle();
            
            if (deptByCode) {
              deptData = deptByCode;
              console.log("[/api/requests/submit] ✅ Found department by code:", deptByCode.name);
            }
          }
          
          // If still not found, try partial match (e.g., "CCMS" in "College of Computer and Mathematical Sciences (CCMS)")
          if (!deptData) {
            console.log("[/api/requests/submit] 🔍 Trying partial match for:", departmentName);
            const { data: deptPartial } = await supabase
              .from("departments")
              .select("id, code, name, parent_department_id")
              .or(`name.ilike.%${departmentName}%,code.ilike.%${departmentName}%`)
              .limit(1)
              .maybeSingle();
            
            if (deptPartial) {
              deptData = deptPartial;
              console.log("[/api/requests/submit] ✅ Found department by partial match:", deptPartial.name);
            }
          }
          
          if (deptData) {
            finalDepartmentId = deptData.id;
            finalDepartment = deptData;
            console.log("[/api/requests/submit] ✅ Successfully resolved department_id:", deptData.id, "for", deptData.name);
          } else {
            console.warn("[/api/requests/submit] ⚠️ Could not find department_id for:", departmentName);
          }
        }
        
        // If still no department_id after lookup, check one more time with fresh query
        if (!finalDepartmentId) {
          const { data: freshProfile } = await supabase
            .from("users")
            .select("id, department_id, department:departments(id, code, name, parent_department_id)")
            .eq("auth_user_id", user.id)
            .single();
          
          if (freshProfile?.department_id) {
            finalDepartmentId = freshProfile.department_id;
            finalDepartment = freshProfile.department;
            console.log("[/api/requests/submit] ✅ Found department from fresh query:", freshProfile.department_id);
          }
        }
        
        // Final check - if still no department_id, reject (unless draft)
        if (!finalDepartmentId) {
          if (requestedStatus === "draft") {
            console.log("[/api/requests/submit] 📝 Draft mode: Allowing seminar draft without department");
          } else {
            console.error("[/api/requests/submit] ❌ Seminar user has no department assigned:", profile.email);
            console.error("[/api/requests/submit] ❌ Department name was:", profile.department);
            return NextResponse.json({ 
              ok: false, 
              error: "Your account is not assigned to a department. Please contact your administrator to assign you to a department before submitting seminar applications." 
            }, { status: 400 });
          }
        }
      } else if (mightBeRepresentative && (requestingPersonUser?.department_id || travelOrder.department)) {
        // Representative submission: requesting person has department OR form has department selected, so allow it
        console.log("[/api/requests/submit] ℹ️ Submitter has no department, but representative submission detected:");
        console.log("  - Requesting person department_id:", requestingPersonUser?.department_id);
        console.log("  - Form selected department:", travelOrder.department);
        console.log("  - Allowing representative submission");
        // finalDepartmentId should already be set above if requestingPersonUser has department_id
      } else {
        // Not representative OR requesting person also has no department
        // Try to look up department_id from department text (same logic as seminar)
        if (!finalDepartmentId && profile.department && typeof profile.department === 'string') {
          const departmentName = profile.department.trim();
          console.log("[/api/requests/submit] 🔍 Regular submission: Looking up department_id for:", departmentName);
          
          // Try exact match first
          let { data: deptData } = await supabase
            .from("departments")
            .select("id, code, name, parent_department_id")
            .eq("name", departmentName)
            .maybeSingle();
          
          // If not found, try matching by code (e.g., "CCMS" might be the code)
          if (!deptData && departmentName.length <= 10) {
            console.log("[/api/requests/submit] 🔍 Trying to match by code:", departmentName);
            const { data: deptByCode } = await supabase
              .from("departments")
              .select("id, code, name, parent_department_id")
              .eq("code", departmentName)
              .maybeSingle();
            
            if (deptByCode) {
              deptData = deptByCode;
              console.log("[/api/requests/submit] ✅ Found department by code:", deptByCode.name);
            }
          }
          
          // If still not found, try partial match (e.g., "CCMS" in "College of Computer and Mathematical Sciences (CCMS)")
          if (!deptData) {
            console.log("[/api/requests/submit] 🔍 Trying partial match for:", departmentName);
            const { data: deptPartial } = await supabase
              .from("departments")
              .select("id, code, name, parent_department_id")
              .or(`name.ilike.%${departmentName}%,code.ilike.%${departmentName}%`)
              .limit(1)
              .maybeSingle();
            
            if (deptPartial) {
              deptData = deptPartial;
              console.log("[/api/requests/submit] ✅ Found department by partial match:", deptPartial.name);
            }
          }
          
          if (deptData) {
            finalDepartmentId = deptData.id;
            finalDepartment = deptData;
            console.log("[/api/requests/submit] ✅ Successfully resolved department_id:", deptData.id, "for", deptData.name);
          } else {
            console.warn("[/api/requests/submit] ⚠️ Could not find department_id for:", departmentName);
          }
        }
        
        // For drafts, allow saving without department (will be validated on final submit)
        if (requestedStatus === "draft") {
          console.log("[/api/requests/submit] 📝 Draft mode: Allowing save without department (will be validated on final submit)");
        } else if (!finalDepartmentId) {
          // Not a draft and still no department_id - require submitter to have department
          console.error("[/api/requests/submit] User has no department assigned:", profile.email);
          return NextResponse.json({ 
            ok: false, 
            error: "Your account is not assigned to a department. Please contact your administrator to assign you to a department before submitting requests." 
          }, { status: 400 });
        }
      }
    }

    // Check if department has parent (for office hierarchy)
    const hasParentDepartment = !!(finalDepartment as any)?.parent_department_id;

    // Extract request data from body (travelOrder and reason already extracted above)
    const costs = travelOrder.costs ?? {};
    const vehicleMode = body.vehicleMode ?? "owned"; // "owned", "institutional", "rent"

    // Get the department ID - use finalDepartmentId (which is requester's department for representative submissions)
    let departmentId = finalDepartmentId;
    let selectedDepartment: any = finalDepartment;
    
    console.log(`[/api/requests/submit] Initial dept: ${(finalDepartment as any)?.name} (${departmentId})`);
    console.log(`[/api/requests/submit] Form selected dept: ${travelOrder.department}`);
    
    // For representative submissions, validate that form department matches requester's department
    // (We already set departmentId to requester's department above, so just validate here)
    if (mightBeRepresentative && requestingPersonUser?.department_id && travelOrder.department) {
      // Validate that the selected department matches the requesting person's department
      const selectedDeptName = travelOrder.department?.trim() || "";
      const requesterDeptName = selectedDepartment?.name?.trim() || "";
      const requesterDeptCode = selectedDepartment?.code?.trim() || "";
      
      // Check if selected department matches (by name or code)
      const matchesName = selectedDeptName === requesterDeptName;
      const matchesCode = selectedDeptName.includes(`(${requesterDeptCode})`) || selectedDeptName === requesterDeptCode;
      const matchesFull = selectedDeptName === `${requesterDeptName} (${requesterDeptCode})`;
      
      if (!matchesName && !matchesCode && !matchesFull && selectedDeptName !== "") {
        console.error(`[/api/requests/submit] ❌ Department mismatch!`);
        console.error(`  - Requesting person's department: ${requesterDeptName} (${requesterDeptCode})`);
        console.error(`  - Selected department: ${selectedDeptName}`);
        return NextResponse.json({ 
          ok: false, 
          error: `The selected department "${selectedDeptName}" does not match the requesting person's department "${requesterDeptName}". Please select the correct department for ${requestingPersonName}.` 
        }, { status: 400 });
      }
      
      console.log(`[/api/requests/submit] ✅ Representative submission: Department validated - ${requesterDeptName} (${requesterDeptCode})`);
    } else if (travelOrder.department && travelOrder.department !== (finalDepartment as any)?.name) {
      // User selected a different department - look it up
      // Try multiple search strategies to handle different name formats
      let deptData = null;
      
      // Strategy 1: Exact match
      const { data: exactMatch } = await supabase
        .from("departments")
        .select("id, code, name, parent_department_id")
        .eq("name", travelOrder.department)
        .maybeSingle();
      
      if (exactMatch) {
        deptData = exactMatch;
      } else {
        // Strategy 2: Extract code from format "Name (CODE)" and search by code
        const codeMatch = travelOrder.department.match(/\(([^)]+)\)$/);
        if (codeMatch) {
          const code = codeMatch[1];
          console.log(`[/api/requests/submit] Trying to find by code: ${code}`);
          const { data: codeSearch } = await supabase
            .from("departments")
            .select("id, code, name, parent_department_id")
            .eq("code", code)
            .maybeSingle();
          
          if (codeSearch) {
            deptData = codeSearch;
          }
        }
        
        // Strategy 3: Search by name using ILIKE (case-insensitive partial match)
        if (!deptData) {
          const searchName = travelOrder.department.replace(/\s*\([^)]*\)\s*$/, '').trim();
          console.log(`[/api/requests/submit] Trying ILIKE search: ${searchName}`);
          const { data: likeSearch } = await supabase
            .from("departments")
            .select("id, code, name, parent_department_id")
            .ilike("name", `%${searchName}%`)
            .maybeSingle();
          
          if (likeSearch) {
            deptData = likeSearch;
          }
        }
      }
      
      if (deptData) {
        departmentId = deptData.id;
        selectedDepartment = deptData;
        console.log(`[/api/requests/submit] ✅ Using selected department: ${deptData.name} (${deptData.code}) (${deptData.id})`);
      } else {
        console.warn(`[/api/requests/submit] ⚠️ Could not find department: ${travelOrder.department}`);
        // For representative submissions, try to use requesting person's department if available
        if (mightBeRepresentative && requestingPersonUser?.department_id) {
          console.log(`[/api/requests/submit] 🔄 Using requesting person's department_id: ${requestingPersonUser.department_id}`);
          departmentId = requestingPersonUser.department_id;
          // Fetch department info
          const { data: reqDept } = await supabase
            .from("departments")
            .select("id, code, name, parent_department_id")
            .eq("id", requestingPersonUser.department_id)
            .maybeSingle();
          if (reqDept) {
            selectedDepartment = reqDept;
          }
        } else {
          console.warn(`[/api/requests/submit] 🔄 Falling back to submitter's department`);
        }
      }
    } else {
      console.log(`[/api/requests/submit] ℹ️ Using requester's own department`);
    }

    // Determine request type
    const requestType = reason === "seminar" ? "seminar" : "travel_order";
    
    // Calculate budget
    const hasBudget = costs && Object.keys(costs).length > 0;
    
    console.log("[/api/requests/submit] Costs data:", costs);
    console.log("[/api/requests/submit] Has budget:", hasBudget);
    const expenseBreakdown = hasBudget ? [
      { 
        item: "Food", 
        amount: parseFloat(costs.food || 0), 
        description: costs.foodDescription || "Meals" 
      },
      { 
        item: "Accommodation", 
        amount: parseFloat(costs.accommodation || 0), 
        description: costs.accommodationDescription || "Lodging" 
      },
      { 
        item: "Transportation", 
        amount: parseFloat(costs.rentVehicles || 0), 
        description: costs.rentVehiclesDescription || "Vehicle rental" 
      },
      { 
        item: "Driver Allowance", 
        amount: parseFloat(costs.driversAllowance || 0), 
        description: costs.driversAllowanceDescription || "Driver costs" 
      },
      { 
        item: "Hired Drivers", 
        amount: parseFloat(costs.hiredDrivers || 0), 
        description: costs.hiredDriversDescription || "Hired driver services" 
      },
      // Handle other expenses (from otherItems array)
      ...(Array.isArray(costs.otherItems) 
        ? costs.otherItems
            .filter((item: any) => item.amount && item.amount > 0)
            .map((item: any) => ({
              item: item.label || "Other",
              amount: parseFloat(item.amount || 0),
              description: item.description || item.label || "Miscellaneous"
            }))
        : costs.otherAmount && costs.otherAmount > 0
        ? [{
            item: "Other",
            amount: parseFloat(costs.otherAmount || 0),
            description: costs.otherLabel || "Miscellaneous"
          }]
        : []
      ),
    ].filter(item => item.amount > 0) : [];
    
    const totalBudget = expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);

    // Determine if vehicle needed
    const needsVehicle = vehicleMode === "institutional" || vehicleMode === "rent";
    
    // Get preferred driver/vehicle suggestions from schoolService
    console.log("[/api/requests/submit] ========== DRIVER/VEHICLE DEBUG ==========");
    console.log("[/api/requests/submit] Full body.schoolService:", JSON.stringify(body.schoolService, null, 2));
    const schoolService = body.schoolService || {};
    console.log("[/api/requests/submit] School Service keys:", Object.keys(schoolService));
    let preferredDriverId = schoolService.preferredDriver || null;
    let preferredVehicleId = schoolService.preferredVehicle || null;
    console.log("[/api/requests/submit] ✏️ Initial driver ID from client:", preferredDriverId);
    console.log("[/api/requests/submit] ✏️ Initial vehicle ID from client:", preferredVehicleId);
    console.log("[/api/requests/submit] ==========================================");

    // Validate driver exists if provided
    // Note: preferredDriverId is the USER ID (from /api/drivers response)
    if (preferredDriverId) {
      const { data: driverExists } = await supabase
        .from("drivers")
        .select("user_id")  // Only select user_id (drivers table has no "id" column!)
        .eq("user_id", preferredDriverId)
        .maybeSingle();
      
      if (!driverExists) {
        console.warn(`[/api/requests/submit] ⚠️ Driver with user_id ${preferredDriverId} not found in drivers table`);
        console.warn(`[/api/requests/submit] ⚠️ Setting preferred_driver_id to NULL to prevent FK error`);
        preferredDriverId = null;
      } else {
        console.log(`[/api/requests/submit] ✅ Driver with user_id ${preferredDriverId} validated successfully!`);
        console.log(`[/api/requests/submit] ✅ Will save preferred_driver_id = ${preferredDriverId}`);
        // Keep the user_id as preferred_driver_id (FK references users table)
      }
    } else {
      console.log(`[/api/requests/submit] ℹ️ No driver preference provided by client`);
    }

    // Validate vehicle exists if provided
    if (preferredVehicleId) {
      const { data: vehicleExists } = await supabase
        .from("vehicles")
        .select("id")
        .eq("id", preferredVehicleId)
        .maybeSingle();
      
      if (!vehicleExists) {
        console.warn(`[/api/requests/submit] ⚠️ Vehicle ID ${preferredVehicleId} not found in vehicles table`);
        console.warn(`[/api/requests/submit] ⚠️ Setting preferred_vehicle_id to NULL to prevent FK error`);
        preferredVehicleId = null;
      } else {
        console.log(`[/api/requests/submit] ✅ Vehicle ID ${preferredVehicleId} validated`);
        console.log(`[/api/requests/submit] ✅ Will save preferred_vehicle_id = ${preferredVehicleId}`);
      }
    } else {
      console.log(`[/api/requests/submit] ℹ️ No vehicle preference provided by client`);
    }

    // Note: isSeminar is already defined above (line 84) - do not redeclare
    
    // Check if requester (logged in user) is a head
    const requesterIsHead = profile.is_head === true;

    // Check if REQUESTING PERSON (from form) is a head
    // This is different from the submitter - the requesting person is who needs the travel
    // Note: requestingPersonUser may already be fetched in early check above
    let requestingPersonIsHead = false;
    if (!isSeminar && travelOrder.requestingPerson) {
      // If we already fetched requestingPersonUser in early check, use it
      if (requestingPersonUser) {
        requestingPersonIsHead = requestingPersonUser.is_head === true || requestingPersonUser.role === "head";
        console.log("[/api/requests/submit] ✅ Using previously fetched requesting person data");
      } else {
        // Otherwise, fetch it now
        try {
          const { data: userData } = await supabase
            .from("users")
            .select("id, name, is_head, role, department_id")
            .ilike("name", `%${travelOrder.requestingPerson}%`)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();
          
          if (userData) {
            requestingPersonUser = userData;
            requestingPersonIsHead = userData.is_head === true || userData.role === "head";
          }
        } catch (error) {
          console.warn("[/api/requests/submit] Could not check if requesting person is head:", error);
          // Default to false if check fails
          requestingPersonIsHead = false;
        }
      }
    } else if (isSeminar) {
      // For seminars, requesting person is the logged-in user
      requestingPersonIsHead = requesterIsHead;
      requestingPersonUser = profile;
    }

    // Determine initial status using workflow engine
    // If representative submission (requesting person ≠ submitter), send to requesting person first
    // If requesting person is NOT a head, send to their department head first
    // If requesting person IS a head, can go directly to admin
    // Note: requestedStatus is already defined above
    let initialStatus: string;
    if (requestedStatus === "draft") {
      initialStatus = "draft";
    } else if (mightBeRepresentative && !isSeminar && travelOrder.requestingPerson) {
      // Representative submission: send to requesting person first for signature
      // Status: "pending_requester_signature" or "pending_head" (if requesting person is head)
      if (requestingPersonIsHead) {
        initialStatus = "pending_head"; // Requesting person is head, they can approve directly
      } else {
        initialStatus = "pending_requester_signature"; // Need requesting person's signature first
      }
    } else if (requestingPersonIsHead) {
      // Requesting person is a head: they sign first, then send to parent head (if exists) or admin
      // Status will be pending_head so they can sign their own request first
      initialStatus = "pending_head";
    } else {
      // Requesting person is NOT a head, send to their department head first
      initialStatus = "pending_head";
    }
    const seminar = body.seminar || {};
    
    // Validate seminar data structure if it's a seminar request
    // For drafts, be more lenient - allow empty or incomplete seminar data
    if (isSeminar && requestedStatus !== "draft" && typeof seminar !== 'object') {
      console.error("[/api/requests/submit] Invalid seminar data structure:", typeof seminar);
      return NextResponse.json({ 
        ok: false, 
        error: "Invalid seminar data. Please refresh the page and try again." 
      }, { status: 400 });
    }
    
    // For drafts, ensure seminar is at least an object (even if empty)
    if (isSeminar && requestedStatus === "draft" && typeof seminar !== 'object') {
      console.warn("[/api/requests/submit] Draft: Converting invalid seminar data to empty object");
      // This shouldn't happen due to || {} above, but just in case
    }
    
    // Parse travel dates
    const travelStartDate = travelOrder.date || travelOrder.dateFrom || new Date().toISOString();
    const travelEndDate = travelOrder.dateTo || travelOrder.date || travelStartDate;

    // Prepare participants (simplified for now)
    const participants = travelOrder.participants || [];
    
    // Determine if this is a representative submission
    // Note: requestingPersonName, submitterName, and mightBeRepresentative already defined above
    // Use mightBeRepresentative as isRepresentative (they're the same check)
    const isRepresentative = mightBeRepresentative;

    // CRITICAL: Determine requester_id BEFORE building requestData
    // For representative submissions, we MUST find the requesting person's ID
    let finalRequesterId = profile.id; // Default to submitter
    if (isRepresentative && !isSeminar) {
      if (requestingPersonUser?.id) {
        finalRequesterId = requestingPersonUser.id;
        console.log("[/api/requests/submit] ✅ Using requesting person ID:", requestingPersonUser.id, "for requester_id");
        console.log("[/api/requests/submit] ✅ Requesting person name:", requestingPersonUser.name);
      } else {
        // Emergency lookup - try to find the user one more time
        console.error("[/api/requests/submit] ❌ CRITICAL: Representative submission but requesting person not found in early fetch!");
        console.error("[/api/requests/submit] ❌ Requesting person name from form:", requestingPersonName);
        console.error("[/api/requests/submit] ❌ Attempting emergency lookup...");
        
        try {
          const searchName = requestingPersonName.trim();
          console.log("[/api/requests/submit] 🔍 Emergency lookup searching for:", searchName);
          
          let emergencyMatches: any[] = [];
          
          // Try full name partial match
          const { data: fullMatch, error: fullError } = await supabase
            .from("users")
            .select("id, name, department_id")
            .ilike("name", `%${searchName}%`)
            .eq("status", "active");
          
          if (!fullError && fullMatch) {
            emergencyMatches = fullMatch;
          }
          
          // Try flexible match with first + last name
          const nameParts = searchName.split(/\s+/).filter(p => p.length > 2);
          if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            console.log("[/api/requests/submit] Emergency flexible match:", firstName, lastName);
            
            // Use raw SQL-like approach: fetch all matching firstName, then filter for lastName
            const { data: firstNameMatches, error: firstNameError } = await supabase
              .from("users")
              .select("id, name, department_id")
              .ilike("name", `%${firstName}%`)
              .eq("status", "active");
            
            console.log("[/api/requests/submit] Emergency firstName search found", firstNameMatches?.length || 0, "users");
            if (firstNameMatches && firstNameMatches.length > 0) {
              console.log("[/api/requests/submit] Emergency firstName matches:", firstNameMatches.map((u: any) => `${u.name} (dept: ${u.department_id || 'none'})`));
            }
            
            if (!firstNameError && firstNameMatches && firstNameMatches.length > 0) {
              // Filter in JavaScript to ensure both firstName and lastName are present
              const firstNameLower = firstName.toLowerCase();
              const lastNameLower = lastName.toLowerCase();
              
              const flexMatch = firstNameMatches.filter((u: any) => {
                const nameLower = u.name.toLowerCase();
                const hasFirstName = nameLower.includes(firstNameLower);
                const hasLastName = nameLower.includes(lastNameLower);
                console.log(`[/api/requests/submit] Checking "${u.name}": hasFirstName=${hasFirstName}, hasLastName=${hasLastName}`);
                return hasFirstName && hasLastName;
              });
              
              console.log("[/api/requests/submit] Emergency flexible match found", flexMatch.length, "users after filtering");
              if (flexMatch.length > 0) {
                console.log("[/api/requests/submit] Emergency flexible matches:", flexMatch.map((u: any) => `${u.name} (dept: ${u.department_id || 'none'})`));
              }
              
              if (flexMatch.length > 0) {
                flexMatch.forEach((u: any) => {
                  if (!emergencyMatches.find((m: any) => m.id === u.id)) {
                    emergencyMatches.push(u);
                  }
                });
              }
            } else if (firstNameError) {
              console.log("[/api/requests/submit] Emergency firstName search error:", firstNameError);
            }
          }
          
          if (emergencyMatches.length > 0) {
            console.log("[/api/requests/submit] Emergency found", emergencyMatches.length, "matches:", emergencyMatches.map((u: any) => `${u.name} (ID: ${u.id}, dept: ${u.department_id || 'none'})`));
            // ALWAYS prefer the one with department_id
            const withDept = emergencyMatches.find((u: any) => u.department_id);
            const found = withDept || emergencyMatches[0];
            finalRequesterId = found.id;
            requestingPersonUser = found; // Update for department_id lookup later
            console.log("[/api/requests/submit] ✅ Emergency lookup found:", found.name, "ID:", found.id, "Dept ID:", found.department_id || "NULL");
            console.log("[/api/requests/submit] ✅ Will set requester_id to:", found.id);
          } else {
            // CRITICAL: DO NOT use submitter ID for representative submissions!
            // This would send the request to the wrong person's inbox
            console.error("[/api/requests/submit] ❌ FAILED: Cannot find requesting person:", searchName);
            console.error("[/api/requests/submit] ❌ This is a representative submission - cannot proceed without valid requesting person ID");
            console.error("[/api/requests/submit] ❌ Available users (first 10) for debugging:");
            
            // Debug: Show some users to help troubleshoot
            const { data: sampleUsers } = await supabase
              .from("users")
              .select("id, name, email, status")
              .eq("status", "active")
              .limit(10);
            
            if (sampleUsers) {
              sampleUsers.forEach((u: any) => {
                console.error(`  - "${u.name}" (${u.email})`);
              });
            }
            
            // For drafts, allow saving even if requesting person not found
            if (requestedStatus === "draft") {
              console.log("[/api/requests/submit] 📝 Draft mode: Allowing save even if requesting person not found");
              // Use submitter's ID as fallback for drafts
              finalRequesterId = profile.id;
            } else {
              return NextResponse.json({ 
                ok: false, 
                error: `Cannot find user "${searchName}" in the system. Please check the spelling of the requesting person's name. If this person is not in the system, they need to be added first.` 
              }, { status: 400 });
            }
          }
        } catch (err) {
          console.error("[/api/requests/submit] ❌ Emergency lookup failed:", err);
          // For drafts, allow saving even if lookup fails
          if (requestedStatus === "draft") {
            console.log("[/api/requests/submit] 📝 Draft mode: Allowing save even if lookup failed");
            finalRequesterId = profile.id;
          } else {
            return NextResponse.json({ 
              ok: false, 
              error: `Failed to find requesting person "${requestingPersonName}". Please verify the name is correct and the person exists in the system.` 
            }, { status: 400 });
          }
        }
      }
      
      // Final validation: make sure we're not using submitter's ID for representative submission
      // SKIP this validation for drafts - allow saving incomplete data
      if (requestedStatus !== "draft" && finalRequesterId === profile.id) {
        console.error("[/api/requests/submit] ❌ CRITICAL ERROR: Representative submission but requester_id is set to submitter's ID!");
        console.error("[/api/requests/submit] ❌ This would send the request to the wrong inbox!");
        console.error("[/api/requests/submit] ❌ Submitter ID:", profile.id, "Name:", submitterName);
        console.error("[/api/requests/submit] ❌ Requesting person name:", requestingPersonName);
        return NextResponse.json({ 
          ok: false, 
          error: `Cannot process representative submission: Could not find user "${requestingPersonName}" in the system. The request cannot be sent to the correct person. Please verify the name is spelled correctly.` 
        }, { status: 400 });
      }
      
      if (requestedStatus !== "draft") {
        console.log("[/api/requests/submit] ✅ Representative submission validated:");
        console.log("[/api/requests/submit]   - Requester ID:", finalRequesterId, "(NOT submitter's ID:", profile.id + ")");
        console.log("[/api/requests/submit]   - Requester Name:", requestingPersonName);
        console.log("[/api/requests/submit]   - Submitter ID:", profile.id);
        console.log("[/api/requests/submit]   - Submitter Name:", submitterName);
      } else {
        console.log("[/api/requests/submit] 📝 Draft mode: Skipping representative validation");
        // For drafts, if we couldn't find the requesting person, use submitter's ID as fallback
        // This allows saving drafts even if the requesting person isn't found yet
        if (finalRequesterId === profile.id && isRepresentative) {
          console.log("[/api/requests/submit] 📝 Draft: Using submitter's ID as requester_id (will be updated on final submit)");
        }
      }
    }

    // Build request object
    // For seminar requests, use seminar data; for travel orders, use travelOrder data
    // For drafts, provide sensible defaults to ensure required fields are not empty
    // CRITICAL: All NOT NULL fields must have non-empty values
    
    // Ensure title is never empty (required NOT NULL)
    const finalTitle = isSeminar 
      ? (seminar.title?.trim() || (requestedStatus === "draft" ? "Draft Seminar Application" : "Seminar Application"))
      : (travelOrder.purposeOfTravel?.trim() || travelOrder.purpose?.trim() || "Travel Request");
    
    // Ensure purpose is never empty (required NOT NULL)
    const finalPurpose = isSeminar 
      ? (seminar.title?.trim() || (requestedStatus === "draft" ? "Draft Seminar Application" : "Seminar Application"))
      : (travelOrder.purposeOfTravel?.trim() || travelOrder.purpose?.trim() || "Travel Request");
    
    // Ensure destination is never empty (required NOT NULL)
    const finalDestination = isSeminar 
      ? (seminar.venue?.trim() || (requestedStatus === "draft" ? "TBD" : "TBD"))
      : (travelOrder.destination?.trim() || "TBD");
    
    // Ensure dates are valid (required NOT NULL)
    // Parse dates and ensure end date is not before start date
    let finalTravelStartDate = isSeminar 
      ? (seminar.dateFrom || new Date().toISOString())
      : (travelOrder.departureDate || travelOrder.date || new Date().toISOString());
    
    let finalTravelEndDate = isSeminar 
      ? (seminar.dateTo || finalTravelStartDate)
      : (travelOrder.returnDate || travelOrder.dateTo || travelOrder.date || finalTravelStartDate);
    
    // Ensure dates are in correct order (end date must be >= start date)
    const startDate = new Date(finalTravelStartDate);
    const endDate = new Date(finalTravelEndDate);
    
    if (endDate < startDate) {
      console.warn("[/api/requests/submit] ⚠️ End date is before start date, swapping dates");
      // Swap dates if they're in wrong order
      const temp = finalTravelStartDate;
      finalTravelStartDate = finalTravelEndDate;
      finalTravelEndDate = temp;
    }
    
    // CRITICAL: Validate requester_id is not null/undefined (required NOT NULL)
    if (!finalRequesterId) {
      console.error("[/api/requests/submit] ❌ CRITICAL: finalRequesterId is null/undefined!");
      console.error("[/api/requests/submit] Profile ID:", profile.id);
      console.error("[/api/requests/submit] Is representative:", isRepresentative);
      console.error("[/api/requests/submit] Requesting person user:", requestingPersonUser);
      
      // For drafts, use submitter's ID as fallback
      if (requestedStatus === "draft") {
        console.log("[/api/requests/submit] 📝 Draft mode: Using submitter's ID as requester_id fallback");
        finalRequesterId = profile.id;
      } else {
        return NextResponse.json({ 
          ok: false, 
          error: "Cannot determine requester. Please verify the requesting person information." 
        }, { status: 400 });
      }
    }
    
    // Get selected approver from body (for head requesters - messenger-style routing)
    const { nextApproverId, nextApproverRole } = body;
    console.log("[/api/requests/submit] 📋 Selected approver:", { nextApproverId, nextApproverRole });
    
    const requestData = {
      request_type: requestType,
      title: finalTitle,
      purpose: finalPurpose,
      destination: finalDestination,
      // NOTE: seminar_title and seminar_venue are stored in seminar_data JSONB field, not as separate columns
      
      // Dates: use travel_start_date/travel_end_date for both seminars and travel orders
      // CRITICAL: These are NOT NULL fields, must have valid timestamps
      // NOTE: The database only has travel_start_date and travel_end_date columns, not date_from/date_to
      travel_start_date: finalTravelStartDate,
      travel_end_date: finalTravelEndDate,
      
      // Requester = person who needs the travel (from form)
      // Already calculated above with emergency lookup if needed
      requester_id: finalRequesterId,
      requester_name: requestingPersonName,
      requester_signature: isSeminar 
        ? (seminar.requesterSignature || null)
        : (isRepresentative ? null : travelOrder.requesterSignature || null), // No signature if representative (requester signs later)
      requester_is_head: requestingPersonIsHead, // Use requesting person's head status, not submitter's
      // For representative submissions: use requesting person's department_id if available,
      // otherwise use the department from the form (which should be the requesting person's department)
      // The form department (CCMS) should be used if we can't find the requesting person's department_id
      department_id: (() => {
        if (isRepresentative && !isSeminar) {
          const finalDeptId = requestingPersonUser?.department_id || departmentId;
          console.log("[/api/requests/submit] 📍 Department ID determination:");
          console.log("[/api/requests/submit]   - Requesting person dept_id:", requestingPersonUser?.department_id || "null");
          console.log("[/api/requests/submit]   - Form selected dept_id:", departmentId);
          console.log("[/api/requests/submit]   - Final dept_id:", finalDeptId);
          return finalDeptId;
        }
        return departmentId;
      })(),
      
      // Submitter = account that clicked submit (logged in user)
      submitted_by_user_id: profile.id,
      submitted_by_name: submitterName,
      is_representative: isRepresentative,
      // Only include parent_department_id if the column exists (optional for now)
      ...((selectedDepartment as any)?.parent_department_id ? { 
        parent_department_id: (selectedDepartment as any).parent_department_id 
      } : {}),
      
      participants: participants,
      head_included: participants.some((p: any) => p.is_head) || requesterIsHead,
      
      has_budget: hasBudget,
      total_budget: totalBudget,
      expense_breakdown: expenseBreakdown,
      cost_justification: costs.justification || null,
      
      vehicle_mode: vehicleMode, // "owned", "institutional", or "rent"
      needs_vehicle: needsVehicle,
      vehicle_type: vehicleMode === "rent" ? "Rental" : vehicleMode === "institutional" ? "University Vehicle" : vehicleMode === "owned" ? "Personal Vehicle" : null,
      needs_rental: vehicleMode === "rent",
      
      // Preferred suggestions (faculty can suggest, admin decides)
      // Only include if they have values to avoid undefined in DB
      ...(preferredDriverId ? { preferred_driver_id: preferredDriverId } : {}),
      ...(preferredVehicleId ? { preferred_vehicle_id: preferredVehicleId } : {}),
      
      // Transportation fields (for institutional vehicles)
      ...(body.transportation ? {
        transportation_type: body.transportation.transportation_type || null,
        pickup_location: body.transportation.pickup_location || null,
        pickup_location_lat: body.transportation.pickup_location_lat || null,
        pickup_location_lng: body.transportation.pickup_location_lng || null,
        pickup_time: body.transportation.pickup_time || null,
        pickup_contact_number: body.transportation.pickup_contact_number || null,
        pickup_special_instructions: body.transportation.pickup_special_instructions || null,
        return_transportation_same: body.transportation.return_transportation_same ?? true,
        dropoff_location: body.transportation.dropoff_location || null,
        dropoff_time: body.transportation.dropoff_time || null,
        parking_required: body.transportation.parking_required ?? false,
        own_vehicle_details: body.transportation.own_vehicle_details || null,
      } : {}),
      
      status: initialStatus,
      current_approver_role: WorkflowEngine.getApproverRole(initialStatus),
      
      // Store selected approver for head requesters (messenger-style routing)
      // This will be used when the head approves the request
      ...(nextApproverId && nextApproverRole ? {
        next_approver_id: nextApproverId,
        next_approver_role: nextApproverRole,
        // Also set specific fields based on role for backward compatibility
        ...(nextApproverRole === 'vp' ? { next_vp_id: nextApproverId } : {}),
        ...(nextApproverRole === 'admin' ? { next_admin_id: nextApproverId } : {}),
        ...(nextApproverRole === 'president' ? { next_president_id: nextApproverId } : {}),
      } : {}),
      
      // For seminar requests, save full seminar data including applicants
      ...(isSeminar ? {
        seminar_data: {
          applicationDate: seminar.applicationDate || new Date().toISOString().split('T')[0],
          title: seminar.title || "",
          dateFrom: seminar.dateFrom || new Date().toISOString(),
          dateTo: seminar.dateTo || new Date().toISOString(),
          typeOfTraining: seminar.typeOfTraining || [],
          trainingCategory: seminar.trainingCategory || "",
          sponsor: seminar.sponsor || "",
          venue: seminar.venue || "",
          venueGeo: seminar.venueGeo || null,
          modality: seminar.modality || "",
          registrationCost: seminar.registrationCost ?? null,
          totalAmount: seminar.totalAmount ?? null,
          breakdown: seminar.breakdown || [],
          makeUpClassSchedule: seminar.makeUpClassSchedule || "",
          applicantUndertaking: seminar.applicantUndertaking || false,
          fundReleaseLine: seminar.fundReleaseLine ?? null,
          requesterSignature: seminar.requesterSignature || null,
          // Applicants array - include any manually added + confirmed participants
          applicants: Array.isArray(seminar.applicants) ? seminar.applicants : [],
          // Participant invitations (for tracking)
          participantInvitations: Array.isArray(seminar.participantInvitations) ? seminar.participantInvitations : [],
          allParticipantsConfirmed: seminar.allParticipantsConfirmed || false,
        }
      } : {}),
    };

    // CRITICAL VALIDATION: Faculty alone cannot travel - must have head included
    // This applies to travel orders only (not seminars)
    if (!isSeminar && requestedStatus !== "draft") {
      const headIncluded = participants.some((p: any) => p.is_head) || requestingPersonIsHead || requesterIsHead;
      
      if (!requesterIsHead && !requestingPersonIsHead && !headIncluded) {
        console.error("[/api/requests/submit] ❌ VALIDATION FAILED: Faculty alone cannot travel");
        return NextResponse.json({
          ok: false,
          error: "Faculty members cannot travel alone. The department head must be included in the travel participants. Please add the department head to the participants list."
        }, { status: 400 });
      }
    }

    // VALIDATION: For multiple requesters, check if all are confirmed (for final submission, not draft)
    if (hasMultipleRequesters && requestedStatus !== "draft" && Array.isArray(travelOrder.requesters)) {
      const allConfirmed = travelOrder.requesters.every((req: any) => 
        req.status === 'confirmed' || req.invitationId // Either confirmed or invitation already sent
      );
      
      if (!allConfirmed) {
        const pendingCount = travelOrder.requesters.filter((req: any) => 
          req.status !== 'confirmed' && !req.invitationId
        ).length;
        
        console.error("[/api/requests/submit] ❌ VALIDATION FAILED: Not all requesters confirmed");
        return NextResponse.json({
          ok: false,
          error: `Cannot submit request: ${pendingCount} requester(s) have not been confirmed yet. Please send invitations and wait for all requesters to confirm before submitting.`
        }, { status: 400 });
      }
    }

    // Final validation: Ensure all NOT NULL fields are present
    const requiredFields = {
      request_type: requestData.request_type,
      title: requestData.title,
      purpose: requestData.purpose,
      destination: requestData.destination,
      travel_start_date: requestData.travel_start_date,
      travel_end_date: requestData.travel_end_date,
      requester_id: requestData.requester_id,
    };
    
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => value === null || value === undefined || value === "")
      .map(([key]) => key);
    
    if (missingFields.length > 0) {
      console.error("[/api/requests/submit] ❌ CRITICAL: Missing required fields:", missingFields);
      console.error("[/api/requests/submit] Required fields values:", requiredFields);
      return NextResponse.json({ 
        ok: false, 
        error: `Missing required fields: ${missingFields.join(", ")}. Please fill in all required information.` 
      }, { status: 400 });
    }
    
    // Log request data before insert (for debugging)
    console.log("[/api/requests/submit] ========== REQUEST DATA TO INSERT ==========");
    console.log("[/api/requests/submit] Request type:", requestData.request_type);
    console.log("[/api/requests/submit] Title:", requestData.title, "(length:", requestData.title?.length || 0, ")");
    console.log("[/api/requests/submit] Purpose:", requestData.purpose, "(length:", requestData.purpose?.length || 0, ")");
    console.log("[/api/requests/submit] Destination:", requestData.destination, "(length:", requestData.destination?.length || 0, ")");
    console.log("[/api/requests/submit] Requester ID:", requestData.requester_id);
    console.log("[/api/requests/submit] Department ID:", requestData.department_id);
    console.log("[/api/requests/submit] Status:", requestData.status);
    console.log("[/api/requests/submit] Travel dates:", requestData.travel_start_date, "to", requestData.travel_end_date);
    if (isSeminar) {
      console.log("[/api/requests/submit] Seminar data present:", !!requestData.seminar_data);
    }
    console.log("[/api/requests/submit] ============================================");
    
    // Insert request with retry logic for duplicate key errors
    let data: any = null;
    let error: any = null;
    const maxRetries = 5;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await supabase
        .from("requests")
        .insert(requestData)
        .select("*")
        .single();
      
      data = result.data;
      error = result.error;
      
      // If success, break out
      if (!error) {
        console.log(`[/api/requests/submit] Success on attempt ${attempt}`);
        break;
      }
      
      // If duplicate key error (race condition), retry
      if (error.code === '23505' && error.message?.includes('request_number')) {
        console.log(`[/api/requests/submit] Duplicate request_number on attempt ${attempt}, retrying...`);
        
        // Wait a bit before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
        continue;
      }
      
      // For other errors, don't retry
      console.error("[/api/requests/submit] Insert error:", error);
      break;
    }

    if (error) {
      console.error("[/api/requests/submit] ========== DATABASE INSERT ERROR ==========");
      console.error("[/api/requests/submit] Insert failed after retries:", error);
      console.error("[/api/requests/submit] Error code:", error.code);
      console.error("[/api/requests/submit] Error message:", error.message);
      console.error("[/api/requests/submit] Error details:", error.details);
      console.error("[/api/requests/submit] Error hint:", error.hint);
      console.error("[/api/requests/submit] Full error object:", JSON.stringify(error, null, 2));
      console.error("[/api/requests/submit] Request data being inserted:", JSON.stringify(requestData, null, 2));
      console.error("[/api/requests/submit] ==========================================");
      
      // Convert database errors to user-friendly messages
      let userFriendlyError = "Failed to submit request. Please try again.";
      
      if (error.code === 'PGRST204') {
        // PostgREST schema cache error - column doesn't exist
        const columnName = error.message?.match(/'([^']+)'/)?.[1] || "unknown column";
        userFriendlyError = `Database schema error: Column '${columnName}' not found. Please contact support.`;
        console.error("[/api/requests/submit] PostgREST schema error - column doesn't exist:", columnName);
      } else if (error.code === '23505') {
        userFriendlyError = "Failed to generate unique request number. Please try again.";
      } else if (error.code === '23502') {
        // NOT NULL constraint violation
        const fieldName = error.message?.match(/column "([^"]+)"/)?.[1] || "unknown field";
        userFriendlyError = `Missing required field: ${fieldName}. Please fill in all required fields.`;
        console.error("[/api/requests/submit] NOT NULL violation on field:", fieldName);
      } else if (error.message?.includes('valid_dates')) {
        userFriendlyError = "Invalid dates: Return date must be on or after departure date. Please check your travel dates.";
      } else if (error.message?.includes('check constraint')) {
        // Generic constraint violation
        if (error.message.includes('budget')) {
          userFriendlyError = "Invalid budget amount. Please check your expense breakdown.";
        } else if (error.message.includes('date')) {
          userFriendlyError = "Invalid dates. Please ensure departure and return dates are valid and in the future.";
        } else {
          userFriendlyError = "Invalid data provided. Please check all required fields.";
        }
      } else if (error.code === '23503') {
        // Foreign key violation - be more specific
        if (error.message?.includes('department')) {
          userFriendlyError = "Invalid department. Your account may not be properly configured. Please contact your administrator.";
        } else if (error.message?.includes('driver') || error.message?.includes('vehicle')) {
          userFriendlyError = "Invalid driver or vehicle selection. Please refresh the page and try again.";
        } else if (error.message?.includes('requester_id')) {
          userFriendlyError = "Invalid requester information. Please verify the requesting person exists in the system.";
        } else {
          userFriendlyError = "Invalid information provided. Please refresh the page and try again.";
        }
      } else if (error.message?.includes('not null') || error.message?.includes('NOT NULL')) {
        // NOT NULL constraint
        const fieldName = error.message?.match(/column "([^"]+)"/)?.[1] || "unknown field";
        userFriendlyError = `Missing required field: ${fieldName}. Please fill in all required fields.`;
      }
      
      // Ensure error response is properly formatted
      const errorResponse = { 
        ok: false, 
        error: userFriendlyError,
        details: process.env.NODE_ENV === 'development' ? {
          code: error.code,
          message: error.message,
          hint: error.hint
        } : undefined
      };
      
      console.error("[/api/requests/submit] Returning error response:", JSON.stringify(errorResponse, null, 2));
      
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Failed to create request" }, { status: 500 });
    }

    // Log creation in history
    // For representative submissions, log with submitter info but mention it's for the requester
    const historyComments = mightBeRepresentative && requestingPersonUser
      ? `Request submitted on behalf of ${requestingPersonName} by ${submitterName}`
      : "Request created and submitted";
    
    const now = getPhilippineTimestamp();
    await supabase.from("request_history").insert({
      request_id: data.id,
      action: "created",
      actor_id: profile.id, // Submitter's ID (the one who clicked submit)
      actor_role: mightBeRepresentative ? "submitter" : (requesterIsHead ? "head" : "faculty"),
      previous_status: null,
      new_status: initialStatus,
      comments: historyComments,
      metadata: {
        is_representative: mightBeRepresentative || false,
        requester_id: mightBeRepresentative && requestingPersonUser ? requestingPersonUser.id : profile.id,
        requester_name: requestingPersonName,
        submitter_id: profile.id,
        submitter_name: submitterName,
        submission_time: now, // Track submission time
        signature_time: null, // Will be set when signed
        receive_time: null // Will be set when received by approver
      }
    });
    
    console.log("[/api/requests/submit] History logged:", {
      action: "created",
      actor_id: profile.id,
      actor_role: mightBeRepresentative ? "submitter" : (requesterIsHead ? "head" : "faculty"),
      comments: historyComments
    });

    console.log("[/api/requests/submit] Request created:", data.id, "Status:", initialStatus);

    // Handle multiple requesters (save to requester_invitations table)
    if (hasMultipleRequesters && Array.isArray(travelOrder.requesters) && travelOrder.requesters.length > 0) {
      console.log("[/api/requests/submit] 📝 Processing multiple requesters:", travelOrder.requesters.length);
      
      try {
        // Get all current invitation IDs from the requesters array
        const currentInvitationIds = travelOrder.requesters
          .map((req: any) => req.invitationId)
          .filter((id: any) => id && id !== 'auto-confirmed'); // Filter out auto-confirmed and empty
        
        // Get all existing invitation IDs for this request from database
        const { data: existingInvitations } = await supabase
          .from("requester_invitations")
          .select("id")
          .eq("request_id", data.id);
        
        const existingIds = (existingInvitations || []).map((inv: any) => inv.id);
        
        // Find invitations to delete (exist in DB but not in current requesters)
        const idsToDelete = existingIds.filter((id: string) => !currentInvitationIds.includes(id));
        
        // Delete removed requester invitations
        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from("requester_invitations")
            .delete()
            .in("id", idsToDelete);
          
          if (deleteError) {
            console.error("[/api/requests/submit] ❌ Failed to delete removed invitations:", deleteError);
          } else {
            console.log("[/api/requests/submit] ✅ Deleted", idsToDelete.length, "removed requester invitation(s)");
          }
        } else if (existingIds.length > 0 && currentInvitationIds.length === 0) {
          // If we had invitations but now have none, delete all
          const { error: deleteAllError } = await supabase
            .from("requester_invitations")
            .delete()
            .eq("request_id", data.id);
          
          if (deleteAllError) {
            console.error("[/api/requests/submit] ❌ Failed to delete all invitations:", deleteAllError);
          } else {
            console.log("[/api/requests/submit] ✅ Deleted all requester invitations (all were removed)");
          }
        }
        
        // Separate requesters into: already invited (have invitationId) and new ones
        const alreadyInvited = travelOrder.requesters.filter((req: any) => req.invitationId && req.invitationId !== 'auto-confirmed');
        const newRequesters = travelOrder.requesters.filter((req: any) => !req.invitationId || req.invitationId === 'auto-confirmed');
        
        // Update existing invitations to link to this request (if they were created for a draft)
        if (alreadyInvited.length > 0) {
          const invitationIds = alreadyInvited.map((req: any) => req.invitationId).filter(Boolean);
          if (invitationIds.length > 0) {
            const { error: updateError } = await supabase
              .from("requester_invitations")
              .update({ request_id: data.id })
              .in("id", invitationIds);
            
            if (updateError) {
              console.error("[/api/requests/submit] ❌ Failed to update existing invitations:", updateError);
            } else {
              console.log("[/api/requests/submit] ✅ Updated", invitationIds.length, "existing requester invitations");
            }
          }
        }
        
        // Create new requester invitations for requesters without invitationId (or auto-confirmed)
        const requestersToCreate = newRequesters.filter((req: any) => req.name && req.email);
        if (requestersToCreate.length > 0) {
          const requesterInvitations = requestersToCreate.map((req: any) => ({
            request_id: data.id,
            email: req.email.toLowerCase(),
            name: req.name,
            user_id: req.user_id || null,
            department: req.department || null,
            department_id: req.department_id || null,
            invited_by: profile.id,
            status: req.invitationId === 'auto-confirmed' ? 'confirmed' : 'pending', // Auto-confirmed if current user
            token: crypto.randomBytes(32).toString('hex'), // Generate new token
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            signature: req.signature || null,
          }));

          const { error: inviteError } = await supabase
            .from("requester_invitations")
            .insert(requesterInvitations);

          if (inviteError) {
            console.error("[/api/requests/submit] ❌ Failed to create requester invitations:", inviteError);
            // Don't fail the request creation, just log the error
          } else {
            console.log("[/api/requests/submit] ✅ Created", requesterInvitations.length, "new requester invitations");
          }
        }
      } catch (err: any) {
        console.error("[/api/requests/submit] ❌ Error processing multiple requesters:", err);
        // Don't fail the request creation
      }
    } else {
      // If no multiple requesters, delete all existing invitations for this request
      // (in case requesters were removed)
      const { error: deleteError } = await supabase
        .from("requester_invitations")
        .delete()
        .eq("request_id", data.id);
      
      if (deleteError) {
        console.error("[/api/requests/submit] ❌ Failed to delete requester invitations:", deleteError);
      } else {
        console.log("[/api/requests/submit] ✅ Deleted all requester invitations (no multiple requesters)");
      }
    }

    // Log to audit_logs
    try {
      let clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
      if (clientIp) {
        clientIp = clientIp.split(",")[0].trim();
      }
      if (clientIp && !clientIp.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        clientIp = null;
      }
      const userAgent = req.headers.get("user-agent") || null;

      const auditInsertData: any = {
        user_id: profile.id,
        action: mightBeRepresentative ? "create_request_representative" : "create_request",
        entity_type: "request",
        entity_id: data.id,
        new_value: {
          request_number: data.request_number,
          request_type: requestType,
          status: initialStatus,
          destination: travelOrder.destination,
          purpose: travelOrder.purposeOfTravel,
          requester_id: finalRequesterId || profile.id,
          requester_name: mightBeRepresentative ? requestingPersonName : profile.name,
          submitted_by_id: profile.id,
          submitted_by_name: submitterName,
          has_budget: hasBudget,
          needs_vehicle: needsVehicle,
        },
        user_agent: userAgent,
      };

      if (clientIp) {
        auditInsertData.ip_address = clientIp;
      }

      const { error: auditError } = await supabase
        .from("audit_logs")
        .insert(auditInsertData);

      if (auditError) {
        console.error("[/api/requests/submit] ❌ Failed to log to audit_logs:", auditError);
      } else {
        console.log("[/api/requests/submit] ✅ Request creation logged to audit_logs");
      }
    } catch (auditErr: any) {
      console.error("[/api/requests/submit] ❌ Exception logging to audit_logs:", auditErr);
      // Don't fail request if audit logging fails
    }

    // Create notifications
    try {
      // 1. Notify submitter that request was submitted
      await createNotification({
        user_id: profile.id,
        notification_type: "request_submitted",
        title: "Request Submitted",
        message: `Your travel order request ${data.request_number || 'has been submitted'} and is now pending approval.`,
        related_type: "request",
        related_id: data.id,
        action_url: `/user/submissions?view=${data.id}`,
        action_label: "View Request",
        priority: "normal",
      });

      // 2. If representative submission, notify requester that they need to sign
      if (mightBeRepresentative && finalRequesterId && finalRequesterId !== profile.id) {
        await createNotification({
          user_id: finalRequesterId,
          notification_type: "request_pending_signature",
          title: "Signature Required",
          message: `${submitterName} submitted a travel order request on your behalf. Please sign to proceed.`,
          related_type: "request",
          related_id: data.id,
          action_url: `/user/inbox`,
          action_label: "Sign Request",
          priority: "high",
        });
      }

      // 3. If request goes directly to admin (head requester or head approved), notify all admins
      if (initialStatus === "pending_admin") {
        console.log("[/api/requests/submit] 📧 Notifying admins about new pending request");
        
        // Find all active admin users
        const { data: admins, error: adminsError } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("role", "admin")
          .eq("is_admin", true)
          .eq("status", "active");

        if (adminsError) {
          console.error("[/api/requests/submit] ❌ Failed to fetch admins:", adminsError);
        } else if (admins && admins.length > 0) {
          console.log(`[/api/requests/submit] ✅ Found ${admins.length} admin(s) to notify`);
          
          // Notify each admin
          const adminNotifications = admins.map((admin: any) =>
            createNotification({
              user_id: admin.id,
              notification_type: "request_pending_signature",
              title: "New Request Requires Review",
              message: `A travel order request ${data.request_number || ''} from ${requestingPersonName || submitterName} requires your review.`,
              related_type: "request",
              related_id: data.id,
              action_url: `/admin/inbox?view=${data.id}`,
              action_label: "Review Request",
              priority: "high",
            })
          );

          await Promise.allSettled(adminNotifications);
          console.log("[/api/requests/submit] ✅ Admin notifications sent");
        } else {
          console.warn("[/api/requests/submit] ⚠️ No active admins found to notify");
        }
      }
    } catch (notifError: any) {
      console.error("[/api/requests/submit] Failed to create notifications:", notifError);
      // Don't fail the request if notifications fail
    }

    // Auto-send participant invitations for seminar requests
    // This runs asynchronously and won't block the response
    if (reason === "seminar" && body.seminar?.participantInvitations) {
      const participantInvitations = Array.isArray(body.seminar.participantInvitations) 
        ? body.seminar.participantInvitations 
        : [];
      
      if (participantInvitations.length > 0) {
        console.log(`[/api/requests/submit] Auto-sending ${participantInvitations.length} participant invitations...`);
        
        // Process invitations asynchronously (fire and forget - don't block response)
        // Use Promise.resolve().then() to run after response is sent
        Promise.resolve().then(async () => {
          try {
            const invitationPromises = participantInvitations
              .filter((inv: any) => inv.email && !inv.invitationId) // Only send if email exists and not already sent
              .map(async (inv: any) => {
                try {
                  const token = crypto.randomBytes(32).toString('hex');
                  const expiresAt = new Date();
                  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration
                  
                  const { data: invitation, error: inviteError } = await supabase
                    .from("participant_invitations")
                    .insert({
                      request_id: data.id,
                      email: inv.email.toLowerCase(),
                      invited_by: profile.id,
                      token,
                      expires_at: expiresAt.toISOString(),
                      status: 'pending',
                    })
                    .select()
                    .single();
                  
                  if (!inviteError && invitation) {
                    // Send email notification
                    // Fix: Properly handle baseUrl with fallback
                    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
                    if (!baseUrl && process.env.VERCEL_URL) {
                      baseUrl = `https://${process.env.VERCEL_URL}`;
                    }
                    if (!baseUrl) {
                      baseUrl = "http://localhost:3000";
                    }
                    const confirmationLink = `${baseUrl}/participants/confirm/${token}`;

                    const seminarTitle = body.seminar?.title || "Seminar/Training";
                    const requesterName = profile.name || "Requester";
                    const requesterProfilePicture = profile.profile_picture || null;
                    const dateFrom = body.seminar?.dateFrom || "";
                    const dateTo = body.seminar?.dateTo || "";

                    const emailHtml = generateParticipantInvitationEmail({
                      participantName: undefined,
                      requesterName,
                      requesterProfilePicture,
                      seminarTitle,
                      dateFrom,
                      dateTo,
                      confirmationLink,
                    });

                    const emailResult = await sendEmail({
                      to: inv.email.toLowerCase(),
                      subject: `Seminar Participation Invitation: ${seminarTitle}`,
                      html: emailHtml,
                    });

                    if (emailResult.success) {
                      console.log(`[/api/requests/submit] ✅ Invitation created and email sent to ${inv.email}`);
                    } else {
                      console.warn(`[/api/requests/submit] ⚠️ Invitation created but email failed for ${inv.email}:`, emailResult.error);
                    }
                  } else {
                    console.warn(`[/api/requests/submit] ⚠️ Failed to create invitation for ${inv.email}:`, inviteError?.message);
                  }
                } catch (err: any) {
                  console.error(`[/api/requests/submit] Error creating invitation for ${inv.email}:`, err.message);
                }
              });
            
            await Promise.allSettled(invitationPromises);
            console.log(`[/api/requests/submit] ✅ All participant invitations processed`);
          } catch (err: any) {
            console.error(`[/api/requests/submit] Error processing invitations:`, err.message);
          }
        });
      }
    }

    return NextResponse.json({ ok: true, data });

  } catch (error: any) {
    console.error("[/api/requests/submit] ========== UNEXPECTED ERROR ==========");
    console.error("[/api/requests/submit] Error:", error);
    console.error("[/api/requests/submit] Error name:", error?.name);
    console.error("[/api/requests/submit] Error message:", error?.message);
    console.error("[/api/requests/submit] Error stack:", error?.stack);
    console.error("[/api/requests/submit] ======================================");
    const errorMessage = error?.message || error?.toString() || "An unexpected error occurred while processing your request";
    return NextResponse.json({ 
      ok: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}

