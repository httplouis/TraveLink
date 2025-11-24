// src/app/api/admin/settings/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/settings
 * Get admin settings
 */
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ ok: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Get settings from system_config table
    const { data: configs, error } = await supabase
      .from("system_config")
      .select("key, value")
      .like("key", "admin_settings_%");

    if (error) {
      console.error("[GET /api/admin/settings] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Parse settings from config
    const settings: any = {
      notifications: {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: false,
      },
      system: {
        autoApproveThreshold: 5000,
        requireJustificationAbove: 10000,
        defaultDriverAllowance: 1000,
      },
      maintenance: {
        oilChangeInterval: 5000,
        ltoReminderDays: 30,
        insuranceReminderDays: 30,
      },
      display: {
        itemsPerPage: 20,
        showAdvancedOptions: false,
      },
    };

    // Override with stored values if they exist
    if (configs) {
      const settingsConfig = configs.find(c => c.key === "admin_settings");
      if (settingsConfig && settingsConfig.value) {
        try {
          const parsed = typeof settingsConfig.value === "string" 
            ? JSON.parse(settingsConfig.value) 
            : settingsConfig.value;
          Object.assign(settings, parsed);
        } catch (e) {
          console.warn("[GET /api/admin/settings] Failed to parse settings:", e);
        }
      }
    }

    return NextResponse.json({ ok: true, data: settings });
  } catch (err: any) {
    console.error("[GET /api/admin/settings] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings
 * Save admin settings
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check if admin
    const { data: profile } = await supabase
      .from("users")
      .select("id, is_admin")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      return NextResponse.json({ ok: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();

    // Upsert settings into system_config
    const { error } = await supabase
      .from("system_config")
      .upsert({
        key: "admin_settings",
        value: JSON.stringify(body),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "key",
      });

    if (error) {
      console.error("[POST /api/admin/settings] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Settings saved successfully" });
  } catch (err: any) {
    console.error("[POST /api/admin/settings] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

