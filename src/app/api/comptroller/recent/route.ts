// src/app/api/comptroller/recent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recent requests that went through comptroller (approved or rejected or pending)
    const { data, error } = await supabase
      .from("requests")
      .select(`
        id,
        request_number,
        total_budget,
        comptroller_edited_budget,
        status,
        created_at,
        comptroller_approved_at,
        comptroller_rejected_at,
        requester:requester_id (
          id,
          name,
          email
        )
      `)
      .or("status.eq.pending_comptroller,comptroller_approved_at.not.is.null,comptroller_rejected_at.not.is.null")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;

    // Transform data
    const recentActivity = data?.map((req) => {
      let status: "pending" | "approved" | "rejected" = "pending";
      let time = "";

      if (req.comptroller_approved_at) {
        status = "approved";
        time = formatTimeAgo(new Date(req.comptroller_approved_at));
      } else if (req.comptroller_rejected_at) {
        status = "rejected";
        time = formatTimeAgo(new Date(req.comptroller_rejected_at));
      } else {
        time = formatTimeAgo(new Date(req.created_at));
      }

      const requesterName = req.requester && typeof req.requester === 'object' && 'name' in req.requester 
        ? (req.requester as any).name 
        : "Unknown";

      return {
        id: req.request_number || req.id,
        requester: requesterName,
        budget: req.comptroller_edited_budget || req.total_budget || 0,
        status,
        time,
      };
    }) || [];

    return NextResponse.json(recentActivity);

  } catch (error: any) {
    console.error("Error fetching recent activity:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
}
