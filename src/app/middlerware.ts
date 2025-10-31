// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Simple RBAC gate:
 * - Read auth cookie (Supabase session) to ensure logged in.
 * - Read a lightweight "role" cookie (set by your login flow). Expected: 'admin' | 'comptroller' | 'hr' | 'executive' | 'head' | 'user' | 'driver'
 *
 * In production, prefer checking the Supabase JWT claims instead of a plain cookie.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Guarded groups by role
  const roleAreas: Record<string, Array<string>> = {
    admin: ["/admin"],
    driver: ["/driver"],
    user: ["/user"],
    head: ["/head"],
    comptroller: ["/comptroller"],
    hr: ["/hr"],
    executive: ["/exec"],
  };

  // Which top-level segments are protected at all?
  const protectedPrefixes = [
    "/admin",
    "/driver",
    "/user",
    "/head",
    "/comptroller",
    "/hr",
    "/exec",
  ];

  const needsAuth = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  // Supabase v2 cookie looks like: sb-<projectRef>-auth-token
  const cookies = req.cookies.getAll();
  const hasSbSession = cookies.some(
    (c) => /^sb-[a-z0-9]+-auth-token$/i.test(c.name) && Boolean(c.value)
  );
  if (!hasSbSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  // Light role check (replace with JWT claims in prod)
  const role = req.cookies.get("role")?.value ?? "user";

  // If path is under one of the role areas, enforce role
  for (const [allowedRole, prefixes] of Object.entries(roleAreas)) {
    if (prefixes.some((p) => pathname.startsWith(p))) {
      if (role !== allowedRole) {
        // 403 page or redirect
        const url = req.nextUrl.clone();
        url.pathname = "/403";
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/driver/:path*",
    "/user/:path*",
    "/head/:path*",
    "/comptroller/:path*",
    "/hr/:path*",
    "/exec/:path*",
  ],
};
