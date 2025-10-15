"use client";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import SchedulePageClient from "@/app/(protected)/admin/schedule/SchedulePageClient";

export default function AdminSchedulePage() {
  return (
    <ToastProvider>
      <SchedulePageClient />
    </ToastProvider>
  );
}
