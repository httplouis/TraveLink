"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if this is an OAuth callback (has code parameter)
    const code = searchParams?.get("code");
    
    if (code) {
      // Redirect to callback handler with the code
      router.replace(`/api/auth/callback?code=${code}`);
    } else {
      // Otherwise, redirect to login
      router.replace("/login");
    }
  }, [searchParams, router]);
  
  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-12 w-12 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-[#7A0010] border-t-transparent rounded-full"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
