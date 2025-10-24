"use client";

import { useMemo, useState } from "react";
import VehiclesTable from "@/components/driver/vehicles/ui/VehiclesTable.ui";
import VehicleDetailsDrawer from "@/components/driver/vehicles/ui/VehicleDetailsDrawer.ui";
import { VehiclesRepo } from "@/lib/driver/vehicles/repo";
import { MaintenanceRepo } from "@/lib/driver/maintenance/repo";
import type { Vehicle } from "@/lib/driver/vehicles/types";
import type { MaintenanceRecord } from "@/lib/driver/maintenance/types";

// mock current user
const DRIVER_ID = "driver-a";

export default function DriverVehiclesPage() {
  const vehicles = useMemo(() => VehiclesRepo.list(), []);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Vehicle | null>(null);

  function openDetails(v: Vehicle) { setActive(v); setOpen(true); }
  function closeDetails() { setOpen(false); setActive(null); }

  const logs: MaintenanceRecord[] = active ? MaintenanceRepo.listPublicForVehicle(active.id) : [];

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Vehicles</h1>
        <p className="text-sm text-neutral-600">Browse vehicles and view maintenance history. Create a simple report if needed.</p>
      </div>

      <VehiclesTable rows={vehicles} onView={openDetails} />

      <VehicleDetailsDrawer
        open={open}
        onClose={closeDetails}
        vehicle={active}
        logs={logs}
        onNewReport={() => {
          if (active) window.location.href = `/driver/maintenance/new?vehicleId=${active.id}`;
        }}
      />
    </div>
  );
}
    