// src/lib/feedback/qr.ts
/**
 * Feedback System - QR Code Generation
 * Generates shareable links/QR codes for student feedback
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface FeedbackLink {
  url: string;
  qrCodeDataUrl?: string;
  expiresAt?: string;
  requestId: string;
  requestNumber: string;
}

/**
 * Generate a shareable feedback link for a trip
 * This allows students to provide feedback without logging in
 */
export async function generateFeedbackLink(
  requestId: string,
  facultyId: string,
  expiresInDays: number = 7
): Promise<FeedbackLink> {
  const supabase = await createSupabaseServerClient(true);
  
  // Get request details
  const { data: request } = await supabase
    .from("requests")
    .select("id, request_number, travel_end_date")
    .eq("id", requestId)
    .single();

  if (!request) {
    throw new Error("Request not found");
  }

  // Generate unique token for anonymous feedback
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  // Store token in database (create a feedback_tokens table or use existing)
  // For now, we'll use the feedback table with a special token field
  // In production, create a separate feedback_tokens table
  
  // Generate shareable URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const feedbackUrl = `${baseUrl}/feedback/anonymous?token=${token}&request=${requestId}`;

  // Generate QR code (client-side using a library like qrcode.react)
  // For server-side, you'd need a library like 'qrcode'
  
  return {
    url: feedbackUrl,
    expiresAt: expiresAt.toISOString(),
    requestId: request.id,
    requestNumber: request.request_number || ""
  };
}

/**
 * Verify feedback token and get request details
 */
export async function verifyFeedbackToken(token: string): Promise<{
  valid: boolean;
  requestId?: string;
  requestNumber?: string;
}> {
  // In production, verify token from database
  // For now, return basic validation
  return {
    valid: token.length > 0,
    requestId: undefined,
    requestNumber: undefined
  };
}

