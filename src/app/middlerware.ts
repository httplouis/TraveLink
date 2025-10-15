// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Only guard these routes
  const protectedPrefixes = ["/admin", "/driver", "/user"];
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
    // preserve full path + query so we can return the user after login
    url.searchParams.set("next", pathname + (search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Only run on protected routes
  matcher: ["/admin/:path*", "/driver/:path*", "/user/:path*"],
};
