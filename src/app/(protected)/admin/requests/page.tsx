// src/app/(protected)/admin/requests/page.tsx
"use client";

import dynamic from "next/dynamic";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";

/* ⚡ Client-only import for PageInner */
const PageInner = dynamic(() => import("./PageInner"), {
  ssr: false, // ✅ prevent hydration mismatch
});

export default function AdminRequestsPage() {
  return (
    <ToastProvider>
      <PageInner />
    </ToastProvider>
  );
}
