// src/app/(protected)/admin/requests/page.tsx
// Redirect to inbox - all admin request management is now in /admin/inbox
import { redirect } from "next/navigation";

export default function AdminRequestsPage() {
  redirect("/admin/inbox");
}
