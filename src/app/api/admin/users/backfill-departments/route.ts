// src/app/api/admin/users/backfill-departments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/admin/users/backfill-departments
 * Backfill department_id for users who have department text but no department_id
 * Admin only - requires password confirmation
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);
    const body = await req.json();

    // Check if user is admin
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, role, is_admin, email")
      .eq("auth_user_id", authUser.id)
      .single();

    // Only super admins can run this
    if (!profile || !profile.is_admin || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Verify password is required
    if (!body.password) {
      return NextResponse.json({ ok: false, error: "Password confirmation required" }, { status: 400 });
    }

    // Verify password
    const cookieStore = await cookies();
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set() {},
          remove() {},
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

    // Get all users with department text but no department_id
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, department, department_id")
      .not("department", "is", null)
      .is("department_id", null);

    if (usersError) {
      console.error("[POST /api/admin/users/backfill-departments] Error:", usersError);
      return NextResponse.json({ ok: false, error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        message: "No users need department backfilling",
        updated: 0
      });
    }

    console.log(`[POST /api/admin/users/backfill-departments] Found ${users.length} users to process`);

    let updated = 0;
    let failed = 0;

    for (const user of users) {
      if (!user.department || typeof user.department !== 'string') continue;

      const departmentName = user.department.trim();
      if (!departmentName) continue;

      // Try exact match first
      let { data: deptData } = await supabase
        .from("departments")
        .select("id, code, name")
        .eq("name", departmentName)
        .maybeSingle();
      
      // If not found, try matching by code
      if (!deptData && departmentName.length <= 10) {
        const { data: deptByCode } = await supabase
          .from("departments")
          .select("id, code, name")
          .eq("code", departmentName.toUpperCase())
          .maybeSingle();
        
        if (deptByCode) {
          deptData = deptByCode;
        }
      }
      
      // If still not found, try partial match
      if (!deptData) {
        const { data: deptPartial } = await supabase
          .from("departments")
          .select("id, code, name")
          .or(`name.ilike.%${departmentName}%,code.ilike.%${departmentName}%`)
          .limit(1)
          .maybeSingle();
        
        if (deptPartial) {
          deptData = deptPartial;
        }
      }
      
      if (deptData) {
        // Get user data before update for audit log
        const userBefore = { ...user };
        
        const { error: updateError } = await supabase
          .from("users")
          .update({ 
            department_id: deptData.id,
            department: null // Clear text field
          })
          .eq("id", user.id);
        
        if (updateError) {
          console.error(`[POST /api/admin/users/backfill-departments] Failed to update user ${user.id}:`, updateError);
          failed++;
        } else {
          console.log(`[POST /api/admin/users/backfill-departments] ✅ Updated ${user.name} (${user.email}) -> ${deptData.name}`);
          updated++;
          
          // Log to audit_logs
          const ipAddress = req.headers.get("x-forwarded-for") || 
                           req.headers.get("x-real-ip") || 
                           "unknown";
          const userAgent = req.headers.get("user-agent") || "unknown";
          
          // Get updated user data
          const { data: userAfter } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();
          
          await supabase
            .from("audit_logs")
            .insert({
              user_id: profile.id, // The admin who ran backfill
              action: "update",
              entity_type: "user",
              entity_id: user.id,
              old_value: userBefore,
              new_value: userAfter,
              ip_address: ipAddress,
              user_agent: userAgent,
            });
        }
      } else {
        console.warn(`[POST /api/admin/users/backfill-departments] ⚠️ Could not resolve department for ${user.name}: "${departmentName}"`);
        failed++;
      }
    }

    // Log the backfill operation itself
    const ipAddress = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    
    await supabase
      .from("audit_logs")
      .insert({
        user_id: profile.id,
        action: "backfill_departments",
        entity_type: "bulk_operation",
        entity_id: null,
        old_value: { total_users: users.length, users_without_dept: users.length },
        new_value: { updated, failed, total: users.length },
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    return NextResponse.json({
      ok: true,
      message: `Backfill complete: ${updated} updated, ${failed} failed`,
      updated,
      failed,
      total: users.length
    });
  } catch (err: any) {
    console.error("[POST /api/admin/users/backfill-departments] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

