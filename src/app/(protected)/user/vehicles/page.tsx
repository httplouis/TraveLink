"use client";

import * as React from "react";
import { Search, Car, Users, Wrench, CheckCircle, XCircle } from "lucide-react";

interface Vehicle {
  id: string;
  plate_number: string;
  vehicle_name: string;
  type: string;
  capacity: number;
  status: string;
  manufacturer?: string;
  model?: string;
  color?: string;
  photo_url?: string;
}

export default function UserVehiclesPage() {
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState<"" | "Bus" | "Van" | "Car" | "SUV" | "Motorcycle">("");
  const [status, setStatus] = React.useState<"" | "available" | "maintenance" | "inactive">("");
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vehicles?status=available');
      const data = await response.json();
      
      if (data.ok) {
        setVehicles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = React.useMemo(() => {
    return vehicles.filter(vehicle => {
      const query = q.toLowerCase();
      const matchesSearch = 
        vehicle.plate_number?.toLowerCase().includes(query) ||
        vehicle.vehicle_name?.toLowerCase().includes(query) ||
        vehicle.manufacturer?.toLowerCase().includes(query) ||
        vehicle.model?.toLowerCase().includes(query);
      
      const matchesType = !type || vehicle.type === type;
      const matchesStatus = !status || vehicle.status === status;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, q, type, status]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5 text-orange-600" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-[#7a0019] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
        <p className="text-gray-600 mt-1">View available vehicles and their specifications</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by plate number, name, brand, or model..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
          >
            <option value="">All Types</option>
            <option>Bus</option>
            <option>Van</option>
            <option>Car</option>
            <option>SUV</option>
            <option>Motorcycle</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No vehicles found</p>
          <p className="text-gray-500 text-sm mt-2">
            {q ? 'Try adjusting your search' : 'No vehicles available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {vehicle.photo_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={vehicle.photo_url}
                    alt={vehicle.vehicle_name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{vehicle.vehicle_name}</h3>
                    <p className="text-sm text-gray-600">{vehicle.plate_number}</p>
                  </div>
                  <div className={`p-2 rounded-lg border ${getStatusColor(vehicle.status)}`}>
                    {getStatusIcon(vehicle.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium text-gray-900">{vehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Capacity</p>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{vehicle.capacity} seats</p>
                    </div>
                  </div>
                  {vehicle.manufacturer && (
                    <div>
                      <p className="text-gray-500">Brand</p>
                      <p className="font-medium text-gray-900">{vehicle.manufacturer}</p>
                    </div>
                  )}
                  {vehicle.model && (
                    <div>
                      <p className="text-gray-500">Model</p>
                      <p className="font-medium text-gray-900">{vehicle.model}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
