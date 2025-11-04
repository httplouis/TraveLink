// src/app/(protected)/layout.tsx
"use client";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Each role-specific layout (admin, head, hr, etc.) now handles its own auth check and navigation
  // This is just a passthrough wrapper
  return <>{children}</>;
}
