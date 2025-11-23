import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Get all active departments
 * Ground Truth: departments table is source of truth for department list
 * Query params: ?id=<uuid> to get specific department, ?name=<name> to search by name
 */
export async function GET(req: Request) {
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
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const name = searchParams.get("name");
  const code = searchParams.get("code");

  // If ID provided, get specific department
  if (id) {
    const { data, error } = await supabase
      .from("departments")
      .select("id, code, name, type, parent_department_id")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[API /departments] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: true, departments: [] });
    }

    // Get user count
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("department_id", data.id);

    return NextResponse.json({ 
      ok: true, 
      departments: [{ ...data, user_count: count || 0 }] 
    });
  }

  // If code provided, search by code (exact match)
  if (code) {
    const { data, error } = await supabase
      .from("departments")
      .select("id, code, name, type, parent_department_id")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error("[API /departments] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: true, departments: [] });
    }

    // Get user count
    const { count } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("department_id", data.id);

    return NextResponse.json({ 
      ok: true, 
      departments: [{ ...data, user_count: count || 0 }] 
    });
  }

  // If name provided, search by name
  if (name) {
    const { data, error } = await supabase
      .from("departments")
      .select("id, code, name, type, parent_department_id")
      .ilike("name", `%${name}%`)
      .order("name");

    if (error) {
      console.error("[API /departments] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Get user counts for each department
    const departmentsWithCounts = await Promise.all(
      (data || []).map(async (dept) => {
        const { count } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("department_id", dept.id);

        return { ...dept, user_count: count || 0 };
      })
    );

    return NextResponse.json({ ok: true, departments: departmentsWithCounts });
  }

  // Get all departments with parent info and user counts
  const { data, error } = await supabase
    .from("departments")
    .select("id, code, name, type, parent_department_id")
    .order("name");

  if (error) {
    console.error("[API /departments] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Get user counts for each department
  const departmentsWithCounts = await Promise.all(
    (data || []).map(async (dept) => {
      const { count, error: countError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("department_id", dept.id);

      if (countError) {
        console.warn(`[API /departments] Error counting users for ${dept.name}:`, countError);
        return { ...dept, user_count: 0 };
      }

      const userCount = count || 0;
      console.log(`[API /departments] Department ${dept.code} (${dept.name}): ${userCount} users`);
      return { ...dept, user_count: userCount };
    })
  );

  console.log("[API /departments] Returning", departmentsWithCounts.length, "departments");
  return NextResponse.json({ ok: true, departments: departmentsWithCounts });
}

/**
 * Create a new department (Admin only)
 */
export async function POST(req: Request) {
  // Use regular client for auth (with cookies)
  const authSupabase = await createSupabaseServerClient(false);

  const { data: { user }, error: authError } = await authSupabase.auth.getUser();
  if (authError || !user) {
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

  // Check if user is super admin
  const { data: profile } = await supabase
    .from("users")
    .select("id, role, is_admin")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || !profile.is_admin || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: "Forbidden: Super Admin access required" }, { status: 403 });
  }

  const { code, name, type, parent_department_id } = await req.json();

  if (!code || !name) {
    return NextResponse.json({ ok: false, error: "code and name required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("departments")
    .insert({ 
      code: code.toUpperCase(), 
      name, 
      type: type || "academic",
      parent_department_id: parent_department_id || null
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Log to audit_logs
  try {
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || 
                     req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    const auditData: any = {
      user_id: profile.id,
      action: "create",
      entity_type: "department",
      entity_id: data.id,
      new_value: {
        code: data.code,
        name: data.name,
        type: data.type,
        parent_department_id: data.parent_department_id,
      },
      user_agent: userAgent,
    };

    if (ipAddress && ipAddress.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
      auditData.ip_address = ipAddress;
    }

    await supabase.from("audit_logs").insert(auditData);
  } catch (auditErr: any) {
    console.error("[POST /api/departments] Failed to log to audit_logs:", auditErr);
    // Don't fail the operation if audit logging fails
  }

  return NextResponse.json({ ok: true, department: data });
}
