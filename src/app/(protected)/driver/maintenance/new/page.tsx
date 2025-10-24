"use client";

import { useMemo } from "react";
import CreateMaintenanceReportUI from "@/components/driver/maintenance/forms/CreateMaintenanceReport.ui";
import { VehiclesRepo } from "@/lib/driver/vehicles/repo";
import { MaintenanceRepo } from "@/lib/driver/maintenance/repo";

// mock current driver
const DRIVER_ID = "driver-a";

function useQuery() {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search);
}

export default function NewMaintenancePage() {
  const qs = useQuery();
  const vehicleId = qs.get("vehicleId") || VehiclesRepo.list()[0]?.id || "veh-bus-12";
  const vehicle = useMemo(() => VehiclesRepo.getById(vehicleId), [vehicleId]);

  if (!vehicle) return <div className="p-6">Vehicle not found.</div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <CreateMaintenanceReportUI
        vehicleName={vehicle.name}
        plate={vehicle.plate}
        onSubmit={(payload, kind) => {
          const draft = MaintenanceRepo.newDraft(DRIVER_ID, { vehicleId, ...payload });
          if (kind === "draft") {
            MaintenanceRepo.saveDraft(DRIVER_ID, draft);
            alert("Saved as draft.");
          } else {
            MaintenanceRepo.submit(DRIVER_ID, draft);
            alert("Submitted to Admin.");
          }
          window.location.href = "/driver/vehicles";
        }}
      />
    </div>
  );
}
