// src/components/user/dashboard/VehicleShowcase.ui.tsx
"use client";

import * as React from "react";
import { Car, Users } from "lucide-react";
import Link from "next/link";

interface Vehicle {
  id: string;
  vehicle_name: string;
  plate_number: string;
  type: string;
  capacity: number;
  photo_url?: string;
  status: string;
}

export default function VehicleShowcase({ vehicles = [] }: { vehicles?: Vehicle[] }) {
  const availableVehicles = vehicles
    .filter(v => v.status === 'available')
    .slice(0, 3); // Show top 3

  if (availableVehicles.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-white p-4 pb-6 shadow-sm ring-1 ring-gray-100">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-[#7a0019]" />
          <h3 className="text-sm font-semibold text-gray-900">Available Vehicles</h3>
        </div>
        <Link
          href="/user/vehicles"
          className="text-xs font-medium text-[#7a0019] hover:text-[#5a0010] transition-colors"
        >
          View All →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {availableVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md hover:border-[#7a0019]/20"
          >
            {/* Vehicle Image */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              {vehicle.photo_url ? (
                <img
                  src={vehicle.photo_url}
                  alt={vehicle.vehicle_name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Car className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute right-2 top-2">
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                  Available
                </span>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="p-3">
              <div className="mb-1 truncate text-sm font-semibold text-gray-900">
                {vehicle.vehicle_name}
              </div>
              <div className="mb-2 text-xs text-gray-500">
                {vehicle.plate_number}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Users className="h-3 w-3" />
                <span>{vehicle.capacity} seats</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

