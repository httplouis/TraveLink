"use client";

import * as React from "react";
import { User, Mail, Phone, Shield, Calendar, Star, Car, CheckCircle2 } from "lucide-react";

interface DriverProfileData {
  full_name: string;
  email: string;
  employee_id: string;
  phone: string;
  license_number: string;
  license_expiry: string;
  status: string;
  department: string;
  assigned_vehicles: Array<{
    vehicle_name: string;
    plate_number: string;
    type: string;
  }>;
  stats: {
    total_trips: number;
    completed_trips: number;
    avg_rating: string;
  };
}

export default function DriverProfilePage() {
  const [profile, setProfile] = React.useState<DriverProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/driver/profile/full");
        const data = await res.json();
        if (data.ok && data.data) {
          setProfile(data.data);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">Profile Not Found</h3>
        <p className="text-gray-500">Unable to load your driver profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Your driver information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header with avatar */}
        <div className="bg-gradient-to-r from-[#7a0019] to-[#5c000c] px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-white text-3xl font-bold">
              {profile.full_name?.charAt(0) || "D"}
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold">{profile.full_name}</h2>
              <p className="text-white/80 mt-1">{profile.employee_id}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Active Driver
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{profile.stats?.total_trips || 0}</div>
              <div className="text-xs text-gray-500">Total Trips</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{profile.stats?.completed_trips || 0}</div>
              <div className="text-xs text-gray-500">Completed</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <Star className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{profile.stats?.avg_rating || "N/A"}</div>
              <div className="text-xs text-gray-500">Avg Rating</div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Contact Information</h3>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-[#7a0019]" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{profile.email || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-5 w-5 text-[#7a0019]" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{profile.phone || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* License Info */}
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">License Information</h3>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-[#7a0019]" />
              <div>
                <p className="text-xs text-gray-500">License Number</p>
                <p className="font-medium text-gray-900 font-mono">{profile.license_number || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-5 w-5 text-[#7a0019]" />
              <div>
                <p className="text-xs text-gray-500">License Expiry</p>
                <p className="font-medium text-gray-900">{formatDate(profile.license_expiry)}</p>
              </div>
            </div>
          </div>

          {/* Assigned Vehicles */}
          {profile.assigned_vehicles && profile.assigned_vehicles.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Currently Assigned Vehicles</h3>
              <div className="space-y-2">
                {profile.assigned_vehicles.map((vehicle, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <Car className="h-5 w-5 text-[#7a0019]" />
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.vehicle_name}</p>
                      <p className="text-sm text-gray-500">{vehicle.plate_number} • {vehicle.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> To update your profile information, please contact the Transport Admin or HR department.
        </p>
      </div>
    </div>
  );
}
