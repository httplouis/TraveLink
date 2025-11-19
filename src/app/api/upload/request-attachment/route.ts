// src/app/api/upload/request-attachment/route.ts
/**
 * Upload Request Attachment API
 * Handles file uploads for travel orders and seminar applications
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/debug";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

export async function POST(request: NextRequest) {
  const logger = createLogger("UploadAttachment");
  
  try {
    logger.info("Starting file upload...");
    
    const supabase = await createSupabaseServerClient(false);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logger.warn("Unauthorized upload attempt");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("User authenticated:", { userId: user.id });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      logger.error("User profile not found:", profileError);
      return NextResponse.json({ ok: false, error: "User profile not found" }, { status: 404 });
    }

    logger.debug("User profile found:", { profileId: profile.id });

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const requestId = formData.get("requestId") as string | null;

    if (!file) {
      logger.warn("No file provided in request");
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    logger.debug("File received:", { 
      name: file.name, 
      type: file.type, 
      size: file.size,
      requestId: requestId || "temp"
    });

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

    logger.debug("Uploading file to storage...", { fileName, size: file.size, type: file.type });

    // Check if bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const documentsBucketExists = buckets?.some(b => b.id === 'documents');
    
    if (!documentsBucketExists) {
      logger.error("Documents bucket doesn't exist");
      return NextResponse.json({
        ok: false,
        error: "Storage bucket 'documents' not found. Please create it in Supabase Dashboard:\n\n1. Go to Supabase Dashboard > Storage\n2. Click 'New bucket'\n3. Name: 'documents'\n4. Public bucket: ✅ YES (important!)\n5. File size limit: 10MB\n6. Allowed MIME types: application/pdf, image/jpeg, image/jpg, image/png\n7. Click 'Create bucket'\n\nAfter creating, run the SQL file 'CREATE-DOCUMENTS-BUCKET-AND-POLICIES.sql' in Supabase SQL Editor to set up policies."
      }, { status: 500 });
    }

    // Upload to Supabase Storage (documents bucket)
    // Supabase accepts File objects directly
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("documents")
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      logger.error("Storage upload error:", uploadError);
      
      // Check if bucket doesn't exist (shouldn't happen if we just created it)
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        return NextResponse.json({
          ok: false,
          error: "Storage bucket 'documents' not found. Please create it in Supabase Dashboard > Storage > New bucket (name: 'documents', make it public)."
        }, { status: 500 });
      }
      
      // Check for RLS policy errors
      if (uploadError.message?.includes("policy") || uploadError.message?.includes("permission") || uploadError.message?.includes("RLS")) {
        return NextResponse.json({
          ok: false,
          error: "Storage permission error. Please check Storage bucket policies in Supabase Dashboard > Storage > documents > Policies. Make sure authenticated users can upload files."
        }, { status: 500 });
      }
      
      return NextResponse.json(
        { ok: false, error: uploadError.message || "Upload failed" },
        { status: 500 }
      );
    }

    logger.success("File uploaded successfully:", { path: uploadData.path });

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("documents")
      .getPublicUrl(uploadData.path);

    // Return attachment info
    const attachment = {
      id: crypto.randomUUID(),
      name: file.name,
      url: publicUrl,
      mime: file.type,
      size: file.size,
      uploaded_at: new Date().toISOString(),
      uploaded_by: profile.id,
    };

    logger.success("Upload complete:", { 
      attachmentId: attachment.id,
      fileName: attachment.name,
      url: publicUrl
    });

    return NextResponse.json({
      ok: true,
      attachment,
    });
  } catch (err: any) {
    logger.error("Upload error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}

