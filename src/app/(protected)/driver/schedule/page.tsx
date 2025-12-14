"use client";

import * as React from "react";
import { Calendar, MapPin, Clock, Car, Users, Phone } from "lucide-react";

interface AssignedTrip {
  id: string;
  request_number: string;
  title: string;
  destination: string;
  departure_date: string;
  return_date: string;
  departure_time: string;
  status: string;
  vehicle_name: string;
  plate_number: string;
  requester_name: string;
  department: string;
  passenger_count: number;
  purpose: string;
}

export default function DriverSchedulePage() {
  const [trips, setTrips] = React.useState<AssignedTrip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTrip, setSelectedTrip] = React.useState<AssignedTrip | null>(null);

  React.useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await fetch("/api/driver/schedule");
        const data = await res.json();
        if (data.ok && data.data) {
          setTrips(data.data);
        }
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return "TODAY";
    if (date.toDateString() === tomorrow.toDateString()) return "TOMORROW";
    
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).toUpperCase();
  };

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-500 mt-1">Your upcoming trips and assignments</p>
      </div>

      {/* Trip List */}
      {trips.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Trips Scheduled</h3>
          <p className="text-gray-500">You don&apos;t have any upcoming trips assigned yet.</p>
          <p className="text-sm text-gray-400 mt-2">Check back later for new assignments.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-[#7a0019] hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Date Badge */}
                <div className="flex-shrink-0">
                  <div className="bg-[#7a0019] text-white rounded-xl py-3 px-4 text-center min-w-[80px]">
                    <div className="text-xs font-bold">{formatDate(trip.departure_date)}</div>
                    <div className="text-lg font-bold mt-1">{trip.departure_time || "TBD"}</div>
                  </div>
                </div>

                {/* Trip Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      {trip.request_number}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{trip.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-[#7a0019]" />
                      <span className="truncate">{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Car className="h-4 w-4 text-[#7a0019]" />
                      <span>{trip.vehicle_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-[#7a0019]" />
                      <span>{trip.passenger_count || 1} passenger(s)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-[#7a0019]" />
                      <span className="truncate">{trip.requester_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedTrip(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#7a0019] text-white p-6 rounded-t-2xl">
              <div className="text-xs font-mono opacity-80">{selectedTrip.request_number}</div>
              <h2 className="text-xl font-bold mt-1">{selectedTrip.title}</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Date & Time */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-medium">Departure</label>
                    <p className="font-semibold text-gray-900 mt-1">{formatFullDate(selectedTrip.departure_date)}</p>
                    <p className="text-[#7a0019] font-bold text-lg">{selectedTrip.departure_time || "TBD"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-medium">Return</label>
                    <p className="font-semibold text-gray-900 mt-1">{formatFullDate(selectedTrip.return_date)}</p>
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Destination
                </label>
                <p className="font-semibold text-gray-900 mt-1 text-lg">{selectedTrip.destination}</p>
              </div>

              {/* Vehicle */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" /> Vehicle
                </label>
                <p className="font-semibold text-gray-900 mt-1">{selectedTrip.vehicle_name}</p>
                <p className="text-gray-500">{selectedTrip.plate_number}</p>
              </div>

              {/* Requester */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" /> Requester
                </label>
                <p className="font-semibold text-gray-900 mt-1">{selectedTrip.requester_name}</p>
                <p className="text-gray-500">{selectedTrip.department}</p>
                <p className="text-sm text-gray-500 mt-1">{selectedTrip.passenger_count || 1} passenger(s)</p>
              </div>

              {/* Purpose */}
              {selectedTrip.purpose && (
                <div>
                  <label className="text-xs text-gray-500 uppercase font-medium">Purpose</label>
                  <p className="text-gray-700 mt-1">{selectedTrip.purpose}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedTrip(null)}
                className="w-full py-3 bg-[#7a0019] text-white rounded-xl font-semibold hover:bg-[#5c000c] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
