// src/components/admin/AdminEditModal.tsx
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, Edit3, MapPin, Calendar, Banknote, FileText, Truck, User } from "lucide-react";
import PasswordConfirmModal from "@/components/common/PasswordConfirmModal";

interface AdminEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
  onSaved: (updatedRequest: any) => void;
}

export default function AdminEditModal({ isOpen, onClose, request, onSaved }: AdminEditModalProps) {
  const [formData, setFormData] = React.useState<any>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [error, setError] = React.useState("");

  // Initialize form data when request changes
  React.useEffect(() => {
    if (request) {
      setFormData({
        purpose: request.purpose || "",
        destination: request.destination || "",
        travel_start_date: request.travel_start_date?.split("T")[0] || "",
        travel_end_date: request.travel_end_date?.split("T")[0] || "",
        total_budget: request.total_budget || 0,
        transportation_type: request.transportation_type || "pickup",
        pickup_location: request.pickup_location || "",
        pickup_time: request.pickup_time || "",
        pickup_contact_number: request.pickup_contact_number || "",
        pickup_special_instructions: request.pickup_special_instructions || "",
        cost_justification: request.cost_justification || "",
        admin_notes: request.admin_notes || "",
      });
      setError("");
    }
  }, [request]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = () => {
    // Show password confirmation modal
    setShowPasswordModal(true);
  };

  const handleConfirmedSave = async () => {
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/requests/${request.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();

      if (data.ok) {
        onSaved(data.data);
        onClose();
      } else {
        setError(data.error || "Failed to save changes");
      }
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!request) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#7A0010] to-[#9c2a3a] text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Edit3 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Edit Request</h2>
                      <p className="text-white/80 text-sm">{request.request_number}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Purpose */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Purpose
                    </label>
                    <textarea
                      value={formData.purpose}
                      onChange={(e) => handleChange("purpose", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none resize-none"
                    />
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      Destination
                    </label>
                    <input
                      type="text"
                      value={formData.destination}
                      onChange={(e) => handleChange("destination", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none"
                    />
                  </div>

                  {/* Travel Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={formData.travel_start_date}
                        onChange={(e) => handleChange("travel_start_date", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        End Date
                      </label>
                      <input
                        type="date"
                        value={formData.travel_end_date}
                        onChange={(e) => handleChange("travel_end_date", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none"
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Banknote className="h-4 w-4 text-gray-400" />
                      Total Budget (PHP)
                    </label>
                    <input
                      type="number"
                      value={formData.total_budget}
                      onChange={(e) => handleChange("total_budget", parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none"
                    />
                  </div>

                  {/* Transportation */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      Transportation Type
                    </label>
                    <select
                      value={formData.transportation_type}
                      onChange={(e) => handleChange("transportation_type", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none"
                    >
                      <option value="pickup">University Vehicle (Pickup)</option>
                      <option value="own">Own Vehicle</option>
                      <option value="public">Public Transportation</option>
                      <option value="rental">Rental Vehicle</option>
                    </select>
                  </div>

                  {/* Pickup Details */}
                  {formData.transportation_type === "pickup" && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700">Pickup Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">Pickup Location</label>
                          <input
                            type="text"
                            value={formData.pickup_location}
                            onChange={(e) => handleChange("pickup_location", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 mb-1 block">Pickup Time</label>
                          <input
                            type="time"
                            value={formData.pickup_time}
                            onChange={(e) => handleChange("pickup_time", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Contact Number</label>
                        <input
                          type="text"
                          value={formData.pickup_contact_number}
                          onChange={(e) => handleChange("pickup_contact_number", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600 mb-1 block">Special Instructions</label>
                        <textarea
                          value={formData.pickup_special_instructions}
                          onChange={(e) => handleChange("pickup_special_instructions", e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none text-sm resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Cost Justification */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      Cost Justification
                    </label>
                    <textarea
                      value={formData.cost_justification}
                      onChange={(e) => handleChange("cost_justification", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none resize-none"
                    />
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 text-gray-400" />
                      Admin Notes (Internal)
                    </label>
                    <textarea
                      value={formData.admin_notes}
                      onChange={(e) => handleChange("admin_notes", e.target.value)}
                      rows={2}
                      placeholder="Notes visible only to admin..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A0010]/20 focus:border-[#7A0010] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 p-4 flex justify-end gap-3 bg-gray-50">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-[#7A0010] hover:bg-[#5e000d] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Password Confirmation Modal */}
      <PasswordConfirmModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={handleConfirmedSave}
        title="Confirm Edit"
        description="Enter your password to save changes to this request."
        confirmText="Save Changes"
      />
    </>
  );
}
