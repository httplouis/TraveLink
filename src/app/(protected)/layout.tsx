// src/app/(protected)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Sidebar, { type Me } from "@/components/common/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) throw new Error("not logged in");
        const data = (await res.json()) as Me;
        setMe(data);
      } catch (e) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="h-dvh flex items-center justify-center text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="min-h-dvh flex bg-slate-100">
      <Sidebar me={me} />
      <main className="flex-1 min-h-dvh overflow-y-auto">{children}</main>
    </div>
  );
}
