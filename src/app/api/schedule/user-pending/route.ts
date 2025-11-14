// src/app/api/schedule/user-pending/route.ts
/**
 * GET /api/schedule/user-pending
 * Fetch current user's pending requests for calendar display
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Fetch pending requests where user is requester
    const { data: requests, error } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        title,
        purpose,
        destination,
        travel_start_date,
        travel_end_date,
        status,
        department:departments!requests_department_id_fkey(name)
      `)
      .eq("requester_id", profile.id)
      .in("status", ["draft", "pending_head", "pending_admin", "pending_comptroller", "pending_hr", "pending_exec", "pending_vp", "pending_president"])
      .order("travel_start_date", { ascending: true });

    if (error) {
      console.error("[/api/schedule/user-pending] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Transform to calendar format
    const pending = (requests || []).map((req: any) => {
      const startDate = new Date(req.travel_start_date);
      const endDate = new Date(req.travel_end_date);
      
      // Generate date range
      const dates: string[] = [];
      const current = new Date(startDate);
      while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }

      return {
        id: req.id,
        request_number: req.request_number,
        title: req.title || req.purpose,
        destination: req.destination,
        department: req.department?.name || "Unknown",
        status: req.status,
        dates, // Array of date strings
      };
    });

    return NextResponse.json({ ok: true, data: pending });
  } catch (err: any) {
    console.error("[/api/schedule/user-pending] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

