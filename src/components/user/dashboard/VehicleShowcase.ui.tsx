// src/components/user/dashboard/VehicleShowcase.ui.tsx
"use client";

import * as React from "react";
import { Car, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 via-white to-gray-50 p-8 shadow-lg ring-1 ring-gray-200/50">
        <div className="text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300">
            <Car className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="mb-2 text-sm font-bold text-gray-900">No Vehicles Available</h3>
          <p className="text-xs text-gray-500">Check back later for available vehicles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50/50 to-white p-6 shadow-xl ring-1 ring-gray-200/50">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5" />
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-emerald-200/20 to-teal-200/20 blur-3xl" />
      
      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
              <Car className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Available Vehicles</h3>
          </div>
          <Link
            href="/user/vehicles"
            className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {availableVehicles.map((vehicle, idx) => (
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-white shadow-md hover:shadow-xl hover:border-emerald-300/50 transition-all duration-300"
            >
              {/* Vehicle Image */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 overflow-hidden">
                {vehicle.photo_url ? (
                  <img
                    src={vehicle.photo_url}
                    alt={vehicle.vehicle_name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Car className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Status Badge */}
                <div className="absolute right-3 top-3">
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                    <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    Available
                  </span>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="p-4">
                <div className="mb-1.5 truncate text-sm font-bold text-gray-900">
                  {vehicle.vehicle_name}
                </div>
                <div className="mb-3 text-xs font-medium text-gray-500">
                  {vehicle.plate_number}
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-600" />
                  <span className="text-xs font-semibold text-gray-700">{vehicle.capacity} seats</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
