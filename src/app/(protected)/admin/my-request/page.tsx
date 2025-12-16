// src/app/(protected)/admin/my-request/page.tsx
"use client";

import dynamic from "next/dynamic";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";

// Render the whole page client-only to avoid hydration issues
const RequestWizard = dynamic(
  async () => {
    try {
      const module = await import("@/components/user/request/RequestWizard.client");
      return module;
    } catch (error) {
      console.error("[AdminMyRequestPage] Failed to load RequestWizard:", error);
      return {
        default: () => (
          <div className="mx-auto max-w-6xl p-4">
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6 text-center">
              <p className="text-red-800 font-semibold">Failed to load request form</p>
              <p className="text-red-600 text-sm mt-2">Please refresh the page</p>
            </div>
          </div>
        ),
      };
    }
  },
  { 
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-6xl p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7a0019] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading request form...</p>
          </div>
        </div>
      </div>
    )
  }
);

export default function AdminMyRequestPage() {
  return (
    <ToastProvider>
      <div className="mx-auto max-w-6xl">
        <RequestWizard />
      </div>
    </ToastProvider>
  );
}
