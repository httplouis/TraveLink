"use client";

import * as React from "react";
import { Calendar, MapPin, Car, CheckCircle2, Star } from "lucide-react";

interface CompletedTrip {
  id: string;
  request_number: string;
  title: string;
  destination: string;
  departure_date: string;
  return_date: string;
  status: string;
  vehicle_name: string;
  plate_number: string;
  requester_name: string;
  department: string;
  completed_at: string;
  feedback_rating: number | null;
  feedback_comment: string | null;
}

export default function DriverHistoryPage() {
  const [trips, setTrips] = React.useState<CompletedTrip[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTrip, setSelectedTrip] = React.useState<CompletedTrip | null>(null);

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/driver/history");
        const data = await res.json();
        if (data.ok && data.data) {
          setTrips(data.data);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-gray-400 text-sm">No rating yet</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-2 font-medium">{rating}/5</span>
      </div>
    );
  };

  // Calculate stats
  const totalTrips = trips.length;
  const tripsWithFeedback = trips.filter((t) => t.feedback_rating).length;
  const avgRating = tripsWithFeedback > 0
    ? (trips.filter((t) => t.feedback_rating).reduce((sum, t) => sum + (t.feedback_rating || 0), 0) / tripsWithFeedback).toFixed(1)
    : "N/A";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trip History</h1>
        <p className="text-gray-500 mt-1">Your completed trips and feedback received</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{totalTrips}</div>
          <div className="text-sm text-gray-500">Total Trips</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{tripsWithFeedback}</div>
          <div className="text-sm text-gray-500">With Feedback</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">{avgRating}</div>
          <div className="text-sm text-gray-500">Avg Rating</div>
        </div>
      </div>

      {/* Trip List */}
      {trips.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Trip History</h3>
          <p className="text-gray-500">You haven&apos;t completed any trips yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:border-[#7a0019] hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-gray-400">{formatDate(trip.departure_date)}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">{trip.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {trip.destination}
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" /> {trip.vehicle_name}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  {trip.feedback_rating ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-gray-900">{trip.feedback_rating}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No rating</span>
                  )}
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
            <div className="bg-green-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center gap-2 text-green-100 text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Completed Trip
              </div>
              <h2 className="text-xl font-bold mt-1">{selectedTrip.title}</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Date */}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Trip Date</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedTrip.departure_date)}</p>
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium text-gray-900">{selectedTrip.destination}</p>
                </div>
              </div>

              {/* Vehicle */}
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium text-gray-900">{selectedTrip.vehicle_name}</p>
                  <p className="text-sm text-gray-500">{selectedTrip.plate_number}</p>
                </div>
              </div>

              {/* Requester */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Requester</p>
                <p className="font-medium text-gray-900">{selectedTrip.requester_name}</p>
                <p className="text-sm text-gray-500">{selectedTrip.department}</p>
              </div>

              {/* Feedback Section */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Feedback Received</p>
                {renderStars(selectedTrip.feedback_rating)}
                {selectedTrip.feedback_comment && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 italic">&quot;{selectedTrip.feedback_comment}&quot;</p>
                  </div>
                )}
                {!selectedTrip.feedback_rating && !selectedTrip.feedback_comment && (
                  <p className="text-gray-400 text-sm">No feedback received for this trip yet</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedTrip(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
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
