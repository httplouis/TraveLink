"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Car,
  Truck,
  Bus,
  CheckCircle,
  XCircle,
  Wrench,
  MapPin,
  Fuel,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface Vehicle {
  id: string;
  vehicle_name: string;
  plate_number: string;
  type: string;
  capacity: number;
  status: "available" | "in_use" | "maintenance" | "unavailable";
  current_driver?: string;
  current_trip?: string;
  fuel_level?: number;
  next_maintenance?: string;
  photo_url?: string;
}

interface FleetStatusProps {
  showDetails?: boolean;
  maxItems?: number;
  onVehicleClick?: (vehicle: Vehicle) => void;
}

const VEHICLE_ICONS: Record<string, React.ReactNode> = {
  sedan: <Car className="h-5 w-5" />,
  suv: <Car className="h-5 w-5" />,
  van: <Truck className="h-5 w-5" />,
  bus: <Bus className="h-5 w-5" />,
  pickup: <Truck className="h-5 w-5" />,
};

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
  available: {
    color: "text-green-600",
    bgColor: "bg-green-100",
    label: "Available",
    icon: <CheckCircle className="h-4 w-4" />,
  },
  in_use: {
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "In Use",
    icon: <MapPin className="h-4 w-4" />,
  },
  maintenance: {
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    label: "Maintenance",
    icon: <Wrench className="h-4 w-4" />,
  },
  unavailable: {
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Unavailable",
    icon: <XCircle className="h-4 w-4" />,
  },
};

export default function FleetStatus({ showDetails = true, maxItems = 6, onVehicleClick }: FleetStatusProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ available: 0, in_use: 0, maintenance: 0, total: 0 });

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      // Fetch all vehicles with all=true parameter
      const res = await fetch("/api/vehicles?all=true", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          const vehicleList = data.data || [];
          setVehicles(vehicleList);

          // Calculate stats
          const available = vehicleList.filter((v: Vehicle) => v.status === "available").length;
          const in_use = vehicleList.filter((v: Vehicle) => v.status === "in_use").length;
          const maintenance = vehicleList.filter((v: Vehicle) => v.status === "maintenance").length;
          setStats({ available, in_use, maintenance, total: vehicleList.length });
        }
      }
    } catch (error) {
      console.error("Failed to load fleet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (type: string) => {
    return VEHICLE_ICONS[type.toLowerCase()] || <Car className="h-5 w-5" />;
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.unavailable;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Fleet Status</h3>
              <p className="text-white/70 text-sm">{stats.total} vehicles total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-3 rounded-xl bg-white shadow-sm"
        >
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <CheckCircle className="h-4 w-4" />
            <span className="text-2xl font-bold">{stats.available}</span>
          </div>
          <p className="text-xs text-gray-500">Available</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center p-3 rounded-xl bg-white shadow-sm"
        >
          <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
            <MapPin className="h-4 w-4" />
            <span className="text-2xl font-bold">{stats.in_use}</span>
          </div>
          <p className="text-xs text-gray-500">In Use</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center p-3 rounded-xl bg-white shadow-sm"
        >
          <div className="flex items-center justify-center gap-1 text-amber-600 mb-1">
            <Wrench className="h-4 w-4" />
            <span className="text-2xl font-bold">{stats.maintenance}</span>
          </div>
          <p className="text-xs text-gray-500">Maintenance</p>
        </motion.div>
      </div>

      {/* Vehicle List */}
      {showDetails && (
        <div className="p-4">
          <div className="space-y-2">
            {vehicles.slice(0, maxItems).map((vehicle, index) => {
              const statusConfig = getStatusConfig(vehicle.status);
              return (
                <motion.div
                  key={vehicle.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onVehicleClick?.(vehicle)}
                  className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all ${
                    onVehicleClick ? "cursor-pointer" : ""
                  }`}
                >
                  {/* Vehicle Icon */}
                  <div className={`h-10 w-10 rounded-lg ${statusConfig.bgColor} ${statusConfig.color} flex items-center justify-center`}>
                    {getVehicleIcon(vehicle.type)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{vehicle.vehicle_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${statusConfig.bgColor} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{vehicle.plate_number}</span>
                      <span>•</span>
                      <span>{vehicle.capacity} seats</span>
                      {vehicle.fuel_level !== undefined && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Fuel className="h-3 w-3" />
                            {vehicle.fuel_level}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {onVehicleClick && <ChevronRight className="h-4 w-4 text-gray-400" />}
                </motion.div>
              );
            })}
          </div>

          {vehicles.length > maxItems && (
            <a 
              href="/admin/vehicles" 
              className="w-full mt-3 py-2 text-sm text-[#7a0019] hover:text-[#5a0010] hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1 font-medium"
            >
              View all {vehicles.length} vehicles
              <ChevronRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
