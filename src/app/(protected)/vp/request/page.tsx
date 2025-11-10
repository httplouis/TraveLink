"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VPRequestPage() {
  const router = useRouter();
  
  useEffect(() => {
    // VP can create requests as a faculty member, redirect to user request page
    router.push("/user/request");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
    </div>
  );
}
