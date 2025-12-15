// src/components/user/request/ui/SchoolServiceSection.ui.tsx
"use client";

import * as React from "react";
import { SelectInput } from "@/components/user/request/ui/controls";

// Cache for drivers and vehicles to prevent repeated API calls
const dataCache: {
  drivers: { value: string; label: string; id: string }[] | null;
  vehicles: Map<string, { value: string; label: string; id: string }[]>;
  driversLoaded: boolean;
} = {
  drivers: null,
  vehicles: new Map(),
  driversLoaded: false,
};

export default function SchoolServiceSection({
  data,
  onChange,
  errors,
  departureDate, // Travel departure date for coding day filtering
}: {
  data: any;
  onChange: (patch: any) => void;
  errors: Record<string, string>;
  departureDate?: string; // Optional: travel departure date
}) {
  const [drivers, setDrivers] = React.useState<{ value: string; label: string; id: string }[]>(
    dataCache.drivers || []
  );
  const [vehicles, setVehicles] = React.useState<{ value: string; label: string; id: string }[]>(
    dataCache.vehicles.get(departureDate || 'default') || []
  );
  const [loading, setLoading] = React.useState(!dataCache.driversLoaded);

  // Fetch drivers and vehicles from API with caching
  // Re-fetch vehicles when departureDate changes (for coding day filtering)
  React.useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        // Check cache first for drivers
        if (dataCache.drivers && dataCache.driversLoaded) {
          if (isMounted) setDrivers(dataCache.drivers);
        } else {
          // Fetch drivers only if not cached
          const driversRes = await fetch("/api/drivers");
          const driversData = await driversRes.json();
          
          if (driversData.ok && driversData.data && isMounted) {
            const driverOptions = driversData.data.map((driver: any) => ({
              value: driver.id,
              label: driver.name,
              id: driver.id,
            }));
            dataCache.drivers = driverOptions;
            dataCache.driversLoaded = true;
            setDrivers(driverOptions);
          }
        }

        // Check cache for vehicles with this date
        const cacheKey = departureDate || 'default';
        const cachedVehicles = dataCache.vehicles.get(cacheKey);
        
        if (cachedVehicles) {
          if (isMounted) setVehicles(cachedVehicles);
        } else {
          // Fetch vehicles - include date parameter if available for coding day filtering
          const vehiclesUrl = departureDate 
            ? `/api/vehicles?status=available&date=${encodeURIComponent(departureDate)}`
            : `/api/vehicles?status=available`;
          
          const vehiclesRes = await fetch(vehiclesUrl);
          const vehiclesData = await vehiclesRes.json();
          
          if (vehiclesData.ok && vehiclesData.data && isMounted) {
            const vehicleOptions = vehiclesData.data.map((vehicle: any) => ({
              value: vehicle.id,
              label: `${vehicle.name} • ${vehicle.plate_number}`,
              id: vehicle.id,
            }));
            dataCache.vehicles.set(cacheKey, vehicleOptions);
            setVehicles(vehicleOptions);
          }
        }
      } catch (error) {
        console.error("Error fetching drivers/vehicles:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [departureDate]);
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
