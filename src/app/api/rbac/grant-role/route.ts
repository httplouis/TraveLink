import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Admin endpoint to grant a role to a user
 * Ground Truth: Only Admin or approved pipeline can grant roles
 */
export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient(true);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Check if requester is admin
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: "Forbidden: Admin only" }, { status: 403 });
  }

  const { targetUserId, role, departmentIds, reason } = await req.json();

  if (!targetUserId || !role) {
    return NextResponse.json({ ok: false, error: "targetUserId and role required" }, { status: 400 });
  }

  // Create role grant
  const { error: grantError } = await supabase
    .from("role_grants")
    .upsert({
      user_id: targetUserId,
      role,
      granted_by: user.id,
      granted_at: new Date().toISOString(),
      reason: reason || `Granted by admin`,
    }, {
      onConflict: 'user_id,role',
      ignoreDuplicates: false,
    });

  if (grantError) {
    return NextResponse.json({ ok: false, error: grantError.message }, { status: 500 });
  }

  // If head role, also create department_heads mappings
  if (role === 'head' && departmentIds && departmentIds.length > 0) {
    const mappings = departmentIds.map((deptId: string) => ({
      department_id: deptId,
      user_id: targetUserId,
      valid_from: new Date().toISOString(),
      created_by: user.id,
    }));

    await supabase.from("department_heads").insert(mappings);
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "grant_role",
    entity_type: "role_grants",
    entity_id: targetUserId,
    new_value: { role, departmentIds, reason },
  });

  return NextResponse.json({ ok: true });
}
