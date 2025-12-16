// src/app/api/activity/test/route.ts
// Debug endpoint to test activity query directly

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    console.log("[TEST] Creating client with URL:", url);
    console.log("[TEST] Key prefix:", key?.substring(0, 30));
    
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    // Test 1: Simple count
    const { count: totalCount, error: countError } = await supabase
      .from("request_history")
      .select("*", { count: "exact", head: true });
    
    console.log("[TEST] Total count:", totalCount, "Error:", countError?.message);
    
    // Test 2: Count for specific user
    const userId = "02358efd-f12c-4660-b4b8-9d66f40d05e8";
    const { count: userCount, error: userError } = await supabase
      .from("request_history")
      .select("*", { count: "exact", head: true })
      .eq("actor_id", userId);
    
    console.log("[TEST] User count:", userCount, "Error:", userError?.message);
    
    // Test 3: Get actual data
    const { data, error: dataError } = await supabase
      .from("request_history")
      .select("id, action, actor_id, created_at")
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);
    
    console.log("[TEST] Data:", data?.length, "Error:", dataError?.message);
    
    return NextResponse.json({
      ok: true,
      totalCount,
      countError: countError?.message,
      userCount,
      userError: userError?.message,
      dataLength: data?.length,
      dataError: dataError?.message,
      sampleData: data,
    });
  } catch (error: any) {
    console.error("[TEST] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
