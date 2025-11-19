"use client";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import AdminCalendarPageClient from "@/components/admin/schedule/AdminCalendarPage.client";

export default function AdminSchedulePage() {
  return (
    <ToastProvider>
      <div className="p-4 md:p-6">
        <AdminCalendarPageClient />
      </div>
    </ToastProvider>
  );
}
