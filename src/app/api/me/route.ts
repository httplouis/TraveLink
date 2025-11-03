// src/app/api/me/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // TEMP LANG TO
  return NextResponse.json({
    id: "u-123",
    full_name: "Belson Gabriel D. Tan",
    department: "College of Nursing and Allied Health Sciences (CNAHS)",
    role: "faculty",
    is_head: true,
    is_hr: false,
    is_exec: false,
  });
}
