// src/components/admin/schedule/ui/AdminCalendarDetailsModal.ui.tsx
"use client";

import * as React from "react";
import { X, MapPin, Calendar, Users, Car, User, FileText, Edit2 } from "lucide-react";

type CalendarRequest = {
  id: string;
  request_number: string;
  title: string;
  purpose: string;
  destination: string;
  status: string;
  requester_name: string;
  department: string;
  department_id: string;
  vehicle: {
    id: string;
    name: string;
    type: string;
    plate_number: string;
    capacity: number;
  };
  driver: {
    id: string;
    name: string;
    email: string;
  };
  travel_start_date: string;
  travel_end_date: string;
  participants: any;
  total_budget: number;
  created_at: string;
  updated_at: string;
  admin_processed_at: string;
};

export function AdminCalendarDetailsModal({
  open,
  dateISO,
  requests,
  onClose,
  onRefresh,
}: {
  open: boolean;
  dateISO: string | null;
  requests: CalendarRequest[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  if (!open || !dateISO) return null;

  const date = dateISO ? new Date(dateISO) : null;
  const dateFormatted = date
    ? date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const statusColors: Record<string, string> = {
    pending_comptroller: "bg-blue-100 text-blue-700 border-blue-200",
    pending_hr: "bg-purple-100 text-purple-700 border-purple-200",
    pending_exec: "bg-indigo-100 text-indigo-700 border-indigo-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Schedule Details</h2>
            <p className="text-sm text-gray-500 mt-1">{dateFormatted}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No requests scheduled for this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{req.title || req.purpose}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            statusColors[req.status] || "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {req.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Request #: {req.request_number}</p>
                    </div>
                    <button
                      onClick={() => {
                        // TODO: Open edit modal
                        window.location.href = `/admin/requests?requestId=${req.id}`;
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      aria-label="Edit request"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-[#7A0010] mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500">Requester</p>
                          <p className="text-sm text-gray-900">{req.requester_name}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Users className="h-4 w-4 text-[#7A0010] mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500">Department</p>
                          <p className="text-sm text-gray-900">{req.department}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-[#7A0010] mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500">Destination</p>
                          <p className="text-sm text-gray-900">{req.destination}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-[#7A0010] mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500">Travel Dates</p>
                          <p className="text-sm text-gray-900">
                            {new Date(req.travel_start_date).toLocaleDateString()} -{" "}
                            {new Date(req.travel_end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Car className="h-4 w-4 text-[#7A0010] mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500">Vehicle</p>
                          <p className="text-sm text-gray-900">
                            {req.vehicle.name} ({req.vehicle.type})
                          </p>
                          <p className="text-xs text-gray-500">{req.vehicle.plate_number}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-[#7A0010] mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-gray-500">Driver</p>
                          <p className="text-sm text-gray-900">{req.driver.name}</p>
                          <p className="text-xs text-gray-500">{req.driver.email}</p>
                        </div>
                      </div>

                      {req.total_budget > 0 && (
                        <div className="flex items-start gap-3">
                          <span className="text-base font-bold text-[#7A0010] mt-0.5">₱</span>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Budget</p>
                            <p className="text-sm text-gray-900">
                              ₱{req.total_budget.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {req.participants && Array.isArray(req.participants) && req.participants.length > 0 && (
                        <div className="flex items-start gap-3">
                          <Users className="h-4 w-4 text-[#7A0010] mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-500">Participants</p>
                            <p className="text-sm text-gray-900">{req.participants.length} participant(s)</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#7A0010] text-white rounded-lg hover:bg-[#5a0008] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

