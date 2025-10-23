// src/app/api/dev/driver/register/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only key
);

// DEV helper: quick random password for admin-created users
function randomPassword(len = 20) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      phone,
      first_name,
      middle_name = null,
      last_name,
      suffix = null,
      address,
      email: providedEmail, // optional (you can omit from client)
    } = body ?? {};

    // ---- validate input ----
    if (!phone || !/^\+63\d{10}$/.test(String(phone))) {
      return NextResponse.json(
        { error: "Invalid or missing phone (+639XXXXXXXXX)." },
        { status: 400 }
      );
    }
    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: "First and last name are required." },
        { status: 400 }
      );
    }
    if (!address) {
      return NextResponse.json(
        { error: "Address is required." },
        { status: 400 }
      );
    }

    // Use a stable synthetic email from phone for DEV (or real email if provided)
    const sanitized = String(phone).replace(/[^0-9]/g, "");
    const email =
      (providedEmail && String(providedEmail).trim()) ||
      `driver+${sanitized}@local.travilink`;

    // ---- 1) Create Auth user if not already present ----
    // Some supabase-js versions don't have getUserByEmail; we just try-create and
    // tolerate 422 "User already registered".
    let auth_user_id: string | null = null;

    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPassword(),
        email_confirm: true, // mark confirmed for synthetic emails in dev
        phone,
        user_metadata: {
          role: "driver",
          first_name,
          middle_name,
          last_name,
          suffix,
          address,
        },
        app_metadata: { provider: "dev_admin_create" },
      });
      if (error) {
        // If it's NOT a conflict, bubble it up
        const msg = String(error.message || "").toLowerCase();
        if (!msg.includes("already registered") && error.status !== 422) {
          throw error;
        }
      } else {
        auth_user_id = data.user.id;
      }
    } catch (authErr: any) {
      const msg = String(authErr?.message || "");
      // Any non-422 error should stop the flow
      if (!/already registered/i.test(msg)) {
        return NextResponse.json({ error: msg || "Auth error" }, { status: 400 });
      }
      // else continue without auth_user_id
    }

    // ---- 2) Upsert into public.users on email (idempotent) ----
    // IMPORTANT: Do NOT send GENERATED ALWAYS columns (name_full, name_last_first).
    const { data: userRow, error: upsertErr } = await supabaseAdmin
      .from("users")
      .upsert(
        [
          {
            role: "driver",
            status: "pending", // or "active"
            email, // UNIQUE key used for onConflict
            phone,
            address,
            first_name,
            middle_name,
            last_name,
            suffix,
            auth_user_id, // may be null if user already existed and we didn't fetch UID
          },
        ],
        { onConflict: "email" }
      )
      .select("id, email, auth_user_id")
      .single();

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        ok: true,
        user_id: userRow.id,
        email: userRow.email,
        auth_user_id: userRow.auth_user_id,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
