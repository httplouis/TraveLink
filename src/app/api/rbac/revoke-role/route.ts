import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Admin endpoint to revoke a role from a user
 * Ground Truth: Only Admin can revoke roles
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

  const { targetUserId, role, reason } = await req.json();

  if (!targetUserId || !role) {
    return NextResponse.json({ ok: false, error: "targetUserId and role required" }, { status: 400 });
  }

  // Revoke role grant
  const { error: revokeError } = await supabase
    .from("role_grants")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: user.id,
      reason: reason || 'Revoked by admin',
    })
    .eq("user_id", targetUserId)
    .eq("role", role)
    .is("revoked_at", null);

  if (revokeError) {
    return NextResponse.json({ ok: false, error: revokeError.message }, { status: 500 });
  }

  // If head role, expire department_heads mappings
  if (role === 'head') {
    await supabase
      .from("department_heads")
      .update({ valid_to: new Date().toISOString() })
      .eq("user_id", targetUserId)
      .is("valid_to", null);
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "revoke_role",
    entity_type: "role_grants",
    entity_id: targetUserId,
    old_value: { role },
    new_value: { reason },
  });

  return NextResponse.json({ ok: true });
}
