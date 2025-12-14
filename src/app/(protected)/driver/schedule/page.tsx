"use client";

import * as React from "react";
import { Calendar, MapPin, Clock, Car, Users, Eye } from "lucide-react";
import { motion } from "framer-motion";

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "in_progress":
      case "ongoing":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
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
        <p className="text-gray-500 mt-1">View your assigned trips and schedules</p>
      </div>

      {/* Trip List */}
      {trips.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assigned Trips</h3>
          <p className="text-gray-500">You don't have any upcoming trips assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-gray-400">{trip.request_number}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(trip.status)}`}>
                      {trip.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate">{trip.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{trip.purpose}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 truncate">{trip.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{formatDate(trip.departure_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{trip.departure_time || "TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{trip.vehicle_name} ({trip.plate_number})</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTrip(trip)}
                  className="p-2 text-gray-400 hover:text-[#7a0019] hover:bg-gray-50 rounded-lg transition-colors"
                  title="View Details"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedTrip(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-gray-400">{selectedTrip.request_number}</span>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedTrip.title}</h2>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedTrip.status)}`}>
                  {selectedTrip.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Destination</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedTrip.destination}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Passengers</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedTrip.passenger_count || "N/A"}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Departure Date</label>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(selectedTrip.departure_date)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Return Date</label>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(selectedTrip.return_date)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Departure Time</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedTrip.departure_time || "TBD"}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Vehicle</label>
                  <p className="font-medium text-gray-900 mt-1">{selectedTrip.vehicle_name}</p>
                  <p className="text-sm text-gray-500">{selectedTrip.plate_number}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Requester</label>
                <p className="font-medium text-gray-900 mt-1">{selectedTrip.requester_name}</p>
                <p className="text-sm text-gray-500">{selectedTrip.department}</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Purpose</label>
                <p className="text-gray-700 mt-1">{selectedTrip.purpose}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedTrip(null)}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
