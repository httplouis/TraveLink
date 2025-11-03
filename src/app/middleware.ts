// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/admin", "/driver", "/faculty", "/head", "/hr", "/exec"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // not a protected route → let it pass
  if (!PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // NOTE: your bootstrap sets "tl_role", so read that
  const role = req.cookies.get("tl_role")?.value ?? "user";

  // role → allowed paths
  const canAccess =
    (role === "admin" && pathname.startsWith("/admin")) ||
    (role === "driver" && pathname.startsWith("/driver")) ||
    (["faculty", "staff"].includes(role) && pathname.startsWith("/faculty")) ||
    (role === "head" && pathname.startsWith("/head")) ||
    (role === "hr" && pathname.startsWith("/hr")) ||
    (role === "exec" && pathname.startsWith("/exec"));

  if (!canAccess) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/driver/:path*", "/faculty/:path*", "/head/:path*", "/hr/:path*", "/exec/:path*"],
};
