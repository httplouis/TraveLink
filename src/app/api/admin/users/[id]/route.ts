// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * PATCH /api/admin/users/[id]
 * Update user role and permissions (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);
    const { id } = await params;
    const userId = id;
    const body = await req.json();

    // Check if user is admin first
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify password is required for all updates
    if (!body.password) {
      return NextResponse.json({ ok: false, error: "Password confirmation required" }, { status: 400 });
    }

    // Verify password by attempting to sign in (need anon key client for this)
    const cookieStore = await cookies();
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Don't actually set cookies during verification
          },
          remove(name: string, options: any) {
            // Don't actually remove cookies during verification
          },
        },
      }
    );

    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: authUser.email!,
      password: body.password,
    });

    if (signInError) {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
    }

    // Remove password from body before processing
    delete body.password;

    // Use service role client for queries (bypasses RLS completely)
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

    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin, email")
      .eq("auth_user_id", authUser.id)
      .single();

    // Only super admins (users with is_admin=true AND role='admin') can manage users
    if (!profile || !profile.is_admin || profile.role !== "admin") {
      console.log(`[PATCH /api/admin/users/[id]] Access denied for user: ${profile?.email || 'unknown'}, role: ${profile?.role}, is_admin: ${profile?.is_admin}`);
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Get current user data before update
    const { data: currentUser } = await supabase
      .from("users")
      .select("role, exec_type, is_head, is_hr, is_vp, is_president, is_admin")
      .eq("id", userId)
      .single();

    // Build update data
    const updateData: any = {};

    // Map frontend role values to database role values
    // Database uses 'exec' for both VP and President
    // Database constraint allows: admin, head, hr, exec, driver, faculty, staff, comptroller
    if (body.role) {
      if (body.role === "vp" || body.role === "president") {
        // Map VP and President to 'exec' in database
        updateData.role = "exec";
      } else {
        updateData.role = body.role;
      }
    }

    // Update department_id ONLY if explicitly provided (preserve existing if not provided)
    // This ensures department is NOT removed when changing roles
    if (body.department_id !== undefined) {
      // Only update if explicitly set (even if null - user wants to remove it)
      updateData.department_id = body.department_id || null;
    }
    // If department_id is NOT in body, it will NOT be in updateData, so existing value is preserved

    // Update permission flags
    // Note: is_head can be set independently for VP/President (users can be both Head and VP/President)
    if (typeof body.is_head === "boolean") {
      // Always respect explicit is_head setting from body
      updateData.is_head = body.is_head;
      
      // If setting is_head=true and role is not VP/President, also set role='head' if not already set
      if (body.is_head === true && !updateData.role && originalRole !== "vp" && originalRole !== "president" && !body.role) {
        updateData.role = "head";
      }
      // If setting is_head=false and current role is 'head', clear role (unless role is being changed)
      if (body.is_head === false && currentUser?.role === "head" && !body.role && !updateData.role) {
        updateData.role = "faculty"; // Default to faculty
      }
    }
    if (typeof body.is_admin === "boolean") {
      updateData.is_admin = body.is_admin;
      // If setting is_admin=true, also set role='admin' if not already set
      if (body.is_admin === true && !updateData.role) {
        updateData.role = "admin";
      }
    }
    if (typeof body.is_vp === "boolean") {
      updateData.is_vp = body.is_vp;
      // If setting is_vp=true, also set role='exec' (database uses 'exec' for VP)
      if (body.is_vp === true && !updateData.role) {
        updateData.role = "exec";
      }
    }
    if (typeof body.is_president === "boolean") {
      updateData.is_president = body.is_president;
      // If setting is_president=true, also set role='exec' (database uses 'exec' for President)
      if (body.is_president === true && !updateData.role) {
        updateData.role = "exec";
      }
    }
    if (typeof body.is_hr === "boolean") {
      updateData.is_hr = body.is_hr;
      // If setting is_hr=true, also set role='hr' if not already set
      if (body.is_hr === true && !updateData.role) {
        updateData.role = "hr";
      }
    }
    // Note: is_comptroller column does not exist in users table
    // Comptroller role is handled through the 'role' field only

    // If role is being set directly, also set corresponding flags
    // Note: We use the mapped role (exec for vp/president) for database, but original for flags
    const originalRole = body.role;
    const dbRole = updateData.role || originalRole; // Use mapped role if available
    
    // If role is changing, clear ALL flags first, then set the appropriate ones
    // Compare database roles (both current and new should be in DB format)
    const currentDbRole = currentUser?.role; // This is already in DB format (could be "exec")
    const isRoleChanging = originalRole && currentDbRole !== dbRole;
    
    // Also check if we're changing between exec subtypes (vp <-> president)
    const isChangingExecSubtype = originalRole && 
      currentDbRole === "exec" && 
      dbRole === "exec" && 
      ((originalRole === "vp" && (currentUser?.exec_type === "president" || currentUser?.is_president)) ||
       (originalRole === "president" && (currentUser?.exec_type === "vp" || currentUser?.is_vp)));
    
    if (isRoleChanging || isChangingExecSubtype) {
      // Determine is_head value: prioritize explicit body.is_head, then preserve if user was already a head and changing to VP/President
      // Users can be both Head and VP/President at the same time
      let finalIsHead: boolean | undefined = undefined;
      if (typeof body.is_head === "boolean") {
        // Explicitly set in body - use that value
        finalIsHead = body.is_head;
      } else if (currentUser?.is_head === true && (originalRole === "vp" || originalRole === "president")) {
        // Preserve is_head if user was already a head and changing to VP/President
        finalIsHead = true;
      }
      
      // Clear permission flags when role changes (but preserve is_head for VP/President if needed)
      updateData.is_admin = false;
      updateData.is_vp = false;
      updateData.is_president = false;
      updateData.is_hr = false;
      // Note: is_comptroller does not exist, so no need to clear it
      
      // Now set the appropriate flags for the new role
      if (originalRole === "head") {
        updateData.is_head = true;
        updateData.exec_type = null; // Clear exec_type when not exec
      } else if (originalRole === "admin") {
        updateData.is_admin = true;
        updateData.is_head = false; // Admin and Head are mutually exclusive
        updateData.exec_type = null; // Clear exec_type when not exec
      } else if (originalRole === "vp") {
        updateData.is_vp = true;
        // Use finalIsHead if determined, otherwise default to false
        updateData.is_head = finalIsHead !== undefined ? finalIsHead : false;
        updateData.exec_type = "vp"; // Set exec_type for VP
        // Role is already mapped to 'exec' above
      } else if (originalRole === "president") {
        updateData.is_president = true;
        // Use finalIsHead if determined, otherwise default to false
        updateData.is_head = finalIsHead !== undefined ? finalIsHead : false;
        updateData.exec_type = "president"; // Set exec_type for President
        // Role is already mapped to 'exec' above
      } else if (originalRole === "hr") {
        updateData.is_hr = true;
        updateData.is_head = false; // HR and Head are mutually exclusive
        updateData.exec_type = null; // Clear exec_type when not exec
      } else if (originalRole === "comptroller") {
        // Comptroller role - no flag needed, just set role
        updateData.is_head = false;
        updateData.exec_type = null; // Clear exec_type when not exec
        // Note: is_comptroller column does not exist
      } else {
        // For faculty, staff, driver - flags remain false (already cleared above)
        updateData.is_head = false;
        updateData.exec_type = null; // Clear exec_type when not exec
      }
    } else if (originalRole) {
      // Role is not changing, but ensure flags match the role
      // Preserve is_head for VP/President if user was already a head
      const shouldPreserveHeadForSameRole = currentUser?.is_head === true && 
        (originalRole === "vp" || originalRole === "president");
      
      if (originalRole === "head") {
        updateData.is_head = true;
        updateData.exec_type = null;
      } else if (originalRole === "admin") {
        updateData.is_admin = true;
        updateData.is_head = false; // Admin and Head are mutually exclusive
        updateData.exec_type = null;
      } else if (originalRole === "vp") {
        updateData.is_vp = true;
        // Preserve is_head if user was already a head (can be both Head and VP)
        if (shouldPreserveHeadForSameRole && body.is_head !== false) {
          updateData.is_head = true;
        }
        updateData.exec_type = "vp";
      } else if (originalRole === "president") {
        updateData.is_president = true;
        // Preserve is_head if user was already a head (can be both Head and President)
        if (shouldPreserveHeadForSameRole && body.is_head !== false) {
          updateData.is_head = true;
        }
        updateData.exec_type = "president";
      } else if (originalRole === "hr") {
        updateData.is_hr = true;
        updateData.is_head = false; // HR and Head are mutually exclusive
        updateData.exec_type = null;
      } else {
        updateData.is_head = false; // Clear is_head for other roles
        updateData.exec_type = null;
      }
    }


    // CRITICAL: If making user admin (either via role='admin' OR is_admin=true), 
    // create admins table entry BEFORE updating users table (database trigger requires it)
    const isBecomingAdmin = (updateData.role === "admin" || body.role === "admin") || 
                            (updateData.is_admin === true || body.is_admin === true);
    const wasNotAdmin = currentUser?.role !== "admin" && !currentUser?.is_admin;

    console.log(`[PATCH /api/admin/users/[id]] Admin check:`, {
      isBecomingAdmin,
      wasNotAdmin,
      updateDataRole: updateData.role,
      bodyRole: body.role,
      updateDataIsAdmin: updateData.is_admin,
      bodyIsAdmin: body.is_admin,
      currentUserRole: currentUser?.role,
      currentUserIsAdmin: currentUser?.is_admin
    });

    if (isBecomingAdmin && wasNotAdmin) {
      console.log("[PATCH /api/admin/users/[id]] Assigning admin role using database function to handle circular dependency...");
      
      // Check if super_admin is explicitly set in body, default to false for normal admin
      const shouldBeSuperAdmin = body.super_admin === true;
      
      // Use the database function to handle the circular dependency
      // This function temporarily disables both triggers (users and admins), updates the role, inserts into admins, and re-enables the triggers
      try {
        // Use the RPC function first, then update super_admin flag
        const { data: rpcData, error: rpcError } = await supabase.rpc('assign_admin_role', {
          p_user_id: userId,
        });
        
        if (rpcError) {
          throw rpcError;
        }
        
        // After RPC, update super_admin to false by default (unless explicitly set to true)
        const { error: adminUpdateError } = await supabase
          .from("admins")
          .update({ super_admin: shouldBeSuperAdmin })
          .eq("user_id", userId);
        
        if (adminUpdateError) {
          console.error("[PATCH /api/admin/users/[id]] Error updating super_admin flag:", adminUpdateError);
          // Don't fail the whole operation, just log it
        }
        
        console.log("[PATCH /api/admin/users/[id]] ✅ Admin role assigned successfully (super_admin: " + shouldBeSuperAdmin + ")");
        // The function already updated role='admin' and is_admin=true
        updateData.role = "admin";
        updateData.is_admin = true;
        // Clear exec_type since user is now admin, not exec
        updateData.exec_type = null;
      } catch (rpcError: any) {
        // If manual approach fails, try the RPC function as fallback
        console.error("[PATCH /api/admin/users/[id]] Manual admin assignment failed, trying RPC function:", rpcError);
        
        try {
          const { data: rpcData, error: rpcError2 } = await supabase.rpc('assign_admin_role', {
            p_user_id: userId,
          });
          
          if (rpcError2) {
            throw rpcError2;
          }
          
          // After RPC, update super_admin to false if not explicitly set to true
          if (!shouldBeSuperAdmin) {
            await supabase
              .from("admins")
              .update({ super_admin: false })
              .eq("user_id", userId);
          }
          
          console.log("[PATCH /api/admin/users/[id]] ✅ Admin role assigned via RPC (super_admin: " + shouldBeSuperAdmin + ")");
          updateData.role = "admin";
          updateData.is_admin = true;
          updateData.exec_type = null;
        } catch (fallbackError: any) {
          console.error("[PATCH /api/admin/users/[id]] Both methods failed:", {
            manual: rpcError?.message,
            rpc: fallbackError?.message
          });
          
          return NextResponse.json({ 
            ok: false, 
            error: `Failed to assign admin role: ${fallbackError?.message || rpcError?.message || 'Unknown error'}` 
          }, { status: 500 });
        }
      }
    } else if (isBecomingAdmin && !wasNotAdmin) {
      // User is already an admin, but make sure the entry exists
      console.log("[PATCH /api/admin/users/[id]] User is already an admin, ensuring admins entry exists...");
      const { data: existingAdmin } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (!existingAdmin) {
        console.log("[PATCH /api/admin/users/[id]] Admin entry missing, creating it...");
        // Default to false for normal admin unless explicitly set to true
        const shouldBeSuperAdmin = body.super_admin === true;
        const { error: adminError } = await supabase
          .from("admins")
          .insert({
            user_id: userId,
            super_admin: shouldBeSuperAdmin,
          });
        
        if (adminError) {
          console.error("[PATCH /api/admin/users/[id]] Error creating missing admin entry:", adminError);
          return NextResponse.json({ 
            ok: false, 
            error: `Failed to create admin entry: ${adminError.message}` 
          }, { status: 500 });
        }
      } else if (body.super_admin !== undefined) {
        // Update super_admin flag if explicitly provided
        const { error: updateError } = await supabase
          .from("admins")
          .update({ super_admin: body.super_admin === true })
          .eq("user_id", userId);
        
        if (updateError) {
          console.error("[PATCH /api/admin/users/[id]] Error updating super_admin flag:", updateError);
        }
      }
    }

    // If removing admin role, remove from admins table
    const isRemovingAdmin = (updateData.role && updateData.role !== "admin" && currentUser?.role === "admin") ||
                            (updateData.is_admin === false && currentUser?.is_admin === true);
    
    if (isRemovingAdmin) {
      console.log("[PATCH /api/admin/users/[id]] Removing admin entry...");
      const { error: removeError } = await supabase
        .from("admins")
        .delete()
        .eq("user_id", userId);
      
      if (removeError) {
        console.error("[PATCH /api/admin/users/[id]] Error removing admin entry:", removeError);
      }
    }

    // CRITICAL: If making user faculty (role='faculty'), 
    // create faculties table entry BEFORE updating users table (database trigger requires it)
    // We need to handle the circular dependency: 
    // - guard_users_role_change() requires faculties entry to exist
    // - enforce_role_for_subtables() requires role to be 'faculty'
    // Solution: Use a database function that temporarily disables triggers
    const isBecomingFaculty = (updateData.role === "faculty" || body.role === "faculty");
    const wasNotFaculty = currentUser?.role !== "faculty";

    if (isBecomingFaculty && wasNotFaculty) {
      console.log("[PATCH /api/admin/users/[id]] Creating faculties table entry before role change...");
      
      const deptId = updateData.department_id || currentUser?.department_id || null;
      
      // Use the helper function to handle the circular dependency
      const { error: facultyError } = await supabase.rpc('assign_faculty_role', {
        p_user_id: userId,
        p_department_id: deptId || null,
      });
      
      if (facultyError) {
        console.error("[PATCH /api/admin/users/[id]] Error calling assign_faculty_role:", facultyError);
        return NextResponse.json({ 
          ok: false, 
          error: `Failed to create faculty entry: ${facultyError.message}` 
        }, { status: 500 });
      } else {
        console.log("[PATCH /api/admin/users/[id]] ✅ Faculty entry created successfully via helper function");
      }
    }

    // If removing faculty role, remove from faculties table
    const isRemovingFaculty = (updateData.role && updateData.role !== "faculty" && currentUser?.role === "faculty");
    
    if (isRemovingFaculty) {
      console.log("[PATCH /api/admin/users/[id]] Removing faculty entry...");
      const { error: removeFacultyError } = await supabase
        .from("faculties")
        .delete()
        .eq("user_id", userId);
      
      if (removeFacultyError) {
        console.error("[PATCH /api/admin/users/[id]] Error removing faculty entry:", removeFacultyError);
      }
    }

    // CRITICAL: If making user driver (role='driver'), 
    // create drivers table entry BEFORE updating users table (database trigger requires it)
    // Similar to faculty/admin, we need to handle the circular dependency
    const isBecomingDriver = (updateData.role === "driver" || body.role === "driver");
    const wasNotDriver = currentUser?.role !== "driver";

    if (isBecomingDriver && wasNotDriver) {
      console.log("[PATCH /api/admin/users/[id]] Creating drivers table entry before role change...");
      
      // Use the helper function to handle the circular dependency (similar to faculty)
      const { error: driverError } = await supabase.rpc('assign_driver_role', {
        p_user_id: userId,
      }).catch(async () => {
        // If rpc doesn't exist, try direct approach
        // First, temporarily set role to driver
        const { error: roleError } = await supabase
          .from("users")
          .update({ role: "driver" })
          .eq("id", userId);
        
        if (roleError) {
          return { error: roleError };
        }
        
        // Now insert into drivers
        return await supabase
          .from("drivers")
          .upsert({
            user_id: userId,
            license_no: null, // Can be set later
            license_expiry: null,
            driver_rating: null,
          }, {
            onConflict: "user_id"
          });
      });
      
      if (driverError) {
        console.error("[PATCH /api/admin/users/[id]] Error creating driver entry:", driverError);
        // Try alternative: use raw SQL query directly
        const { error: sqlError } = await supabase
          .from("users")
          .update({ role: "driver" })
          .eq("id", userId);
        
        if (!sqlError) {
          // Now insert into drivers
          const { error: insertError } = await supabase
            .from("drivers")
            .upsert({
              user_id: userId,
              license_no: null,
              license_expiry: null,
              driver_rating: null,
            }, {
              onConflict: "user_id"
            });
          
          if (insertError) {
            console.error("[PATCH /api/admin/users/[id]] Error inserting into drivers after role change:", insertError);
            return NextResponse.json({ 
              ok: false, 
              error: `Failed to create driver entry: ${insertError.message}` 
            }, { status: 500 });
          } else {
            console.log("[PATCH /api/admin/users/[id]] ✅ Driver entry created successfully (alternative method)");
          }
        } else {
          return NextResponse.json({ 
            ok: false, 
            error: `Failed to set role to driver: ${sqlError.message}` 
          }, { status: 500 });
        }
      } else {
        console.log("[PATCH /api/admin/users/[id]] ✅ Driver entry created successfully");
      }
    }

    // If removing driver role, remove from drivers table
    const isRemovingDriver = (updateData.role && updateData.role !== "driver" && currentUser?.role === "driver");
    
    if (isRemovingDriver) {
      console.log("[PATCH /api/admin/users/[id]] Removing driver entry...");
      const { error: removeDriverError } = await supabase
        .from("drivers")
        .delete()
        .eq("user_id", userId);
      
      if (removeDriverError) {
        console.error("[PATCH /api/admin/users/[id]] Error removing driver entry:", removeDriverError);
      }
    }

    // Handle department_heads mappings based on is_head flag
    // Check if is_head is being changed
    const wasHead = currentUser?.is_head === true;
    const willBeHead = updateData.is_head === true;
    
    if (willBeHead && body.department_id) {
      // User is becoming/remaining a head with a department - create/update mapping
      // First, invalidate any existing active mappings for this user
      console.log(`[PATCH /api/admin/users/[id]] Invalidating old department_heads mappings: user_id=${userId}`);
      await supabase
        .from("department_heads")
        .update({ valid_to: new Date().toISOString() })
        .eq("user_id", userId)
        .is("valid_to", null);
      
      // Then create a new active mapping
      console.log(`[PATCH /api/admin/users/[id]] Creating new department_heads mapping: user_id=${userId}, department_id=${body.department_id}`);
      const { error: headError } = await supabase
        .from("department_heads")
        .insert({
          user_id: userId,
          department_id: body.department_id,
          valid_from: new Date().toISOString(),
          valid_to: null,
          created_by: profile.id,
        });
      
      if (headError) {
        console.error("[PATCH /api/admin/users/[id]] Error creating head mapping:", headError);
        // Don't fail the whole update if this fails, but log it
      } else {
        console.log("[PATCH /api/admin/users/[id]] ✅ Department head mapping created");
      }
    } else if (wasHead && !willBeHead) {
      // User is losing head role - invalidate all department_heads mappings
      console.log(`[PATCH /api/admin/users/[id]] Invalidating department_heads mappings: user_id=${userId}`);
      const { error: headError } = await supabase
        .from("department_heads")
        .update({ valid_to: new Date().toISOString() })
        .eq("user_id", userId)
        .is("valid_to", null);
      
      if (headError) {
        console.error("[PATCH /api/admin/users/[id]] Error removing head mappings:", headError);
      } else {
        console.log("[PATCH /api/admin/users/[id]] ✅ Department head mappings invalidated");
      }
    }

    // Current user data already fetched above

    // Log what we're about to update
    console.log(`[PATCH /api/admin/users/[id]] Updating user ${userId} with data:`, JSON.stringify(updateData, null, 2));
    
    // Update user
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select(`
        id,
        name,
        email,
        role,
        exec_type,
        is_head,
        is_admin,
        is_vp,
        is_president,
        is_hr,
        status,
        department_id
      `)
      .single();

    if (error) {
      console.error("[PATCH /api/admin/users/[id]] Error updating user:", error);
      console.error("[PATCH /api/admin/users/[id]] Error details:", JSON.stringify(error, null, 2));
      console.error("[PATCH /api/admin/users/[id]] Update data that failed:", JSON.stringify(updateData, null, 2));
      return NextResponse.json({ 
        ok: false, 
        error: error.message || "Failed to update user",
        details: error.details || error.hint || undefined
      }, { status: 500 });
    }

    // Fetch department separately to avoid relationship query issues
    let department = null;
    if (updatedUser.department_id) {
      const { data: deptData } = await supabase
        .from("departments")
        .select("id, name, code")
        .eq("id", updatedUser.department_id)
        .maybeSingle();
      
      if (deptData) {
        department = {
          id: deptData.id,
          name: deptData.name,
          code: deptData.code,
        };
      }
    }

    // Fetch super_admin flag from admins table if user is admin
    let is_super_admin = false;
    if (updatedUser.role === "admin" || updatedUser.is_admin) {
      const { data: adminData } = await supabase
        .from("admins")
        .select("super_admin")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (adminData) {
        is_super_admin = adminData.super_admin || false;
      }
    }

    // Map "exec" role to "vp" or "president" for frontend display
    let displayRole = updatedUser.role;
    if (updatedUser.role === "exec") {
      if (updatedUser.is_president || updatedUser.exec_type === "president") {
        displayRole = "president";
      } else if (updatedUser.is_vp || updatedUser.exec_type === "vp") {
        displayRole = "vp";
      } else {
        // Default to vp if unclear
        displayRole = "vp";
      }
    }

    // Add department and super_admin to response
    const responseData = {
      ...updatedUser,
      role: displayRole, // Use mapped role for frontend
      department,
      is_super_admin,
    };

    // Log role changes to role_grants table for audit
    console.log(`[PATCH /api/admin/users/[id]] Role grant creation check:`, {
      updateDataRole: updateData.role,
      currentUserRole: currentUser?.role,
      updateDataIsHead: updateData.is_head,
      currentUserIsHead: currentUser?.is_head,
      updateDataIsHr: updateData.is_hr,
      currentUserIsHr: currentUser?.is_hr,
      updateDataIsVp: updateData.is_vp,
      currentUserIsVp: currentUser?.is_vp,
      updateDataIsPresident: updateData.is_president,
      currentUserIsPresident: currentUser?.is_president,
    });

    // Role mapping for role_grants table
    // Now role_grants supports ALL roles for complete history tracking
    const roleMapping: Record<string, string> = {
      'head': 'head',
      'hr': 'hr',
      'vp': 'exec', // vp maps to exec in role_grants (both VP and President use 'exec')
      'president': 'exec', // president maps to exec in role_grants
      'admin': 'admin',
      'comptroller': 'comptroller',
      'faculty': 'faculty', // Now tracked in role_grants for history
      'staff': 'staff', // Now tracked in role_grants for history
      'driver': 'driver', // Now tracked in role_grants for history
    };

    // Handle role changes: Revoke old role grant and create new one
    if (updateData.role && updateData.role !== currentUser?.role) {
      const oldRole = currentUser?.role;
      const newRole = updateData.role;
      
      // Map roles for role_grants (only roles in the constraint)
      const oldGrantRole = oldRole ? roleMapping[oldRole] : null;
      const newGrantRole = roleMapping[newRole];
      
      // ALWAYS create role grants for complete history tracking
      // First, ensure old role grant exists and revoke it
      if (oldGrantRole) {
        // Check if old role grant exists
        const { data: existingOldGrant } = await supabase
          .from("role_grants")
          .select("id, revoked_at")
          .eq("user_id", userId)
          .eq("role", oldGrantRole)
          .maybeSingle();
        
        if (existingOldGrant) {
          // Revoke existing old role grant if it's still active
          if (!existingOldGrant.revoked_at) {
            console.log(`[PATCH /api/admin/users/[id]] Revoking old role grant: user_id=${userId}, old_role=${oldGrantRole}, revoked_by=${profile.id}`);
            const { error: revokeError } = await supabase
              .from("role_grants")
              .update({
                revoked_at: new Date().toISOString(),
                revoked_by: profile.id,
                reason: `Role changed from ${oldRole} to ${newRole} by super admin`,
              })
              .eq("user_id", userId)
              .eq("role", oldGrantRole)
              .is("revoked_at", null);
            
            if (revokeError) {
              console.error(`[PATCH /api/admin/users/[id]] Error revoking old role grant:`, revokeError);
            } else {
              console.log(`[PATCH /api/admin/users/[id]] ✅ Old role grant revoked`);
            }
          }
        } else {
          // Create old role grant entry (immediately revoked) to show complete history
          // Use upsert in case there's already a revoked entry (UNIQUE constraint)
          console.log(`[PATCH /api/admin/users/[id]] Creating historical role grant for old role: user_id=${userId}, old_role=${oldGrantRole}`);
          const { error: createOldError } = await supabase
            .from("role_grants")
            .upsert({
              user_id: userId,
              role: oldGrantRole,
              granted_by: profile.id, // Use current admin as granted_by (historical)
              granted_at: new Date(Date.now() - 1000).toISOString(), // 1 second ago
              revoked_at: new Date().toISOString(), // Immediately revoked
              revoked_by: profile.id,
              reason: `Role changed from ${oldRole} to ${newRole} by super admin (historical entry)`,
            }, {
              onConflict: "user_id,role"
            });
          
          if (createOldError) {
            console.error(`[PATCH /api/admin/users/[id]] Error creating historical old role grant:`, createOldError);
          } else {
            console.log(`[PATCH /api/admin/users/[id]] ✅ Historical old role grant created`);
          }
        }
      }
      
      // Create new role grant for ALL role changes (now supports all roles)
      // Use the original role name (not mapped) for role_grants to preserve history
      const roleForGrant = newGrantRole || newRole; // Use mapped role if available, otherwise use original
      console.log(`[PATCH /api/admin/users/[id]] Creating role grant: user_id=${userId}, role=${roleForGrant}, granted_by=${profile.id}`);
      const { data: grantData, error: grantError } = await supabase
        .from("role_grants")
        .upsert({
          user_id: userId,
          role: roleForGrant,
          granted_by: profile.id,
          granted_at: new Date().toISOString(),
          revoked_at: null,
          reason: `Role changed to ${newRole} by super admin`,
        }, {
          onConflict: "user_id,role"
        })
        .select();

      if (grantError) {
        console.error(`[PATCH /api/admin/users/[id]] Error creating role grant:`, grantError);
      } else {
        console.log(`[PATCH /api/admin/users/[id]] ✅ Role grant created/updated:`, grantData);
      }
    }


    // Grant permission flags as roles
    // Note: is_comptroller column does not exist, comptroller is handled via role field only
    const permissionRoles = [
      { flag: 'is_head', role: 'head' },
      { flag: 'is_hr', role: 'hr' },
      { flag: 'is_vp', role: 'exec' }, // vp maps to exec in role_grants
      { flag: 'is_president', role: 'exec' }, // president maps to exec in role_grants
    ];

    for (const { flag, role } of permissionRoles) {
      const currentValue = currentUser?.[flag as keyof typeof currentUser] as boolean | undefined;
      const newValue = updateData[flag] as boolean | undefined;
      
      console.log(`[PATCH /api/admin/users/[id]] Checking permission flag ${flag}:`, {
        currentValue,
        newValue,
        willCheck: currentValue !== undefined || newValue !== undefined
      });
      
      const wasGranted = currentValue === false && newValue === true;
      const wasRevoked = currentValue === true && newValue === false;

      if (wasGranted) {
        // Grant role
        console.log(`[PATCH /api/admin/users/[id]] Granting role via flag: user_id=${userId}, role=${role}, granted_by=${profile.id}`);
        const { data: grantData, error: grantError } = await supabase
          .from("role_grants")
          .upsert({
            user_id: userId,
            role: role,
            granted_by: profile.id,
            granted_at: new Date().toISOString(),
            revoked_at: null,
            reason: `${flag} permission granted by super admin`,
          }, {
            onConflict: "user_id,role"
          })
          .select();

        if (grantError) {
          console.error(`[PATCH /api/admin/users/[id]] Error granting role via flag:`, grantError);
        } else {
          console.log(`[PATCH /api/admin/users/[id]] ✅ Role granted via flag:`, grantData);
        }
      } else if (wasRevoked) {
        // Revoke role
        console.log(`[PATCH /api/admin/users/[id]] Revoking role via flag: user_id=${userId}, role=${role}, revoked_by=${profile.id}`);
        const { data: revokeData, error: revokeError } = await supabase
          .from("role_grants")
          .update({
            revoked_at: new Date().toISOString(),
            revoked_by: profile.id,
            reason: `${flag} permission revoked by super admin`,
          })
          .eq("user_id", userId)
          .eq("role", role)
          .is("revoked_at", null)
          .select();

        if (revokeError) {
          console.error(`[PATCH /api/admin/users/[id]] Error revoking role via flag:`, revokeError);
        } else {
          console.log(`[PATCH /api/admin/users/[id]] ✅ Role revoked via flag:`, revokeData);
        }
      }
    }

    // Log all changes to audit_logs
    // Get IP address and user agent from request
    const ipAddress = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Determine what changed
    const changes: Record<string, { old: any; new: any }> = {};
    
    if (updateData.role !== undefined && updateData.role !== currentUser?.role) {
      changes.role = { old: currentUser?.role, new: updateData.role };
    }
    if (updateData.department_id !== undefined && updateData.department_id !== currentUser?.department_id) {
      changes.department_id = { old: currentUser?.department_id, new: updateData.department_id };
    }
    if (updateData.is_head !== undefined && updateData.is_head !== currentUser?.is_head) {
      changes.is_head = { old: currentUser?.is_head, new: updateData.is_head };
    }
    if (updateData.is_admin !== undefined && updateData.is_admin !== currentUser?.is_admin) {
      changes.is_admin = { old: currentUser?.is_admin, new: updateData.is_admin };
    }
    if (updateData.is_hr !== undefined && updateData.is_hr !== currentUser?.is_hr) {
      changes.is_hr = { old: currentUser?.is_hr, new: updateData.is_hr };
    }
    if (updateData.is_vp !== undefined && updateData.is_vp !== currentUser?.is_vp) {
      changes.is_vp = { old: currentUser?.is_vp, new: updateData.is_vp };
    }
    if (updateData.is_president !== undefined && updateData.is_president !== currentUser?.is_president) {
      changes.is_president = { old: currentUser?.is_president, new: updateData.is_president };
    }
    // Note: is_comptroller column does not exist, comptroller role is handled via role field only

    // Log to audit_logs if there are any changes
    if (Object.keys(changes).length > 0) {
      const { error: auditLogError } = await supabase
        .from("audit_logs")
        .insert({
          user_id: profile.id, // The admin who made the change
          action: "update",
          entity_type: "user",
          entity_id: userId,
          old_value: currentUser, // Full user data before update
          new_value: updatedUser, // Full user data after update
          ip_address: ipAddress,
          user_agent: userAgent,
        });

      if (auditLogError) {
        console.warn("[PATCH /api/admin/users/[id]] Warning logging update to audit_logs:", auditLogError);
        // Don't fail update if logging fails
      } else {
        console.log("[PATCH /api/admin/users/[id]] ✅ User update logged to audit_logs");
      }
    }

    console.log("[PATCH /api/admin/users/[id]] User updated successfully:", userId);

    return NextResponse.json({
      ok: true,
      data: responseData,
      message: "User updated successfully",
    });
  } catch (err: any) {
    console.error("[PATCH /api/admin/users/[id]] Unexpected error:", err);
    // Don't expose internal errors like "supabase is not defined"
    const errorMessage = err.message || "Internal server error";
    const safeErrorMessage = errorMessage.includes("supabase") || errorMessage.includes("is not defined")
      ? "An internal error occurred. Please try again."
      : errorMessage;
    return NextResponse.json(
      { ok: false, error: safeErrorMessage },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete a user (admin only)
 * Handles foreign key constraints by cleaning up related records
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);
    const { id } = await params;
    const userId = id;
    const body = await req.json().catch(() => ({}));

    // Check if user is admin first
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify password is required for deletion
    if (!body.password) {
      return NextResponse.json({ ok: false, error: "Password confirmation required" }, { status: 400 });
    }

    // Verify password by attempting to sign in (need anon key client for this)
    const cookieStore = await cookies();
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Don't actually set cookies during verification
          },
          remove(name: string, options: any) {
            // Don't actually remove cookies during verification
          },
        },
      }
    );

    const { error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: authUser.email!,
      password: body.password,
    });

    if (signInError) {
      return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
    }

    // Use service role client for queries (bypasses RLS completely)
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

    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin, email")
      .eq("auth_user_id", authUser.id)
      .single();

    // Only super admins can delete users
    if (!profile || !profile.is_admin || profile.role !== "admin") {
      console.log(`[DELETE /api/admin/users/[id]] Access denied for user: ${profile?.email || 'unknown'}, role: ${profile?.role}, is_admin: ${profile?.is_admin}`);
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Prevent self-deletion
    if (userId === profile.id) {
      return NextResponse.json({ ok: false, error: "You cannot delete your own account" }, { status: 400 });
    }

    // Get full user info before deletion (for audit logging)
    const { data: userToDelete, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userToDelete) {
      console.error("[DELETE /api/admin/users/[id]] User not found:", userError);
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    console.log(`[DELETE /api/admin/users/[id]] Deleting user: ${userToDelete.name} (${userToDelete.email})`);

    // Log user deletion to audit_logs BEFORE deletion
    // Get IP address and user agent from request
    const ipAddress = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Log the deletion with full user data
    const { error: auditLogError } = await supabase
      .from("audit_logs")
      .insert({
        user_id: profile.id, // The admin who is deleting
        action: "delete",
        entity_type: "user",
        entity_id: userId,
        old_value: userToDelete, // Full user data before deletion
        new_value: null, // User is deleted, so new value is null
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (auditLogError) {
      console.warn("[DELETE /api/admin/users/[id]] Warning logging deletion to audit_logs:", auditLogError);
      // Don't fail deletion if logging fails
    } else {
      console.log("[DELETE /api/admin/users/[id]] ✅ User deletion logged to audit_logs");
    }

    // Step 1: Try to delete department_heads records first
    // If this fails due to replication, we'll handle it when deleting from users
    const { error: deptHeadsDeleteError } = await supabase
      .from("department_heads")
      .delete()
      .eq("user_id", userId);

    if (deptHeadsDeleteError) {
      // If deletion fails due to replication, mark as invalidated instead
      if (deptHeadsDeleteError.message?.includes("replica identity") || deptHeadsDeleteError.code === "55000") {
        console.warn("[DELETE /api/admin/users/[id]] Cannot delete department_heads due to replication, marking as invalidated");
        await supabase
          .from("department_heads")
          .update({ valid_to: new Date().toISOString() })
          .eq("user_id", userId)
          .is("valid_to", null);
      } else {
        console.warn("[DELETE /api/admin/users/[id]] Warning deleting department_heads:", deptHeadsDeleteError);
      }
    }

    // Step 2: Delete from related tables that might have foreign key constraints
    // Delete from admins table
    await supabase
      .from("admins")
      .delete()
      .eq("user_id", userId);

    // Delete from role_grants table
    await supabase
      .from("role_grants")
      .delete()
      .eq("user_id", userId);

    // NOTE: We do NOT delete audit_logs entries
    // Audit logs should be preserved for history even after user deletion
    // The user_id in audit_logs will be set to NULL by ON DELETE SET NULL constraint
    // This preserves the audit trail while allowing user deletion

    // Delete from audit_log table (singular, if exists) - might have RLS issues
    const { error: auditLogSingularError } = await supabase
      .from("audit_log")
      .delete()
      .eq("user_id", userId);

    if (auditLogSingularError) {
      const isRLSError = auditLogSingularError.message?.includes("row-level security") || auditLogSingularError.code === '42501';
      const isTableError = auditLogSingularError.message?.includes("does not exist") || auditLogSingularError.message?.includes("relation");
      
      if (!isTableError) {
        if (isRLSError) {
          console.warn("[DELETE /api/admin/users/[id]] RLS error deleting audit_log (will continue):", auditLogSingularError.message);
          // Continue - RLS is blocking, but user deletion should still work
        } else {
          console.warn("[DELETE /api/admin/users/[id]] Warning deleting audit_log:", auditLogSingularError);
        }
      }
    }

    // Delete from activity_logs table (if exists)
    const { error: activityLogsError } = await supabase
      .from("activity_logs")
      .delete()
      .eq("user_id", userId);

    if (activityLogsError && !activityLogsError.message?.includes("does not exist")) {
      console.warn("[DELETE /api/admin/users/[id]] Warning deleting activity_logs:", activityLogsError);
    }

    // Delete from requests table - handle ALL user references
    // This includes: requester_id, head_approved_by, admin_processed_by, 
    // comptroller_approved_by, hr_approved_by, exec_approved_by, assigned_driver_id, etc.
    
    // First, delete requests where user is the requester
    const { error: requestsDeleteError } = await supabase
      .from("requests")
      .delete()
      .eq("requester_id", userId);

    if (requestsDeleteError) {
      console.warn("[DELETE /api/admin/users/[id]] Warning deleting requests by requester_id:", requestsDeleteError);
    }

    // Then, set all approval references to NULL (preserves request history)
    // This handles: head_approved_by, admin_processed_by, admin_approved_by,
    // comptroller_approved_by, hr_approved_by, exec_approved_by, parent_head_approved_by, assigned_driver_id
    const requestsUserFields = [
      'head_approved_by',
      'admin_processed_by',
      'admin_approved_by',  // Added - might exist in some schema versions
      'comptroller_approved_by',
      'hr_approved_by',
      'exec_approved_by',
      'parent_head_approved_by',
      'assigned_driver_id',
      'rejected_by'
    ];

    for (const field of requestsUserFields) {
      const { error: updateError } = await supabase
        .from("requests")
        .update({ [field]: null })
        .eq(field, userId);

      if (updateError && !updateError.message?.includes("does not exist") && !updateError.message?.includes("column")) {
        console.warn(`[DELETE /api/admin/users/[id]] Warning updating ${field}:`, updateError);
      }
    }

    // Delete from request_history table - handle user references
    // NOTE: actor_id now has ON DELETE SET NULL constraint, so it will be handled automatically
    // We still need to delete records where user is referenced by other fields
    
    // Delete by user_id (if this field exists and has FK constraint)
    await supabase
      .from("request_history")
      .delete()
      .eq("user_id", userId);

    // Delete by created_by (if this field exists)
    await supabase
      .from("request_history")
      .delete()
      .eq("created_by", userId);

    // Delete by updated_by (if this field exists)
    await supabase
      .from("request_history")
      .delete()
      .eq("updated_by", userId);

    // actor_id will be automatically set to NULL by the database constraint (ON DELETE SET NULL)
    // No need to manually handle it

    // Delete from approvals table - handle ALL user references
    // This includes: approver_id, admin_id, and any other user reference fields
    // NOTE: Some columns may have NOT NULL constraints, so we try delete first, then NULL as fallback
    const approvalsUserFields = ['approver_id', 'admin_id', 'created_by', 'updated_by'];
    
    for (const field of approvalsUserFields) {
      // Try to delete records first (handles NOT NULL constraints)
      const { error: deleteError } = await supabase
        .from("approvals")
        .delete()
        .eq(field, userId);

      if (deleteError && !deleteError.message?.includes("does not exist") && !deleteError.message?.includes("column")) {
        console.warn(`[DELETE /api/admin/users/[id]] Warning deleting approvals by ${field}:`, deleteError);
        
        // If delete fails, try to set to NULL as fallback (only works if column allows NULL)
        const { error: updateError } = await supabase
          .from("approvals")
          .update({ [field]: null })
          .eq(field, userId);

        if (updateError && !updateError.message?.includes("does not exist") && !updateError.message?.includes("column") && !updateError.message?.includes("not-null")) {
          console.warn(`[DELETE /api/admin/users/[id]] Warning updating approvals ${field}:`, updateError);
        }
      }
    }

    // Delete from approvals_history table - handle ALL user references
    // NOTE: Since FK constraints are now CASCADE, records will be auto-deleted when user is deleted
    // We skip manual deletion to avoid triggering audit_log RLS errors from triggers
    // The FK CASCADE will handle all deletions automatically
    console.log(`[DELETE /api/admin/users/[id]] Skipping manual approvals_history deletion - FK CASCADE will handle it automatically`);
    
    // Optional: Try to delete only if no RLS issues, but don't fail if it does
    // This is just for cleanup before FK cascade, but not critical
    try {
      const approvalHistoryFields = ['approver_id', 'admin_id', 'user_id', 'actor_id', 'created_by', 'updated_by'];
      
      for (const field of approvalHistoryFields) {
        const { error: deleteError } = await supabase
          .from("approvals_history")
          .delete()
          .eq(field, userId);

        if (deleteError) {
          const isRLSError = deleteError.message?.includes("row-level security") || 
                            deleteError.message?.includes("audit_log") || 
                            deleteError.code === '42501';
          const isColumnError = deleteError.message?.includes("does not exist") || deleteError.message?.includes("column");
          
          if (isRLSError && !isColumnError) {
            console.warn(`[DELETE /api/admin/users/[id]] RLS error deleting approvals_history by ${field} (FK CASCADE will handle it):`, deleteError.message);
            // Stop trying to delete manually - FK CASCADE will handle it
            break;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[DELETE /api/admin/users/[id]] Error during approvals_history cleanup (FK CASCADE will handle it):`, err.message);
      // Continue - FK CASCADE will delete records when user is deleted
    }

    // Delete from notifications table (user's notifications)
    const { error: notificationsError } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);

    if (notificationsError && !notificationsError.message?.includes("does not exist")) {
      console.warn("[DELETE /api/admin/users/[id]] Warning deleting notifications:", notificationsError);
    }

    // Step 3: Final cleanup - delete ALL approvals_history records that reference this user
    // This must be done BEFORE deleting the user to avoid FK constraint issues
    // CRITICAL: Delete ALL records to prevent FK constraint from trying to set NULL
    console.log(`[DELETE /api/admin/users/[id]] Final cleanup: Deleting all approvals_history records referencing user ${userId}`);
    
    // Delete records where user is referenced in any field
    // We do this field by field to ensure all are caught, even if RLS blocks some
    const finalCleanupFields = ['approver_id', 'admin_id', 'user_id', 'actor_id', 'created_by', 'updated_by'];
    let deletedCount = 0;
    
    for (const field of finalCleanupFields) {
      const { data: deletedData, error: fieldError } = await supabase
        .from("approvals_history")
        .delete()
        .eq(field, userId)
        .select('id', { count: 'exact' });
      
      if (fieldError) {
        const isRLSError = fieldError.message?.includes("row-level security") || fieldError.code === '42501';
        const isColumnError = fieldError.message?.includes("does not exist") || fieldError.message?.includes("column");
        
        if (!isColumnError) {
          if (isRLSError) {
            console.warn(`[DELETE /api/admin/users/[id]] RLS error deleting approvals_history by ${field} (will continue):`, fieldError.message);
            // Continue - we'll handle remaining records when deleting user
          } else {
            console.warn(`[DELETE /api/admin/users/[id]] Warning deleting approvals_history by ${field}:`, fieldError);
          }
        }
      } else if (deletedData) {
        deletedCount += deletedData.length || 0;
      }
    }
    
    console.log(`[DELETE /api/admin/users/[id]] Deleted ${deletedCount} approvals_history records in final cleanup`);

    // Step 4: Try to delete from public.users table
    // NOTE: There might be a trigger that tries to insert into audit_log, which could be blocked by RLS
    // If that happens, we'll provide instructions to fix the RLS policy
    const { error: deleteError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      // Check if it's an RLS error from audit_log trigger
      const isAuditLogRLSError = deleteError.message?.includes("audit_log") && 
                                 (deleteError.message?.includes("row-level security") || deleteError.code === '42501');
      
      if (isAuditLogRLSError) {
        console.error("[DELETE /api/admin/users/[id]] RLS error from audit_log trigger:", deleteError);
        return NextResponse.json({ 
          ok: false, 
          error: "Cannot delete user due to RLS policy on audit_log table. Please run the SQL migration 'FIX-AUDIT-LOG-RLS-FOR-SERVICE-ROLE.sql' in Supabase SQL Editor to allow service role and triggers to insert into audit_log." 
        }, { status: 500 });
      }
      
      // If deletion fails due to replication issue with department_heads,
      // provide a helpful error message with instructions
      if (deleteError.message?.includes("replica identity") || deleteError.message?.includes("department_heads") || deleteError.code === "55000") {
        console.error("[DELETE /api/admin/users/[id]] Replication error:", deleteError);
        return NextResponse.json({ 
          ok: false, 
          error: "Cannot delete user due to database replication settings. Please run the SQL migration 'FIX-DEPARTMENT-HEADS-REPLICATION.sql' in Supabase SQL Editor to fix this issue. The user's department head assignments have been marked as inactive." 
        }, { status: 500 });
      }
      
      console.error("[DELETE /api/admin/users/[id]] Error deleting from users table:", deleteError);
      return NextResponse.json({ ok: false, error: deleteError.message }, { status: 500 });
    }

    // Step 5: Delete from auth.users (Supabase Auth) using Admin API
    // Since we're using service role, we can use admin API
    try {
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userToDelete.auth_user_id);
      if (authDeleteError) {
        console.warn("[DELETE /api/admin/users/[id]] Could not delete from auth.users:", authDeleteError);
        // Continue anyway - the public.users record is deleted
        // User won't be able to log in since there's no public.users record
      } else {
        console.log("[DELETE /api/admin/users/[id]] ✅ Deleted from auth.users successfully");
      }
    } catch (authErr: any) {
      console.warn("[DELETE /api/admin/users/[id]] Error deleting from auth.users:", authErr.message);
      // Continue - public.users is already deleted
    }

    console.log(`[DELETE /api/admin/users/[id]] ✅ User deleted successfully: ${userToDelete.email}`);

    return NextResponse.json({
      ok: true,
      message: `User ${userToDelete.name} (${userToDelete.email}) deleted successfully`,
    });
  } catch (err: any) {
    console.error("[DELETE /api/admin/users/[id]] Unexpected error:", err);
    // Don't expose internal errors like "supabase is not defined"
    const errorMessage = err.message || "Internal server error";
    const safeErrorMessage = errorMessage.includes("supabase") || errorMessage.includes("is not defined")
      ? "An internal error occurred. Please try again."
      : errorMessage;
    return NextResponse.json(
      { ok: false, error: safeErrorMessage },
      { status: 500 }
    );
  }
}

