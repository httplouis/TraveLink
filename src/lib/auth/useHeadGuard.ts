"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

// Swap this to your real AuthRepo/current-user selector.
function getClientRole(): string | null {
  try {
    const mod = require("@/lib/auth/repo");
    if (mod?.AuthRepo?.getCurrent) {
      const u = mod.AuthRepo.getCurrent();
      return u?.role ?? null;
    }
  } catch {}
  if (typeof window !== "undefined") {
    return localStorage.getItem("role"); // dev fallback
  }
  return null;
}

export function useHeadGuard() {
  const router = useRouter();
  React.useEffect(() => {
    const role = getClientRole();
    if (role !== "head") {
      router.replace("/login"); // or 403 page
    }
  }, [router]);
}
