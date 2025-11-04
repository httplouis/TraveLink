import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = ["/", "/login", "/register", "/api"];
const ASSET_PREFIXES = ["/_next", "/images", "/favicon.ico", "/robots.txt", "/sitemap.xml"];

type Me = {
  id: string;
  role: "admin" | "faculty" | "driver";
  is_head?: boolean;
  is_hr?: boolean;
  is_exec?: boolean;
  department?: string | null;
};

async function getUser(req: NextRequest): Promise<Me | null> {
  try {
    const url = new URL("/api/me", req.url);
    const res = await fetch(url.toString(), {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isPublicPath(path: string) {
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/")) ||
         ASSET_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

function resolveHomeBase(me: Me): string {
  const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph"];
  if (me.role === "admin" || adminEmails.includes((me as any).email)) return "/admin";
  if (me.is_head) return "/head/dashboard";
  if (me.is_hr) return "/hr/dashboard";
  if (me.is_exec) return "/exec/dashboard";
  if (me.role === "driver") return "/driver";
  return "/user";  // This routes to /user/page.tsx
}

function isAllowed(me: Me, path: string): boolean {
  const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph"];
  const isAdmin = me.role === "admin" || adminEmails.includes((me as any).email);
  
  // Strict role-based access - each role can ONLY access their designated pages
  if (path.startsWith("/admin")) return isAdmin;
  if (path.startsWith("/head")) return !!me.is_head && !isAdmin;
  if (path.startsWith("/hr")) return !!me.is_hr && !isAdmin;
  if (path.startsWith("/exec")) return !!me.is_exec && !isAdmin;
  if (path.startsWith("/comptroller")) return false; // Reserved
  if (path.startsWith("/driver")) return me.role === "driver" && !isAdmin;
  if (path.startsWith("/user")) return !isAdmin && !me.is_head && !me.is_hr && !me.is_exec && me.role !== "driver";
  
  return true;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const me = await getUser(req);
  if (!me) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!isAllowed(me, pathname)) {
    const home = resolveHomeBase(me);
    const url = new URL(home, req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|images|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
