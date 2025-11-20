import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = ["/", "/login", "/register", "/api", "/requesters", "/participants", "/contact", "/privacy", "/terms"];
const ASSET_PREFIXES = ["/_next", "/images", "/favicon.ico", "/robots.txt", "/sitemap.xml", "/euwhite.png", "/pattern-light.jpg", "/eulogo.png", "/site.webmanifest"];

type Me = {
  id: string;
  role: "admin" | "faculty" | "driver" | "comptroller";
  is_head?: boolean;
  is_hr?: boolean;
  is_exec?: boolean;
  is_vp?: boolean;
  is_president?: boolean;
  is_admin?: boolean;
  is_comptroller?: boolean;
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
  const comptrollerEmails = ["comptroller@mseuf.edu.ph"];
  
  // Super Admin: is_admin = true AND role = 'admin' → /super-admin
  if (me.is_admin && me.role === "admin") return "/super-admin";
  // Transport Admin: role = 'admin' but not super admin → /admin
  if (me.role === "admin" || adminEmails.includes((me as any).email)) return "/admin";
  // Comptroller: check both role and is_comptroller flag, or email
  if (me.role === "comptroller" || me.is_comptroller || comptrollerEmails.includes((me as any).email)) {
    return "/comptroller/inbox";
  }
  if (me.is_president) return "/president/dashboard";
  // VP takes priority over head (VP is higher role)
  if (me.is_vp) return "/vp/dashboard";
  // HR takes priority over head (HR is a specialized role)
  if (me.is_hr) return "/hr/dashboard";
  if (me.is_head) return "/head/dashboard";
  if (me.is_exec) return "/exec/dashboard";
  if (me.role === "driver") return "/driver";
  return "/user";  // This routes to /user/page.tsx
}

function isAllowed(me: Me, path: string): boolean {
  const adminEmails = ["admin@mseuf.edu.ph", "admin.cleofe@mseuf.edu.ph"];
  const comptrollerEmails = ["comptroller@mseuf.edu.ph"];
  const isAdmin = me.role === "admin" || adminEmails.includes((me as any).email);
  const isSuperAdmin = me.is_admin === true && me.role === "admin";
  // Check comptroller by role, flag, or email
  const isComptroller = me.role === "comptroller" || me.is_comptroller || comptrollerEmails.includes((me as any).email);
  
  // Strict role-based access - each role can ONLY access their designated pages
  // Super Admin: is_admin = true AND role = 'admin' → /super-admin
  if (path.startsWith("/super-admin")) return isSuperAdmin;
  // Transport Admin: role = 'admin' but not super admin → /admin
  if (path.startsWith("/admin")) return isAdmin && !isSuperAdmin;
  if (path.startsWith("/president")) return !!me.is_president && !isAdmin && !isComptroller;
  // Allow both VP and President to access VP routes (President is higher role)
  if (path.startsWith("/vp")) return (!!me.is_vp || !!me.is_president) && !isAdmin && !isComptroller;
  if (path.startsWith("/head")) return !!me.is_head && !isAdmin && !isComptroller;
  if (path.startsWith("/hr")) return !!me.is_hr && !isAdmin && !isComptroller;
  if (path.startsWith("/exec")) return !!me.is_exec && !isAdmin && !isComptroller;
  if (path.startsWith("/comptroller")) return isComptroller; // Allow comptroller role, flag, or email
  if (path.startsWith("/driver")) return me.role === "driver" && !isAdmin && !isComptroller;
  if (path.startsWith("/user")) return !isAdmin && !me.is_head && !me.is_hr && !me.is_exec && !me.is_vp && !me.is_president && me.role !== "driver" && !isComptroller;
  
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
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public static files (images, manifest, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)).*)",
  ],
};
