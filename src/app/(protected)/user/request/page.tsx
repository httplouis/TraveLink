// src/app/(protected)/user/request/page.tsx
"use client";

import dynamic from "next/dynamic";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";

// Render the whole page client-only to avoid hydration issues
const RequestWizard = dynamic(
  () => import("@/components/user/request/RequestWizard.client"),
  { ssr: false }
);

export default function UserRequestPage() {
  return (
    <ToastProvider>
      <div className="mx-auto max-w-6xl p-4">
        <RequestWizard />
      </div>
    </ToastProvider>
  );
}
