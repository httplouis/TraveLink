// src/app/api/super-admin/audit-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/super-admin/audit-logs
 * Get audit logs with pagination and filtering (Super Admin only)
 */
export async function GET(req: NextRequest) {
  try {
    // Use regular client for auth (with cookies)
    const authSupabase = await createSupabaseServerClient(false);

    // Check if user is super admin
    const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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

    if (!profile || !profile.is_admin || profile.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entity_type");

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply filters
    if (action) {
      query = query.ilike("action", `%${action}%`);
    }
    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    console.log("[GET /api/super-admin/audit-logs] Query params:", {
      page,
      limit,
      offset,
      action,
      entityType,
    });

    // Get total count and data
    const { data: logs, error: logsError, count } = await query.range(offset, offset + limit - 1);

    if (logsError) {
      console.error("[GET /api/super-admin/audit-logs] ❌ Query Error:", logsError);
      console.error("[GET /api/super-admin/audit-logs] Error code:", logsError.code);
      console.error("[GET /api/super-admin/audit-logs] Error message:", logsError.message);
      console.error("[GET /api/super-admin/audit-logs] Error details:", logsError.details);
      console.error("[GET /api/super-admin/audit-logs] Error hint:", logsError.hint);
      return NextResponse.json({ 
        ok: false, 
        error: logsError.message || "Failed to fetch audit logs",
        details: logsError.details,
        hint: logsError.hint
      }, { status: 500 });
    }

    console.log("[GET /api/super-admin/audit-logs] ✅ Query result:", {
      logsCount: logs?.length || 0,
      totalCount: count || 0,
      page,
      limit,
      offset,
      hasLogs: (logs && logs.length > 0),
    });

    // Get unique user IDs
    const userIds = new Set<string>();
    logs?.forEach((log) => {
      if (log.user_id) userIds.add(log.user_id);
    });

    // Fetch all users
    let usersMap: Record<string, any> = {};
    if (userIds.size > 0) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", Array.from(userIds));

      if (!usersError && users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Map logs with user info
    const logsWithUsers = logs?.map((log) => ({
      ...log,
      user: log.user_id ? usersMap[log.user_id] || null : null,
    })) || [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      data: logsWithUsers,
      totalPages,
      currentPage: page,
      totalCount: count || 0,
    });
  } catch (err: any) {
    console.error("[GET /api/super-admin/audit-logs] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

