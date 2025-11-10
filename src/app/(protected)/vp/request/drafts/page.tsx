"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VPDraftsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push("/user/request/drafts");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
    </div>
  );
}
