import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET - Fetch department budgets
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is comptroller
    const { data: profile } = await supabase
      .from("users")
      .select("role, is_comptroller")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== 'comptroller' && !profile.is_comptroller)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const semester = searchParams.get("semester");

    // Build query
    let query = supabase
      .from("department_budgets")
      .select(`
        *,
        department:departments!department_budgets_department_id_fkey(
          id, name, code
        )
      `)
      .order("updated_at", { ascending: false });

    if (year) {
      query = query.eq("fiscal_year", parseInt(year));
    }

    if (semester && semester !== "all") {
      // Assuming semester is stored as a column or in metadata
      // Adjust based on your actual schema
      query = query.eq("semester", semester);
    }

    const { data: budgets, error } = await query;

    if (error) {
      console.error("[GET /api/comptroller/budget] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Transform data to include department name
    const transformedBudgets = (budgets || []).map((budget: any) => ({
      id: budget.id,
      department_id: budget.department_id,
      department_name: budget.department?.name || 'Unknown Department',
      department_code: budget.department?.code,
      fiscal_year: budget.fiscal_year,
      semester: budget.semester,
      total_allocated: parseFloat(budget.total_allocated || 0),
      total_used: parseFloat(budget.total_used || 0),
      total_pending: parseFloat(budget.total_pending || 0),
      remaining: parseFloat(budget.remaining || 0),
      created_at: budget.created_at,
      updated_at: budget.updated_at
    }));

    return NextResponse.json({ ok: true, data: transformedBudgets });
  } catch (err: any) {
    console.error("[GET /api/comptroller/budget] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// POST - Create new budget
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is comptroller
    const { data: profile } = await supabase
      .from("users")
      .select("role, is_comptroller")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== 'comptroller' && !profile.is_comptroller)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { department_id, fiscal_year, semester, total_allocated } = body;

    if (!department_id || !fiscal_year || !total_allocated) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: newBudget, error } = await supabase
      .from("department_budgets")
      .insert({
        department_id,
        fiscal_year: parseInt(fiscal_year),
        semester: semester || null,
        total_allocated: parseFloat(total_allocated),
        total_used: 0,
        total_pending: 0,
        remaining: parseFloat(total_allocated)
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/comptroller/budget] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: newBudget });
  } catch (err: any) {
    console.error("[POST /api/comptroller/budget] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// PATCH - Update budget
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is comptroller
    const { data: profile } = await supabase
      .from("users")
      .select("role, is_comptroller")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== 'comptroller' && !profile.is_comptroller)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, total_allocated } = body;

    if (!id || total_allocated === undefined) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get current budget to calculate remaining
    const { data: currentBudget } = await supabase
      .from("department_budgets")
      .select("total_used, total_pending")
      .eq("id", id)
      .single();

    if (!currentBudget) {
      return NextResponse.json({ ok: false, error: "Budget not found" }, { status: 404 });
    }

    const newAllocated = parseFloat(total_allocated);
    const newRemaining = newAllocated - currentBudget.total_used - currentBudget.total_pending;

    const { data: updatedBudget, error } = await supabase
      .from("department_budgets")
      .update({
        total_allocated: newAllocated,
        remaining: newRemaining,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/comptroller/budget] Error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: updatedBudget });
  } catch (err: any) {
    console.error("[PATCH /api/comptroller/budget] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

