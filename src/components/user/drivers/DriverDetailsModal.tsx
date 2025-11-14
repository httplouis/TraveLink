// src/components/user/drivers/DriverDetailsModal.tsx
"use client";

import * as React from "react";
import { X, Calendar, MapPin, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Assignment {
  id: string;
  startDate: string;
  endDate: string;
  destination: string;
  purpose: string;
  status: string;
}

interface Driver {
  id: string;
  number: number;
  name: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  rating?: number;
  isAvailable?: boolean;
  hasFirstAidCert?: boolean;
  firstAidCertIssuer?: string;
  firstAidCertExpiresOn?: string;
  assignments?: Assignment[];
}

interface DriverDetailsModalProps {
  driver: Driver | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DriverDetailsModal({ driver, isOpen, onClose }: DriverDetailsModalProps) {
  if (!driver) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status.startsWith('pending')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'approved') return 'Approved';
    if (status === 'pending') return 'Pending';
    if (status === 'pending_comptroller') return 'Pending Comptroller';
    if (status === 'pending_hr') return 'Pending HR';
    if (status === 'pending_exec') return 'Pending Executive';
    return status;
  };

  // Group assignments by date
  const assignmentsByDate = React.useMemo(() => {
    const grouped: { [key: string]: Assignment[] } = {};
    (driver.assignments || []).forEach((assignment) => {
      const startDate = new Date(assignment.startDate).toDateString();
      if (!grouped[startDate]) {
        grouped[startDate] = [];
      }
      grouped[startDate].push(assignment);
    });
    return grouped;
  }, [driver.assignments]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#7A0010] to-[#5A0010] text-white p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Driver #{driver.number}: {driver.name}</h2>
                  <p className="text-white/80 mt-1">Driver Details</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                        driver.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {driver.isAvailable ? 'Available' : 'Off Duty'}
                      </span>
                    </div>
                    {driver.rating && (
                      <div>
                        <p className="text-sm text-gray-600">Rating</p>
                        <p className="text-lg font-semibold text-gray-900 mt-1">
                          ⭐ {driver.rating.toFixed(1)} / 5.0
                        </p>
                      </div>
                    )}
                    {driver.licenseNumber && (
                      <div>
                        <p className="text-sm text-gray-600">License Number</p>
                        <p className="text-gray-900 font-medium mt-1">{driver.licenseNumber}</p>
                      </div>
                    )}
                    {driver.licenseExpiry && (
                      <div>
                        <p className="text-sm text-gray-600">License Expires</p>
                        <p className="text-gray-900 font-medium mt-1">{formatDate(driver.licenseExpiry)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* First Aid Certification */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    First Aid Certification
                  </h3>
                  {driver.hasFirstAidCert ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Certified First Aider</span>
                      </div>
                      {driver.firstAidCertIssuer && (
                        <p className="text-sm text-gray-600">
                          Issued by: <span className="font-medium text-gray-900">{driver.firstAidCertIssuer}</span>
                        </p>
                      )}
                      {driver.firstAidCertExpiresOn && (
                        <p className="text-sm text-gray-600">
                          Expires: <span className="font-medium text-gray-900">{formatDate(driver.firstAidCertExpiresOn)}</span>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <XCircle className="w-5 h-5" />
                      <span>Not certified as First Aider</span>
                    </div>
                  )}
                </div>

                {/* Assignments/Appointments */}
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Assignments & Appointments
                  </h3>
                  {driver.assignments && driver.assignments.length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(assignmentsByDate).map(([date, assignments]) => (
                        <div key={date} className="border-l-4 border-[#7A0010] pl-4 space-y-3">
                          <p className="font-semibold text-gray-900">{formatDate(date)}</p>
                          {assignments.map((assignment) => (
                            <div key={assignment.id} className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span className="font-medium text-gray-900">{assignment.destination}</span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{assignment.purpose}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>Start: {formatDateTime(assignment.startDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>End: {formatDateTime(assignment.endDate)}</span>
                                    </div>
                                  </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                                  {getStatusLabel(assignment.status)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No assignments or appointments scheduled</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-[#7A0010] text-white rounded-lg hover:bg-[#5A0010] transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

