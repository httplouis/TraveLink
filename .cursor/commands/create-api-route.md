# Create API Route Template

Create a new API route file with proper structure for TraviLink project.

## Template

```typescript
// src/app/api/[endpoint]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient(false); // or true for admin
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    // Permission check (if needed)
    // const { data: profile } = await supabase.from("users")...
    
    // Your logic here
    
    return NextResponse.json({ ok: true, data: {} });
  } catch (error: any) {
    console.error("[GET /api/[endpoint]] Error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Similar structure
}

export async function PATCH(req: NextRequest) {
  // For updates - include password confirmation for admin actions
}

export async function DELETE(req: NextRequest) {
  // For deletions - include password confirmation for admin actions
}
```

## Key Points
- Always check authentication
- Use proper Supabase client (true for admin, false for regular)
- Include error handling
- Log with [PREFIX] format
- Return consistent JSON format

