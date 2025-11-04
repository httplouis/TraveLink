import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    counts: {
      pending_head: 5,
      comptroller_pending: 3,
      hr_pending: 2,
      executive_pending: 4,
    },
  });
}
