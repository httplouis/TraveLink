// src/components/user/request/ui/SchoolServiceSection.ui.tsx
"use client";

import * as React from "react";
import { SelectInput } from "@/components/user/request/ui/controls";

export default function SchoolServiceSection({
  data,
  onChange,
  errors,
}: {
  data: any;
  onChange: (patch: any) => void;
  errors: Record<string, string>;
}) {
  const [drivers, setDrivers] = React.useState<{ value: string; label: string; id: string }[]>([]);
  const [vehicles, setVehicles] = React.useState<{ value: string; label: string; id: string }[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Fetch drivers and vehicles from API
  React.useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch drivers
        const driversRes = await fetch("/api/drivers");
        const driversData = await driversRes.json();
        
        if (driversData.ok && driversData.data) {
          const driverOptions = driversData.data.map((driver: any) => ({
            value: driver.id, // Use ID as value for DB storage
            label: driver.name,
            id: driver.id,
          }));
          setDrivers(driverOptions);
        }

        // Fetch vehicles
        const vehiclesRes = await fetch("/api/vehicles?status=available");
        const vehiclesData = await vehiclesRes.json();
        
        if (vehiclesData.ok && vehiclesData.data) {
          const vehicleOptions = vehiclesData.data.map((vehicle: any) => ({
            value: vehicle.id, // Use ID as value for DB storage
            label: `${vehicle.name} • ${vehicle.plate_number}`,
            id: vehicle.id,
          }));
          setVehicles(vehicleOptions);
        }
      } catch (error) {
        console.error("Error fetching drivers/vehicles:", error);
        // Fallback to empty arrays if fetch fails
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">School Service Request</h3>
        <p className="text-xs text-neutral-500 mt-1">
          Suggest your preferred driver and vehicle (optional). The admin will make the final assignment.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SelectInput
          id="ss-driver"
          label="Preferred Driver (Suggestion)"
          placeholder={loading ? "Loading drivers..." : "Select a driver (optional)"}
          value={data?.preferredDriver ?? ""}
          onChange={(e) => onChange({ preferredDriver: e.target.value })}
          error={errors["schoolService.preferredDriver"]}
          options={drivers}
          disabled={loading}
          helper="Suggest a driver you prefer to work with"
        />

        <SelectInput
          id="ss-vehicle"
          label="Preferred Vehicle (Suggestion)"
          placeholder={loading ? "Loading vehicles..." : "Select a vehicle (optional)"}
          value={data?.preferredVehicle ?? ""}
          onChange={(e) => onChange({ preferredVehicle: e.target.value })}
          error={errors["schoolService.preferredVehicle"]}
          options={vehicles}
          disabled={loading}
          helper="Suggest a vehicle you'd like to use"
        />
      </div>
    </section>
  );
}
