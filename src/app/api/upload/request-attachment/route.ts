// src/app/api/upload/request-attachment/route.ts
/**
 * Upload Request Attachment API
 * Handles file uploads for travel orders and seminar applications
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(false);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const requestId = formData.get("requestId") as string | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Invalid file type. Allowed: PDF, JPG, PNG` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Use service role client for storage upload (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { ok: false, error: "Storage configuration missing" },
        { status: 500 }
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = requestId 
      ? `requests/${requestId}/${timestamp}-${sanitizedName}`
      : `requests/temp/${profile.id}/${timestamp}-${sanitizedName}`;

    // Upload to Supabase Storage (documents bucket)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload/request-attachment] Storage upload error:", uploadError);
      
      // Check if bucket doesn't exist
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        return NextResponse.json({
          ok: false,
          error: "Storage bucket 'documents' not found. Please create it in Supabase Dashboard > Storage > New bucket (name: 'documents', make it public)."
        }, { status: 500 });
      }
      
      return NextResponse.json(
        { ok: false, error: uploadError.message || "Upload failed" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("documents")
      .getPublicUrl(uploadData.path);

    // Return attachment info
    return NextResponse.json({
      ok: true,
      attachment: {
        id: crypto.randomUUID(),
        name: file.name,
        url: publicUrl,
        mime: file.type,
        size: file.size,
        uploaded_at: new Date().toISOString(),
        uploaded_by: profile.id,
      },
    });
  } catch (err: any) {
    console.error("[upload/request-attachment] Error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}

