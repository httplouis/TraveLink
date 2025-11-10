import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Create Supabase client directly
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Ignore cookie errors in API routes
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: "", ...options });
            } catch (error) {
              // Ignore cookie errors in API routes
            }
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile to check President status
    const { data: profile } = await supabase
      .from("users")
      .select("is_president")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile?.is_president) {
      return NextResponse.json(
        { ok: false, error: "Access denied. President role required." },
        { status: 403 }
      );
    }

    // Get requests requiring Presidential approval
    // President reviews high priority and high budget requests
    const { data: requests, error: requestsError } = await supabase
      .from("requests")
      .select("*")
      .eq("status", "pending_president")
      .is("president_approved_at", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (requestsError) {
      console.error("President Inbox error:", requestsError);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch President inbox", details: requestsError.message },
        { status: 500 }
      );
    }

    // Get requester and department info separately for each request
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (req) => {
        const { data: requester } = await supabase
          .from("users")
          .select("name, profile_picture, position_title")
          .eq("id", req.requester_id)
          .single();

        const { data: department } = await supabase
          .from("departments")
          .select("name, code")
          .eq("id", req.department_id)
          .single();

        let vpApprover = null;
        if (req.vp_approved_by) {
          const { data: vp } = await supabase
            .from("users")
            .select("name, signature")
            .eq("id", req.vp_approved_by)
            .single();
          vpApprover = vp;
        }

        return {
          ...req,
          requester_name: requester?.name || "Unknown",
          requester,
          department,
          vp_approver: vpApprover,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      data: enrichedRequests,
    });
  } catch (error) {
    console.error("President Inbox error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch President inbox" },
      { status: 500 }
    );
  }
}
