"use client";
import { useMemo } from "react";
import { VehiclesRepo } from "@/lib/driver/vehicles/repo";
import { MaintenanceRepo } from "@/lib/driver/maintenance/repo";
import MaintenanceTable from "@/components/driver/vehicles/ui/MaintenanceTable.ui";

export default function VehicleByIdPage({ params }: { params: { id: string } }) {
  const vehicle = useMemo(() => VehiclesRepo.getById(params.id), [params.id]);
  const logs = useMemo(() => MaintenanceRepo.listPublicForVehicle(params.id), [params.id]);

  if (!vehicle) return <div className="p-6">Vehicle not found.</div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-5">
      <div>
        <div className="text-xs text-neutral-500">{vehicle.type}</div>
        <h1 className="text-2xl font-semibold">{vehicle.name} • <span className="font-mono">{vehicle.plate}</span></h1>
        <p className="text-sm text-neutral-600">Detailed maintenance history.</p>
      </div>
      <MaintenanceTable rows={logs} />
    </div>
  );
}
