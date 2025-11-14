// src/app/api/upload/profile-picture/route.ts
/**
 * Upload Profile Picture API
 */
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient(false);
    
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    // Get user from database to get user ID
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (dbError || !dbUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ ok: false, error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ ok: false, error: "File size must be less than 5MB" }, { status: 400 });
    }

    // Generate unique filename
    const fileName = `${dbUser.id}/avatar-${Date.now()}.${file.name.split('.').pop()}`;
    
    // Upload to Supabase Storage using service role to bypass RLS
    const supabaseAdmin = await createSupabaseServerClient(true);
    
    // Verify service role key is set
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[upload/profile-picture] ❌ SUPABASE_SERVICE_ROLE_KEY is not set!");
      return NextResponse.json({ 
        ok: false, 
        error: "Server configuration error: Service role key not found. Please set SUPABASE_SERVICE_ROLE_KEY in .env.local" 
      }, { status: 500 });
    }
    
    console.log("[upload/profile-picture] ✅ Using service role client for storage upload");
    
    // Upload to Supabase Storage
    // Note: Supabase Storage expects File or Blob, not Buffer
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('profiles')
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error("[upload/profile-picture] ❌ Storage upload error:", uploadError);
      console.error("[upload/profile-picture] Error details:", {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error
      });
      
      // Check if bucket doesn't exist
      if (uploadError.message?.includes("Bucket not found") || uploadError.message?.includes("not found")) {
        return NextResponse.json({ 
          ok: false, 
          error: "Storage bucket 'profiles' not found. Please create it in Supabase Dashboard > Storage > New bucket (name: 'profiles', make it public)." 
        }, { status: 500 });
      }
      
      // Check if RLS error
      if (uploadError.message?.includes("row-level security") || uploadError.message?.includes("RLS")) {
        return NextResponse.json({ 
          ok: false, 
          error: "Storage RLS error. Please check Storage bucket policies in Supabase Dashboard > Storage > profiles > Policies. Make sure authenticated users can upload files." 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        ok: false, 
        error: uploadError.message || "Upload failed. Check if 'profiles' bucket exists in Supabase Storage." 
      }, { status: 500 });
    }
    
    console.log("[upload/profile-picture] ✅ File uploaded successfully:", uploadData.path);

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profiles')
      .getPublicUrl(uploadData.path);

    // Update user's profile_picture in database
    // Using same service role client (already created above)
    
    console.log("[upload/profile-picture] Updating database with URL:", publicUrl);
    
    // Try both avatar_url and profile_picture columns
    const updateData: any = {
      avatar_url: publicUrl,
      profile_picture: publicUrl
    };
    
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", dbUser.id);

    if (updateError) {
      console.error("[upload/profile-picture] ❌ Database update error:", updateError);
      console.error("[upload/profile-picture] Update error details:", {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint
      });
      return NextResponse.json({ 
        ok: false, 
        error: `Failed to update profile picture: ${updateError.message}` 
      }, { status: 500 });
    }
    
    console.log("[upload/profile-picture] ✅ Database updated successfully");

    return NextResponse.json({ 
      ok: true, 
      url: publicUrl,
      path: uploadData.path 
    });

  } catch (err: any) {
    console.error("[upload/profile-picture] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Upload failed" }, { status: 500 });
  }
}

