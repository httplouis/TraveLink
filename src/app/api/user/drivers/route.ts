import { NextResponse } from "next/server";
import { listPublicDrivers } from "@/lib/fleet/publicRepo";

export async function GET() {
  const data = await listPublicDrivers();
  return NextResponse.json({ data });
}
