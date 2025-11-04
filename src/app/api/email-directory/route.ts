import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simulated external email directory
// In production, this would call the actual email directory API
const EMAIL_DIRECTORY = [
  {
    email: "head.nursing@mseuf.edu.ph",
    name: "Dr. Maria Santos",
    department: "College of Nursing and Allied Health Sciences (CNAHS)",
    position: "Department Head",
  },
  {
    email: "head.engineering@mseuf.edu.ph",
    name: "Eng. Juan Dela Cruz",
    department: "College of Engineering",
    position: "Department Head",
  },
  {
    email: "hr.admin@mseuf.edu.ph",
    name: "Ms. Ana Reyes",
    department: "Human Resources",
    position: "HR Officer",
  },
  {
    email: "exec.office@mseuf.edu.ph",
    name: "Dr. Roberto Garcia",
    department: "Executive Office",
    position: "Executive Director",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ ok: false, error: "Email required" }, { status: 400 });
  }

  const entry = EMAIL_DIRECTORY.find(e => e.email.toLowerCase() === email.toLowerCase());

  if (!entry) {
    return NextResponse.json({ ok: false, error: "Email not found in directory" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    data: entry,
    note: "Department and position may be outdated; use as provisional data only."
  });
}
