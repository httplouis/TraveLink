// src/app/(protected)/user/request/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import RequestFAQPage from "./faq/page";

// Redirect to FAQ page (which has the "Start Request Now" button)
export default function UserRequestPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to FAQ page
    router.replace("/user/request/faq");
  }, [router]);

  return <RequestFAQPage />;
}
