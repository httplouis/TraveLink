"use client";

import React from "react";
import { Clock } from "lucide-react";
import VPInboxContainer from "@/components/vp/inbox/InboxContainer";

export default function VPInboxPage() {
  console.log("[VPInboxPage] 🚀 Component rendering");
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        console.log("[VPInboxPage] 🔍 Starting fetch to /api/vp/inbox for count");
        const res = await fetch("/api/vp/inbox", { cache: "no-store" });
        console.log("[VPInboxPage] 📡 Response received:", {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          contentType: res.headers.get("content-type"),
          url: res.url
        });
        if (!res.ok) {
          console.warn("[VPInboxPage] ❌ API not OK:", res.status);
          const errorText = await res.text();
          console.error("[VPInboxPage] ❌ Error response body:", errorText.substring(0, 500));
          return;
        }
        const contentType = res.headers.get("content-type");
        console.log("[VPInboxPage] 📄 Content-Type:", contentType);
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("[VPInboxPage] ❌ Non-JSON response");
          const errorText = await res.text();
          console.error("[VPInboxPage] ❌ Non-JSON response body:", errorText.substring(0, 500));
          return;
        }
        console.log("[VPInboxPage] ✅ Parsing JSON...");
        const data = await res.json();
        console.log("[VPInboxPage] ✅ JSON parsed successfully:", { ok: data.ok, dataLength: data.data?.length });
        if (data.ok) {
          setPendingCount(data.data?.length || 0);
        }
      } catch (err) {
        console.error("Failed to fetch count:", err);
      }
    };
    
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <VPInboxContainer />
    </div>
  );
}
