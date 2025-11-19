// src/app/api/admin/history/departments/route.ts
/**
 * GET /api/admin/history/departments
 * Get unique departments from completed requests for filter dropdown
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);

    // Get unique departments from completed/approved requests
    const { data: requests, error } = await supabase
      .from("requests")
      .select("departments:departments!requests_department_id_fkey(name, code)")
      .in("status", ["completed", "approved"]);

    if (error) {
      console.error("[GET /api/admin/history/departments] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Extract unique departments
    const deptMap = new Map<string, { name: string; code: string }>();
    (requests || []).forEach((req: any) => {
      if (req.departments && req.departments.name) {
        deptMap.set(req.departments.code || req.departments.name, {
          name: req.departments.name,
          code: req.departments.code || req.departments.name,
        });
      }
    });

    const departments = Array.from(deptMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      ok: true,
      data: departments,
    });
  } catch (err: any) {
    console.error("[GET /api/admin/history/departments] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

