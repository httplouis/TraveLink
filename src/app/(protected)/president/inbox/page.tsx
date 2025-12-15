"use client";

import React, { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PresidentInboxContainer from "@/components/president/inbox/InboxContainer";

export default function PresidentInboxPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-[#7A0019]" /></div>}>
      <div className="space-y-6">
        <PresidentInboxContainer />
      </div>
    </Suspense>
  );
}
