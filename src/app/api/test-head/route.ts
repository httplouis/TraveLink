// Test endpoint to directly query for Irish Mae Cagas
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("department_id") || "c8d1d0b3-3fb6-417f-b0cf-7003fe0d03f3";
    
    console.log(`[TEST] Testing head query for department_id=${departmentId}`);
    
    // Use service role to bypass RLS
    const supabase = await createSupabaseServerClient(true);
    console.log(`[TEST] ✅ Supabase client created`);
    
    // Verify service role key is being used
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    console.log(`[TEST] Service role key present: ${!!serviceRoleKey}`);
    console.log(`[TEST] Service role key length: ${serviceRoleKey?.length || 0}`);
    console.log(`[TEST] Anon key present: ${!!anonKey}`);
    console.log(`[TEST] Service role key starts with: ${serviceRoleKey?.substring(0, 20) || 'N/A'}...`);
    
    // Test Query 1: Direct query with is_head=true
    console.log(`[TEST] 🔍 Query 1: is_head=true`);
    const { data: query1, error: error1 } = await supabase
      .from("users")
      .select("id, name, email, department_id, is_head, role, status")
      .eq("department_id", departmentId)
      .eq("is_head", true);
    
    console.log(`[TEST] Query 1 result:`, {
      found: query1?.length || 0,
      error: error1,
      data: query1
    });
    
    // Test Query 2: role='head'
    console.log(`[TEST] 🔍 Query 2: role='head'`);
    const { data: query2, error: error2 } = await supabase
      .from("users")
      .select("id, name, email, department_id, is_head, role, status")
      .eq("department_id", departmentId)
      .eq("role", "head");
    
    console.log(`[TEST] Query 2 result:`, {
      found: query2?.length || 0,
      error: error2,
      data: query2
    });
    
    // Test Query 3: Check if Irish exists at all
    console.log(`[TEST] 🔍 Query 3: Search for Irish Mae Cagas`);
    const { data: query3, error: error3 } = await supabase
      .from("users")
      .select("id, name, email, department_id, is_head, role, status")
      .ilike("name", "%Irish%");
    
    console.log(`[TEST] Query 3 result:`, {
      found: query3?.length || 0,
      error: error3,
      data: query3
    });
    
    // Test Query 4: Check all heads in CENG
    console.log(`[TEST] 🔍 Query 4: All users in CENG`);
    const { data: query4, error: error4 } = await supabase
      .from("users")
      .select("id, name, email, department_id, is_head, role, status")
      .eq("department_id", departmentId);
    
    console.log(`[TEST] Query 4 result:`, {
      found: query4?.length || 0,
      error: error4,
      error_message: error4?.message,
      error_code: error4?.code,
      error_details: error4?.details,
      heads: query4?.filter((u: any) => u.is_head || u.role === 'head'),
      all_users: query4?.map((u: any) => ({ name: u.name, is_head: u.is_head, role: u.role, dept_id: u.department_id }))
    });
    
    // Test Query 5: Direct search by email (should bypass any department_id issues)
    console.log(`[TEST] 🔍 Query 5: Search by email directly`);
    const { data: query5, error: error5 } = await supabase
      .from("users")
      .select("id, name, email, department_id, is_head, role, status")
      .eq("email", "a21-31062@student.mseuf.edu.ph");
    
    console.log(`[TEST] Query 5 result:`, {
      found: query5?.length || 0,
      error: error5,
      error_message: error5?.message,
      error_code: error5?.code,
      data: query5
    });
    
    return NextResponse.json({
      ok: true,
      department_id: departmentId,
      results: {
        query1: { found: query1?.length || 0, data: query1, error: error1 },
        query2: { found: query2?.length || 0, data: query2, error: error2 },
        query3: { found: query3?.length || 0, data: query3, error: error3 },
        query4: { found: query4?.length || 0, data: query4, error: error4 },
        query5: { found: query5?.length || 0, data: query5, error: error5 }
      }
    });
  } catch (err: any) {
    console.error("[TEST] Error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

