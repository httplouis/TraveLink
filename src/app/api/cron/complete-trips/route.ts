// src/app/api/cron/complete-trips/route.ts
/**
 * POST /api/cron/complete-trips
 * Cron job endpoint to auto-complete trips after travel date
 * Can be called by external cron service (e.g., Vercel Cron, GitHub Actions)
 */

import { NextRequest, NextResponse } from "next/server";
import { autoCompleteTrips } from "@/lib/schedule/trip-completion";

export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication/authorization check
    // For example, check for a secret token in headers
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await autoCompleteTrips();

    return NextResponse.json({
      ok: true,
      data: result,
      message: `Completed ${result.completed} trips, ${result.errors} errors`,
    });
  } catch (error: any) {
    console.error("[Cron Complete Trips] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to complete trips" },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing
export async function GET(req: NextRequest) {
  return POST(req);
}

