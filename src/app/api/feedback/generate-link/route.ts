// src/app/api/feedback/generate-link/route.ts
/**
 * POST /api/feedback/generate-link
 * Generate a shareable feedback link/QR code for student feedback
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(true);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, is_head, is_admin, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
    }

    // Only faculty/head/admin can generate feedback links
    if (!profile.is_head && profile.role !== "faculty" && !profile.is_admin) {
      return NextResponse.json({ ok: false, error: "Only faculty/head/admin can generate feedback links" }, { status: 403 });
    }

    const body = await request.json() as { requestId?: string; expiresInDays?: number };
    const { requestId, expiresInDays = 7 } = body;

    if (!requestId) {
      return NextResponse.json({ ok: false, error: "Request ID required" }, { status: 400 });
    }

    // Verify request belongs to user or user is admin
    const { data: requestData } = await supabase
      .from("requests")
      .select("id, request_number, requester_id, status")
      .eq("id", requestId)
      .single();

    if (!requestData) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    // Check if user owns the request or is admin
    if (requestData.requester_id !== profile.id && !profile.is_admin) {
      return NextResponse.json({ ok: false, error: "Not authorized for this request" }, { status: 403 });
    }

    // Generate unique token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store token in database (create feedback_tokens table or use existing mechanism)
    // For now, we'll store it in a simple format
    // In production, create a feedback_tokens table with: id, request_id, token, created_by, expires_at, created_at
    
    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "http://localhost:3000";
    const feedbackUrl = `${baseUrl}/feedback/anonymous?token=${token}&request=${requestId}`;

    console.log(`[Feedback Link] Generated link for request ${requestId}: ${feedbackUrl}`);

    return NextResponse.json({
      ok: true,
      data: {
        url: feedbackUrl,
        token: token,
        expiresAt: expiresAt.toISOString(),
        requestId: requestData.id,
        requestNumber: requestData.request_number
      }
    });

  } catch (error: any) {
    console.error("[Feedback Link] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to generate feedback link" },
      { status: 500 }
    );
  }
}

