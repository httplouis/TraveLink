import { NextResponse } from "next/server";
import { listPublicVehicles } from "@/lib/fleet/publicRepo";

export async function GET() {
  const data = await listPublicVehicles();
  return NextResponse.json({ data });
}
