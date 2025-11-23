// src/app/api/admin/create-exec-accounts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * POST /api/admin/create-exec-accounts
 * Creates all executive, comptroller, and admin accounts in Supabase Auth
 * 
 * NOTE: This requires service_role key and should only be called by super-admin
 */
export async function POST(req: NextRequest) {
  try {
    // Use service role for admin operations
    const supabase = await createSupabaseServerClient(true);

    // Verify caller is super-admin (optional security check)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile to check if super-admin
    const { data: profile } = await supabase
      .from("users")
      .select("is_admin, role")
      .eq("auth_user_id", authUser.id)
      .single();

    if (!profile?.is_admin || profile?.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Only super-admin can create accounts" },
        { status: 403 }
      );
    }

    // Verify password is required for bulk account creation
    const body = await req.json().catch(() => ({}));
    if (!body.password) {
      return NextResponse.json({ ok: false, error: "Password confirmation required" }, { status: 400 });
    }

    // Verify password by attempting to sign in
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

    // Account definitions
    const accounts = [
      {
        email: "president@mseuf.edu.ph",
        password: "President2024!",
        name: "Naila E. Leveriza",
        position: "University President/COO",
      },
      {
        email: "svp.academics@mseuf.edu.ph",
        password: "SVP2024!",
        name: "Dr. Benilda Villenas",
        position: "Senior Vice President for Academics and Research",
      },
      {
        email: "vp.admin@mseuf.edu.ph",
        password: "VPAdmin2024!",
        name: "Atty. Dario R. Opistan",
        position: "Vice President for Administration",
      },
      {
        email: "vp.external@mseuf.edu.ph",
        password: "VPExternal2024!",
        name: "Celso D. Jaballa",
        position: "Vice President for External Relations",
      },
      {
        email: "vp.finance@mseuf.edu.ph",
        password: "VPFinance2024!",
        name: "Carlito M. Rodriguez",
        position: "Vice President for Finance and University Treasurer",
      },
      {
        email: "comptroller@mseuf.edu.ph",
        password: "Comptroller2024!",
        name: "Carlos Jayron A. Remiendo",
        position: "Comptroller",
      },
      {
        email: "audrey.abulencia@mseuf.edu.ph",
        password: "Audrey2024!",
        name: "Audrey R. Abulencia",
        position: "Financial Analyst",
      },
      {
        email: "albert.alingalan@mseuf.edu.ph",
        password: "Albert2024!",
        name: "Albert D. Alingalan",
        position: "Financial Analyst",
      },
      {
        email: "cleofe.atayde@mseuf.edu.ph",
        password: "Cleofe2024!",
        name: "Cleofe A. Atayde",
        position: "Director, Treasury Services",
      },
      {
        email: "trizzia.casino@mseuf.edu.ph",
        password: "Trizzia2024!",
        name: "Trizzia Maree Z. Casiño",
        position: "Treasury Staff / School Transportation Coordinator",
      },
    ];

    const results = [];
    const errors = [];

    // Create each account
    for (const account of accounts) {
      try {
        // Check if user already exists
        const { data: existing } = await supabase.auth.admin.listUsers();
        const userExists = existing?.users?.some((u) => u.email === account.email);

        if (userExists) {
          results.push({
            email: account.email,
            status: "exists",
            message: "User already exists, skipping creation",
          });
          continue;
        }

        // Create user in Supabase Auth
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: account.name,
            position: account.position,
          },
        });

        if (createError) {
          errors.push({
            email: account.email,
            error: createError.message,
          });
        } else {
          results.push({
            email: account.email,
            status: "created",
            userId: newUser.user?.id,
            message: "Account created successfully",
          });
        }
      } catch (err: any) {
        errors.push({
          email: account.email,
          error: err.message || "Unknown error",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Created ${results.filter((r) => r.status === "created").length} accounts`,
      results,
      errors: errors.length > 0 ? errors : undefined,
      nextStep: "Run CREATE-ALL-EXEC-ACCOUNTS.sql in Supabase SQL Editor to set roles and departments",
    });
  } catch (err: any) {
    console.error("[POST /api/admin/create-exec-accounts] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

