// app/(protected)/user/request/page.tsx
"use client";
import { RequestProvider } from "@/store/user/requestStore";
import RequestWizard from "@/components/user/request/RequestWizard.client";

export default function UserRequestPage() {
  return (
    <RequestProvider>
      <div className="mx-auto max-w-6xl p-4">
        <RequestWizard />
      </div>
    </RequestProvider>
  );
}
