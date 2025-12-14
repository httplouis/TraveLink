import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This endpoint creates Supabase Auth accounts for drivers who don't have one yet
// Only accessible by admin users

const DEFAULT_PASSWORD = "Driver@2024";

export async function POST(_req: NextRequest) {
  try {
    // Create admin client with service role key (can create auth users)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get all drivers from users table
    const { data: drivers, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("role", "driver");

    if (fetchError) {
      return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
    }

    if (!drivers || drivers.length === 0) {
      return NextResponse.json({ ok: true, message: "No drivers found", created: [] });
    }

    const results: { email: string; status: string; error?: string; action?: string }[] = [];

    for (const driver of drivers) {
      // Check if auth user with correct UUID already exists
      const { data: existingAuth } = await supabaseAdmin.auth.admin.getUserById(driver.id);
      
      if (existingAuth?.user) {
        results.push({ email: driver.email, status: "already_exists" });
        continue;
      }

      // Check if there's an auth user with the same email but WRONG UUID
      const { data: authByEmail } = await supabaseAdmin.auth.admin.listUsers();
      const wrongAuthUser = authByEmail?.users?.find(u => u.email === driver.email && u.id !== driver.id);
      
      if (wrongAuthUser) {
        // Delete the wrong auth user first
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(wrongAuthUser.id);
        if (deleteError) {
          results.push({ 
            email: driver.email, 
            status: "error", 
            error: `Failed to delete wrong auth user: ${deleteError.message}`,
            action: "delete_failed"
          });
          continue;
        }
      }

      // Create auth user with the SAME UUID as the users table
      const { error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: driver.id, // Use same UUID from users table
        email: driver.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true, // Auto-confirm so they can login immediately
        user_metadata: {
          name: driver.name,
          role: "driver",
        },
      });

      if (createError) {
        results.push({ email: driver.email, status: "error", error: createError.message });
      } else {
        results.push({ 
          email: driver.email, 
          status: "created",
          action: wrongAuthUser ? "recreated_with_correct_uuid" : "new"
        });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const alreadyExists = results.filter(r => r.status === "already_exists").length;
    const errors = results.filter(r => r.status === "error").length;

    return NextResponse.json({
      ok: true,
      message: `Created ${created} auth accounts. ${alreadyExists} already existed. ${errors} errors.`,
      defaultPassword: DEFAULT_PASSWORD,
      results,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Create Driver Auth] Error:", error);
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}

// GET endpoint to check driver auth status
export async function GET(_req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get all drivers
    const { data: drivers, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, name, email")
      .eq("role", "driver")
      .order("name");

    if (fetchError) {
      return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
    }

    // Check auth status for each driver
    const driversWithAuthStatus = await Promise.all(
      (drivers || []).map(async (driver) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(driver.id);
        return {
          ...driver,
          has_auth: !!authUser?.user,
          auth_email: authUser?.user?.email || null,
          last_sign_in: authUser?.user?.last_sign_in_at || null,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      data: driversWithAuthStatus,
      summary: {
        total: driversWithAuthStatus.length,
        with_auth: driversWithAuthStatus.filter(d => d.has_auth).length,
        without_auth: driversWithAuthStatus.filter(d => !d.has_auth).length,
      },
    });
  } catch (error: any) {
    console.error("[Check Driver Auth] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
