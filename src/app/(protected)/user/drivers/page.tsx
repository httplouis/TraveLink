// src/app/(protected)/user/drivers/page.tsx
"use client";

import * as React from "react";
import { Search, Filter, User, Phone, Mail, Star } from "lucide-react";

type DriverStatus = "active" | "on_trip" | "off_duty" | "suspended";

interface Driver {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  rating?: number;
  isAvailable?: boolean;
  profile_picture?: string;
}

export default function UserDriversPage() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<"" | DriverStatus>("");
  const [drivers, setDrivers] = React.useState<Driver[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      console.log('[Drivers Page] Fetching drivers...');
      const response = await fetch('/api/drivers');
      console.log('[Drivers Page] Response status:', response.status);
      const data = await response.json();
      console.log('[Drivers Page] Response data:', data);
      
      if (data.ok && data.data) {
        console.log('[Drivers Page] Setting drivers:', data.data.length);
        setDrivers(data.data || []);
      } else {
        console.error('[Drivers Page] API returned error:', data);
        setDrivers([]);
      }
    } catch (error) {
      console.error('[Drivers Page] Error fetching drivers:', error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrivers = React.useMemo(() => {
    return drivers.filter(driver => {
      const query = q.toLowerCase();
      const matchesSearch = 
        driver.name?.toLowerCase().includes(query) ||
        driver.email?.toLowerCase().includes(query) ||
        driver.phone?.includes(query) ||
        driver.licenseNumber?.toLowerCase().includes(query);
      
      const matchesStatus = !status || 
        (status === 'active' && driver.isAvailable) ||
        (status === 'off_duty' && !driver.isAvailable);
      
      return matchesSearch && matchesStatus;
    });
  }, [drivers, q, status]);

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
        <h1 className="text-3xl font-bold text-gray-900">Drivers</h1>
        <p className="text-gray-600 mt-1">View available drivers and their information</p>
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
              placeholder="Search by name, email, phone, or license number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | DriverStatus)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7a0019] focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Available</option>
            <option value="off_duty">Off Duty</option>
          </select>
        </div>
      </div>

      {/* Drivers Grid */}
      {filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No drivers found</p>
          <p className="text-gray-500 text-sm mt-2">
            {q ? 'Try adjusting your search' : 'No drivers available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-4">
                {/* Privacy: No driver avatars, use initials only */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#7a0019] to-[#5a0010] flex items-center justify-center text-white font-semibold text-lg shadow-md">
                  {driver.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{driver.name}</h3>
                  {driver.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-gray-600">{driver.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  driver.isAvailable
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {driver.isAvailable ? 'Available' : 'Off Duty'}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {driver.licenseNumber && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-medium">License:</span>
                    <span>{driver.licenseNumber}</span>
                  </div>
                )}
                {driver.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{driver.phone}</span>
                  </div>
                )}
                {driver.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{driver.email}</span>
                  </div>
                )}
                {driver.licenseExpiry && (
                  <div className="text-xs text-gray-500 mt-2">
                    License expires: {new Date(driver.licenseExpiry).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
