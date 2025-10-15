"use client";
import ToastProvider from "@/components/common/ui/ToastProvider.ui";
import VehiclesPageClient from "@/components/admin/vehicles/containers/VehiclesPage.client";

export default function AdminVehiclesPage() {
  return (
    <ToastProvider>
      <VehiclesPageClient />
    </ToastProvider>
  );
}
