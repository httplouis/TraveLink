// src/app/api/activity/route.ts
/**
 * GET /api/activity
 * Get activity history for the current user
 * Query params: action_type, start_date, end_date, limit, offset
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function getAuthUser() {
  const cookieStore = await cookies();
  
  // Debug: Log all cookies
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'));
  console.log("[getAuthUser] Auth cookies found:", authCookies.map(c => ({ name: c.name, valueLength: c.value?.length })));
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          if (name.includes('supabase') || name.includes('sb-')) {
            console.log("[getAuthUser] Reading cookie:", name, "exists:", !!value);
          }
          return value;
        },
        set() {},
        remove() {},
      },
    }
  );
  return supabase.auth.getUser();
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log("[getServiceClient] URL exists:", !!url);
  console.log("[getServiceClient] Service key exists:", !!key);
  console.log("[getServiceClient] Service key prefix:", key?.substring(0, 20));
  
  return createClient(url!, key!, { 
    auth: { persistSession: false, autoRefreshToken: false } 
  });
}

export async function GET(req: NextRequest) {
  try {
    console.log("[GET /api/activity] Starting...");
    
    // Get authenticated user
    const { data: { user }, error: authError } = await getAuthUser();
    
    console.log("[GET /api/activity] Auth result:", { 
      hasUser: !!user, 
      userId: user?.id,
      authError: authError?.message 
    });
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for all queries
    const supabase = getServiceClient();
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    console.log("[GET /api/activity] Profile lookup:", { 
      authUserId: user.id,
      userEmail: user.email,
      profileId: profile?.id, 
      profileError: profileError?.message 
    });

    if (profileError || !profile) {
      // Return more debug info
      return NextResponse.json({ 
        ok: false, 
        error: "Profile not found",
        debug: {
          authUserId: user.id,
          userEmail: user.email,
          profileError: profileError?.message,
        }
      }, { status: 404 });
    }

    const userId = profile.id;

    // Parse query params
    const searchParams = req.nextUrl.searchParams;
    const action_type = searchParams.get("action_type") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Get user's request IDs first
    const { data: userRequests, error: reqError } = await supabase
      .from("requests")
      .select("id")
      .eq("requester_id", userId);
    
    console.log("[GET /api/activity] User requests:", { 
      count: userRequests?.length, 
      reqError: reqError?.message 
    });
    
    const userRequestIds = (userRequests || []).map((r: any) => r.id);

    // Build query for request_history - SIMPLIFIED: just get by actor_id first
    console.log("[GET /api/activity] Querying request_history for actor_id:", userId);
    
    // First, do a simple count to verify the query works
    const { count: preCount, error: preError } = await supabase
      .from("request_history")
      .select("*", { count: "exact", head: true })
      .eq("actor_id", userId);
    
    console.log("[GET /api/activity] Pre-count check:", { preCount, preError: preError?.message });
    
    // Now do the actual query
    const { data, error, count } = await supabase
      .from("request_history")
      .select("*", { count: "exact" })
      .eq("actor_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    
    console.log("[GET /api/activity] Query result:", { 
      dataLength: data?.length, 
      count, 
      error: error?.message,
      firstItem: data?.[0]?.id,
    });

    if (error) {
      console.error("[GET /api/activity] Query error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    
    // DEBUG: If no data, return debug info
    if (!data || data.length === 0) {
      // Try a direct count query to verify
      const { count: directCount, error: countError } = await supabase
        .from("request_history")
        .select("*", { count: "exact", head: true })
        .eq("actor_id", userId);
      
      // Also try getting sample data directly
      const { data: sampleData, error: sampleError } = await supabase
        .from("request_history")
        .select("id, action, actor_id")
        .eq("actor_id", userId)
        .limit(3);
      
      console.log("[GET /api/activity] DEBUG:", { 
        directCount, 
        countError: countError?.message,
        sampleDataLength: sampleData?.length,
        sampleError: sampleError?.message
      });
      
      // If direct query works but main query doesn't, there's something wrong
      if (directCount && directCount > 0) {
        // Return the sample data instead
        return NextResponse.json({
          ok: true,
          data: sampleData || [],
          total: directCount,
          limit,
          offset,
          debug: {
            message: "Main query failed but direct query worked",
            userId,
            authUserId: user.id,
            directCount,
          }
        });
      }
      
      return NextResponse.json({
        ok: true,
        data: [],
        total: 0,
        limit,
        offset,
        debug: {
          userId,
          authUserId: user.id,
          directCount,
          countError: countError?.message,
        }
      });
    }

    // Fetch related data
    const requestIds = [...new Set((data || []).map((item: any) => item.request_id).filter(Boolean))];
    const actorIds = [...new Set((data || []).map((item: any) => item.actor_id).filter(Boolean))];

    let requestsMap: Record<string, any> = {};
    if (requestIds.length > 0) {
      const { data: requests } = await supabase
        .from("requests")
        .select("id, request_number, purpose, requester_id")
        .in("id", requestIds);
      if (requests) {
        requestsMap = Object.fromEntries(requests.map((r: any) => [r.id, r]));
      }
    }

    let actorsMap: Record<string, any> = {};
    if (actorIds.length > 0) {
      const { data: actors } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", actorIds);
      if (actors) {
        actorsMap = Object.fromEntries(actors.map((a: any) => [a.id, a]));
      }
    }

    // Transform data
    const transformedData = (data || []).map((item: any) => ({
      ...item,
      request: requestsMap[item.request_id] || null,
      actor: actorsMap[item.actor_id] || null,
      is_own_action: item.actor_id === userId,
    }));

    const response = NextResponse.json({
      ok: true,
      data: transformedData,
      total: count || 0,
      limit,
      offset,
      debug: {
        userId,
        authUserId: user.id,
        userEmail: user.email,
        timestamp: new Date().toISOString(),
      }
    });
    
    // Ensure no caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    
    return response;
  } catch (error: any) {
    console.error("[GET /api/activity] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
